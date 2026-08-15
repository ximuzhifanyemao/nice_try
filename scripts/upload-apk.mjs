// ============================================================
// APK 上传到 Supabase Storage 脚本
// 用法：node scripts/upload-apk.mjs
// 前提：设置环境变量 SUPABASE_URL 和 SUPABASE_SERVICE_KEY
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 请设置环境变量 SUPABASE_URL 和 SUPABASE_SERVICE_KEY')
  console.error('   SUPABASE_SERVICE_KEY 是 service_role key，在 Supabase Dashboard → Settings → API 中获取')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const APK_PATH = join(__dirname, '..', 'apk', 'kaoyan-tracker.apk')
const STORAGE_PATH = 'kaoyan-tracker.apk'
const BUCKET_NAME = 'ota-bundles'

async function main() {
  console.log(`\n📱 上传 APK 到 Supabase Storage\n`)

  // 读取 APK 文件
  const apkBuffer = readFileSync(APK_PATH)
  const fileSizeMB = (apkBuffer.length / 1024 / 1024).toFixed(1)
  console.log(`   文件: ${APK_PATH}`)
  console.log(`   大小: ${fileSizeMB} MB`)

  // 上传到 Storage
  console.log(`\n☁️  上传到: ${BUCKET_NAME}/${STORAGE_PATH}`)
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(STORAGE_PATH, apkBuffer, {
      contentType: 'application/vnd.android.package-archive',
      upsert: true,
    })

  if (uploadError) {
    console.error('❌ 上传失败:', uploadError.message)
    process.exit(1)
  }

  // 获取公开 URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(STORAGE_PATH)

  const downloadUrl = urlData.publicUrl
  console.log(`\n✅ 上传成功！`)
  console.log(`   下载地址: ${downloadUrl}\n`)
}

main().catch((err) => {
  console.error('❌ 脚本执行失败:', err.message)
  process.exit(1)
})