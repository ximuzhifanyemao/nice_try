// ============================================================
// OTA 更新上传脚本（APK 模式）
// 用法：node scripts/upload-ota.mjs [--skip-build] [--apk <path>] [--host cloudbase|supabase]
// 前提：设置环境变量 SUPABASE_URL 和 SUPABASE_SERVICE_KEY（app_versions 表仍走 Supabase）
//       --host 选择 APK 存放位置：cloudbase（默认读 release/config.json，国内快）
//       或 supabase（原有通道，代码保留可随时切回）
//       APK 自动挑选 apk/ 下最新的版本化 APK（kaoyan-tracker-vX.Y.Z.apk），
//       没有则回退 apk/DiveDeep.apk；--skip-build 跳过 Web 构建（发版脚本用）
//       --apk 可显式指定本次要上传的 APK，避免同目录存在更高版本文件时误选
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync, readdirSync, statSync, copyFileSync, mkdirSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { fileURLToPath, URL } from 'url'
import { execSync } from 'child_process'
import { createHash } from 'crypto'
import { createRequire } from 'module'
import { request as httpsRequest } from 'https'
import { request as httpRequest } from 'http'
import { connect as netConnect } from 'net'
import { connect as tlsConnect } from 'tls'

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
const VERSION = pkg.version
const APK_DIR = join(__dirname, '..', 'apk')
const APK_STORAGE_NAME = 'DiveDeep.apk' // bucket 中使用固定文件名，保证公共下载链接稳定
// 只让大文件上传走代理（直连 Supabase 的国际上行只有 ~40KB/s，走代理实测快 3 倍左右）
const UPLOAD_PROXY = process.env.OTA_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || ''

// ========== 发版控制台配置（与 release/config.json 共用一份设置）==========
// OTA 上传目标：cloudbase（国内静态托管，快）/ supabase（原有通道，保留备用）
const RELEASE_CONFIG_PATH = join(__dirname, '..', 'release', 'config.json')
let releaseConfig = {}
try {
  if (existsSync(RELEASE_CONFIG_PATH)) {
    releaseConfig = JSON.parse(readFileSync(RELEASE_CONFIG_PATH, 'utf-8'))
  }
} catch {
  console.warn('⚠️  release/config.json 解析失败，OTA 上传目标回退为 supabase')
}
const CLOUDBASE_CLI = String(releaseConfig.cloudbase?.cliPath || '')
const CLOUDBASE_ENV_ID = String(releaseConfig.cloudbase?.envId || '')
// 静态托管默认域名：webapps 域名只提供站点入口，实测不返回 APK 等任意文件
const CLOUDBASE_STATIC_DOMAIN = String(
  releaseConfig.cloudbase?.staticDomain || releaseConfig.cloudbase?.siteUrl || '',
).replace(/\/+$/, '')
// 云端目录：默认 downloads/DiveDeep.apk，可在 release/config.json 中改
const CLOUDBASE_OTA_DIR = String(releaseConfig.android?.cloudbaseDir || 'downloads')
  .replace(/^\/+|\/+$/g, '') || 'downloads'
// Supabase 公开桶名，可在 release/config.json 中改
const BUCKET_NAME = String(releaseConfig.android?.supabaseBucket || 'ota-bundles').replace(/^\/+|\/+$/g, '') || 'ota-bundles'

/**
 * 自动挑选最新 APK：
 * 优先用 apk/ 下最新的版本化 APK（kaoyan-tracker-vX.Y.Z.apk，一键发版脚本会实时更新它）；
 * 若版本化 APK 不存在或比 DiveDeep.apk 旧，则回退用 DiveDeep.apk（手工构建场景）。
 * 避免忘复制文件时把历史遗留的旧 DiveDeep.apk 当成新包发布。
 */
