// ============================================================
// 发布控制台 - 项目与本机工具链探测
// 所有函数都只读，不会修改任何文件。
// ============================================================

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { readJsonIfExists, readTextIfExists, which } from './util.mjs'

export function readPackageJson(root) {
  return readJsonIfExists(join(root, 'package.json'))
}

export function parseGradleVersions(text) {
  const source = String(text || '')
  const codeMatch = source.match(/versionCode\s+(\d+)/)
  const nameMatch = source.match(/versionName\s+["']([^"']+)["']/)
  return {
    versionCode: codeMatch ? Number(codeMatch[1]) : null,
    versionName: nameMatch ? nameMatch[1] : null,
  }
}

export function readGradleVersions(root) {
  const filePath = join(root, 'android', 'app', 'build.gradle')
  const text = readTextIfExists(filePath)
  return text ? parseGradleVersions(text) : { versionCode: null, versionName: null }
}

export function unescapeProperty(value) {
  return String(value || '').replace(/\\([:=\\ ])/g, '$1')
}

export function parseProperties(text) {
  const result = {}
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || line.startsWith('!')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    const key = line.slice(0, eq).trim()
    const value = unescapeProperty(line.slice(eq + 1).trim())
    if (key) result[key] = value
  }
  return result
}

export function readAndroidProperties(root) {
  const localProps = join(root, 'android', 'local.properties')
  const keystoreProps = join(root, 'android', 'keystore.properties')
  return {
    local: parseProperties(readTextIfExists(localProps) || ''),
    keystore: parseProperties(readTextIfExists(keystoreProps) || ''),
    localPath: localProps,
    keystorePath: keystoreProps,
  }
}

export function readCompileSdkVersion(root) {
  const text = readTextIfExists(join(root, 'android', 'variables.gradle')) || ''
  const match = text.match(/compileSdkVersion\s*=\s*(\d+)/)
  return match ? Number(match[1]) : 36
}

export function getCurrentVersions(root) {
  const pkg = readPackageJson(root) || {}
  const android = readGradleVersions(root)
  const tauri = readJsonIfExists(join(root, 'src-tauri', 'tauri.conf.json')) || {}
  const lock = readJsonIfExists(join(root, 'package-lock.json')) || {}
  return {
    packageVersion: pkg.version || null,
    androidVersionName: android.versionName,
    androidVersionCode: android.versionCode,
    tauriVersion: tauri.version || null,
    lockVersion: lock.version || null,
  }
}

function readGitConfigRemote(root) {
  const text = readTextIfExists(join(root, '.git', 'config'))
  if (!text) return null
  let inOrigin = false
  let remote = null
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (line.startsWith('[')) {
      inOrigin = /^\[remote\s+"origin"\]/i.test(line)
      continue
    }
    if (!inOrigin) continue
    const match = line.match(/^url\s*=\s*(.+)$/i)
    if (match) remote = match[1].trim()
  }
  return remote
}

