// ============================================================
// 发布控制台 - 发布计划与执行流水线
// 先构建、后发布；任一步失败会停止后续步骤并保留日志。
// ============================================================

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from 'node:fs'
import { join } from 'node:path'
import {
  TARGET_IDS,
  TARGET_LABELS,
  buildCommand,
  formatBytes,
  formatDuration,
  getEnvPath,
  runShell,
  sha256File,
  sleep,
  splitPathList,
  unique,
} from './util.mjs'
import { computeVersionChanges, applyVersionChanges } from './versioning.mjs'
import { runChecks } from './checks.mjs'
import { buildRuntimeEnv } from './runtime.mjs'

export class ReleaseCancelledError extends Error {
  constructor() {
    super('发布已取消')
    this.name = 'ReleaseCancelledError'
    this.code = 'CANCELLED'
  }
}

function normalizeTargets(targets) {
  return unique(
    (Array.isArray(targets) ? targets : []).filter((target) => TARGET_IDS.includes(target)),
  )
}

function timeoutFor(config, minutes = null) {
  const base = Number(config?.options?.stepTimeoutMinutes) || 40
  return Math.max(5, minutes || base) * 60 * 1000
}

export function buildPlan(options = {}) {
  const config = options.config || {}
  const runtime = options.runtime
  const targets = normalizeTargets(options.targets)
  if (targets.length === 0) {
    throw new Error('请至少选择一个发布目标（web / apk / desktop）')
  }
  const version = String(options.version || '').trim().replace(/^v/i, '')
  if (targets.includes('web')) {
    if (!runtime.cli || !runtime.cli.path) {
      throw new Error('未找到 CloudBase CLI，请先在设置中配置路径')
    }
    if (!runtime.envId) {
      throw new Error('未配置 CloudBase 环境 ID')
    }
  }
  const versionPlan = computeVersionChanges(version, { root: runtime.root })
  const dryRun = Boolean(options.dryRun)
  const githubRelease =
    options.githubRelease !== false &&
    Boolean(config.github?.enabled) &&
    (targets.includes('apk') || targets.includes('desktop'))

  const steps = []
  const push = (step) => {
    steps.push({
      id: step.id,
      title: step.title,
      group: step.group,
      description: step.description || '',
      command: step.command || '',
      cwd: step.cwd || '',
      timeoutMs: step.timeoutMs || timeoutFor(config),
      action: step.action,
      meta: step.meta || {},
    })
  }

  push({
    id: 'preflight',
    title: '检查发布环境',
    group: '准备',
    action: 'preflight',
    description: '重新检查 Node、CloudBase、JDK、SDK、Rust、GitHub Token 等',
    timeoutMs: 120000,
    meta: {
      targets,
      githubRelease,
      allowDirty: Boolean(options.allowDirty ?? config.options?.allowDirty),
      version,
    },
  })

  push({
    id: 'version',
    title: '写入版本号 v' + version,
    group: '准备',
    action: 'version',
    description:
      versionPlan.changes.length > 0
        ? versionPlan.changes.map((item) => item.displayPath + ' ' + item.from + '→' + item.to).join('；')
        : '版本文件已经是目标版本',
    timeoutMs: 60000,
    meta: { version },
  })

  const needsWebBuild = targets.includes('web') || targets.includes('apk')
  if (needsWebBuild) {
    push({
      id: 'web-build',
      title: '构建 Web 产物',
      group: '构建',
      action: 'command',
      description: 'npm run build:deploy（tsc + vite build）',
      command: 'npm run build:deploy',
      timeoutMs: timeoutFor(config, 25),
    })
  }

  if (targets.includes('apk')) {
    push({
      id: 'android-sync',
      title: '同步 Android 工程',
      group: '构建',
      action: 'command',
      description: 'npx cap sync android',
      command: 'npx cap sync android',
      timeoutMs: timeoutFor(config, 15),
    })
    push({
      id: 'android-build',
      title: '构建签名 APK',
      group: '构建',
      action: 'command',
      description:
        'android\\gradlew.bat ' +
        (config.android?.gradleTask || 'assembleRelease') +
        ' --console=plain',
      command:
        (process.platform === 'win32' ? 'gradlew.bat ' : './gradlew ') +
        (config.android?.gradleTask || 'assembleRelease') +
        ' --console=plain',
      cwd: join(runtime.root, 'android'),
      timeoutMs: timeoutFor(config, 35),
    })
    push({
      id: 'android-collect',
      title: '归置 APK 产物',
      group: '构建',
      action: 'collect-apk',
      description: '复制到 apk/kaoyan-tracker-v' + version + '.apk 与 apk/DiveDeep.apk',
      timeoutMs: 60000,
      meta: { version },
    })
  }

  if (targets.includes('desktop')) {
    const bundles = String(config.desktop?.bundles || '').trim()
    const bundleArgs = bundles ? ' -- --bundles ' + bundles : ''
    push({
      id: 'desktop-build',
      title: '构建 Windows 安装包',
      group: '构建',
      action: 'command',
      description: 'npm run build:desktop' + (bundles ? ' -- --bundles ' + bundles : '') + '（Tauri + NSIS/MSI）',
      command: 'npm run build:desktop' + bundleArgs,
      timeoutMs: timeoutFor(config, 50),
    })
  }

  // 构建全部完成后再发布，避免构建失败时线上出现半成品
  if (targets.includes('web')) {
    const args = [
      runtime.cli.path,
      'hosting',
      'deploy',
      'dist',
      '-e',
      runtime.envId,
      ...(Array.isArray(config.cloudbase?.deployArgs) ? config.cloudbase.deployArgs : []),
    ]
    push({
      id: 'web-deploy',
      title: '部署到 CloudBase',
      group: '发布',
      action: 'command',
      description: 'CloudBase 静态网站托管 · 环境 ' + runtime.envId,
      command: buildCommand(args),
      timeoutMs: timeoutFor(config, 20),
    })
  }

  if (targets.includes('apk')) {
    // OTA 上传目标：cloudbase（国内静态托管，快）或 supabase（原有通道）
    const otaHost = String(config.android?.otaHost || 'supabase').toLowerCase() === 'cloudbase'
      ? 'cloudbase'
      : 'supabase'
    push({
      id: 'android-ota',
      title: '发布 Android OTA',
      group: '发布',
      action: 'command',
      description:
        '上传 APK 到 ' + (otaHost === 'cloudbase' ? 'CloudBase 静态托管' : 'Supabase Storage') + ' 并写入 app_versions',
      command:
        'node scripts/upload-ota.mjs --skip-build --host ' +
        otaHost +
        ' --apk "apk/kaoyan-tracker-v' +
        version +
        '.apk"',
      timeoutMs: timeoutFor(config, 20),
    })
  }

  if (targets.includes('desktop')) {
    const desktopOtaHost = String(config.desktop?.otaHost || 'cloudbase').toLowerCase() === 'supabase'
      ? 'supabase'
      : 'cloudbase'
    push({
      id: 'desktop-ota',
      title: '发布桌面端 OTA',
      group: '发布',
      action: 'command',
      description:
        '上传 MSI/EXE 到 ' +
        (desktopOtaHost === 'cloudbase' ? 'CloudBase 静态托管' : 'Supabase Storage') +
        ' 并写入 desktop_versions',
      command: 'node scripts/upload-desktop-update.mjs --host ' + desktopOtaHost,
      timeoutMs: timeoutFor(config, 20),
    })
  }

  if (githubRelease) {
    const flags = []
    if (!targets.includes('apk')) flags.push('--no-apk')
    if (!targets.includes('desktop')) flags.push('--no-desktop')
    push({
      id: 'github-release',
      title: '创建 GitHub Release',
      group: '发布',
      action: 'command',
      description: '上传 APK / 桌面安装包到 v' + version + ' Release',
      command: ['node scripts/upload-release.mjs', ...flags].join(' '),
      timeoutMs: timeoutFor(config, 20),
    })
  }

  push({
    id: 'summary',
    title: '汇总发布结果',
    group: '完成',
    action: 'summary',
    description: '生成产物清单、访问地址与发布记录',
    timeoutMs: 60000,
    meta: { version, targets, githubRelease },
  })

  return {
    version,
    targets,
    dryRun,
    githubRelease,
    versionChanges: versionPlan.changes,
    versionWarnings: versionPlan.warnings,
    steps,
  }
}

