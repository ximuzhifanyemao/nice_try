// ============================================================
// OTA 热更新上传脚本
// 用法：node scripts/upload-ota.mjs
// 前提：设置环境变量 SUPABASE_URL 和 SUPABASE_SERVICE_KEY
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { readFileSync, createReadStream, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { createHash } from 'crypto'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)
const pkg = require('../package.json')

// ========== 配置 ==========
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY // 需要 service_role key（非 anon key）
const BUCKET_NAME = 'ota-bundles'
const VERSION = pkg.version

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 请设置环境变量 SUPABASE_URL 和 SUPABASE_SERVICE_KEY')
  console.error('   SUPABASE_SERVICE_KEY 是 service_role key（非 anon key），在 Supabase Dashboard → Settings → API 中获取')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ========== 主流程 ==========
async function main() {
  console.log(`\n📦 考研追踪 OTA 更新上传 - v${VERSION}\n`)

  // 1. 构建项目
  console.log('🔨 构建项目...')
  execSync('npm run build:deploy', { cwd: join(__dirname, '..'), stdio: 'inherit' })

  // 2. 打包 dist 为 zip
  const distDir = join(__dirname, '..', 'dist')
  const zipPath = join(__dirname, '..', `ota-${VERSION}.zip`)

  console.log(`📦 打包 ${distDir} → ${zipPath}`)
  // 使用 PowerShell 压缩（Windows 兼容）
  if (process.platform === 'win32') {
    execSync(
      `powershell -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipPath}' -Force"`,
      { stdio: 'inherit' }
    )
  } else {
    execSync(`cd "${distDir}" && zip -r "${zipPath}" .`, { stdio: 'inherit' })
  }

  // 3. 计算文件哈希和大小
  const zipBuffer = readFileSync(zipPath)
  const checksum = createHash('sha256').update(zipBuffer).digest('hex')
  const fileSize = zipBuffer.length
  console.log(`   SHA256: ${checksum}`)
  console.log(`   大小: ${(fileSize / 1024).toFixed(1)} KB`)

  // 4. 上传到 Supabase Storage
  const storagePath = `v${VERSION}.zip`
  console.log(`\n☁️  上传到 Supabase Storage: ${BUCKET_NAME}/${storagePath}`)

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, zipBuffer, {
      contentType: 'application/zip',
      upsert: true,
    })

  if (uploadError) {
    console.error('❌ 上传失败:', uploadError.message)
    process.exit(1)
  }

  // 5. 获取公开 URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath)

  const bundleUrl = urlData.publicUrl
  console.log(`   URL: ${bundleUrl}`)

  // 6. 写入/更新数据库版本记录
  console.log(`\n📝 写入版本记录到 app_versions 表...`)

  // 获取当前最大 version_code
  const { data: existing } = await supabase
    .from('app_versions')
    .select('version_code')
    .order('version_code', { ascending: false })
    .limit(1)

  const versionCode = existing && existing.length > 0
    ? existing[0].version_code + 1
    : 1

  const { error: dbError } = await supabase
    .from('app_versions')
    .upsert({
      version: VERSION,
      version_code: versionCode,
      bundle_url: bundleUrl,
      file_size: fileSize,
      checksum,
      release_notes: '',
      is_active: true,
    }, {
      onConflict: 'version',
    })

  if (dbError) {
    console.error('❌ 数据库写入失败:', dbError.message)
    process.exit(1)
  }

  // 7. 清理本地 zip
  try {
    if (process.platform === 'win32') {
      execSync(`del "${zipPath}"`, { stdio: 'ignore' })
    } else {
      execSync(`rm "${zipPath}"`, { stdio: 'ignore' })
    }
  } catch {
    // 忽略清理失败
  }

  console.log(`\n✅ OTA 更新 v${VERSION} 已成功发布！`)
  console.log(`   版本号: ${VERSION} (code: ${versionCode})`)
  console.log(`   SHA256: ${checksum}`)
  console.log(`   下载链接: ${bundleUrl}\n`)
}

main().catch((err) => {
  console.error('❌ 脚本执行失败:', err.message)
  process.exit(1)
})