// ============================================================
// 发布控制台 - 本地 Web 服务
// 只监听 127.0.0.1，提供静态页面、检查/发布 API 与 SSE 实时日志。
// ============================================================

import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import {
  createWriteStream,
  existsSync,
  readFileSync,
  statSync,
} from 'node:fs'
import { extname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CONFIG_PATH,
  LOG_DIR,
  PROJECT_ROOT,
  PUBLIC_DIR,
  ensureRuntimeDirs,
  formatClock,
  formatDuration,
  isInside,
  killProcessTree,
  makeRunId,
  runShell,
} from './lib/util.mjs'
import {
  applyConfigPatch,
  getConfigMeta,
  loadConfig,
  saveConfig,
} from './lib/config.mjs'
import { buildRuntimeEnv, getRuntime, publicRuntime } from './lib/runtime.mjs'
import { runChecks } from './lib/checks.mjs'
import { buildPlan, executePlan, planRetry, summarizePlan } from './lib/pipeline.mjs'
import { suggestNextVersion } from './lib/versioning.mjs'
import {
  appendHistory,
  findHistory,
  loadHistory,
  logPathFor,
  publicHistoryEntry,
} from './lib/history.mjs'

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

let config = null
let lastChecks = null
let currentRun = null
let serverPort = 0
let serverUrl = ''
const sseClients = new Set()

// 内置命令终端：同一时间只允许一条命令，输出通过 SSE 实时推给页面
const terminal = {
  cwd: PROJECT_ROOT,
  shell: { path: null, args: [], label: process.platform === 'win32' ? 'CMD' : 'Shell' },
  running: false,
  cancelled: false,
  child: null,
  lines: [],
  lastExit: null,
}

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

function sendText(res, statusCode, text, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(text),
  })
  res.end(text)
}

function readJsonBody(req) {
  return new Promise((resolvePromise, reject) => {
    let body = ''
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > 1024 * 1024) {
        reject(new Error('请求体过大'))
        req.destroy()
        return
      }
      body += chunk
    })
    req.on('end', () => {
      if (!body.trim()) {
        resolvePromise({})
        return
      }
      try {
        resolvePromise(JSON.parse(body))
      } catch {
        reject(new Error('请求体不是合法 JSON'))
      }
    })
    req.on('error', (error) => reject(error))
  })
}

function broadcast(event) {
  const payload = 'data: ' + JSON.stringify(event) + '\n\n'
  for (const client of sseClients) {
    try {
      client.write(payload)
    } catch {
      // 忽略断开的客户端
    }
  }
}

function publicRun(run) {
  if (!run) return null
  const runningStep = run.steps.find((step) => step.status === 'running')
  return {
    id: run.id,
    version: run.version,
    targets: run.targets,
    dryRun: run.dryRun,
    status: run.status,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    durationMs: run.durationMs,
    steps: run.steps,
    artifacts: run.artifacts || [],
    error: run.error || null,
    retryOf: run.retryOf || null,
    retryFromStepId: run.retryFromStepId || null,
    retryFromTitle: run.retryFromTitle || null,
    cancelRequested: Boolean(run.cancelRequested),
    currentStepId: runningStep ? runningStep.id : null,
    logFile: run.logFile || '',
    logs: (run.logs || []).slice(-500),
  }
}

function appendRunLog(run, text, stream = 'stdout') {
  const line = {
    t: Date.now(),
    stream,
    text: String(text),
  }
  run.logs.push(line)
  if (run.logs.length > 5000) run.logs.splice(0, run.logs.length - 5000)
  if (run.logStream) {
    try {
      run.logStream.write(
        '[' + formatClock(line.t) + '] [' + stream + '] ' + line.text + '\n',
      )
    } catch {
      // 忽略写日志失败
    }
  }
  broadcast({ type: 'log', runId: run.id, line })
}

function terminalSnapshot() {
  return {
    cwd: terminal.cwd,
    shell: { label: terminal.shell.label, path: terminal.shell.path },
    running: terminal.running,
    lastExit: terminal.lastExit,
    lines: terminal.lines.slice(-1000),
  }
}