async function findApkCandidates(root) {
  const releaseDir = join(root, 'android', 'app', 'build', 'outputs', 'apk', 'release')
  if (!existsSync(releaseDir)) {
    throw new Error('未找到 Gradle 输出目录：' + releaseDir + '\n请确认 assembleRelease 已成功执行')
  }
  const files = readdirSync(releaseDir)
    .filter((name) => name.endsWith('.apk') && !/unaligned|unsigned|mappings/i.test(name))
    .map((name) => {
      const filePath = join(releaseDir, name)
      return { name, path: filePath, size: statSync(filePath).size, mtime: statSync(filePath).mtimeMs }
    })
    .sort((a, b) => b.mtime - a.mtime)
  if (files.length === 0) {
    throw new Error('Gradle 输出目录下没有可用的 release APK：' + releaseDir)
  }
  return files
}

export async function collectApk(options) {
  const { root, version, dryRun, log } = options
  const apkDir = join(root, 'apk')
  const versionedPath = join(apkDir, 'kaoyan-tracker-v' + version + '.apk')
  const fixedPath = join(apkDir, 'DiveDeep.apk')

  let built = null
  try {
    const candidates = await findApkCandidates(root)
    built = candidates[0]
  } catch (error) {
    if (!dryRun) throw error
    log('[演练] ' + String(error?.message || error), 'warn')
  }

  if (built) {
    log('选中产物：' + built.name + '（' + formatBytes(built.size) + '）', 'info')
  }
  if (dryRun) {
    log('[演练] 将复制到：', 'info')
    log('  - ' + versionedPath, 'info')
    log('  - ' + fixedPath, 'info')
    return {
      dryRun: true,
      source: built?.path || null,
      name: 'kaoyan-tracker-v' + version + '.apk',
      path: versionedPath,
      size: built?.size || 0,
      sha256: null,
    }
  }

  mkdirSync(apkDir, { recursive: true })
  copyFileSync(built.path, versionedPath)
  copyFileSync(built.path, fixedPath)
  const checksum = sha256File(versionedPath)
  log('已复制：' + versionedPath + '（' + formatBytes(statSync(versionedPath).size) + '）', 'success')
  log('已复制：' + fixedPath, 'success')
  log('SHA256: ' + checksum, 'info')
  return {
    dryRun: false,
    source: built.path,
    name: 'kaoyan-tracker-v' + version + '.apk',
    path: versionedPath,
    fixedPath,
    size: statSync(versionedPath).size,
    sha256: checksum,
  }
}

