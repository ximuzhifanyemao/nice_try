// ============================================================
// 上传产物到 GitHub Releases 脚本
// 用法：node scripts/upload-release.mjs
// 前提：apk/kaoyan-tracker.apk 与
//       src-tauri/target/release/bundle/nsis/*.exe、bundle/msi/*.msi 已构建
// 认证：优先 GITHUB_TOKEN / GH_TOKEN 环境变量，或 .env.ota 中配置，
//       否则回退到 git 凭据管理器（HTTPS 推送时用的同款令牌）
// ============================================================

import { readFileSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { execSync, execFileSync } from 'child_process'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)
const pkg = require('../package.json')

// ========== 从 .env.ota 加载环境变量 ==========
const envPath = join(__dirname, '..', '.env.ota')
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) {
      process.env[key] = val
    }
  }
}

// ========== 配置 ==========
const OWNER = process.env.GITHUB_OWNER || 'ximuzhifanyemao'
const REPO = process.env.GITHUB_REPO || 'nice_try'
const VERSION = pkg.version
const TAG = `v${VERSION}`
const APK_PATH = join(__dirname, '..', 'apk', 'kaoyan-tracker.apk')
const ASSET_NAME = 'kaoyan-tracker.apk'
const NSIS_DIR = join(__dirname, '..', 'src-tauri', 'target', 'release', 'bundle', 'nsis')
const MSI_DIR = join(__dirname, '..', 'src-tauri', 'target', 'release', 'bundle', 'msi')
const API = `https://api.github.com/repos/${OWNER}/${REPO}`
const UPLOAD_API = `https://uploads.github.com/repos/${OWNER}/${REPO}`
const WEB = `https://github.com/${OWNER}/${REPO}`

// ========== 获取 GitHub 令牌 ==========
function getToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN
  try {
    const input = 'protocol=https\nhost=github.com\n\n'
    const out = execSync('git credential fill', { input, encoding: 'utf-8' })
    for (const line of out.split('\n')) {
      const t = line.trim()
      if (t.startsWith('password=')) return t.slice('password='.length)
    }
  } catch {
    // 忽略，交给上层报错
  }
  return null
}

// ========== GitHub API 封装 ==========
async function ghApi(path, options = {}, token, base = API) {
  const res = await fetch(`${base}${path}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
    body: options.body,
  })

  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    // 非 JSON 响应
  }

  if (!res.ok) {
    const msg = json?.message || res.statusText || res.status
    throw new Error(`GitHub API ${res.status} ${path}: ${msg}`)
  }
  return json
}

// ========== 生成版本更新日志（自上一个 tag 以来的提交） ==========
// 本地可能没有 tag（release 由 API 创建，本地不会自动打 tag），会导致日志退化为
// "最近 N 条提交"，从而与前一个版本日志大量重复。这里先从远端拉取 tag，
// 再按版本号排序找出当前版本的上一个版本，取其 ..HEAD 提交为本次日志。
function ensureTags() {
  try {
    // 已有 tag 仍要拉取，确保拿到远端最新的 tag（当前版本可能尚未本地打 tag）
    const remote = (execFileSync('git', ['remote'], { encoding: 'utf-8' }).trim().split('\n').filter(Boolean)[0]) || 'origin'
    execFileSync('git', ['fetch', '--tags', '--force', remote], { encoding: 'utf-8', stdio: 'pipe' })
  } catch {
    // 网络失败时忽略，退回本地 tag
  }
}

function buildChangelog() {
  try {
    const buf = execFileSync('git', ['tag', '--sort=-v:refname'], { encoding: 'utf-8' })
    const tags = buf.trim().split('\n').filter(Boolean)
    const current = `v${VERSION}`
    const prevTag = tags.find((t) => t && t !== current) || null
    if (!prevTag) return { prevTag: null, lines: [] }
    const range = `${prevTag}..HEAD`
    const lines = execFileSync('git', ['log', '--pretty=%s', '-30', range], { encoding: 'utf-8' })
      .trim().split('\n').filter(Boolean)
    return { prevTag, lines }
  } catch {
    return { prevTag: null, lines: [] }
  }
}

// 收集本次要上传的全部产物（按当前版本过滤，避免把旧版本 bundle 一起传上去）
function collectAssets() {
  const assets = []
  if (existsSync(APK_PATH)) {
    assets.push({ path: APK_PATH, name: ASSET_NAME, type: 'application/vnd.android.package-archive', label: 'Android (APK)' })
  }
  for (const dir of [['Windows 安装包 (NSIS .exe)', NSIS_DIR, 'application/x-msdownload'], ['Windows (MSI)', MSI_DIR, 'application/x-msi']]) {
    const [label, dirPath, type] = dir
    if (!existsSync(dirPath)) continue
    for (const f of readdirSync(dirPath)) {
      if (f.includes(VERSION)) {
        assets.push({ path: join(dirPath, f), name: f, type, label })
      }
    }
  }
  return assets
}

function buildReleaseBody(changelog, assets) {
  let body = `考研追踪 v${VERSION}\n\n`
  if (changelog.length) {
    body += `## 更新日志\n${changelog.map((l) => `- ${l}`).join('\n')}\n\n`
  }
  const labels = assets.map((a) => `- ${a.label}: \`${a.name}\``)
  body += `## 安装包\n${labels.join('\n')}`
  return body
}