function appendTerminalLine(line) {
  const entry = {
    t: Date.now(),
    stream: line.stream || 'stdout',
    text: String(line.text == null ? '' : line.text),
  }
  terminal.lines.push(entry)
  if (terminal.lines.length > 2000) terminal.lines.splice(0, terminal.lines.length - 2000)
  broadcast({ type: 'terminal-line', line: entry })
}

/** 处理终端里的 cd：切换工作目录而不是起子进程。 */
function handleTerminalCd(command) {
  const match = command.match(/^cd(?:\s+(.+))?$/i)
  if (!match) return null
  let target = String(match[1] || '').trim().replace(/^["']|["']$/g, '')
  if (!target || target === '~') target = PROJECT_ROOT
  // Git Bash 风格路径 /e/code_app → E:\code_app
  const msys = target.match(/^\/([a-zA-Z])\/(.*)$/)
  if (msys) target = msys[1] + ':\\' + msys[2].replace(/\//g, '\\')
  const next = isAbsolute(target) ? resolve(target) : resolve(terminal.cwd, target)
  if (!existsSync(next)) {
    appendTerminalLine({ stream: 'error', text: '目录不存在：' + next })
    return { ok: false, cwd: terminal.cwd }
  }
  if (!statSync(next).isDirectory()) {
    appendTerminalLine({ stream: 'error', text: '不是目录：' + next })
    return { ok: false, cwd: terminal.cwd }
  }
  terminal.cwd = next
  appendTerminalLine({ stream: 'muted', text: 'cwd → ' + next })
  broadcast({ type: 'terminal-cwd', cwd: next })
  return { ok: true, cwd: next }
}

function startTerminalCommand(command) {
  const runtime = getRuntime(config)
  terminal.running = true
  terminal.cancelled = false
  terminal.lastExit = null
  appendTerminalLine({ stream: 'command', text: '$ ' + command })
  broadcast({
    type: 'terminal-start',
    command,
    cwd: terminal.cwd,
    shell: terminal.shell.label,
  })

  runTerminalCommand(command, runtime)
    .then((result) => {
      terminal.lastExit = {
        code: result.code,
        cancelled: terminal.cancelled,
        timedOut: result.timedOut,
        durationMs: result.durationMs,
      }
      if (result.timedOut) {
        appendTerminalLine({ stream: 'error', text: '命令超时（30 分钟），已终止' })
      } else if (terminal.cancelled) {
        appendTerminalLine({ stream: 'warn', text: '命令已中止' })
      } else if (result.code === 0) {
        appendTerminalLine({
          stream: 'success',
          text: '完成（' + formatDuration(result.durationMs) + '）',
        })
      } else {
        appendTerminalLine({
          stream: 'error',
          text:
            '退出码 ' + (result.code == null ? 'null' : result.code) +
            '（' + formatDuration(result.durationMs) + '）',
        })
      }
    })
    .finally(() => {
      terminal.running = false
      terminal.child = null
      broadcast({
        type: 'terminal-end',
        cwd: terminal.cwd,
        exitCode: terminal.lastExit ? terminal.lastExit.code : null,
        cancelled: terminal.lastExit ? terminal.lastExit.cancelled : false,
        timedOut: terminal.lastExit ? terminal.lastExit.timedOut : false,
      })
      terminal.cancelled = false
    })
}

async function runTerminalCommand(command, runtime) {
  return runShell(command, {
    cwd: terminal.cwd,
    env: buildRuntimeEnv(runtime),
    timeoutMs: 30 * 60 * 1000,
    shellExe: terminal.shell.path,
    shellArgs: terminal.shell.args,
    onLine: (line, stream) => {
      appendTerminalLine({ stream: stream === 'stderr' ? 'stderr' : 'stdout', text: line })
    },
    onSpawn: (child) => {
      terminal.child = child
    },
  })
}

function createRunRecord(plan, extra = {}) {
  const run = {
    id: makeRunId(plan.version),
    version: plan.version,
    targets: plan.targets,
    dryRun: plan.dryRun,
    status: 'running',
    startedAt: Date.now(),
    finishedAt: null,
    durationMs: null,
    retryOf: extra.retryOf || null,
    retryFromStepId: extra.retryFromStepId || null,
    retryFromTitle: extra.retryFromTitle || null,
    steps: plan.steps.map((step) => ({
      ...step,
      status: 'pending',
      reused: false,
      startedAt: null,
      finishedAt: null,
      durationMs: null,
      error: null,
      result: null,
    })),
    logs: [],
    artifacts: [],
    error: null,
    cancelRequested: false,
    activeChild: null,
    logFile: '',
    logStream: null,
  }
  run.logFile = 'logs/' + run.id + '.log'
  return run
}

/**
 * 依据历史记录重建发布计划，用于「从失败步骤重试」。
 * 保留原来的版本号、发布目标与是否创建 GitHub Release。
 */
function buildPlanForRetry(entry) {
  const runtime = getRuntime(config)
  const plan = buildPlan({
    config,
    runtime,
    version: entry.version,
    targets: entry.targets || [],
    dryRun: false,
    githubRelease: (entry.steps || []).some((step) => step.id === 'github-release'),
    // 重试跳过预检，工作区可能有未提交改动也允许继续
    allowDirty: true,
  })
  return { runtime, plan }
}

async function startRelease(run, plan, runtime, retry = null) {
  currentRun = run
  ensureRuntimeDirs()
  run.logStream = createWriteStream(logPathFor(run.id), { flags: 'w' })
  run.logStream.on('error', () => {
    // 日志文件写失败不影响发布
  })

  broadcast({ type: 'run-start', run: publicRun(run) })

  appendRunLog(run, 'DiveDeep 发布控制台', 'system')
  appendRunLog(run, '版本：v' + plan.version + (plan.dryRun ? '（演练模式）' : ''), 'system')
  appendRunLog(run, '目标：' + plan.targets.join(' / '), 'system')
  appendRunLog(run, '开始时间：' + new Date(run.startedAt).toLocaleString('zh-CN'), 'system')
  if (retry) {
    appendRunLog(
      run,
      '重试：从第 ' + (retry.fromIndex + 1) + '/' + retry.total + ' 步「' + retry.fromTitle +
        '」开始，前 ' + retry.reusedCount + ' 步复用 ' + retry.runId + ' 的结果',
      'system',
    )
  }

  let result
  try {
    result = await executePlan({
      plan,
      config,
      runtime,
      dryRun: plan.dryRun,
      retry,
      onStep: (step) => {
        const index = run.steps.findIndex((item) => item.id === step.id)
        if (index >= 0) run.steps[index] = step
        broadcast({ type: 'step', runId: run.id, step })
      },
      onLog: (line, stream) => appendRunLog(run, line, stream),
      onChecks: (checks) => {
        lastChecks = checks
        broadcast({ type: 'checks', checks })
      },
      onChild: (child) => {
        run.activeChild = child
      },
      isCancelled: () => Boolean(run.cancelRequested),
    })
  } catch (error) {
    result = {
      status: 'failed',
      error: String(error?.message || error),
      steps: run.steps,
      artifacts: [],
    }
  }

  run.status = result.status
  run.error = result.error || null
  run.artifacts = result.artifacts || []
  if (Array.isArray(result.steps)) run.steps = result.steps
  run.finishedAt = Date.now()
  run.durationMs = run.finishedAt - run.startedAt
  run.activeChild = null

  const finalLine =
    result.status === 'success'
      ? '发布完成 v' + run.version + (run.dryRun ? '（演练）' : '') + '，耗时 ' + formatDuration(run.durationMs)
      : result.status === 'cancelled'
        ? '发布已取消，耗时 ' + formatDuration(run.durationMs)
        : '发布失败：' + (run.error || '未知错误')
  appendRunLog(
    run,
    finalLine,
    result.status === 'success' ? 'success' : result.status === 'cancelled' ? 'warn' : 'error',
  )

  if (run.logStream) {
    run.logStream.end()
    run.logStream = null
  }

  const historyEntry = {
    id: run.id,
    version: run.version,
    targets: run.targets,
    status: run.status,
    dryRun: run.dryRun,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    durationMs: run.durationMs,
    steps: run.steps,
    artifacts: run.artifacts,
    logFile: run.logFile,
    error: run.error,
    retryOf: run.retryOf || null,
    retryFromStepId: run.retryFromStepId || null,
    retryFromTitle: run.retryFromTitle || null,
  }
  try {
    appendHistory(historyEntry, config.options?.keepHistory || 80)
  } catch {
    // 历史写入失败不影响发布
  }

  broadcast({ type: 'run-end', run: publicRun(run) })
}

function getBootstrap() {
  const runtime = getRuntime(config)
  return {
    config,
    runtime: publicRuntime(runtime),
    versions: {
      ...runtime.versions,
      nextVersion: suggestNextVersion(runtime.versions.packageVersion),
    },
    git: runtime.git,
    history: loadHistory().map(publicHistoryEntry),
    checks: lastChecks,
    currentRun: currentRun ? publicRun(currentRun) : null,
    terminal: terminalSnapshot(),
    meta: {
      ...getConfigMeta(),
      port: serverPort,
      url: serverUrl,
      node: process.version,
      platform: process.platform,
      logDir: LOG_DIR,
    },
  }
}

function parseTargets(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => ['web', 'apk', 'desktop'].includes(item))
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => ['web', 'apk', 'desktop'].includes(item))
  }
  return []
}