export function findDesktopBundles(root, version) {
  const dirs = [
    ['nsis', 'NSIS 安装包', join(root, 'src-tauri', 'target', 'release', 'bundle', 'nsis')],
    ['msi', 'MSI 安装包', join(root, 'src-tauri', 'target', 'release', 'bundle', 'msi')],
  ]
  const bundles = []
  for (const [type, label, dir] of dirs) {
    if (!existsSync(dir)) continue
    for (const name of readdirSync(dir)) {
      if (!version || !name.includes(version) || !/\.(exe|msi)$/i.test(name)) continue
      const filePath = join(dir, name)
      bundles.push({
        type,
        label,
        name,
        path: filePath,
        size: statSync(filePath).size,
      })
    }
  }
  return bundles
}

/** 拼出 OTA 文件在云端的公开地址。 */
function otaPublicUrl(options) {
  const { config, runtime, host, cloudbaseDir, supabaseBucket, fileName } = options
  if (host === 'cloudbase') {
    const base = String(config.cloudbase?.staticDomain || config.cloudbase?.siteUrl || '').replace(/\/+$/, '')
    if (!base) return ''
    const dir = String(cloudbaseDir || '').replace(/^\/+|\/+$/g, '')
    return base + (dir ? '/' + dir : '') + '/' + encodeURIComponent(fileName)
  }
  const base = String(runtime.otaEnv?.SUPABASE_URL || '').replace(/\/+$/, '')
  if (!base) return ''
  return base + '/storage/v1/object/public/' + supabaseBucket + '/' + encodeURIComponent(fileName)
}