function readGitFallback(root) {
  const gitDir = join(root, '.git')
  if (!existsSync(gitDir)) return null
  const head = (readTextIfExists(join(gitDir, 'HEAD')) || '').trim()
  let branch = null
  if (head.startsWith('ref: ')) {
    branch = head.slice(5).trim().replace(/^refs\/heads\//, '')
  }
  let commit = null
  if (branch) {
    commit = (readTextIfExists(join(gitDir, 'refs', 'heads', branch)) || '').trim().slice(0, 7) || null
  }
  if (!commit && branch) {
    const packed = readTextIfExists(join(gitDir, 'packed-refs')) || ''
    const line = packed
      .split(/\r?\n/)
      .find((item) => item.trim().endsWith(' refs/heads/' + branch))
    if (line) commit = line.trim().split(/\s+/)[0].slice(0, 7)
  }
  return {
    isRepo: true,
    branch: branch || '(detached)',
    commit,
    dirty: null,
    dirtyCount: null,
    dirtyKnown: false,
    remote: readGitConfigRemote(root),
    latestTag: null,
  }
}

export function getGitInfo(root) {
  const git = (args) => {
    const result = spawnSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      timeout: 8000,
      windowsHide: true,
    })
    if (result.status !== 0) return null
    return String(result.stdout || '').trim()
  }

  const isRepo = git(['rev-parse', '--is-inside-work-tree']) === 'true'
  if (!isRepo) {
    const fallback = readGitFallback(root)
    if (fallback) return fallback
    return {
      isRepo: false,
      branch: null,
      commit: null,
      dirty: false,
      dirtyCount: 0,
      dirtyKnown: true,
      remote: null,
      latestTag: null,
    }
  }

  const statusText = git(['status', '--porcelain'])
  const dirtyKnown = statusText != null
  const dirtyLines = dirtyKnown ? statusText.split(/\r?\n/).filter(Boolean) : []
  const tags = git(['tag', '--sort=-v:refname'])
  return {
    isRepo: true,
    branch: git(['branch', '--show-current']) || '(detached)',
    commit: git(['rev-parse', '--short', 'HEAD']) || null,
    dirty: dirtyKnown ? dirtyLines.length > 0 : null,
    dirtyCount: dirtyKnown ? dirtyLines.length : null,
    dirtyKnown,
    remote: git(['remote', 'get-url', 'origin']),
    latestTag: tags ? tags.split(/\r?\n/)[0] : null,
  }
}

export function parseGithubRemote(remote) {
  if (!remote) return null
  const text = String(remote).trim()
  let match = text.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i)
  if (match) return { owner: match[1], repo: match[2] }
  match = text.match(/^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/i)
  if (match) return { owner: match[1], repo: match[2] }
  match = text.match(/^ssh:\/\/git@github\.com\/([^/]+)\/(.+?)(?:\.git)?$/i)
  if (match) return { owner: match[1], repo: match[2] }
  return null
}

export function detectGithubRepo(config, root) {
  const configuredOwner = config?.github?.owner
  const configuredRepo = config?.github?.repo
  if (configuredOwner && configuredRepo) {
    return {
      owner: configuredOwner,
      repo: configuredRepo,
      remote: null,
      source: '配置',
    }
  }
  const git = getGitInfo(root)
  const parsed = parseGithubRemote(git.remote)
  if (parsed) {
    return { ...parsed, remote: git.remote, source: 'git remote' }
  }
  return { owner: '', repo: '', remote: git.remote, source: '未检测到' }
}

export function readSiteUrl(root) {
  const text = readTextIfExists(join(root, 'src', 'lib', 'appLinks.ts')) || ''
  const match = text.match(/APP_SITE_URL\s*=\s*['"]([^'"]+)['"]/)
  return match ? match[1] : ''
}

function normalizePath(pathValue) {
  return pathValue ? resolve(pathValue) : ''
}

function uniquePaths(items) {
  const seen = new Set()
  const out = []
  for (const item of items) {
    if (!item) continue
    const key = normalizePath(item).toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(resolve(item))
  }
  return out
}

function javaExeForHome(home) {
  if (!home) return null
  const exe = process.platform === 'win32' ? join(home, 'bin', 'java.exe') : join(home, 'bin', 'java')
  return existsSync(exe) ? exe : null
}

export function readJavaVersion(javaExe) {
  if (!javaExe) return null
  const result = spawnSync(javaExe, ['-version'], {
    encoding: 'utf8',
    timeout: 8000,
    windowsHide: true,
  })
  const text = String(result.stderr || '') + String(result.stdout || '')
  const match = text.match(/version\s+"?(\d+)(?:\.(\d+))?/i)
  if (!match) return null
  const major = Number(match[1])
  const fullMatch = text.match(/version\s+"([^"]+)"/i)
  return {
    major,
    version: fullMatch ? fullMatch[1] : String(major),
    raw: text.trim(),
  }
}