async function handleApi(req, res, url) {
  const pathname = url.pathname

  if (req.method === 'GET' && pathname === '/api/health') {
    sendJson(res, 200, { ok: true, pid: process.pid, uptime: process.uptime() })
    return
  }

  if (req.method === 'GET' && pathname === '/api/bootstrap') {
    sendJson(res, 200, getBootstrap())
    return
  }

  if (req.method === 'GET' && pathname === '/api/state') {
    sendJson(res, 200, {
      run: currentRun ? publicRun(currentRun) : null,
      checks: lastChecks,
      terminal: terminalSnapshot(),
    })
    return
  }

  if (req.method === 'POST' && pathname === '/api/terminal/run') {
    if (terminal.running) {
      sendJson(res, 409, { error: '已有命令正在执行，请等待完成或点击「中止」' })
      return
    }
    const body = await readJsonBody(req)
    const command = String(body.command || '').trim()
    if (!command) {
      sendJson(res, 400, { error: '命令不能为空' })
      return
    }
    if (command.length > 4000) {
      sendJson(res, 400, { error: '命令过长（最多 4000 字符）' })
      return
    }
    if (command === 'clear' || command === 'cls') {
      terminal.lines = []
      broadcast({ type: 'terminal-clear' })
      sendJson(res, 200, { ok: true, cwd: terminal.cwd })
      return
    }
    const cdResult = handleTerminalCd(command)
    if (cdResult) {
      sendJson(res, 200, { ok: cdResult.ok, cwd: cdResult.cwd })
      return
    }
    sendJson(res, 202, {
      ok: true,
      cwd: terminal.cwd,
      shell: terminal.shell.label,
    })
    startTerminalCommand(command)
    return
  }

  if (req.method === 'POST' && pathname === '/api/terminal/stop') {
    if (!terminal.running) {
      sendJson(res, 409, { error: '当前没有正在执行的命令' })
      return
    }
    terminal.cancelled = true
    if (terminal.child) killProcessTree(terminal.child)
    appendTerminalLine({ stream: 'warn', text: '收到中止请求，正在终止当前命令…' })
    sendJson(res, 200, { ok: true })
    return
  }

  if (req.method === 'POST' && pathname === '/api/terminal/clear') {
    terminal.lines = []
    broadcast({ type: 'terminal-clear' })
    sendJson(res, 200, { ok: true })
    return
  }

  if (req.method === 'GET' && pathname === '/api/history') {
    sendJson(res, 200, { history: loadHistory().map(publicHistoryEntry) })
    return
  }

  if (req.method === 'GET' && pathname === '/api/retry-plan') {
    const runId = String(url.searchParams.get('runId') || '')
    const entry = findHistory(runId)
    if (!entry) {
      sendJson(res, 404, { error: '找不到发布记录：' + (runId || '（空）') })
      return
    }
    try {
      const { plan } = buildPlanForRetry(entry)
      const retry = planRetry(entry, plan)
      sendJson(res, 200, {
        plan: summarizePlan(plan),
        retry: {
          runId: retry.runId,
          fromStepId: retry.fromStepId,
          fromIndex: retry.fromIndex,
          fromTitle: retry.fromTitle,
          total: retry.total,
          reusedCount: retry.reusedCount,
        },
      })
    } catch (error) {
      sendJson(res, 400, { error: String(error?.message || error) })
    }
    return
  }

  if (req.method === 'GET' && pathname === '/api/plan') {
    const version = url.searchParams.get('version') || ''
    const targets = parseTargets(url.searchParams.get('targets') || '')
    const githubRelease = url.searchParams.get('github') !== '0'
    const dryRun = url.searchParams.get('dryRun') === '1'
    const runtime = getRuntime(config)
    let plan
    try {
      plan = buildPlan({
        config,
        runtime,
        version,
        targets,
        dryRun,
        githubRelease,
        allowDirty: config.options?.allowDirty,
      })
    } catch (error) {
      sendJson(res, 400, { error: String(error?.message || error) })
      return
    }
    sendJson(res, 200, {
      plan: summarizePlan(plan),
      runtime: publicRuntime(runtime),
    })
    return
  }

  if (req.method === 'POST' && pathname === '/api/check') {
    const body = await readJsonBody(req)
    const targets = parseTargets(body.targets)
    const runtime = getRuntime(config)
    const checks = await runChecks({
      config,
      runtime,
      targets,
      githubRelease:
        body.githubRelease === undefined ? Boolean(config.github?.enabled) : Boolean(body.githubRelease),
      allowDirty:
        body.allowDirty === undefined ? Boolean(config.options?.allowDirty) : Boolean(body.allowDirty),
      version: body.version || null,
    })
    lastChecks = checks
    broadcast({ type: 'checks', checks })
    sendJson(res, 200, checks)
    return
  }

  if (req.method === 'POST' && pathname === '/api/run') {
    if (currentRun && currentRun.status === 'running') {
      sendJson(res, 409, { error: '已有发布任务正在执行，请先等待完成或点击「中止」' })
      return
    }
    const body = await readJsonBody(req)
    const version = String(body.version || '').trim()
    const targets = parseTargets(body.targets)
    if (targets.length === 0) {
      sendJson(res, 400, { error: '请至少选择一个发布目标' })
      return
    }
    const dryRun = Boolean(body.dryRun)
    const githubRelease =
      body.githubRelease === undefined ? Boolean(config.github?.enabled) : Boolean(body.githubRelease)
    const runtime = getRuntime(config)

    if (targets.includes('web')) {
      if (!runtime.cli.path) {
        sendJson(res, 400, { error: '未找到 CloudBase CLI，请先在设置中配置路径' })
        return
      }
      if (!runtime.envId) {
        sendJson(res, 400, { error: '未配置 CloudBase 环境 ID' })
        return
      }
    }

    let plan
    try {
      plan = buildPlan({
        config,
        runtime,
        version,
        targets,
        dryRun,
        githubRelease,
        allowDirty:
          body.allowDirty === undefined ? Boolean(config.options?.allowDirty) : Boolean(body.allowDirty),
      })
    } catch (error) {
      sendJson(res, 400, { error: String(error?.message || error) })
      return
    }

    const run = createRunRecord(plan)
    currentRun = run
    sendJson(res, 202, { run: publicRun(run) })
    startRelease(run, plan, runtime).catch((error) => {
      if (run.logStream) {
        appendRunLog(run, '发布异常：' + String(error?.message || error), 'error')
        run.logStream.end()
        run.logStream = null
      }
      run.status = 'failed'
      run.error = String(error?.message || error)
      run.finishedAt = Date.now()
      run.durationMs = run.finishedAt - run.startedAt
      broadcast({ type: 'run-end', run: publicRun(run) })
    })
    return
  }

  if (req.method === 'POST' && pathname === '/api/retry') {
    if (currentRun && currentRun.status === 'running') {
      sendJson(res, 409, { error: '已有发布任务正在执行，请先等待完成或点击「中止」' })
      return
    }
    const body = await readJsonBody(req)
    const entry = findHistory(String(body.runId || ''))
    if (!entry) {
      sendJson(res, 404, { error: '找不到发布记录：' + (body.runId || '（空）') })
      return
    }

    let runtime
    let plan
    let retry
    try {
      const prepared = buildPlanForRetry(entry)
      runtime = prepared.runtime
      plan = prepared.plan
      retry = planRetry(entry, plan)
    } catch (error) {
      sendJson(res, 400, { error: String(error?.message || error) })
      return
    }

    const run = createRunRecord(plan, {
      retryOf: retry.runId,
      retryFromStepId: retry.fromStepId,
      retryFromTitle: retry.fromTitle,
    })
    currentRun = run
    sendJson(res, 202, { run: publicRun(run), retry: { fromIndex: retry.fromIndex, total: retry.total } })
    startRelease(run, plan, runtime, retry).catch((error) => {
      if (run.logStream) {
        appendRunLog(run, '发布异常：' + String(error?.message || error), 'error')
        run.logStream.end()
        run.logStream = null
      }
      run.status = 'failed'
      run.error = String(error?.message || error)
      run.finishedAt = Date.now()
      run.durationMs = run.finishedAt - run.startedAt
      broadcast({ type: 'run-end', run: publicRun(run) })
    })
    return
  }

  if (req.method === 'POST' && pathname === '/api/cancel') {
    if (!currentRun || currentRun.status !== 'running') {
      sendJson(res, 409, { error: '当前没有正在执行的发布任务' })
      return
    }
    currentRun.cancelRequested = true
    if (currentRun.activeChild) {
      killProcessTree(currentRun.activeChild)
    }
    appendRunLog(currentRun, '收到中止请求，正在终止当前步骤…', 'warn')
    sendJson(res, 200, { ok: true, runId: currentRun.id })
    return
  }

  if (req.method === 'POST' && pathname === '/api/config') {
    const body = await readJsonBody(req)
    const next = applyConfigPatch(config, body)
    saveConfig(next)
    config = next
    const runtime = getRuntime(config)
    sendJson(res, 200, {
      ok: true,
      config,
      runtime: publicRuntime(runtime),
      note: '端口修改需要重启发布控制台后生效',
    })
    return
  }

  const logMatch = pathname.match(/^\/api\/logs\/([A-Za-z0-9._-]+)$/)
  if (req.method === 'GET' && logMatch) {
    const id = logMatch[1]
    if (!/^[A-Za-z0-9._-]+$/.test(id)) {
      sendJson(res, 400, { error: '非法日志 ID' })
      return
    }
    const filePath = logPathFor(id)
    if (!existsSync(filePath)) {
      sendJson(res, 404, { error: '日志不存在' })
      return
    }
    const entry = findHistory(id)
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Release-Version': entry ? 'v' + entry.version : '',
    })
    res.end(readFileSync(filePath, 'utf8'))
    return
  }

  sendJson(res, 404, { error: 'API 不存在' })
}

