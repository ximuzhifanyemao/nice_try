// ============================================================
// 桌面端（Windows）更新上传脚本
// 用法：node scripts/upload-desktop-update.mjs [--host cloudbase|supabase] [--force]
// 前提：npm run build:desktop 已产出 MSI / NSIS bundle；
//       .env.ota 已配置 SUPABASE_URL / SUPABASE_SERVICE_KEY
// 作用：把安装包上传到 CloudBase 静态托管（默认，国内快）
//       或 Supabase Storage（原有通道），并写入 desktop_versions 表；
//       版本记录始终写 Supabase，因为桌面端用它检测更新。
// ============================================================

import { createClient } from '@supabase/supabase-js'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'
import { createRequire } from 'module'
import { execSync } from 'child_process'
import { request as httpsRequest } from 'https'

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
    if (!process.env[key]) process.env[key] = val
  }
}

// ========== 发版控制台配置（与 release/config.json 共用一份设置）==========
const RELEASE_CONFIG_PATH = join(__dirname, '..', 'release', 'config.json')
let releaseConfig = {}
try {
  if (existsSync(RELEASE_CONFIG_PATH)) {
    releaseConfig = JSON.parse(readFileSync(RELEASE_CONFIG_PATH, 'utf-8'))
  }
} catch {
  console.warn('⚠️  release/config.json 解析失败，桌面端 OTA 目标回退为 supabase')
}
const CLOUDBASE_CLI = String(releaseConfig.cloudbase?.cliPath || '')
const CLOUDBASE_ENV_ID = String(releaseConfig.cloudbase?.envId || '')
const CLOUDBASE_STATIC_DOMAIN = String(
  releaseConfig.cloudbase?.staticDomain || releaseConfig.cloudbase?.siteUrl || '',
).replace(/\/+$/, '')
const CLOUDBASE_DIR = String(releaseConfig.desktop?.cloudbaseDir || 'downloads/desktop')
  .replace(/^\/+|\/+$/g, '') || 'downloads/desktop'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const BUCKET_NAME = String(releaseConfig.desktop?.supabaseBucket || 'desktop-bundles')
  .replace(/^\/+|\/+$/g, '') || 'desktop-bundles'
const VERSION = pkg.version

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 请设置环境变量 SUPABASE_URL / SUPABASE_SERVICE_KEY（配置在 .env.ota）')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function describeError(err) {
  const cause = err?.cause
  const code = cause?.code || err?.code
  const message = cause?.message || err?.message || String(err)
  return code && !message.includes(code) ? `${message} (${code})` : message
}

function quoteArg(value) {
  const text = String(value)
  return /\s/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function joinUrl(base, ...parts) {
  const root = String(base || '').replace(/\/+$/, '')
  const rest = parts
    .map((part) => String(part || '').replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')
  return root + (rest ? '/' + rest : '')
}

// 收集本次版本对应的桌面安装包（来自 tauri bundle 输出）
function collectBundles() {
  const dirs = [
    join(__dirname, '..', 'src-tauri', 'target', 'release', 'bundle', 'msi'),
    join(__dirname, '..', 'src-tauri', 'target', 'release', 'bundle', 'nsis'),
  ]
  const files = []
  for (const dir of dirs) {
    if (!existsSync(dir)) continue
    for (const f of readdirSafe(dir)) {
      if (f.includes(VERSION) && /\.(msi|exe)$/i.test(f)) {
        files.push({ name: f, path: join(dir, f), size: statSync(join(dir, f)).size })
      }
    }
  }
  // 优先 MSI，其次 setup.exe，确保至少一个
  files.sort((a, b) => {
    const rank = (n) => (/\.msi$/i.test(n) ? 0 : /setup.*\.exe$/i.test(n) ? 1 : 2)
    return rank(a.name) - rank(b.name)
  })
  return files
}

function readdirSafe(dir) {
  try {
    return readdirSync(dir)
  } catch {
    return []
  }
}

/** 确保公开存储桶存在（不存在则自动创建，避免 Dashboard 手动建桶） */
async function ensureBucket() {
  const resp = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: BUCKET_NAME, name: BUCKET_NAME, public: true }),
  })
  if (resp.ok) {
    console.log(`✅ 存储桶 ${BUCKET_NAME} 创建成功（公开）`)
    return
  }
  const text = await resp.text().catch(() => '')
  if (/already exists|Duplicate/i.test(text) || resp.status === 409) {
    console.log(`ℹ️  存储桶 ${BUCKET_NAME} 已存在`)
    return
  }
  console.warn(`⚠️ 创建存储桶失败（HTTP ${resp.status}），若上传报 Bucket not found 请手动在 Dashboard 建桶: ${text}`)
}

function headRemoteFileSize(urlStr) {
  return new Promise((resolvePromise) => {
    const target = new URL(urlStr)
    const req = httpsRequest(
      {
        method: 'HEAD',
        hostname: target.hostname,
        port: Number(target.port) || 443,
        path: target.pathname + target.search,
        agent: false,
      },
      (res) => {
        res.resume()
        const size = res.statusCode === 200 ? Number(res.headers['content-length']) : null
        resolvePromise(Number.isFinite(size) ? size : null)
      },
    )
    req.setTimeout(30000, () => req.destroy(new Error('HEAD 请求超时')))
    req.on('error', () => resolvePromise(null))
    req.end()
  })
}

