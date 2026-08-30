// ============================================================
// 桌面端（Windows）更新上传脚本
// 用法：npm run ota:desktop
// 前提：npm run build:desktop 已产出 MSI / NSIS bundle；
//       .env.ota 已配置 SUPABASE_URL / SUPABASE_SERVICE_KEY
// 作用：把安装包上传到 Supabase Storage 公开桶 desktop-bundles，
//       并写入 desktop_versions 表（仅当前版本 is_active=true）。
//       这样电脑端无需访问 GitHub 也能检测更新（国内直连）。
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'
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
    if (!process.env[key]) process.env[key] = val
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const BUCKET_NAME = 'desktop-bundles'
const VERSION = pkg.version

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 请设置环境变量 SUPABASE_URL / SUPABASE_SERVICE_KEY（配置在 .env.ota）')
  process.exit(1)
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
        files.push({ name: f, path: join(dir, f) })
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
    const { readdirSync } = require('fs')
    return readdirSync(dir)
  } catch {
    return []
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// 确保公开存储桶存在（不存在则自动创建，避免 Dashboard 手动建桶）
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
  // 已存在则忽略（400 Bucket already exists / 409）
  if (/already exists|Duplicate/i.test(text) || resp.status === 409) {
    console.log(`ℹ️  存储桶 ${BUCKET_NAME} 已存在`)
    return
  }
  console.warn(`⚠️ 创建存储桶失败（HTTP ${resp.status}），若上传报 Bucket not found 请手动在 Dashboard 建桶: ${text}`)
}

async function main() {
  console.log(`\n📦 DiveDeep 桌面端更新上传 - v${VERSION}\n`)
  await ensureBucket()
  const files = collectBundles()
  if (files.length === 0) {
    console.error(`❌ 未找到 v${VERSION} 的 MSI/EXE（请先执行 npm run build:desktop）`)
    process.exit(1)
  }

  // 1. 上传每个安装包到桌面公开桶
  const uploaded = []
  for (const f of files) {
    const buf = readFileSync(f.path)
    const checksum = createHash('sha256').update(buf).digest('hex')
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${encodeURIComponent(f.name)}`
    console.log(`☁️  上传 ${f.name} (${(buf.length / 1024 / 1024).toFixed(2)} MB) → ${BUCKET_NAME}/`)
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
      console.error(`❌ 上传失败 ${f.name}: HTTP ${resp.status} ${errText}`)
      process.exit(1)
    }
    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(f.name)
    uploaded.push({ name: f.name, bundleUrl: urlData.publicUrl, fileSize: buf.length, checksum })
  }

  // 2. 优先选 MSI 作为「推荐安装包」，记录到表
  const primary = uploaded.find((u) => /\.msi$/i.test(u.name)) ?? uploaded[0]

  // 3. 先把本版本以外全部置为 is_active=false，再写入当前版本
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
    console.error('   请先在 Supabase SQL Editor 执行 supabase-migration-desktop-versions.sql')
    process.exit(1)
  }

  console.log(`\n✅ 桌面端更新 v${VERSION} 已发布！`)
  for (const u of uploaded) console.log(`   - ${u.name} (${u.bundleUrl})`)
  console.log(`   推荐安装包: ${primary.name}\n`)
}

main().catch((err) => {
  console.error(`❌ 脚本执行失败: ${err.message}`)
  process.exit(1)
})