function serveStatic(req, res, url) {
  let pathname
  try {
    pathname = decodeURIComponent(url.pathname)
  } catch {
    sendText(res, 400, 'Bad Request')
    return
  }
  if (pathname === '/') pathname = '/index.html'
  if (pathname.includes('\0')) {
    sendText(res, 400, 'Bad Request')
    return
  }
  const publicDir = PUBLIC_DIR
  const filePath = resolve(publicDir, '.' + pathname)
  if (!isInside(filePath, publicDir)) {
    sendText(res, 403, 'Forbidden')
    return
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    sendText(res, 404, 'Not Found')
    return
  }
  const type = MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream'
  const body = readFileSync(filePath)
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'Content-Length': body.length,
  })
  res.end(body)
}

function checkRequestSecurity(req) {
  const host = String(req.headers.host || '')
  const allowed = new Set([
    '127.0.0.1:' + serverPort,
    'localhost:' + serverPort,
    '[::1]:' + serverPort,
  ])
  if (!allowed.has(host)) return '非法 Host'
  const origin = req.headers.origin
  if (origin) {
    const allowedOrigins = new Set([
      'http://127.0.0.1:' + serverPort,
      'http://localhost:' + serverPort,
    ])
    if (!allowedOrigins.has(origin)) return '非法 Origin'
  }
  return null
}

