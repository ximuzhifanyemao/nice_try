// ============================================================
// DiveDeep 发布控制台 - 命令行入口
// 无参数启动本地 Web 控制台；也支持 --check / --release 无界面发布。
// ============================================================

import { createWriteStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'
import {
  formatBytes,
  formatClock,
  formatDuration,
  killProcessTree,
  makeRunId,
} from './lib/util.mjs'
import { loadConfig } from './lib/config.mjs'
import { getRuntime } from './lib/runtime.mjs'
import { runChecks, CHECK_GROUPS } from './lib/checks.mjs'
import { buildPlan, executePlan, planRetry } from './lib/pipeline.mjs'
import { appendHistory, loadHistory } from './lib/history.mjs'
import { startServer } from './server.mjs'

const USE_COLOR = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR
const color = (code, text) => (USE_COLOR ? '\x1b[' + code + 'm' + text + '\x1b[0m' : text)
const dim = (text) => color('90', text)
const green = (text) => color('32', text)
const yellow = (text) => color('33', text)
const red = (text) => color('31', text)
const cyan = (text) => color('36', text)
const bold = (text) => color('1', text)

const HELP = [
  'DiveDeep 发布控制台',
  '',
  '用法：',
  '  release.cmd                         启动本地 Web 控制台（推荐）',
  '  release.cmd --check                 只检查当前发布环境',
  '  release.cmd 1.18.0 --targets web,apk,desktop --dry-run',
  '                                      无界面发布（--dry-run 为演练）',
  '  release.cmd --retry                 从上次失败的那一步重试（跳过已成功步骤）',
  '  release.cmd --retry <runId>         指定某次失败记录重试',
  '',
  '参数：',
  '  --ui                    启动 Web 控制台（默认）',
  '  --check                 只做发布前检查，不发布',
  '  --release <版本号>      指定版本号；也可以直接把版本号放在前面',
  '  --targets <列表>        web,apk,desktop（逗号分隔，默认全部）',
  '  --dry-run               演练模式：只检查/打印，不写版本、不构建、不上传',
  '  --yes, -y               跳过交互确认（自动化/CI 用）',
  '  --retry [runId]         从失败步骤重试；不带 runId 时取最近一次失败记录',
  '  --no-github             不创建 GitHub Release',
  '  --allow-dirty           允许工作区有未提交改动',
  '  --port <端口>           Web 控制台端口（默认 4780）',
  '  --no-open               启动 Web 控制台但不自动打开浏览器',
  '  --help, -h              显示帮助',
  '',
  '示例：',
  '  release.cmd --check',
  '  release.cmd --retry',
  '  release.cmd 1.17.1 --targets web --dry-run',
  '  release.cmd --release 1.18.0 --targets apk,desktop --yes',
  '',
].join('\n')

function parseArgs(argv) {
  const options = {
    ui: false,
    check: false,
    version: '',
    releaseRequested: false,
    targets: [],
    dryRun: false,
    yes: false,
    github: true,
    retry: false,
    retryRunId: '',
    allowDirty: null,
    port: null,
    noOpen: false,
    help: false,
    unknown: [],
  }

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === '--ui') options.ui = true
    else if (arg === '--check') options.check = true
    else if (arg === '--release' || arg === '--version') {
      options.releaseRequested = true
      options.version = String(argv[++index] || '')
    } else if (arg === '--targets') {
      options.targets = String(argv[++index] || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    } else if (arg === '--retry' || arg === '--retry-last') {
      options.retry = true
      const next = argv[index + 1]
      if (next && !next.startsWith('-') && /^[A-Za-z0-9._-]+$/.test(next) && !/^\d+\.\d+\.\d+/.test(next)) {
        options.retryRunId = next
        index += 1
      }
    } else if (arg === '--dry-run') options.dryRun = true
    else if (arg === '--yes' || arg === '-y') options.yes = true
    else if (arg === '--no-github') options.github = false
    else if (arg === '--allow-dirty') options.allowDirty = true
    else if (arg === '--port') options.port = Number(argv[++index])
    else if (arg === '--no-open') options.noOpen = true
    else if (arg === '--help' || arg === '-h') options.help = true
    else if (arg.startsWith('-')) options.unknown.push(arg)
    else if (!options.version && /^\d+\.\d+\.\d+/.test(arg)) {
      options.releaseRequested = true
      options.version = arg
    } else options.unknown.push(arg)
  }

  if (options.targets.length === 0) options.targets = ['web', 'apk', 'desktop']
  options.targets = options.targets.filter((item) => ['web', 'apk', 'desktop'].includes(item))
  return options
}