// ========== 核心：上传产物到 Release ==========
export async function uploadApkToGithubRelease({ apkPath = APK_PATH, extraAssets = [] } = {}) {
  const token = getToken()
  if (!token) {
    throw new Error('未找到 GitHub 令牌（请设置 GITHUB_TOKEN，或配置 git 凭据管理器）')
  }

  ensureTags()
  const { prevTag, lines: changelog } = buildChangelog()
  const assets = collectAssets()
  // 允许外部显式追加产物（如临时指定某文件）
  for (const a of extraAssets) {
    if (existsSync(a.path)) assets.push(a)
  }
  if (assets.length === 0) {
    throw new Error(`未找到任何待上传产物（APK 与桌面 bundle 均不存在）`)
  }

  const body = buildReleaseBody(changelog, assets)

  for (const a of assets) {
    console.log(`   产物: ${a.name} (${(readFileSync(a.path).length / 1024 / 1024).toFixed(2)} MB)`)
  }
  console.log(`   更新日志范围: ${prevTag ? `${prevTag}..HEAD (${changelog.length} 条)` : '无 tag，跳过日志'}`)

  // 1. 查找是否已有该 tag 的 Release
  let release
  try {
    release = await ghApi(`/releases/tags/${TAG}`, {}, token)
  } catch {
    release = null
  }

  let releaseId
  if (release?.id) {
    releaseId = release.id
    console.log(`   已有 Release ${TAG}，复用 (id=${releaseId})`)
    // 同步更新正文（含版本更新日志）
    await ghApi(`/releases/${releaseId}`, { method: 'PATCH', body: JSON.stringify({ body }) }, token)
  } else {
    const created = await ghApi(`/releases`, {
      method: 'POST',
      body: JSON.stringify({
        tag_name: TAG,
        name: TAG,
        body,
        draft: false,
        prerelease: false,
      }),
    }, token)
    releaseId = created.id
    console.log(`   已创建 Release ${TAG} (id=${releaseId})`)
  }

  // 2. 上传产物（同名旧 asset 先删除）
  const existingAssets = release?.assets || []
  for (const a of assets) {
    const old = existingAssets.find((x) => x.name === a.name)
    if (old) {
      await ghApi(`/releases/assets/${old.id}`, { method: 'DELETE' }, token)
      console.log(`   已删除旧 asset: ${a.name}`)
    }
    const data = readFileSync(a.path)
    await ghApi(`/releases/${releaseId}/assets?name=${encodeURIComponent(a.name)}`, {
      method: 'POST',
      headers: { 'Content-Type': a.type },
      body: data,
    }, token, UPLOAD_API)
    console.log(`   已上传 asset: ${a.name}`)
  }

  const downloadUrl = `${WEB}/releases/download/${TAG}/${ASSET_NAME}`
  const latestUrl = `${WEB}/releases/latest/download/${ASSET_NAME}`
  return { tag: TAG, downloadUrl, latestUrl, assets }
}

// ========== 直接运行时入口 ==========
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  console.log(`\n🚀 上传产物到 GitHub Releases - v${VERSION}\n`)
  uploadApkToGithubRelease()
    .then(({ tag, downloadUrl, latestUrl, assets }) => {
      console.log(`\n✅ 上传成功！本次 Release ${TAG} 共 ${assets.length} 个产物:`)
      for (const a of assets) console.log(`   - ${a.name}`)
      console.log(`\n   手机端下载: ${downloadUrl}`)
      console.log(`   最新下载: ${latestUrl}\n`)
    })
    .catch((err) => {
      console.error(`❌ 上传失败: ${err.message}`)
      process.exit(1)
    })
}