async function handleRequest(req, res) {
  const securityError = checkRequestSecurity(req)
  if (securityError) {
    sendJson(res, 403, { error: securityError })
    return
  }

  const url = new URL(req.url || '/', 'http://127.0.0.1')

  if (url.pathname === '/api/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    res.write('retry: 3000\n\n')
    sseClients.add(res)
    res.write(
      'data: ' +
        JSON.stringify({
          type: 'snapshot',
          run: currentRun ? publicRun(currentRun) : null,
          checks: lastChecks,
          history: loadHistory().map(publicHistoryEntry),
          terminal: terminalSnapshot(),
        }) +
        '\n\n',
    )
    req.on('close', () => {
      sseClients.delete(res)
    })
    return
  }

  if (url.pathname.startsWith('/api/')) {
    if (req.method === 'POST') {
      const contentType = String(req.headers['content-type'] || '')
      if (!contentType.includes('application/json')) {
        sendJson(res, 415, { error: 'Content-Type 必须是 application/json' })
        return
      }
    }
    try {
      await handleApi(req, res, url)
    } catch (error) {
      if (!res.headersSent) {
        sendJson(res, 500, { error: String(error?.message || error) })
      } else {
        try {
          res.end()
        } catch {
          // 忽略
        }
      }
    }
    return
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendText(res, 405, 'Method Not Allowed')
    return
  }
  serveStatic(req, res, url)
}

