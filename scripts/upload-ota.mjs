// ============================================================
// OTA 更新上传脚本（APK 模式）
// 用法：node scripts/upload-ota.mjs
// 前提：设置环境变量 SUPABASE_URL 和 SUPABASE_SERVICE_KEY
//       APK 文件需已构建到 apk/DiveDeep.apk
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { createHash } from 'crypto'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)
const pkg = require('../package.json')

// ========== 从 .env.ota 加载环境变量（无需每次手动 export）==========
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
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY // 需要 service_role key（非 anon key）
const BUCKET_NAME = 'ota-bundles'
const VERSION = pkg.version
const APK_PATH = join(__dirname, '..', 'apk', 'DiveDeep.apk')
const APK_STORAGE_NAME = 'DiveDeep.apk' // bucket 中使用固定文件名

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 请设置环境变量 SUPABASE_URL 和 SUPABASE_SERVICE_KEY')
  console.error('   SUPABASE_SERVICE_KEY 是 service_role key（非 anon key），在 Supabase Dashboard → Settings → API 中获取')
  process.exit(1)
}

if (!existsSync(APK_PATH)) {
  console.error(`❌ APK 文件不存在: ${APK_PATH}`)
  console.error('   请先构建 APK（npm run cap:android 后手动构建）')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ========== 主流程 ==========
async function main() {
  console.log(`\n📦 DiveDeep OTA 更新上传（APK 模式） - v${VERSION}\n`)

  // 1. 构建项目（用于网站）
  console.log('🔨 构建 Web 项目...')
  execSync('npm run build:deploy', { cwd: join(__dirname, '..'), stdio: 'inherit' })

  // 2. 读取 APK 文件
  console.log(`📦 读取 APK: ${APK_PATH}`)
  const apkBuffer = readFileSync(APK_PATH)
  const checksum = createHash('sha256').update(apkBuffer).digest('hex')
  const fileSize = apkBuffer.length
  console.log(`   SHA256: ${checksum}`)
  console.log(`   大小: ${(fileSize / 1024).toFixed(1)} KB`)

  // 3. 上传 APK 到 Supabase Storage（REST API 直接上传，避免客户端超时）
  //    对比 app_versions 表最新记录的 checksum，相同则跳过（避免重复传大文件）
  //    注意：不能按文件大小判断——不同版本只改 versionName 时 APK 大小可能完全相同
  const force = process.argv.includes('--force')
  console.log(`\n☁️  上传 APK 到 Supabase Storage: ${BUCKET_NAME}/${APK_STORAGE_NAME}`)

  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${APK_STORAGE_NAME}`

  // 查询 app_versions 表最新记录的 checksum（与本地对比决定是否上传）
  const { data: latestVer } = await supabase
    .from('app_versions')
    .select('checksum')
    .order('version_code', { ascending: false })
    .limit(1)
  const remoteChecksum = latestVer?.[0]?.checksum
  console.log(`   本地 SHA256: ${checksum}`)
  console.log(`   云端最新记录 SHA256: ${remoteChecksum ?? '(无记录)'}`)

  let uploadError = null
  if (!force && remoteChecksum === checksum) {
    console.log('   ✅ 云端已存在相同 SHA256 的 APK，跳过上传')
  } else {
    if (force) console.log('   ⚠️ --force 强制上传')
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`   第 ${attempt} 次尝试...`)
      try {
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/vnd.android.package-archive',
            'x-upsert': 'true',
          },
          body: apkBuffer,
          // 不设置 signal，让 Node.js 自行管理超时（默认无限制）
        })

        if (!response.ok) {
          const errText = await response.text().catch(() => '')
          uploadError = new Error(`HTTP ${response.status}: ${errText || response.statusText}`)
        } else {
          uploadError = null
          break
        }
      } catch (err) {
        uploadError = err
      }
      if (uploadError) {
        console.warn(`   ⚠️ 失败: ${uploadError.message}`)
      }
      if (!uploadError) break
      if (attempt < 3) {
        const wait = attempt * 2000
        console.log(`   等待 ${wait / 1000}s 后重试...`)
        await new Promise(r => setTimeout(r, wait))
      }
    }
  }

  // 上传失败时：核对云端是否已存在相同大小文件（响应丢失但服务端已接收）
  if (uploadError) {
    const { data: recheckList } = await supabase.storage.from(BUCKET_NAME).list()
    const recheckApk = recheckList?.find((f) => f.name === APK_STORAGE_NAME)
    if (recheckApk?.metadata?.size === fileSize) {
      console.log('   ⚠️ 上传响应丢失，但云端已存在相同大小的 APK，视为上传成功')
      uploadError = null
    } else {
      console.error('❌ 上传失败（已重试 3 次）:', uploadError.message)
      process.exit(1)
    }
  }

  // 4. 获取公开 URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(APK_STORAGE_NAME)

  const bundleUrl = urlData.publicUrl
  console.log(`   URL: ${bundleUrl}`)

  // 5. 清理旧文件（只保留固定文件名的 APK）
  //    旧 ZIP 包 + 上传测试残留（__t*.bin）+ 旧版本命名的文件都删掉，避免撑爆 50MB 免费额度
  console.log(`\n🧹 清理旧文件（保留 ${APK_STORAGE_NAME}）...`)
  const { data: cleanupList, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list()

  if (!listError && cleanupList) {
    const staleFiles = cleanupList.filter(
      (f) => f.name !== APK_STORAGE_NAME && f.name !== '.emptyFolderPlaceholder'
    )
    if (staleFiles.length > 0) {
      const pathsToRemove = staleFiles.map((f) => f.name)
      const { error: removeError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(pathsToRemove)
      if (removeError) {
        console.warn(`   ⚠️ 清理失败: ${removeError.message}`)
      } else {
        console.log(`   已删除 ${pathsToRemove.length} 个旧文件: ${pathsToRemove.join(', ')}`)
      }
    } else {
      console.log('   无旧文件需要清理')
    }
  }

  // 6. 写入/更新数据库版本记录
  console.log(`\n📝 写入版本记录到 app_versions 表...`)

  // 从 build.gradle 读取 versionCode（与 APK 真实版本一致，避免与数据库最大值脱节）
  const gradlePath = join(__dirname, '..', 'android', 'app', 'build.gradle')
  const gradleContent = readFileSync(gradlePath, 'utf-8')
  const gradleMatch = gradleContent.match(/versionCode\s+(\d+)/)
  const versionCode = gradleMatch ? parseInt(gradleMatch[1], 10) : 1

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

  console.log(`\n✅ OTA 更新 v${VERSION} 已成功发布！`)
  console.log(`   版本号: ${VERSION} (code: ${versionCode})`)
  console.log(`   SHA256: ${checksum}`)
  console.log(`   APK 下载链接: ${bundleUrl}\n`)
}

main().catch((err) => {
  console.error('❌ 脚本执行失败:', err.message)
  process.exit(1)
})