export function detectJavaHome(config, root) {
  const candidates = []
  const configured = config?.android?.javaHome
  if (configured) candidates.push(configured)
  if (process.env.JAVA_HOME) candidates.push(process.env.JAVA_HOME)

  const javaOnPath = which('java')
  if (javaOnPath) {
    const home = dirname(dirname(javaOnPath))
    candidates.push(home)
  }

  const commonRoots = []
  if (process.platform === 'win32') {
    if (process.env.ProgramFiles) commonRoots.push(join(process.env.ProgramFiles, 'Java'))
    if (process.env['ProgramFiles(x86)']) commonRoots.push(join(process.env['ProgramFiles(x86)'], 'Java'))
    if (process.env.ProgramFiles) commonRoots.push(join(process.env.ProgramFiles, 'Eclipse Adoptium'))
    if (process.env.ProgramFiles) commonRoots.push(join(process.env.ProgramFiles, 'Microsoft'))
    if (process.env.LOCALAPPDATA) commonRoots.push(join(process.env.LOCALAPPDATA, 'Programs', 'Eclipse Adoptium'))
  } else {
    commonRoots.push('/usr/lib/jvm')
  }

  for (const base of commonRoots) {
    try {
      if (!existsSync(base)) continue
      for (const name of readdirSync(base)) {
        candidates.push(join(base, name))
      }
    } catch {
      // 忽略无权限目录
    }
  }

  try {
    for (const name of readdirSync(root)) {
      if (/^jdk[-_]?\d/i.test(name)) candidates.push(join(root, name))
    }
  } catch {
    // 忽略
  }

  for (const home of uniquePaths(candidates)) {
    const exe = javaExeForHome(home)
    if (!exe) continue
    const version = readJavaVersion(exe)
    return {
      home,
      javaExe: exe,
      version,
      valid: true,
      versionReadable: Boolean(version),
      source: configured && normalizePath(configured).toLowerCase() === normalizePath(home).toLowerCase() ? '配置' : '自动检测',
    }
  }

  return { home: null, javaExe: null, version: null, valid: false, versionReadable: false, source: '未检测到' }
}