/** 上传到 CloudBase 静态托管：把本版本安装包放到 downloads/desktop 下。 */
function uploadToCloudBase(files) {
  if (!CLOUDBASE_CLI) {
    throw new Error('未配置 CloudBase CLI 路径（release/config.json → cloudbase.cliPath）')
  }
  if (!CLOUDBASE_ENV_ID) {
    throw new Error('未配置 CloudBase 环境 ID（release/config.json → cloudbase.envId）')
  }
  if (!CLOUDBASE_STATIC_DOMAIN) {
    throw new Error('未配置静态托管域名（release/config.json → cloudbase.staticDomain）')
  }

  const stagingDir = join(__dirname, '..', 'release', '.tmp', 'desktop-ota')
  rmSync(stagingDir, { recursive: true, force: true })
  mkdirSync(stagingDir, { recursive: true })
  for (const file of files) {
    copyFileSync(file.path, join(stagingDir, file.name))
  }

  console.log(`   上传到 CloudBase: ${CLOUDBASE_ENV_ID}/${CLOUDBASE_DIR}/`)
  const command = [
    CLOUDBASE_CLI,
    'hosting',
    'deploy',
    stagingDir,
    CLOUDBASE_DIR,
    '-e',
    CLOUDBASE_ENV_ID,
    '--verify',
  ]
    .map(quoteArg)
    .join(' ')
  execSync(command, { cwd: join(__dirname, '..'), stdio: 'inherit', shell: true })

  return files.map((file) => ({
    name: file.name,
    bundleUrl: joinUrl(CLOUDBASE_STATIC_DOMAIN, CLOUDBASE_DIR, encodeURIComponent(file.name)),
    fileSize: file.size,
    checksum: createHash('sha256').update(readFileSync(file.path)).digest('hex'),
  }))
}

/** 上传到 Supabase Storage（原有通道，保留备用）。 */
async function uploadToSupabase(files) {
  await ensureBucket()
  const uploaded = []
  for (const file of files) {
    const buf = readFileSync(file.path)
    const checksum = createHash('sha256').update(buf).digest('hex')
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${encodeURIComponent(file.name)}`
    console.log(`☁️  上传 ${file.name} (${(buf.length / 1024 / 1024).toFixed(2)} MB) → ${BUCKET_NAME}/`)
    const resp = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/octet-stream',
        'x-upsert': 'true',
      },
      body: buf,
    })
    if (!resp.ok) {
      const errText = await resp.text().catch(() => '')
      throw new Error(`上传失败 ${file.name}: HTTP ${resp.status} ${errText}`)
    }
    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(file.name)
    uploaded.push({ name: file.name, bundleUrl: urlData.publicUrl, fileSize: buf.length, checksum })
  }
  return uploaded
}

async function main() {
  const hostArgIndex = process.argv.indexOf('--host')
  const otaHost = String(
    (hostArgIndex >= 0 ? process.argv[hostArgIndex + 1] : '') ||
      process.env.DESKTOP_OTA_HOST ||
      releaseConfig.desktop?.otaHost ||
      'cloudbase',
  ).toLowerCase()
  if (!['cloudbase', 'supabase'].includes(otaHost)) {
    console.error(`❌ 未知的桌面端 OTA 上传目标: ${otaHost}（可选 cloudbase / supabase）`)
    process.exit(1)
  }

  console.log(`\n📦 DiveDeep 桌面端更新上传 - v${VERSION}`)
  console.log(`   目标: ${otaHost === 'cloudbase' ? 'CloudBase 静态托管（国内）' : 'Supabase Storage'}\n`)

  const files = collectBundles()
  if (files.length === 0) {
    console.error(`❌ 未找到 v${VERSION} 的 MSI/EXE（请先执行 npm run build:desktop）`)
    process.exit(1)
  }

  const uploaded = otaHost === 'cloudbase' ? uploadToCloudBase(files) : await uploadToSupabase(files)

  // CloudBase CDN 刷新有延迟，仅做提示性校验，不阻塞发布
  if (otaHost === 'cloudbase') {
    for (const item of uploaded) {
      const remoteSize = await headRemoteFileSize(item.bundleUrl)
      if (remoteSize !== item.fileSize) {
        console.warn(
          `   ⚠️ 远端校验未通过（远端 ${remoteSize ?? '读取失败'} / 本地 ${item.fileSize}），CDN 可能尚未刷新：${item.name}`,
        )
      } else {
        console.log(`   ✅ 远端校验通过：${item.name}`)
      }
    }
  }

  // 优先选 MSI 作为「推荐安装包」，记录到表
  const primary = uploaded.find((u) => /\.msi$/i.test(u.name)) ?? uploaded[0]

  // 先把本版本以外全部置为 is_active=false，再写入当前版本
  const { error: deactivateErr } = await supabase
    .from('desktop_versions')
    .update({ is_active: false })
    .neq('version', VERSION)
  if (deactivateErr) console.warn(`⚠️ 停用旧版本失败（非致命）: ${deactivateErr.message}`)

  const { error: dbError } = await supabase.from('desktop_versions').upsert(
    {
      version: VERSION,
      bundle_url: primary.bundleUrl,
      file_name: primary.name,
      file_size: primary.fileSize,
      checksum: primary.checksum,
      release_notes: '',
      is_active: true,
    },
    { onConflict: 'version' },
  )
  if (dbError) {
    console.error(`❌ 写入 desktop_versions 失败: ${dbError.message}`)
    console.error('   请先在 Supabase SQL Editor 执行合并后的 supabase-schema.sql（已包含桌面端版本表，幂等可重复执行）')
    process.exit(1)
  }

  console.log(`\n✅ 桌面端更新 v${VERSION} 已发布！`)
  for (const u of uploaded) console.log(`   - ${u.name} (${u.bundleUrl})`)
  console.log(`   推荐安装包: ${primary.name}\n`)
}

main().catch((err) => {
  console.error(`❌ 脚本执行失败: ${describeError(err)}`)
  process.exit(1)
})
