// ============================================================
// 发布控制台 - 配置读取与保存
// 配置文件：release/config.json（本机路径，默认不提交）
// ============================================================

import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'
import {
  CONFIG_PATH,
  PROJECT_ROOT,
  RELEASE_DIR,
  deepMerge,
  ensureRuntimeDirs,
  formatStamp,
  readJsonIfExists,
  writeJsonAtomic,
} from './util.mjs'
import {
  detectAndroidSdk,
  detectCargoBin,
  detectGithubRepo,
  detectGit,
  detectJavaHome,
  getGitInfo,
  parseGithubRemote,
  readCloudbaseEnvId,
  readSiteUrl,
  resolveCloudbaseCli,
} from './detect.mjs'

export const DEFAULT_CONFIG = {
  configVersion: 1,
  cloudbase: {
    cliPath: '',
    envId: '',
    siteUrl: '',
    // 静态托管默认域名（前端与 APK 同域，网站主入口）
    staticDomain: '',
    deployArgs: ['--verify'],
    region: 'ap-shanghai',
  },
  android: {
    javaHome: '',
    sdkDir: '',
    gradleTask: 'assembleRelease',
    // OTA 上传目标：cloudbase（国内静态托管）/ supabase（原有通道）
    otaHost: 'supabase',
  },
  desktop: {
    cargoBin: '',
    bundles: '',
  },
  git: {
    // git.exe 路径；留空则自动检测（PATH / 注册表 / 常见安装目录）
    exe: '',
  },
  github: {
    enabled: true,
    owner: '',
    repo: '',
    tokenEnv: 'GITHUB_TOKEN',
  },
  server: {
    port: 4780,
    openBrowser: true,
  },
  options: {
    allowDirty: false,
    stepTimeoutMinutes: 40,
    keepHistory: 80,
  },
}

export function detectDefaultConfig() {
  const base = deepMerge(DEFAULT_CONFIG, {})
  const cli = resolveCloudbaseCli(base)
  const java = detectJavaHome(base, PROJECT_ROOT)
  const sdk = detectAndroidSdk(base, PROJECT_ROOT)
  const cargo = detectCargoBin(base)
  const gitTool = detectGit(base)
  const git = getGitInfo(PROJECT_ROOT, gitTool.exe)
  const remoteRepo = parseGithubRemote(git.remote) || detectGithubRepo(base, PROJECT_ROOT)

  return {
    ...base,
    cloudbase: {
      ...base.cloudbase,
      cliPath: cli.path || '',
      envId: readCloudbaseEnvId(PROJECT_ROOT),
      siteUrl: readSiteUrl(PROJECT_ROOT),
    },
    android: {
      ...base.android,
      javaHome: java.home || '',
      sdkDir: sdk.dir || '',
    },
    desktop: {
      ...base.desktop,
      cargoBin: cargo.dir || '',
    },
    git: {
      ...base.git,
      exe: gitTool.exe || '',
    },
    github: {
      ...base.github,
      owner: remoteRepo.owner || '',
      repo: remoteRepo.repo || '',
    },
  }
}

export function loadConfig(options = {}) {
  ensureRuntimeDirs()
  const { createIfMissing = true, refreshDetected = false } = options
  const detected = detectDefaultConfig()
  const configExists = existsSync(CONFIG_PATH)
  const saved = readJsonIfExists(CONFIG_PATH)
  if (configExists && !saved) {
    backupBrokenConfig()
  }

  if (saved) {
    const merged = deepMerge(detected, saved)
    if (refreshDetected) {
      writeJsonAtomic(CONFIG_PATH, merged)
    }
    return merged
  }

  if (!createIfMissing) return detected

  writeJsonAtomic(CONFIG_PATH, detected)
  return detected
}

export function saveConfig(nextConfig) {
  ensureRuntimeDirs()
  writeJsonAtomic(CONFIG_PATH, nextConfig)
  return nextConfig
}

function asString(value, fallback = '') {
  if (value === undefined || value === null) return fallback
  return String(value).trim()
}

function asBoolean(value, fallback) {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === '1' || value === 1) return true
  if (value === 'false' || value === '0' || value === 0) return false
  return fallback
}

function asInt(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

function asStringArray(value, fallback) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return fallback
}