export function detectAndroidSdk(config, root) {
  const props = readAndroidProperties(root)
  const candidates = []
  const configured = config?.android?.sdkDir
  if (configured) candidates.push({ value: configured, source: '配置' })
  if (props.local['sdk.dir']) candidates.push({ value: props.local['sdk.dir'], source: 'android/local.properties' })
  if (process.env.ANDROID_HOME) candidates.push({ value: process.env.ANDROID_HOME, source: 'ANDROID_HOME' })
  if (process.env.ANDROID_SDK_ROOT) candidates.push({ value: process.env.ANDROID_SDK_ROOT, source: 'ANDROID_SDK_ROOT' })
  if (process.env.LOCALAPPDATA) {
    candidates.push({ value: join(process.env.LOCALAPPDATA, 'Android', 'Sdk'), source: '默认路径' })
  }
  candidates.push({ value: 'D:\\codeapp\\sdk', source: '常见路径' })

  for (const item of candidates) {
    if (!item.value) continue
    const dir = resolve(item.value)
    if (!existsSync(dir)) continue

    let buildTools = []
    try {
      buildTools = readdirSync(join(dir, 'build-tools'))
        .filter((name) => /^\d+(\.\d+)+$/.test(name))
        .sort((a, b) => {
          const pa = a.split('.').map(Number)
          const pb = b.split('.').map(Number)
          for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
            const diff = (pb[i] || 0) - (pa[i] || 0)
            if (diff !== 0) return diff
          }
          return 0
        })
    } catch {
      // 忽略
    }

    const compileSdk = readCompileSdkVersion(root)
    const platformDir = join(dir, 'platforms', 'android-' + compileSdk)
    return {
      dir,
      source: item.source,
      valid: existsSync(join(dir, 'platforms')),
      compileSdk,
      platformDir,
      hasPlatform: existsSync(platformDir),
      buildTools,
      latestBuildTools: buildTools[0] || null,
      hasPlatformTools: existsSync(join(dir, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb')),
      hasLicenses: existsSync(join(dir, 'licenses', 'android-sdk-license')),
    }
  }

  return {
    dir: null,
    source: '未检测到',
    valid: false,
    compileSdk: readCompileSdkVersion(root),
    platformDir: null,
    hasPlatform: false,
    buildTools: [],
    latestBuildTools: null,
    hasPlatformTools: false,
    hasLicenses: false,
  }
}

export function detectCargoBin(config) {
  const candidates = []
  if (config?.desktop?.cargoBin) candidates.push(config.desktop.cargoBin)
  const cargoOnPath = which('cargo')
  if (cargoOnPath) candidates.push(dirname(cargoOnPath))
  if (process.env.CARGO_HOME) candidates.push(join(process.env.CARGO_HOME, 'bin'))
  if (process.env.USERPROFILE) candidates.push(join(process.env.USERPROFILE, '.cargo', 'bin'))
  if (process.env.HOME) candidates.push(join(process.env.HOME, '.cargo', 'bin'))

  for (const dir of uniquePaths(candidates)) {
    const exe = process.platform === 'win32' ? join(dir, 'cargo.exe') : join(dir, 'cargo')
    if (!existsSync(exe)) continue
    const cargoVersion = spawnSync(exe, ['--version'], {
      encoding: 'utf8',
      timeout: 8000,
      windowsHide: true,
    })
    const rustc = process.platform === 'win32' ? join(dir, 'rustc.exe') : join(dir, 'rustc')
    const rustcVersion = existsSync(rustc)
      ? spawnSync(rustc, ['--version'], { encoding: 'utf8', timeout: 8000, windowsHide: true })
      : null
    return {
      dir,
      cargoExe: exe,
      cargoVersion: String(cargoVersion.stdout || '').trim(),
      rustcExe: existsSync(rustc) ? rustc : null,
      rustcVersion: rustcVersion ? String(rustcVersion.stdout || '').trim() : '',
      source: config?.desktop?.cargoBin ? '配置' : '自动检测',
    }
  }

  return {
    dir: null,
    cargoExe: null,
    cargoVersion: '',
    rustcExe: null,
    rustcVersion: '',
    source: '未检测到',
  }
}

export function resolveCloudbaseCli(config) {
  const configured = config?.cloudbase?.cliPath
  if (configured) {
    if (existsSync(configured)) return { path: resolve(configured), source: '配置' }
    const found = which(configured)
    if (found) return { path: found, source: '配置 (PATH)' }
  }
  const candidates = [
    'D:\\cloudbase-cli\\cloudbase.cmd',
    'D:\\cloudbase-cli\\tcb.cmd',
    which('cloudbase'),
    which('tcb'),
  ]
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) {
      return { path: candidate, source: '自动检测' }
    }
  }
  return { path: null, source: '未检测到' }
}

export function readCloudbaseEnvId(root) {
  const config = readJsonIfExists(join(root, 'cloudbaserc.json'))
  return config?.envId || ''
}

export function readCliPackageVersion(cliPath) {
  if (!cliPath) return null
  const dir = dirname(cliPath)
  const candidates = [
    join(dir, 'node_modules', '@cloudbase', 'cli', 'package.json'),
    join(dir, 'package.json'),
  ]
  for (const candidate of candidates) {
    const pkg = readJsonIfExists(candidate)
    if (pkg && pkg.version) return pkg.version
  }
  return null
}

export function readDotEnvNames(root) {
  return {
    production: join(root, '.env.production'),
    ota: join(root, '.env.ota'),
  }
}

export function getFolderSizeSafe(dir) {
  try {
    let total = 0
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      try {
        const info = statSync(full)
        total += info.isDirectory() ? getFolderSizeSafe(full) : info.size
      } catch {
        // 忽略
      }
    }
    return total
  } catch {
    return 0
  }
}

export function fileExists(filePath) {
  try {
    return existsSync(filePath)
  } catch {
    return false
  }
}

export function readText(filePath) {
  try {
    return readFileSync(filePath, 'utf8')
  } catch {
    return null
  }
}