function buildArtifacts(plan, config, runtime, stepResults) {
  const artifacts = []
  if (plan.targets.includes('web')) {
    artifacts.push({
      type: 'web',
      label: 'Web 网站',
      url: config.cloudbase?.siteUrl || '',
    })
  }
  const apkResult = stepResults.get('android-collect')
  if (plan.targets.includes('apk') && apkResult) {
    const apkHost = String(config.android?.otaHost || 'supabase').toLowerCase() === 'cloudbase'
      ? 'cloudbase'
      : 'supabase'
    artifacts.push({
      type: 'apk',
      label: 'Android APK',
      path: apkResult.path,
      name: apkResult.name,
      size: apkResult.size,
      sha256: apkResult.sha256,
      url: otaPublicUrl({
        config,
        runtime,
        host: apkHost,
        cloudbaseDir: config.android?.cloudbaseDir || 'downloads',
        supabaseBucket: config.android?.supabaseBucket || 'ota-bundles',
        fileName: 'DiveDeep.apk',
      }),
      host: apkHost,
    })
  }
  if (plan.targets.includes('desktop')) {
    const desktopHost = String(config.desktop?.otaHost || 'cloudbase').toLowerCase() === 'supabase'
      ? 'supabase'
      : 'cloudbase'
    const bundles = findDesktopBundles(runtime.root, plan.version)
    for (const bundle of bundles) {
      artifacts.push({
        type: 'desktop',
        label: bundle.label,
        name: bundle.name,
        path: bundle.path,
        size: bundle.size,
        host: desktopHost,
        url: otaPublicUrl({
          config,
          runtime,
          host: desktopHost,
          cloudbaseDir: config.desktop?.cloudbaseDir || 'downloads/desktop',
          supabaseBucket: config.desktop?.supabaseBucket || 'desktop-bundles',
          fileName: bundle.name,
        }),
      })
    }
  }
  if (plan.githubRelease && runtime.github.owner && runtime.github.repo) {
    artifacts.push({
      type: 'github',
      label: 'GitHub Release',
      url:
        'https://github.com/' +
        runtime.github.owner +
        '/' +
        runtime.github.repo +
        '/releases/tag/v' +
        plan.version,
    })
  }
  return artifacts
}

function stepPublic(step) {
  return {
    id: step.id,
    title: step.title,
    group: step.group,
    description: step.description,
    command: step.command,
    status: step.status,
    reused: Boolean(step.reused),
    startedAt: step.startedAt,
    finishedAt: step.finishedAt,
    durationMs: step.durationMs,
    error: step.error || null,
    result: step.result || null,
  }
}

function formatChecksFailure(checks) {
  const blocking = checks.checks.filter((item) => item.blocking)
  const lines = ['发布前检查未通过（' + blocking.length + ' 项阻塞）：']
  for (const item of blocking) {
    lines.push('- [' + item.group + '] ' + item.title + '：' + item.detail)
    if (item.fix) lines.push('  修复：' + item.fix)
  }
  return lines.join('\n')
}

/**
 * 计算「从哪一步重试」。
 * 规则：重试从上次失败（或被中止）的那一步开始，前序步骤必须全部成功；
 * 版本与发布目标必须和记录一致，否则产物与计划对不上。
 */
