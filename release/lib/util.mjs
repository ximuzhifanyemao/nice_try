// ============================================================
// 发布控制台 - 通用工具
// 只依赖 Node 内置模块，不引入第三方依赖。
// ============================================================

import { spawn } from 'node:child_process'
import { createHash, randomBytes } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, isAbsolute, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const LIB_DIR = dirname(fileURLToPath(import.meta.url))

export const RELEASE_DIR = resolve(LIB_DIR, '..')
export const PROJECT_ROOT = resolve(RELEASE_DIR, '..')
export const CONFIG_PATH = join(RELEASE_DIR, 'config.json')
export const HISTORY_PATH = join(RELEASE_DIR, 'history.json')
export const LOG_DIR = join(RELEASE_DIR, 'logs')
export const TMP_DIR = join(RELEASE_DIR, '.tmp')
export const PUBLIC_DIR = join(RELEASE_DIR, 'public')
export const IS_WINDOWS = process.platform === 'win32'

export const TARGET_IDS = ['web', 'apk', 'desktop']
export const TARGET_LABELS = {
  web: 'Web 网站',
  apk: 'Android APK',
  desktop: 'Windows 桌面端',
}

export function ensureRuntimeDirs() {
  for (const dir of [RELEASE_DIR, LOG_DIR, TMP_DIR]) {
    mkdirSync(dir, { recursive: true })
  }
}

export function resolveFrom(base, value) {
  if (!value) return value
  if (isAbsolute(value)) return value
  return resolve(base, value)
}

export function isInside(child, parent) {
  const c = resolve(child)
  const p = resolve(parent)
  return c === p || c.startsWith(p.endsWith(sep) ? p : p + sep)
}

export function readJsonIfExists(filePath) {
  try {
    if (!existsSync(filePath)) return null
    return JSON.parse(readFileSync(filePath, 'utf8'))
  } catch {
    return null
  }
}

export function readTextIfExists(filePath) {
  try {
    if (!existsSync(filePath)) return null
    return readFileSync(filePath, 'utf8')
  } catch {
    return null
  }
}

export function writeJsonAtomic(filePath, data) {
  mkdirSync(dirname(filePath), { recursive: true })
  const tmp = filePath + '.tmp-' + process.pid + '-' + Date.now()
  writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8')
  try {
    renameSync(tmp, filePath)
  } catch {
    rmSync(filePath, { force: true })
    renameSync(tmp, filePath)
  }
}

export function writeTextAtomic(filePath, text) {
  mkdirSync(dirname(filePath), { recursive: true })
  const tmp = filePath + '.tmp-' + process.pid + '-' + Date.now()
  writeFileSync(tmp, text, 'utf8')
  try {
    renameSync(tmp, filePath)
  } catch {
    rmSync(filePath, { force: true })
    renameSync(tmp, filePath)
  }
}

export function deepMerge(base, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return base
  const out = Array.isArray(base) ? [...base] : { ...(base || {}) }
  for (const [key, value] of Object.entries(patch)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      out[key] &&
      typeof out[key] === 'object' &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMerge(out[key], value)
    } else {
      out[key] = value
    }
  }
  return out
}

const ANSI_PATTERN = new RegExp(String.fromCharCode(27) + '\\[[0-9;?]*[ -/]*[@-~]', 'g')

const UTF8_STRICT_DECODER = new TextDecoder('utf-8', { fatal: true })
let gbkDecoder = null

/**
 * 解码命令行输出的一行。
 * 子进程编码并不统一：node / npm 输出 UTF-8，而 cmd 与 git 在 Windows 控制台
 * 代码页下输出 GBK。先按 UTF-8 严格解码，失败再退回 GBK，避免日志出现 U+FFFD。
 */
function decodeOutputLine(buffer) {
  if (!buffer || buffer.length === 0) return ''
  try {
    return UTF8_STRICT_DECODER.decode(buffer)
  } catch {
    // 不是合法 UTF-8，继续尝试 GBK
  }
  try {
    if (!gbkDecoder) gbkDecoder = new TextDecoder('gbk')
    return gbkDecoder.decode(buffer)
  } catch {
    return buffer.toString('utf8')
  }
}

export function stripAnsi(text) {
  return String(text).replace(ANSI_PATTERN, '')
}

/**
 * 读取环境对象里的 PATH 值。
 * Windows 上 PATH 的键名大小写不固定（例如被某些启动器写成小写 `path`），
 * 直接读 env.PATH / env.Path 会漏掉，进而导致子进程 PATH 被清空。
 */
export function getEnvPath(envObj = process.env) {
  if (!envObj) return ''
  let found = ''
  for (const key of Object.keys(envObj)) {
    if (key.toLowerCase() !== 'path') continue
    const value = envObj[key]
    if (value) found = String(value)
  }
  return found
}