function selectApkSource() {
  const fixedPath = join(APK_DIR, APK_STORAGE_NAME)
  const fixedMtime = existsSync(fixedPath) ? statSync(fixedPath).mtimeMs : -1
  let versioned = []
  try {
    versioned = readdirSync(APK_DIR)
      .filter((f) => /^kaoyan-tracker-v\d+\.\d+\.\d+\.apk$/i.test(f))
      .map((f) => {
        const p = join(APK_DIR, f)
        return { path: p, name: f, mtime: statSync(p).mtimeMs }
      })
      .sort((a, b) => b.mtime - a.mtime)
  } catch {
    // apk 目录不存在时忽略
  }
  if (versioned.length > 0 && versioned[0].mtime >= fixedMtime) {
    return { path: versioned[0].path, picked: `版本化 APK ${versioned[0].name}` }
  }
  return { path: fixedPath, picked: existsSync(fixedPath) ? APK_STORAGE_NAME : '(不存在)' }
}

/**
 * 打印可读的错误信息。
 * Node 内置 fetch（undici）抛出的都是 "fetch failed"，真正原因在 err.cause 里，
 * 不展开 cause 就只能看到一句没有信息量的报错。
 */
function describeError(err) {
  const cause = err?.cause
  const code = cause?.code || err?.code
  const message = cause?.message || err?.message || String(err)
  return code && !message.includes(code) ? `${message} (${code})` : message
}

/**
 * 探测代理是否可用（3 秒内能建立 TCP 连接即可）。
 * 代理没开时不要卡住整个发布流程，直接回退直连。
 */
function probeProxy(proxyUrl) {
  return new Promise((resolvePromise, reject) => {
    const proxy = new URL(proxyUrl)
    const socket = netConnect({ host: proxy.hostname, port: Number(proxy.port) || 80 })
    const finish = (err) => {
      socket.destroy()
      if (err) reject(err)
      else resolvePromise()
    }
    socket.setTimeout(3000, () => finish(new Error('连接代理超时')))
    socket.once('connect', () => finish())
    socket.once('error', finish)
  })
}

/**
 * 通过 HTTP 代理建立到目标站点的 CONNECT 隧道，返回已握手完成的 TLS socket。
 */
function createProxiedTlsSocket(proxyUrl, targetHost, targetPort) {
  return new Promise((resolvePromise, reject) => {
    const proxy = new URL(proxyUrl)
    const connectReq = httpRequest({
      host: proxy.hostname,
      port: Number(proxy.port) || 80,
      method: 'CONNECT',
      path: `${targetHost}:${targetPort}`,
      headers: { Host: `${targetHost}:${targetPort}` },
      agent: false,
    })
    connectReq.setTimeout(30000, () => connectReq.destroy(new Error('代理 CONNECT 超时')))
    connectReq.on('connect', (res, socket) => {
      if (res.statusCode !== 200) {
        socket.destroy()
        reject(new Error(`代理 CONNECT 失败: HTTP ${res.statusCode}`))
        return
      }
      const tlsSocket = tlsConnect({ socket, servername: targetHost })
      tlsSocket.once('error', reject)
      tlsSocket.once('secureConnect', () => resolvePromise(tlsSocket))
    })
    connectReq.on('error', (err) => reject(new Error(`代理不可用: ${describeError(err)}`)))
    connectReq.end()
  })
}

/**
 * 用 node:https 直传 APK（可选走 HTTP 代理的 CONNECT 隧道）。
 * 不能用全局 fetch：undici 的 headersTimeout/bodyTimeout 默认只有 300 秒，
 * 而 APK 传到 Supabase 的上行只有 ~40KB/s，18MB 要传 8 分钟左右，
 * 会在第 5 分钟被掐断并抛出含糊的 "fetch failed"。
 * 这里只限制「完全没有收发进展」的时间（120 秒），慢速但仍在传的上传不受影响。
 */