function statusLabel(status) {
  if (status === 'ok') return green('[OK]')
  if (status === 'warn') return yellow('[WARN]')
  if (status === 'fail') return red('[FAIL]')
  return dim('[SKIP]')
}

function printChecks(result) {
  console.log('')
  console.log(bold('发布环境检查') + dim(' · ' + new Date(result.checkedAt).toLocaleString('zh-CN')))
  console.log(dim('目标：' + result.targets.join('、')))
  for (const group of CHECK_GROUPS) {
    const items = result.checks.filter((item) => item.group === group)
    if (items.length === 0) continue
    console.log('')
    console.log(bold(group))
    for (const item of items) {
      console.log('  ' + statusLabel(item.status) + ' ' + item.title + '  ' + item.detail)
      if (item.fix && (item.status === 'fail' || item.status === 'warn')) {
        console.log('       ' + dim('修复：' + item.fix))
      }
    }
  }
  console.log('')
  const summary = result.summary
  console.log(
    bold('汇总：') +
      green('通过 ' + summary.ok) +
      ' · ' +
      yellow('警告 ' + summary.warn) +
      ' · ' +
      red('失败 ' + summary.fail) +
      (summary.blocking ? red(' · 阻塞 ' + summary.blocking) : ''),
  )
  if (!summary.canRun) {
    console.log(red('存在阻塞问题，请按上面的提示修复后再发布。'))
  }
}