/** 写入 PATH，并删除其它大小写变体，保证只留下一个键。 */
export function setEnvPath(envObj, value) {
  for (const key of Object.keys(envObj)) {
    if (key.toLowerCase() === 'path') delete envObj[key]
  }
  envObj[IS_WINDOWS ? 'Path' : 'PATH'] = String(value || '')
  return envObj
}

export function splitPathList(value) {
  if (!value) return []
  const sep = IS_WINDOWS ? ';' : ':'
  return String(value)
    .split(sep)
    .map((item) => item.trim().replace(/^"|"$/g, ''))
    .filter(Boolean)
}

/** 合并多组 PATH 片段并去重（Windows 不区分大小写），保持先出现的顺序。 */
export function mergePathList(...lists) {
  const seen = new Set()
  const out = []
  for (const list of lists) {
    for (const item of list || []) {
      const trimmed = String(item || '').trim().replace(/^"|"$/g, '')
      if (!trimmed) continue
      const key = trimmed.replace(/[\\/]+$/, '')
      const dedupeKey = IS_WINDOWS ? key.toLowerCase() : key
      if (seen.has(dedupeKey)) continue
      seen.add(dedupeKey)
      out.push(trimmed)
    }
  }
  return out
}

/**
 * 合并 process.env 与附加 env，并修正 PATH 的大小写问题。
 * 子进程 env 里若同时存在 `PATH` 与 `path`，Windows 取哪个键是不确定的，
 * 必须收敛成一个键再交给 spawn。
 */
export function mergeEnv(extra = {}) {
  const merged = { ...process.env, ...extra }
  const basePath = getEnvPath(process.env)
  const extraPath = getEnvPath(extra)
  setEnvPath(merged, extraPath || basePath)
  if (IS_WINDOWS && !merged.PATHEXT) {
    merged.PATHEXT = '.COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.JSE;.WSF;.WSH;.MSC'
  }
  return merged
}

export function which(command) {
  if (!command) return null
  const cmd = String(command).trim()
  if (!cmd) return null
  if (cmd.includes('/') || cmd.includes('\\')) {
    return existsSync(cmd) ? cmd : null
  }

  const pathValue = getEnvPath(process.env)
  const dirs = pathValue.split(IS_WINDOWS ? ';' : ':').filter(Boolean)
  const exts = IS_WINDOWS
    ? (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';').filter(Boolean)
    : ['']

  for (const dir of dirs) {
    const trimmed = dir.replace(/^"|"$/g, '')
    for (const ext of exts) {
      const candidate = join(trimmed, cmd + ext)
      if (existsSync(candidate)) return candidate
    }
  }
  return null
}