/**
 * 把前端/命令行传来的局部配置合并进当前配置，并做基础校验。
 * 不合法字段会回退到当前值，避免把程序写坏。
 */
export function applyConfigPatch(current, patch) {
  if (!patch || typeof patch !== 'object') return current
  const next = deepMerge(current, {})
  const cloudbase = patch.cloudbase || {}
  const android = patch.android || {}
  const desktop = patch.desktop || {}
  const gitCfg = patch.git || {}
  const github = patch.github || {}
  const server = patch.server || {}
  const options = patch.options || {}

  if (cloudbase.cliPath !== undefined) next.cloudbase.cliPath = asString(cloudbase.cliPath, next.cloudbase.cliPath)
  if (cloudbase.envId !== undefined) next.cloudbase.envId = asString(cloudbase.envId, next.cloudbase.envId)
  if (cloudbase.siteUrl !== undefined) next.cloudbase.siteUrl = asString(cloudbase.siteUrl, next.cloudbase.siteUrl)
  if (cloudbase.staticDomain !== undefined) {
    next.cloudbase.staticDomain = asString(cloudbase.staticDomain, next.cloudbase.staticDomain)
  }
  if (cloudbase.region !== undefined) next.cloudbase.region = asString(cloudbase.region, next.cloudbase.region)
  if (cloudbase.deployArgs !== undefined) {
    next.cloudbase.deployArgs = asStringArray(cloudbase.deployArgs, next.cloudbase.deployArgs)
  }

  if (android.javaHome !== undefined) next.android.javaHome = asString(android.javaHome, next.android.javaHome)
  if (android.sdkDir !== undefined) next.android.sdkDir = asString(android.sdkDir, next.android.sdkDir)
  if (android.gradleTask !== undefined) next.android.gradleTask = asString(android.gradleTask, next.android.gradleTask)
  if (android.otaHost !== undefined) {
    const host = asString(android.otaHost, next.android.otaHost).toLowerCase()
    next.android.otaHost = host === 'cloudbase' ? 'cloudbase' : 'supabase'
  }

  if (desktop.cargoBin !== undefined) next.desktop.cargoBin = asString(desktop.cargoBin, next.desktop.cargoBin)
  if (desktop.bundles !== undefined) next.desktop.bundles = asString(desktop.bundles, next.desktop.bundles)

  if (!next.git) next.git = { exe: '' }
  if (gitCfg.exe !== undefined) next.git.exe = asString(gitCfg.exe, next.git.exe)

  if (github.enabled !== undefined) next.github.enabled = asBoolean(github.enabled, next.github.enabled)
  if (github.owner !== undefined) next.github.owner = asString(github.owner, next.github.owner)
  if (github.repo !== undefined) next.github.repo = asString(github.repo, next.github.repo)
  if (github.tokenEnv !== undefined) next.github.tokenEnv = asString(github.tokenEnv, next.github.tokenEnv) || 'GITHUB_TOKEN'

  if (server.port !== undefined) next.server.port = asInt(server.port, next.server.port, 1024, 65535)
  if (server.openBrowser !== undefined) next.server.openBrowser = asBoolean(server.openBrowser, next.server.openBrowser)

  if (options.allowDirty !== undefined) next.options.allowDirty = asBoolean(options.allowDirty, next.options.allowDirty)
  if (options.stepTimeoutMinutes !== undefined) {
    next.options.stepTimeoutMinutes = asInt(options.stepTimeoutMinutes, next.options.stepTimeoutMinutes, 5, 240)
  }
  if (options.keepHistory !== undefined) {
    next.options.keepHistory = asInt(options.keepHistory, next.options.keepHistory, 10, 200)
  }

  next.configVersion = 1
  return next
}

export function backupBrokenConfig() {
  try {
    if (!existsSync(CONFIG_PATH)) return null
    const target = join(RELEASE_DIR, 'config.broken-' + formatStamp() + '.json')
    renameSync(CONFIG_PATH, target)
    return target
  } catch {
    return null
  }
}

export function getConfigMeta() {
  return {
    configPath: CONFIG_PATH,
    releaseDir: RELEASE_DIR,
    projectRoot: PROJECT_ROOT,
  }
}
