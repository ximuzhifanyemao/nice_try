// ============================================================
// 上传 APK 到 GitHub Releases 脚本
// 用法：node scripts/upload-release.mjs
// 前提：apk/kaoyan-tracker.apk 已构建
// 认证：优先 GITHUB_TOKEN / GH_TOKEN 环境变量，或 .env.ota 中配置，
//       否则回退到 git 凭据管理器（HTTPS 推送时用的同款令牌）
// ============================================================

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { execSync } from 'child_process'
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

// ========== 核心：上传 APK 到 Release ==========
export async function uploadApkToGithubRelease({ apkPath = APK_PATH } = {}) {
  if (!existsSync(apkPath)) {
    throw new Error(`APK 文件不存在: ${apkPath}`)
  }
  const apk = readFileSync(apkPath)
  const token = getToken()
  if (!token) {
    throw new Error('未找到 GitHub 令牌（请设置 GITHUB_TOKEN，或配置 git 凭据管理器）')
  }

  console.log(`   APK: ${apkPath} (${(apk.length / 1024 / 1024).toFixed(2)} MB)`)

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
    // 删除同名旧 asset（同名文件无法重复上传）
    const oldAsset = release.assets?.find((a) => a.name === ASSET_NAME)
    if (oldAsset) {
      await ghApi(`/releases/assets/${oldAsset.id}`, { method: 'DELETE' }, token)
      console.log(`   已删除旧 asset: ${ASSET_NAME}`)
    }
  } else {
    const created = await ghApi(`/releases`, {
      method: 'POST',
      body: JSON.stringify({
        tag_name: TAG,
        name: TAG,
        body: `考研追踪 App v${VERSION}（Android APK）\n\n安装包：${ASSET_NAME}`,
        draft: false,
        prerelease: false,
      }),
    }, token)
    releaseId = created.id
    console.log(`   已创建 Release ${TAG} (id=${releaseId})`)
  }

  // 2. 上传 asset
  const asset = await ghApi(`/releases/${releaseId}/assets?name=${encodeURIComponent(ASSET_NAME)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.android.package-archive',
    },
    body: apk,
  }, token, UPLOAD_API)
  console.log(`   已上传 asset: ${ASSET_NAME}`)

  const downloadUrl = asset.browser_download_url || `${WEB}/releases/download/${TAG}/${ASSET_NAME}`
  const latestUrl = `${WEB}/releases/latest/download/${ASSET_NAME}`
  return { tag: TAG, downloadUrl, latestUrl }
}

// ========== 直接运行时入口 ==========
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  console.log(`\n🚀 上传 APK 到 GitHub Releases - v${VERSION}\n`)
  uploadApkToGithubRelease()
    .then(({ tag, downloadUrl, latestUrl }) => {
      console.log(`\n✅ 上传成功！`)
      console.log(`   版本下载: ${downloadUrl}`)
      console.log(`   最新下载: ${latestUrl}\n`)
    })
    .catch((err) => {
      console.error(`❌ 上传失败: ${err.message}`)
      process.exit(1)
    })
}