export function planRetry(entry, plan) {
  if (!entry) throw new Error('找不到对应的发布记录')
  if (entry.status === 'running') throw new Error('该发布仍在执行中，不能重试')
  if (entry.status === 'success') throw new Error('该发布已成功，无需重试')
  if (entry.dryRun) throw new Error('演练记录不能重试')

  const entryVersion = String(entry.version || '').replace(/^v/i, '')
  if (entryVersion !== String(plan.version)) {
    throw new Error(
      '版本已变化（记录 v' + entryVersion + '，当前 v' + plan.version + '），请重新发布而不是重试',
    )
  }
  const entryTargets = (entry.targets || []).join(',')
  const planTargets = (plan.targets || []).join(',')
  if (entryTargets !== planTargets) {
    throw new Error(
      '发布目标与记录不一致（记录 ' + (entryTargets || '-') + '，当前 ' + (planTargets || '-') + '），请重新发布',
    )
  }

  const entrySteps = entry.steps || []
  const fromStep = entrySteps.find((step) => step.status === 'failed') ||
    entrySteps.find((step) => step.status === 'cancelled')
  if (!fromStep) throw new Error('该记录没有失败步骤，无法重试')

  const fromIndex = plan.steps.findIndex((step) => step.id === fromStep.id)
  if (fromIndex < 0) {
    throw new Error(
      '失败步骤「' + (fromStep.title || fromStep.id) + '」已不在当前发布计划中，请重新发布',
    )
  }

  const previous = new Map(entrySteps.map((step) => [step.id, step]))
  for (let index = 0; index < fromIndex; index++) {
    const step = plan.steps[index]
    const previousStep = previous.get(step.id)
    // reused 表示这一步在上一次重试里也是复用的，等价于「在更早的记录里已经成功」
    const completed = Boolean(previousStep) && (previousStep.status === 'success' || previousStep.reused)
    if (!completed) {
      throw new Error(
        '第 ' + (index + 1) + ' 步「' + step.title + '」上次未成功（' +
          (previousStep ? previousStep.status : '缺失') + '），无法跳过，请重新发布',
      )
    }
  }

  const previousSteps = plan.steps
    .slice(0, fromIndex)
    .map((step) => previous.get(step.id))
    .filter(Boolean)

  return {
    runId: entry.id,
    fromStepId: plan.steps[fromIndex].id,
    fromIndex,
    fromTitle: plan.steps[fromIndex].title,
    total: plan.steps.length,
    reusedCount: fromIndex,
    previousSteps,
  }
}