async function uploadApkByHttps(uploadUrl, body, proxyUrl) {
  const target = new URL(uploadUrl)
  const targetPort = Number(target.port) || 443
  const tunnelSocket = proxyUrl
    ? await createProxiedTlsSocket(proxyUrl, target.hostname, targetPort)
    : null

  return new Promise((resolvePromise, reject) => {
    const req = httpsRequest(
      {
        method: 'POST',
        hostname: target.hostname,
        port: targetPort,
        path: target.pathname + target.search,
        agent: false,
        ...(tunnelSocket ? { createConnection: () => tunnelSocket } : {}),
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/vnd.android.package-archive',
          'x-upsert': 'true',
          'Content-Length': body.length,
        },
      },
      (res) => {
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () =>
          resolvePromise({
            status: res.statusCode || 0,
            text: Buffer.concat(chunks).toString('utf-8'),
          }),
        )
        res.on('error', reject)
      },
    )

    req.setTimeout(120000, () => {
      req.destroy(new Error('连续 120 秒没有任何收发进展（连接可能被重置），中断本次上传'))
    })
    req.on('error', reject)

    const CHUNK_SIZE = 256 * 1024
    const startedAt = Date.now()
    let offset = 0
    let lastLogAt = startedAt

    const pump = () => {
      while (offset < body.length) {
        const end = Math.min(offset + CHUNK_SIZE, body.length)
        const canContinue = req.write(body.subarray(offset, end))
        offset = end

        const now = Date.now()
        if (now - lastLogAt >= 15000 || offset === body.length) {
          lastLogAt = now
          const seconds = Math.max((now - startedAt) / 1000, 1)
          const speed = (offset / 1024 / seconds).toFixed(0)
          console.log(`   📤 已上传 ${((offset / body.length) * 100).toFixed(1)}%（${speed} KB/s）`)
        }

        if (!canContinue) {
          req.once('drain', pump)
          return
        }
      }
      req.end()
    }
    pump()
  })
}

/**
 * 读取远端文件的 Content-Length（HEAD 请求），用于上传后/跳过上传前的存在性校验。
 * 失败返回 null，不抛错。
 */
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

/**
 * 上传 APK 到 CloudBase 静态托管（国内 CDN，实测比 Supabase 快约 13 倍）。
 * 走 tcb hosting deploy，把本地暂存目录整体传到云端 downloads/ 下。
 */