export function quoteArg(value) {
  const text = String(value)
  if (!text) return IS_WINDOWS ? '""' : "''"
  if (IS_WINDOWS) {
    if (!/[\s"&|<>^()%!]/.test(text)) return text
    return '"' + text.replace(/"/g, '""') + '"'
  }
  if (!/[\s"'$\x60\\!*?[\]{}()<>|&;]/.test(text)) return text
  return "'" + text.replace(/'/g, "'\\''") + "'"
}

export function buildCommand(parts) {
  return parts.map(quoteArg).join(' ')
}

/**
 * 通过 shell 执行命令，实时回调每一行输出。
 * @param {string} command
 * @param {{cwd?: string, env?: Record<string,string>, timeoutMs?: number, input?: string|null, onLine?: (line: string, stream: 'stdout'|'stderr') => void, onSpawn?: (child: import('node:child_process').ChildProcess) => void}} options
 * @returns {Promise<{code: number|null, signal: string|null, stdout: string, stderr: string, timedOut: boolean, durationMs: number}>}
 */
export function runShell(command, options = {}) {
  const {
    cwd = PROJECT_ROOT,
    env = {},
    timeoutMs = 15 * 60 * 1000,
    input = null,
    onLine = () => {},
    onSpawn = null,
    // 指定 shell 可执行文件时不再经过 cmd，例如用 Git Bash 执行命令
    shellExe = null,
    shellArgs = [],
  } = options

  return new Promise((resolvePromise) => {
    const startedAt = Date.now()
    let child
    try {
      child = shellExe
        ? spawn(shellExe, [...shellArgs, command], {
            cwd,
            windowsHide: true,
            env: mergeEnv(env),
            stdio: ['pipe', 'pipe', 'pipe'],
          })
        : spawn(command, {
            cwd,
            shell: true,
            windowsHide: true,
            env: mergeEnv(env),
            stdio: ['pipe', 'pipe', 'pipe'],
          })
    } catch (error) {
      resolvePromise({
        code: null,
        signal: null,
        stdout: '',
        stderr: String(error?.message || error),
        timedOut: false,
        durationMs: Date.now() - startedAt,
      })
      return
    }

    if (onSpawn) {
      try {
        onSpawn(child)
      } catch {
        // 忽略回调错误
      }
    }

    let stdout = ''
    let stderr = ''
    let settled = false
    let timedOut = false

    const emit = (buffer, stream) => {
      let line = stripAnsi(decodeOutputLine(buffer))
      if (line.endsWith('\r')) line = line.slice(0, -1)
      if (stream === 'stdout') stdout = appendCapped(stdout, line + '\n')
      else stderr = appendCapped(stderr, line + '\n')
      if (!line.trim()) return
      try {
        onLine(line, stream)
      } catch {
        // 忽略 UI 错误
      }
    }

    // 按字节缓冲、以换行切行，再逐行判断编码（UTF-8 / GBK）
    const makeReader = (stream) => {
      let pending = Buffer.alloc(0)
      return {
        push(chunk) {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
          pending = pending.length ? Buffer.concat([pending, buffer]) : buffer
          let index
          while ((index = pending.indexOf(0x0a)) >= 0) {
            const lineBuffer = pending.subarray(0, index)
            pending = pending.subarray(index + 1)
            emit(lineBuffer, stream)
          }
        },
        flush() {
          if (pending.length === 0) return
          const rest = pending
          pending = Buffer.alloc(0)
          emit(rest, stream)
        },
      }
    }

    const outReader = makeReader('stdout')
    const errReader = makeReader('stderr')

    const timer = setTimeout(() => {
      timedOut = true
      killProcessTree(child)
    }, timeoutMs)

    const finish = (code, signal) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      outReader.flush()
      errReader.flush()
      resolvePromise({
        code,
        signal,
        stdout,
        stderr,
        timedOut,
        durationMs: Date.now() - startedAt,
      })
    }

    child.stdout.on('data', (chunk) => outReader.push(chunk))
    child.stderr.on('data', (chunk) => errReader.push(chunk))
    child.on('error', (error) => {
      stderr = appendCapped(stderr, String(error?.message || error) + '\n')
      finish(null, null)
    })
    child.on('close', (code, signal) => finish(code, signal))

    if (input != null) {
      try {
        child.stdin.write(input)
        child.stdin.end()
      } catch {
        // 忽略
      }
    } else {
      try {
        child.stdin.end()
      } catch {
        // 忽略
      }
    }
  })
}

function appendCapped(current, chunk, cap = 2 * 1024 * 1024) {
  const next = current + chunk
  return next.length > cap ? next.slice(-cap) : next
}

export function killProcessTree(child) {
  if (!child) return
  const pid = child.pid
  if (!pid) return
  try {
    if (IS_WINDOWS) {
      spawn('taskkill', ['/pid', String(pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      })
    } else {
      try {
        process.kill(-pid, 'SIGTERM')
      } catch {
        try {
          process.kill(pid, 'SIGTERM')
        } catch {
          // 忽略
        }
      }
    }
  } catch {
    // 忽略
  }
  try {
    child.kill()
  } catch {
    // 忽略
  }
}

export function readEnvFile(filePath) {
  const result = {}
  const text = readTextIfExists(filePath)
  if (!text) return result
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key) result[key] = value
  }
  return result
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '-'
  const totalSeconds = Math.round(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return hours + ' 小时 ' + minutes + ' 分'
  if (minutes > 0) return minutes + ' 分 ' + seconds + ' 秒'
  return seconds + ' 秒'
}

export function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  const pad = (n) => String(n).padStart(2, '0')
  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    ' ' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes()) +
    ':' +
    pad(date.getSeconds())
  )
}

export function formatClock(value = Date.now()) {
  const date = value instanceof Date ? value : new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds())
}

export function formatStamp(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return (
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    '-' +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  )
}

export function makeRunId(version) {
  const safeVersion = String(version).replace(/[^0-9A-Za-z._-]/g, '-')
  return 'v' + safeVersion + '-' + formatStamp() + '-' + randomBytes(2).toString('hex')
}

export function sha256Text(text) {
  return createHash('sha256').update(text).digest('hex')
}

export function sha256File(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

export function fileSize(filePath) {
  try {
    return statSync(filePath).size
  } catch {
    return 0
  }
}

export function escapeRegExp(text) {
  return String(text).replace(/[.*+?^\x24{}()|[\]\\]/g, '\\$&')
}

export function maskSecret(value) {
  if (!value) return ''
  const text = String(value)
  if (text.length <= 8) return '****'
  return text.slice(0, 4) + '…' + text.slice(-4)
}

export function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms))
}

export function unique(items) {
  return [...new Set(items)]
}

export function isSemverLike(value) {
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(
    String(value || '').trim(),
  )
}