async function confirmRelease(plan) {
  console.log('')
  console.log(bold('即将发布 v' + plan.version))
  console.log('目标：' + plan.targets.join('、'))
  console.log('模式：' + (plan.dryRun ? yellow('演练（不写文件、不构建、不上传）') : red('正式发布')))
  console.log('GitHub Release：' + (plan.githubRelease ? '是' : '否'))
  console.log('')
  console.log(bold('版本变更：'))
  if (plan.versionChanges.length === 0) console.log('  （无需修改）')
  for (const change of plan.versionChanges) {
    console.log('  - ' + change.displayPath + ' · ' + change.label + ': ' + change.from + ' → ' + change.to)
  }
  console.log('')
  console.log(bold('执行步骤：'))
  plan.steps.forEach((step, index) => {
    console.log('  ' + (index + 1) + '. [' + step.group + '] ' + step.title)
    if (step.command) console.log('     ' + dim(step.command))
  })
  console.log('')

  if (!process.stdin.isTTY) {
    throw new Error('当前不是交互式终端，请追加 --yes 确认发布')
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await new Promise((resolvePromise) => {
    rl.question('确认开始？输入 y 继续，其他任意键取消：', (value) => resolvePromise(value))
  })
  rl.close()
  return /^y(es)?$/i.test(answer.trim())
}

async function runHeadless(options) {
  const config = loadConfig()
  const runtime = getRuntime(config)
  let plan
  try {
    plan = buildPlan({
      config,
      runtime,
      version: options.version,
      targets: options.targets,
      dryRun: options.dryRun,
      githubRelease: options.github,
      allowDirty:
        options.allowDirty === null ? Boolean(config.options?.allowDirty) : Boolean(options.allowDirty),
    })
  } catch (error) {
    console.error(red('无法创建发布计划：' + String(error?.message || error)))
    return 1
  }

  if (!options.yes) {
    let ok = false
    try {
      ok = await confirmRelease(plan)
    } catch (error) {
      console.error(red(String(error?.message || error)))
      return 1
    }
    if (!ok) {
      console.log('已取消发布。')
      return 0
    }
  }

  return executeAndReport({ config, runtime, plan }, options)
}

/** 取最近一次失败记录；也可以用 runId 指定。 */
function pickRetryEntry(options) {
  const entries = loadHistory()
  if (options.retryRunId) {
    const entry = entries.find((item) => item.id === options.retryRunId)
    if (!entry) throw new Error('找不到发布记录：' + options.retryRunId)
    return entry
  }
  const candidate = entries.find((item) => {
    if (item.dryRun) return false
    if (item.status !== 'failed' && item.status !== 'cancelled') return false
    return (item.steps || []).some((step) => step.status === 'failed' || step.status === 'cancelled')
  })
  if (!candidate) throw new Error('没有可重试的失败记录（可用 --retry <runId> 指定）')
  return candidate
}

async function runRetryHeadless(options) {
  let prepared
  try {
    const config = loadConfig()
    const entry = pickRetryEntry(options)
    const runtime = getRuntime(config)
    const plan = buildPlan({
      config,
      runtime,
      version: entry.version,
      targets: entry.targets || [],
      dryRun: Boolean(options.dryRun),
      githubRelease: (entry.steps || []).some((step) => step.id === 'github-release'),
      allowDirty: true,
    })
    prepared = { config, runtime, plan, retry: planRetry(entry, plan) }
  } catch (error) {
    console.error(red('无法重试：' + String(error?.message || error)))
    return 1
  }

  const { plan, retry } = prepared
  console.log('')
  console.log(bold('重试发布 v' + plan.version))
  console.log(dim('源记录：' + retry.runId))
  console.log('从第 ' + (retry.fromIndex + 1) + '/' + retry.total + ' 步开始：' + bold(retry.fromTitle))
  console.log('复用前 ' + retry.reusedCount + ' 个已完成步骤（不重新构建、不改版本号）')
  console.log('')

  if (!options.yes) {
    let ok = false
    try {
      ok = await confirmRetry()
    } catch (error) {
      console.error(red(String(error?.message || error)))
      return 1
    }
    if (!ok) {
      console.log('已取消重试。')
      return 0
    }
  }

  return executeAndReport(prepared, options)
}

async function confirmRetry() {
  if (!process.stdin.isTTY) {
    throw new Error('当前不是交互式终端，请追加 --yes 确认重试')
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await new Promise((resolvePromise) => {
    rl.question('确认开始重试？输入 y 继续，其他任意键取消：', (value) => resolvePromise(value))
  })
  rl.close()
  return /^y(es)?$/i.test(answer.trim())
}

async function executeAndReport({ config, runtime, plan, retry = null }, options) {
  console.log('')
  console.log(bold('开始发布 v' + plan.version + (plan.dryRun ? '（演练）' : '') + (retry ? '（重试）' : '')))
  console.log('')

  const startedAt = Date.now()
  const runId = makeRunId(plan.version)
  const logPath = resolve(import.meta.dirname, 'logs', runId + '.log')
  const logStream = createWriteStream(logPath, { flags: 'w' })
  const writeLog = (text, stream) => {
    try {
      logStream.write('[' + formatClock() + '] [' + stream + '] ' + text + '\n')
    } catch {
      // 忽略
    }
  }
  writeLog('DiveDeep 发布控制台', 'system')
  writeLog('版本：v' + plan.version + (plan.dryRun ? '（演练）' : ''), 'system')
  writeLog('目标：' + plan.targets.join(' / '), 'system')
  if (retry) {
    writeLog(
      '重试：从第 ' + (retry.fromIndex + 1) + '/' + retry.total + ' 步「' + retry.fromTitle +
        '」开始，前 ' + retry.reusedCount + ' 步复用 ' + retry.runId,
      'system',
    )
  }

  let cancelled = false
  let activeChild = null
  const onSigint = () => {
    cancelled = true
    console.log(yellow('\n收到 Ctrl+C，正在中止当前步骤…'))
    if (activeChild) killProcessTree(activeChild)
  }
  process.on('SIGINT', onSigint)

  const result = await executePlan({
    plan,
    config,
    runtime,
    dryRun: plan.dryRun,
    retry,
    onStep: (step) => {
      if (step.status === 'running') {
        console.log(cyan('▶ ' + step.title))
      } else if (step.status === 'success') {
        console.log(green('✓ ' + step.title) + dim('（' + formatDuration(step.durationMs) + '）'))
      } else if (step.status === 'failed') {
        console.log(red('✕ ' + step.title + '：' + step.error))
      } else if (step.status === 'cancelled') {
        console.log(yellow('✕ ' + step.title + '：已取消'))
      }
    },
    onLog: (text, stream) => {
      writeLog(text, stream)
      if (!String(text).trim()) return
      // 步骤标题/成功提示已经由 onStep 打印，避免重复
      if (stream === 'system' && text.indexOf('▶ [') === 0) return
      if (stream === 'success' && text.indexOf('✓ ') === 0) return
      if ((stream === 'error' || stream === 'warn') && text.indexOf('✕ ') === 0) return
      if (stream === 'stderr') console.log(dim(text))
      else if (stream === 'error') console.log(red(text))
      else if (stream === 'warn') console.log(yellow(text))
      else if (stream === 'success') console.log(green(text))
      else if (stream === 'command') console.log(cyan(text))
      else if (stream === 'system') console.log(bold(text))
      else console.log(text)
    },
    onChecks: () => {},
    onChild: (child) => {
      activeChild = child
    },
    isCancelled: () => cancelled,
  })

  process.off('SIGINT', onSigint)

  const finishedAt = Date.now()
  const entry = {
    id: runId,
    version: plan.version,
    targets: plan.targets,
    status: result.status,
    dryRun: plan.dryRun,
    startedAt,
    finishedAt,
    durationMs: finishedAt - startedAt,
    steps: result.steps || [],
    artifacts: result.artifacts || [],
    logFile: 'logs/' + runId + '.log',
    error: result.error || null,
    retryOf: retry ? retry.runId : null,
    retryFromStepId: retry ? retry.fromStepId : null,
    retryFromTitle: retry ? retry.fromTitle : null,
  }
  try {
    appendHistory(entry, config.options?.keepHistory || 80)
  } catch {
    // 忽略历史写失败
  }

  await new Promise((resolvePromise) => logStream.end(resolvePromise))

  console.log('')
  if (result.status === 'success') {
    console.log(green(bold('🎉 发布完成 v' + plan.version + (plan.dryRun ? '（演练）' : '') + (retry ? '（重试）' : ''))))
    for (const artifact of result.artifacts || []) {
      console.log(
        '  - ' +
          artifact.label +
          '：' +
          (artifact.url || artifact.path || '') +
          (artifact.size ? '（' + formatBytes(artifact.size) + '）' : ''),
      )
    }
    console.log(dim('日志：' + logPath))
    return 0
  }
  if (result.status === 'cancelled') {
    console.log(yellow('发布已取消。日志：' + logPath))
    return 1
  }
  const firstLine = String(result.error || '未知错误').split(/\r?\n/)[0]
  console.log(red('发布失败：' + firstLine))
  console.log(dim('完整错误见上方日志；日志文件：' + logPath))
  return 1
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.unknown.length) {
    console.error(red('未知参数：' + options.unknown.join(' ')))
    console.error(HELP)
    process.exit(2)
  }
  if (options.help) {
    console.log(HELP)
    return
  }

  if (options.check) {
    const config = loadConfig()
    const result = await runChecks({
      config,
      targets: options.targets,
      githubRelease: options.github,
      allowDirty:
        options.allowDirty === null ? Boolean(config.options?.allowDirty) : Boolean(options.allowDirty),
      version: options.version || null,
    })
    printChecks(result)
    process.exitCode = result.summary.canRun ? 0 : 1
    return
  }

  if (options.retry) {
    const code = await runRetryHeadless(options)
    process.exitCode = code
    return
  }

  if (options.ui || (!options.version && !options.releaseRequested)) {
    await startServer({
      openBrowser: !options.noOpen,
      port: options.port || undefined,
    })
    return
  }

  if (!options.version) {
    console.error(red('缺少版本号，例如：release.cmd 1.18.0 --targets web'))
    process.exit(2)
  }

  const code = await runHeadless(options)
  process.exitCode = code
}

main().catch((error) => {
  console.error(red(String(error?.message || error)))
  process.exit(1)
})