function uploadApkToCloudBase(apkPath) {
  if (!CLOUDBASE_CLI) {
    throw new Error('未配置 CloudBase CLI 路径（release/config.json → cloudbase.cliPath）')
  }
  if (!CLOUDBASE_ENV_ID) {
    throw new Error('未配置 CloudBase 环境 ID（release/config.json → cloudbase.envId）')
  }
  if (!CLOUDBASE_STATIC_DOMAIN) {
    throw new Error('未配置静态托管域名（release/config.json → cloudbase.staticDomain）')
  }

  // 文件在 CloudBase 上固定叫 DiveDeep.apk，URL 才能跨版本稳定
  const stagingDir = join(APK_DIR, '.ota-upload')
  mkdirSync(stagingDir, { recursive: true })
  copyFileSync(apkPath, join(stagingDir, APK_STORAGE_NAME))

  console.log(`   上传到 CloudBase: ${CLOUDBASE_ENV_ID}/${CLOUDBASE_OTA_DIR}/${APK_STORAGE_NAME}`)
  const command = [
    CLOUDBASE_CLI,
    'hosting',
    'deploy',
    stagingDir,
    CLOUDBASE_OTA_DIR,
    '-e',
    CLOUDBASE_ENV_ID,
    '--verify',
  ]
    .map((part) => (/\s/.test(part) ? `"${part}"` : part))
    .join(' ')
  execSync(command, { cwd: join(__dirname, '..'), stdio: 'inherit', shell: true })

  return `${CLOUDBASE_STATIC_DOMAIN}/${CLOUDBASE_OTA_DIR}/${APK_STORAGE_NAME}`
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 请设置环境变量 SUPABASE_URL 和 SUPABASE_SERVICE_KEY')
  console.error('   SUPABASE_SERVICE_KEY 是 service_role key（非 anon key），在 Supabase Dashboard → Settings → API 中获取')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ========== 主流程 ==========
async function main() {
  const skipBuild = process.argv.includes('--skip-build') // 一键发版脚本已构建过 Web，跳过避免重复
  const apkArgIndex = process.argv.indexOf('--apk')
  const explicitApk = apkArgIndex >= 0 ? resolve(process.argv[apkArgIndex + 1] || '') : null
  console.log(`\n📦 DiveDeep OTA 更新上传（APK 模式） - v${VERSION}\n`)

  // 1. 构建项目（用于网站）
  if (!skipBuild) {
    console.log('🔨 构建 Web 项目...')
    execSync('npm run build:deploy', { cwd: join(__dirname, '..'), stdio: 'inherit' })
  } else {
    console.log('⏭️  跳过 Web 构建（--skip-build，Web 已由发版脚本构建）')
  }

  // 2. 读取 APK 文件
  const { path: APK_PATH, picked } = explicitApk
    ? { path: explicitApk, picked: '--apk 显式指定' }
    : selectApkSource()
  if (!existsSync(APK_PATH)) {
    console.error(`❌ APK 文件不存在: ${APK_PATH}`)
    console.error('   请先构建 APK（npm run release:android 一键发版，或 npm run cap:android 后手动构建）')
    process.exit(1)
  }
  console.log(`📦 读取 APK: ${APK_PATH}`)
  console.log(`   来源: ${picked}`)
  const apkBuffer = readFileSync(APK_PATH)
  const checksum = createHash('sha256').update(apkBuffer).digest('hex')
  const fileSize = apkBuffer.length
  console.log(`   SHA256: ${checksum}`)
  console.log(`   大小: ${(fileSize / 1024).toFixed(1)} KB`)

  // 3. 选择 OTA 上传目标
  //    优先级：--host 参数 > 环境变量 OTA_HOST > release/config.json → android.otaHost > supabase
  //    Supabase 通道的代码完整保留，可随时用 --host supabase 切回
  const force = process.argv.includes('--force')
  const hostArgIndex = process.argv.indexOf('--host')
  const otaHost = String(
    (hostArgIndex >= 0 ? process.argv[hostArgIndex + 1] : '') ||
      process.env.OTA_HOST ||
      releaseConfig.android?.otaHost ||
      'supabase',
  ).toLowerCase()
  if (!['cloudbase', 'supabase'].includes(otaHost)) {
    console.error(`❌ 未知的 OTA 上传目标: ${otaHost}（可选 cloudbase / supabase）`)
    process.exit(1)
  }
  console.log(
    `\n☁️  OTA 上传目标: ${otaHost === 'cloudbase' ? 'CloudBase 静态托管（国内）' : 'Supabase Storage'}`,
  )

  // 查询 app_versions 表最新记录的 checksum（与本地对比决定是否上传）
  // 注意：不能按文件大小判断——不同版本只改 versionName 时 APK 大小可能完全相同
  const { data: latestVer } = await supabase
    .from('app_versions')
    .select('checksum')
    .order('version_code', { ascending: false })
    .limit(1)
  const remoteChecksum = latestVer?.[0]?.checksum
  console.log(`   本地 SHA256: ${checksum}`)
  console.log(`   云端最新记录 SHA256: ${remoteChecksum ?? '(无记录)'}`)

  // 4. 上传 APK（CloudBase / Supabase 二选一，CDN 上的文件名始终是 DiveDeep.apk）
  let bundleUrl =
    otaHost === 'cloudbase'
      ? `${CLOUDBASE_STATIC_DOMAIN}/${CLOUDBASE_OTA_DIR}/${APK_STORAGE_NAME}`
      : supabase.storage.from(BUCKET_NAME).getPublicUrl(APK_STORAGE_NAME).data.publicUrl

  let needUpload = force || remoteChecksum !== checksum
  if (!needUpload && otaHost === 'cloudbase') {
    // CloudBase 首次切换过来时数据库里可能已有相同 checksum，但文件并不存在
    const remoteSize = await headRemoteFileSize(bundleUrl)
    if (remoteSize !== fileSize) {
      console.log(`   ⚠️ CloudBase 上文件缺失或大小不符（${remoteSize ?? '不存在'}），仍需上传`)
      needUpload = true
    }
  }

  if (!needUpload) {
    console.log('   ✅ 云端已存在相同 SHA256 的 APK，跳过上传')
  } else {
    if (force) console.log('   ⚠️ --force 强制上传')

    if (otaHost === 'cloudbase') {
      // ===== 通道 A：CloudBase 静态托管 =====
      try {
        uploadApkToCloudBase(APK_PATH)
      } catch (err) {
        console.error('❌ 上传 CloudBase 失败:', describeError(err))
        process.exit(1)
      }
      const remoteSize = await headRemoteFileSize(bundleUrl)
      if (remoteSize === fileSize) {
        console.log('   ✅ 远端文件校验通过（大小一致）')
      } else {
        console.warn(`   ⚠️ 远端校验未通过（远端 ${remoteSize ?? '读取失败'} / 本地 ${fileSize}），CDN 可能尚未刷新`)
      }
    } else {
      // ===== 通道 B：Supabase Storage（原有实现，保留备用）=====
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${APK_STORAGE_NAME}`
      let uploadError = null

      // 代理可用则走代理，没开代理时静默回退直连
      let activeProxy = UPLOAD_PROXY
      if (activeProxy) {
        try {
          await probeProxy(activeProxy)
          console.log(`   🚀 上传代理: ${activeProxy}`)
        } catch (err) {
          console.warn(`   ⚠️ 代理不可用（${describeError(err)}），回退直连`)
          activeProxy = ''
        }
      } else {
        console.log('   提示：如需让上传走本地代理，可在 .env.ota 配置 OTA_PROXY=http://127.0.0.1:7897（实测对长传提升有限）')
      }

      const estimate = `（预计 ${Math.ceil(fileSize / 1024 / (activeProxy ? 110 : 40) / 60)} 分钟左右）`
      console.log(`   上行较慢时不会中断，只会在 120 秒完全无进展时重试 ${estimate}`)
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`   第 ${attempt} 次尝试...`)
        try {
          const result = await uploadApkByHttps(uploadUrl, apkBuffer, activeProxy)
          if (result.status < 200 || result.status >= 300) {
            uploadError = new Error(`HTTP ${result.status}: ${result.text || '(空响应)'}`)
          } else {
            uploadError = null
            break
          }
        } catch (err) {
          uploadError = err
        }
        if (uploadError) {
          console.warn(`   ⚠️ 失败: ${describeError(uploadError)}`)
        }
        if (!uploadError) break
        if (attempt < 3) {
          const wait = attempt * 2000
          console.log(`   等待 ${wait / 1000}s 后重试...`)
          await new Promise(r => setTimeout(r, wait))
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
          console.error('❌ 上传失败（已重试 3 次）:', describeError(uploadError))
          process.exit(1)
        }
      }
    }
  }

  console.log(`   URL: ${bundleUrl}`)

  // 5. 清理 Supabase 桶里的旧文件（CloudBase 通道不涉及，固定只覆盖 DiveDeep.apk）
  //    旧 ZIP 包 + 上传测试残留（__t*.bin）+ 旧版本命名的文件都删掉，避免撑爆 50MB 免费额度
  if (otaHost === 'supabase') {
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
  console.log(`   上传目标: ${otaHost === 'cloudbase' ? 'CloudBase 静态托管' : 'Supabase Storage'}`)
  console.log(`   版本号: ${VERSION} (code: ${versionCode})`)
  console.log(`   SHA256: ${checksum}`)
  console.log(`   APK 下载链接: ${bundleUrl}\n`)
}

main().catch((err) => {
  console.error('❌ 脚本执行失败:', describeError(err))
  process.exit(1)
})