export async function executePlan(context) {
  const {
    plan,
    config,
    runtime,
    dryRun,
    retry = null,
    onStep = () => {},
    onLog = () => {},
    onChecks = () => {},
    onChild = () => {},
    isCancelled = () => false,
  } = context

  const log = (text, stream = 'stdout') => onLog(String(text), stream)
  const steps = plan.steps.map((step) => ({
    ...step,
    status: 'pending',
    startedAt: null,
    finishedAt: null,
    durationMs: null,
    error: null,
    result: null,
  }))

  const stepResults = new Map()
  let cancelled = false
  const emit = (step) => onStep(stepPublic(step))

  // 重试：把失败步骤之前的步骤标记为「已复用」，并回收它们的结果（如 APK 产物信息）
  let startIndex = 0
  if (retry && retry.fromStepId) {
    const index = steps.findIndex((step) => step.id === retry.fromStepId)
    if (index < 0) throw new Error('重试起点「' + retry.fromStepId + '」不在当前发布计划中')
    startIndex = index
    const previous = new Map((retry.previousSteps || []).map((step) => [step.id, step]))
    for (let cursor = 0; cursor < index; cursor++) {
      const step = steps[cursor]
      const previousStep = previous.get(step.id) || {}
      step.status = 'skipped'
      step.reused = true
      step.startedAt = previousStep.startedAt ?? null
      step.finishedAt = previousStep.finishedAt ?? null
      step.durationMs = previousStep.durationMs ?? null
      step.result = previousStep.result ?? null
      if (step.result) stepResults.set(step.id, step.result)
      emit(step)
    }
  }

  const checkCancel = () => {
    if (cancelled || isCancelled()) {
      cancelled = true
      throw new ReleaseCancelledError()
    }
  }

  if (startIndex > 0) {
    log('')
    log(
      '↺ 重试模式：复用前 ' + startIndex + ' 个已完成步骤，从第 ' + (startIndex + 1) + ' 步「' +
        steps[startIndex].title + '」开始执行',
      'system',
    )
    log('  已复用的步骤不会重新构建，也不会再次修改版本文件', 'muted')
  }

  for (let index = startIndex; index < steps.length; index++) {
    const step = steps[index]
    if (cancelled) {
      step.status = 'skipped'
      emit(step)
      continue
    }
    checkCancel()

    step.status = 'running'
    step.startedAt = Date.now()
    emit(step)
    log('')
    log('▶ [' + (index + 1) + '/' + steps.length + '] ' + step.title, 'system')
    if (step.description) log('  ' + step.description, 'muted')

    const commandEnv = {
      ...buildRuntimeEnv(runtime),
      ...(step.meta?.env || {}),
    }

    const registerChild = (child) => {
      onChild(child)
    }

    try {
      if (step.action === 'preflight') {
        const checks = await runChecks({
          config,
          runtime,
          targets: step.meta.targets,
          githubRelease: step.meta.githubRelease,
          allowDirty: step.meta.allowDirty,
          version: step.meta.version,
        })
        onChecks(checks)
        log(
          '检查结果：通过 ' +
            checks.summary.ok +
            ' · 警告 ' +
            checks.summary.warn +
            ' · 失败 ' +
            checks.summary.fail,
          checks.summary.fail > 0 ? 'warn' : 'success',
        )
        for (const item of checks.checks) {
          if (item.status === 'fail') {
            log('  [FAIL] ' + item.title + '：' + item.detail, 'error')
            if (item.fix) log('         修复：' + item.fix, 'muted')
          } else if (item.status === 'warn') {
            log('  [WARN] ' + item.title + '：' + item.detail, 'warn')
          }
        }
        step.result = { summary: checks.summary, checkedAt: checks.checkedAt }
        // 记录子进程实际拿到的 PATH，便于排查「父进程有 git、子进程找不到 git」这类问题
        log(
          '命令环境：PATH ' +
            splitPathList(getEnvPath(commandEnv)).length +
            ' 项 · ' +
            (runtime.gitTool?.exe ? 'git ' + (runtime.gitTool.version || runtime.gitTool.exe) : '未找到 git'),
          'muted',
        )
        if (checks.summary.blocking > 0 && !dryRun) {
          throw new Error(formatChecksFailure(checks))
        }
        if (checks.summary.blocking > 0 && dryRun) {
          log('演练模式：忽略 ' + checks.summary.blocking + ' 项阻塞问题，继续打印发布计划', 'warn')
        }
      } else if (step.action === 'version') {
        const result = applyVersionChanges(step.meta.version, {
          root: runtime.root,
          dryRun,
          log: (text) => log(text, 'info'),
        })
        step.result = { changes: result.changes, applied: result.applied }
        log(
          result.applied
            ? '版本文件已更新' + (result.changes.length ? '（' + result.changes.length + ' 项）' : '')
            : '演练模式：未写入版本文件',
          result.applied ? 'success' : 'warn',
        )
      } else if (step.action === 'command') {
        if (dryRun) {
          log('[演练] 将执行：' + step.command, 'warn')
          log('        工作目录：' + (step.cwd || runtime.root), 'muted')
          await sleep(120)
          step.result = { dryRun: true, command: step.command }
        } else {
          log('$ ' + step.command, 'command')
          const result = await runShell(step.command, {
            cwd: step.cwd || runtime.root,
            env: commandEnv,
            timeoutMs: step.timeoutMs,
            onLine: (line, stream) => log(line, stream === 'stderr' ? 'stderr' : 'stdout'),
            onSpawn: registerChild,
          })
          if (result.timedOut) {
            throw new Error('命令超时（' + formatDuration(step.timeoutMs) + '）：' + step.command)
          }
          if (cancelled || isCancelled()) {
            throw new ReleaseCancelledError()
          }
          if (result.code !== 0) {
            const detail = String(result.stderr || result.stdout || '').trim().split(/\r?\n/).slice(-8).join('\n')
            throw new Error(
              '命令失败（exit ' + result.code + '）：' + step.command + (detail ? '\n' + detail : ''),
            )
          }
          step.result = { command: step.command, exitCode: result.code }
          log('命令完成', 'success')
        }
      } else if (step.action === 'collect-apk') {
        const result = await collectApk({
          root: runtime.root,
          version: step.meta.version,
          dryRun,
          log,
        })
        stepResults.set(step.id, result)
        step.result = result
      } else if (step.action === 'summary') {
        const artifacts = buildArtifacts(plan, config, runtime, stepResults)
        step.result = { artifacts }
        log('')
        log('发布完成 v' + plan.version + (dryRun ? '（演练）' : ''), 'success')
        log('发布目标：' + plan.targets.map((target) => TARGET_LABELS[target] || target).join('、'), 'info')
        for (const artifact of artifacts) {
          const value = artifact.url || artifact.path || ''
          log('  - ' + artifact.label + '：' + value + (artifact.size ? '（' + formatBytes(artifact.size) + '）' : ''), 'info')
        }
        if (plan.targets.includes('web') && config.cloudbase?.siteUrl) {
          log('网站地址：' + config.cloudbase.siteUrl, 'info')
        }
        if (plan.githubRelease) {
          log(dryRun ? '演练模式：未实际创建 GitHub Release' : 'GitHub Release 已按脚本结果创建/更新', 'info')
        }
        log('日志已保存到 release/logs/', 'muted')
      } else {
        throw new Error('未知步骤类型：' + step.action)
      }

      step.status = 'success'
      step.finishedAt = Date.now()
      step.durationMs = step.finishedAt - step.startedAt
      emit(step)
      log('✓ ' + step.title + '（' + formatDuration(step.durationMs) + '）', 'success')
    } catch (error) {
      const isCancel = error instanceof ReleaseCancelledError || cancelled || isCancelled()
      step.status = isCancel ? 'cancelled' : 'failed'
      step.finishedAt = Date.now()
      step.durationMs = step.finishedAt - step.startedAt
      step.error = isCancel ? '发布已取消' : String(error?.message || error)
      emit(step)
      log('✕ ' + step.title + '：' + step.error, isCancel ? 'warn' : 'error')
      for (let rest = index + 1; rest < steps.length; rest++) {
        steps[rest].status = 'skipped'
        emit(steps[rest])
      }
      return {
        status: isCancel ? 'cancelled' : 'failed',
        error: step.error,
        steps,
        artifacts: [],
        versionChanges: plan.versionChanges,
      }
    }
  }

  const summaryStep = steps.find((step) => step.action === 'summary')
  const artifacts = summaryStep?.result?.artifacts || []
  return {
    status: 'success',
    error: null,
    steps,
    artifacts,
    versionChanges: plan.versionChanges,
  }
}

export function summarizePlan(plan) {
  return {
    version: plan.version,
    targets: plan.targets,
    dryRun: plan.dryRun,
    githubRelease: plan.githubRelease,
    versionChanges: plan.versionChanges,
    steps: plan.steps.map((step) => ({
      id: step.id,
      title: step.title,
      group: step.group,
      description: step.description,
      command: step.command,
    })),
  }
}