function openBrowser(url) {
  try {
    if (process.platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', url], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      }).unref()
    } else if (process.platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref()
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref()
    }
  } catch {
    // 打不开浏览器时用户可手动访问控制台打印的地址
  }
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms))
}

async function listenOn(port) {
  return new Promise((resolvePromise, reject) => {
    const server = createServer(handleRequest)
    const onError = (error) => {
      server.close()
      reject(error)
    }
    server.once('error', onError)
    server.listen(port, '127.0.0.1', () => {
      server.off('error', onError)
      resolvePromise(server)
    })
  })
}

export async function startServer(options = {}) {
  ensureRuntimeDirs()
  config = loadConfig()
  const bootRuntime = getRuntime(config)
  terminal.shell = {
    path: bootRuntime.terminalShell?.path || null,
    args: bootRuntime.terminalShell?.args || [],
    label: bootRuntime.terminalShell?.label || (process.platform === 'win32' ? 'CMD' : 'Shell'),
  }
  const desiredPort = Number(options.port || config.server?.port || 4780)
  const maxPort = desiredPort + 20
  let server = null
  let lastError = null

  for (let port = desiredPort; port <= maxPort; port++) {
    try {
      server = await listenOn(port)
      serverPort = port
      break
    } catch (error) {
      lastError = error
      if (error?.code !== 'EADDRINUSE') break
    }
  }

  if (!server) {
    throw lastError || new Error('无法启动发布控制台服务')
  }

  serverUrl = 'http://127.0.0.1:' + serverPort + '/'

  const heartbeat = setInterval(() => {
    for (const client of sseClients) {
      try {
        client.write(': ping\n\n')
      } catch {
        // 忽略
      }
    }
  }, 20000)
  heartbeat.unref?.()

  console.log('')
  console.log('============================================================')
  console.log('  DiveDeep 发布控制台')
  console.log('  本地地址: ' + serverUrl)
  console.log('  项目目录: ' + PROJECT_ROOT)
  console.log('  配置文件: ' + CONFIG_PATH)
  console.log('  日志目录: ' + LOG_DIR)
  console.log('  提示: 关闭此窗口或按 Ctrl+C 停止服务')
  console.log('============================================================')
  console.log('')

  const shouldOpen = options.openBrowser !== false && config.server?.openBrowser !== false
  if (shouldOpen) {
    await sleep(250)
    openBrowser(serverUrl)
  }

  const shutdown = async (signal) => {
    console.log('\n收到 ' + signal + '，正在关闭发布控制台…')
    if (currentRun && currentRun.status === 'running') {
      currentRun.cancelRequested = true
      if (currentRun.activeChild) killProcessTree(currentRun.activeChild)
      await sleep(500)
    }
    clearInterval(heartbeat)
    for (const client of sseClients) {
      try {
        client.end()
      } catch {
        // 忽略
      }
    }
    sseClients.clear()
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 3000).unref()
  }

  process.once('SIGINT', () => {
    void shutdown('SIGINT')
  })
  process.once('SIGTERM', () => {
    void shutdown('SIGTERM')
  })

  return { server, port: serverPort, url: serverUrl }
}

const isMain = process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])
if (isMain) {
  startServer({ openBrowser: !process.argv.includes('--no-open') }).catch((error) => {
    console.error('启动发布控制台失败：', error)
    process.exit(1)
  })
}
