// ============================================================
// 发布控制台 - 发布前环境检查
// 每个检查只读；返回 ok / warn / fail，并给出修复建议。
// ============================================================

import { existsSync, mkdirSync, readdirSync, statfsSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  TMP_DIR,
  TARGET_IDS,
  buildCommand,
  formatBytes,
  readJsonIfExists,
  readTextIfExists,
  runShell,
  unique,
} from './util.mjs'
import { getRuntime } from './runtime.mjs'
import { readCliPackageVersion } from './detect.mjs'
import { getVersionSnapshot } from './versioning.mjs'

export const CHECK_GROUPS = [
  '通用环境',
  'Web 发布',
  'Android APK',
  'Windows 桌面端',
  'GitHub Release',
]

const WEBVIEW2_GUID = '{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}'

function fullPath(root, ...parts) {
  return join(root, ...parts)
}

function tail(text, length = 500) {
  const value = String(text || '').trim()
  return value.length > length ? value.slice(-length) : value
}

function parseJsonOutput(text) {
  const source = String(text || '')
  const start = source.indexOf('{')
  const end = source.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(source.slice(start, end + 1))
  } catch {
    return null
  }
}

function statusOk(detail) {
  return { status: 'ok', detail: String(detail || ''), fix: '' }
}

function statusWarn(detail, fix) {
  return { status: 'warn', detail: String(detail || ''), fix: String(fix || '') }
}

function statusFail(detail, fix) {
  return { status: 'fail', detail: String(detail || ''), fix: String(fix || '') }
}

async function cached(ctx, key, factory) {
  if (!ctx.cache.has(key)) {
    ctx.cache.set(key, Promise.resolve().then(factory))
  }
  return ctx.cache.get(key)
}

function check(id, group, title, appliesTo, run, options = {}) {
  return {
    id,
    group,
    title,
    appliesTo,
    blocking: options.blocking !== false,
    run,
  }
}

export async function runChecks(options = {}) {
  const config = options.config || {}
  const runtime = options.runtime || getRuntime(config)
  const selected = unique(
    (Array.isArray(options.targets) && options.targets.length ? options.targets : TARGET_IDS).filter(
      (target) => TARGET_IDS.includes(target),
    ),
  )
  const githubRelease =
    options.githubRelease !== undefined
      ? Boolean(options.githubRelease)
      : Boolean(config.github?.enabled) && (selected.includes('apk') || selected.includes('desktop'))
  const allowDirty =
    options.allowDirty !== undefined ? Boolean(options.allowDirty) : Boolean(config.options?.allowDirty)
  const version = options.version ? String(options.version).trim().replace(/^v/i, '') : null

  const ctx = {
    config,
    runtime,
    selected,
    githubRelease,
    allowDirty,
    version,
    cache: new Map(),
  }

  const checks = []
  const push = (item) => checks.push(item)

  // ── 通用环境 ──────────────────────────────────────────────
  push(
    check('node-version', '通用环境', 'Node.js 版本', TARGET_IDS, async () => {
      const major = Number(process.versions.node.split('.')[0])
      if (major < 22) {
        return statusFail(
          '当前 Node.js ' + process.version + '，项目依赖要求 Node.js 22+',
          '安装 Node.js 22 或更高版本，并确认命令行中的 node 指向新版本',
        )
      }
      return statusOk('Node.js ' + process.version + ' · ' + process.execPath)
    }),
  )

  push(
    check('npm-ready', '通用环境', 'npm 可用', TARGET_IDS, async () => {
      const result = await runShell('npm --version', { cwd: runtime.root, timeoutMs: 15000 })
      if (result.code !== 0) {
        const reason = tail(result.stderr || result.stdout) || 'spawn 失败（code=' + result.code + '）'
        return statusFail(
          'npm 执行失败：' + reason,
          '确认 npm 已安装并在 PATH 中；如果从受限终端/沙箱运行，请在普通 PowerShell 或双击 release.cmd 启动',
        )
      }
      return statusOk('npm ' + String(result.stdout || '').trim())
    }),
  )

  push(
    check('project-package', '通用环境', '项目与当前版本', TARGET_IDS, async () => {
      const pkg = readJsonIfExists(fullPath(runtime.root, 'package.json'))
      if (!pkg) return statusFail('未找到 package.json', '请确认发布程序位于项目根目录的 release/ 下')
      return statusOk(
        (pkg.name || 'project') +
          ' v' +
          (pkg.version || '?') +
          ' · 当前版本 ' +
          (runtime.versions.packageVersion || '?'),
      )
    }),
  )

  push(
    check('project-writable', '通用环境', '项目目录可写', TARGET_IDS, async () => {
      const probe = fullPath(TMP_DIR, 'write-probe-' + process.pid + '-' + Date.now() + '.txt')
      try {
        mkdirSync(TMP_DIR, { recursive: true })
        writeFileSync(probe, 'ok', 'utf8')
        unlinkSync(probe)
        return statusOk('可写 · ' + runtime.root)
      } catch (error) {
        return statusFail(
          '无法写入 ' + TMP_DIR + '：' + String(error?.message || error),
          '检查目录权限；发布程序需要对项目目录有写权限',
        )
      }
    }),
  )

  push(
    check('git-repo', '通用环境', 'Git 仓库状态', TARGET_IDS, async () => {
      const git = runtime.git
      if (!git.isRepo) {
        return statusFail('当前目录不是 Git 仓库', '在项目根目录初始化/克隆仓库，或检查是否删除了 .git')
      }
      return statusOk(
        (git.branch || '(detached)') +
          ' @ ' +
          (git.commit || '?') +
          ' · 最新 tag ' +
          (git.latestTag || '无'),
      )
    }),
  )

  push(
    check('git-available', '通用环境', 'Git 命令', TARGET_IDS, async () => {
      const gitTool = runtime.gitTool || {}
      if (gitTool.exe) {
        return statusOk((gitTool.version || 'git 已安装') + ' · ' + (gitTool.source || '自动检测'))
      }
      return statusWarn(
        '未找到 git 命令',
        '安装 Git for Windows 并确保 git.exe 在 PATH（或在配置中填写 git.exe 路径）；缺失时 GitHub Release 的更新日志与凭据读取会退化',
      )
    }),
  )

  push(
    check('git-clean', '通用环境', '工作区是否干净', TARGET_IDS, async () => {
      const git = runtime.git
      if (!git.isRepo) return statusFail('不是 Git 仓库', '请先初始化 Git 仓库')
      if (git.dirty == null || git.dirtyKnown === false) {
        return statusWarn(
          '无法通过 git 命令读取工作区状态（可能是权限/沙箱限制）',
          '在普通 PowerShell 中执行 git status 确认；这不会阻止构建，但请确保改动已提交',
        )
      }
      if (!git.dirty) return statusOk('工作区干净')
      if (ctx.allowDirty) {
        return statusWarn(
          '有 ' + git.dirtyCount + ' 个未提交改动（已允许）',
          '建议先 git commit，保证 Release 的 tag 与源码一致',
        )
      }
      return statusFail(
        '有 ' + git.dirtyCount + ' 个未提交改动',
        '先 git commit；或在「发布选项」中勾选「允许未提交改动」',
      )
    }),
  )

  push(
    check('node-modules', '通用环境', '前端依赖已安装', TARGET_IDS, async () => {
      const vite = fullPath(runtime.root, 'node_modules', 'vite', 'package.json')
      if (!existsSync(vite)) {
        return statusFail('node_modules 不完整（缺少 vite）', '在项目根目录执行 npm install')
      }
      const pkg = readJsonIfExists(vite)
      return statusOk('vite ' + (pkg?.version || '?') + ' · node_modules 已安装')
    }),
  )

  push(
    check('disk-space', '通用环境', '磁盘剩余空间', TARGET_IDS, async () => {
      try {
        const stats = statfsSync(runtime.root)
        const free = Number(stats.bavail) * Number(stats.bsize)
        if (free < 1 * 1024 * 1024 * 1024) {
          return statusFail('仅剩 ' + formatBytes(free), '清理磁盘空间，至少保留 3 GB')
        }
        if (free < 3 * 1024 * 1024 * 1024) {
          return statusWarn('仅剩 ' + formatBytes(free), '构建 APK/桌面端建议至少保留 3 GB')
        }
        return statusOk('剩余 ' + formatBytes(free))
      } catch (error) {
        return statusWarn('无法读取磁盘空间：' + String(error?.message || error), '可忽略，但请确认磁盘空间充足')
      }
    }),
  )

  push(
    check('ota-env', '通用环境', 'Supabase OTA 配置', ['apk', 'desktop'], async () => {
      const env = runtime.otaEnv || {}
      const missing = []
      if (!env.SUPABASE_URL) missing.push('SUPABASE_URL')
      if (!env.SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_KEY')
      if (missing.length) {
        return statusFail(
          '.env.ota 缺少 ' + missing.join('、'),
          '在项目根目录 .env.ota 中配置 SUPABASE_URL 与 SUPABASE_SERVICE_KEY（service_role key）',
        )
      }
      return statusOk('已配置 SUPABASE_URL 与 SUPABASE_SERVICE_KEY')
    }),
  )

  // ── Web 发布 ─────────────────────────────────────────────
  push(
    check('cloudbase-cli', 'Web 发布', 'CloudBase CLI', ['web'], async () => {
      if (!runtime.cli.path) {
        return statusFail(
          '未找到 cloudbase CLI',
          '在设置中填写 CloudBase CLI 路径（例如 D:\\cloudbase-cli\\cloudbase.cmd），或把 cloudbase 加入 PATH',
        )
      }
      return statusOk(runtime.cli.path + ' · ' + runtime.cli.source)
    }),
  )

  push(
    check('cloudbase-version', 'Web 发布', 'CloudBase CLI 版本', ['web'], async () => {
      if (!runtime.cli.path) return statusFail('CloudBase CLI 路径为空', '先配置 CLI 路径')
      const result = await cached(ctx, 'cloudbase-version', () =>
        runShell(buildCommand([runtime.cli.path, '--version']), {
          cwd: runtime.root,
          timeoutMs: 20000,
        }),
      )
      if (result.code !== 0) {
        const packageVersion = readCliPackageVersion(runtime.cli.path)
        if (packageVersion) {
          return statusOk(
            'CloudBase CLI ' + packageVersion + '（从 CLI 安装目录读取，未实际执行）',
          )
        }
        return statusFail(
          '无法执行 CloudBase CLI：' + (tail(result.stderr || result.stdout) || 'spawn 失败'),
          '检查 CLI 路径是否正确；如果从受限终端/沙箱运行，请在普通 PowerShell 或双击 release.cmd 启动',
        )
      }
      const text = String(result.stdout || '').trim()
      const match = text.match(/(\d+\.\d+\.\d+)/)
      return statusOk('CloudBase CLI ' + (match ? match[1] : text.split(/\r?\n/)[0]))
    }),
  )

  push(
    check('cloudbase-login', 'Web 发布', 'CloudBase 登录与环境', ['web'], async () => {
      if (!runtime.cli.path) return statusFail('CloudBase CLI 路径为空', '先配置 CLI 路径')
      if (!runtime.envId) return statusFail('未配置 CloudBase 环境 ID', '在设置中填写环境 ID')
      const result = await cached(ctx, 'cloudbase-env-list', () =>
        runShell(buildCommand([runtime.cli.path, 'env', 'list', '--json']), {
          cwd: runtime.root,
          timeoutMs: 30000,
        }),
      )
      if (result.code !== 0) {
        return statusFail(
          'CloudBase 未登录或查询失败：' + tail(result.stderr || result.stdout),
          '在终端执行 "' + runtime.cli.path + ' login" 完成登录后重试',
        )
      }
      const json = parseJsonOutput(result.stdout)
      if (!json || !Array.isArray(json.data)) {
        return statusFail('无法解析 CloudBase 环境列表', '在终端执行 "' + runtime.cli.path + ' env list --json" 查看原始输出')
      }
      const env = json.data.find((item) => item.EnvId === runtime.envId || item.envId === runtime.envId)
      if (!env) {
        const ids = json.data
          .map((item) => item.EnvId || item.envId)
          .filter(Boolean)
          .slice(0, 5)
        return statusFail(
          '环境 ' + runtime.envId + ' 不在当前账号下',
          '检查环境 ID；当前账号可用环境：' + (ids.length ? ids.join('、') : '无'),
        )
      }
      const status = env.Status || env.status || 'NORMAL'
      if (String(status).toUpperCase() !== 'NORMAL') {
        return statusWarn(
          '环境 ' + runtime.envId + ' 状态为 ' + status,
          '在腾讯云 CloudBase 控制台确认环境状态正常',
        )
      }
      return statusOk(
        '已登录 · ' +
          runtime.envId +
          (env.PackageName ? ' · ' + env.PackageName : '') +
          ' · ' +
          (env.Region || 'ap-shanghai'),
      )
    }),
  )

  push(
    check('cloudbase-config', 'Web 发布', 'cloudbaserc.json 环境 ID', ['web'], async () => {
      const rc = readJsonIfExists(fullPath(runtime.root, 'cloudbaserc.json'))
      if (!rc) return statusWarn('未找到 cloudbaserc.json', '可忽略；发布时使用设置中的环境 ID')
      if (rc.envId && runtime.envId && rc.envId !== runtime.envId) {
        return statusWarn(
          'cloudbaserc.json 的环境 ID（' + rc.envId + '）与设置中的（' + runtime.envId + '）不一致',
          '统一两处环境 ID，避免部署到错误环境',
        )
      }
      return statusOk('cloudbaserc.json 环境 ID: ' + (rc.envId || '(空)'))
    }),
  )

  push(
    check('web-env', 'Web 发布', '前端生产环境变量', ['web'], async () => {
      const env = runtime.productionEnv || {}
      const missing = []
      if (!env.VITE_SUPABASE_URL) missing.push('VITE_SUPABASE_URL')
      if (!env.VITE_SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY')
      if (missing.length) {
        return statusFail(
          '.env.production 缺少 ' + missing.join('、'),
          '在项目根目录 .env.production 中配置 Supabase 项目 URL 与 anon key',
        )
      }
      const url = String(env.VITE_SUPABASE_URL)
      if (!/^https?:\/\//i.test(url)) {
        return statusWarn('VITE_SUPABASE_URL 格式可疑：' + url, '确认 URL 以 https:// 开头且不要包含 /rest/v1')
      }
      return statusOk('已配置 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY')
    }),
  )

  push(
    check('web-redirects', 'Web 发布', 'SPA 路由回退配置', ['web'], async () => {
      const filePath = fullPath(runtime.root, 'public', '_redirects')
      if (!existsSync(filePath)) {
        return statusFail('缺少 public/_redirects', '创建 public/_redirects，内容为：/*    /index.html   200')
      }
      return statusOk('public/_redirects 存在')
    }),
  )

  push(
    check('web-site', 'Web 发布', '线上网站可访问性', ['web'], async () => {
      const siteUrl = config.cloudbase?.siteUrl
      if (!siteUrl) {
        return statusWarn('未配置线上网站地址', '在设置中填写 siteUrl，发布后可自动验证访问')
      }
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      try {
        const response = await fetch(siteUrl, {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal,
          headers: { 'User-Agent': 'DiveDeep-Release-Console' },
        })
        if (response.status >= 400) {
          return statusWarn('网站返回 HTTP ' + response.status, '确认站点是否已开通静态网站托管')
        }
        return statusOk('HTTP ' + response.status + ' · ' + siteUrl)
      } catch (error) {
        return statusWarn(
          '访问网站失败：' + String(error?.message || error),
          '可能是网络/DNS 问题；不影响构建与上传，但请发布后手动打开确认',
        )
      } finally {
        clearTimeout(timer)
      }
    }),
  )

  // ── Android APK ──────────────────────────────────────────
  push(
    check('android-java', 'Android APK', 'Java / JDK', ['apk'], async () => {
      const java = runtime.java
      if (!java.valid || !java.javaExe) {
        return statusFail(
          '未找到可用的 JDK',
          '安装 JDK 21，或在设置中填写 Java Home（例如 E:\\code_app\\jdk-21.0.12）',
        )
      }
      if (!java.version) {
        return statusWarn(
          '已找到 Java 可执行文件，但无法读取版本：' + java.javaExe,
          '在普通终端执行 java -version 确认是 JDK 21；受限终端/沙箱可能阻止读取版本',
        )
      }
      const major = java.version.major || 0
      if (major < 17) {
        return statusFail(
          'JDK ' + (java.version?.version || major) + ' 版本过低',
          'AGP 8.13 需要 JDK 17+，建议 JDK 21',
        )
      }
      if (major < 21) {
        return statusWarn(
          'JDK ' + java.version.version + '（项目推荐 JDK 21）',
          '建议在设置中改用 JDK 21，避免 Gradle/AGP 兼容问题',
        )
      }
      return statusOk('Java ' + java.version.version + ' · ' + java.home)
    }),
  )

  push(
    check('android-sdk', 'Android APK', 'Android SDK', ['apk'], async () => {
      const sdk = runtime.sdk
      if (!sdk.dir) {
        return statusFail(
          '未找到 Android SDK',
          '在设置中填写 SDK 路径，或配置 android/local.properties 的 sdk.dir',
        )
      }
      if (!sdk.hasPlatform) {
        return statusFail(
          '缺少 platforms/android-' + sdk.compileSdk,
          '用 Android Studio SDK Manager 安装 Android SDK Platform ' + sdk.compileSdk,
        )
      }
      if (!sdk.latestBuildTools) {
        return statusFail('缺少 build-tools', '安装 Android SDK Build-Tools 35 或更高版本')
      }
      const details = [
        sdk.dir,
        'android-' + sdk.compileSdk,
        'build-tools ' + sdk.latestBuildTools,
      ]
      if (!sdk.hasPlatformTools) {
        return statusWarn(details.join(' · ') + ' · 缺少 platform-tools', '安装 Android SDK Platform-Tools')
      }
      if (!sdk.hasLicenses) {
        return statusWarn(details.join(' · ') + ' · 缺少 licenses', '在 Android Studio 中接受 SDK 许可协议')
      }
      return statusOk(details.join(' · '))
    }),
  )

  push(
    check('android-gradle', 'Android APK', 'Gradle 工程', ['apk'], async () => {
      const items = [
        ['android/gradlew.bat', 'Gradle wrapper'],
        ['android/app/build.gradle', 'app/build.gradle'],
        ['android/settings.gradle', 'settings.gradle'],
      ]
      const missing = items.filter(([file]) => !existsSync(fullPath(runtime.root, file)))
      if (missing.length) {
        return statusFail(
          '缺少 ' + missing.map(([file]) => file).join('、'),
          '确认 android/ 工程完整，或在 Android Studio 中重新同步 Capacitor 工程',
        )
      }
      return statusOk('Gradle wrapper 与 app 模块存在')
    }),
  )

  push(
    check('android-keystore', 'Android APK', 'APK 签名配置', ['apk'], async () => {
      const propsPath = fullPath(runtime.root, 'android', 'keystore.properties')
      if (!existsSync(propsPath)) {
        return statusFail(
          '缺少 android/keystore.properties',
          '创建签名配置，指向 android/kaoyan-tracker.keystore，并填入 storePassword/keyAlias/keyPassword',
        )
      }
      const text = readTextIfExists(propsPath) || ''
      const props = {}
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eq = trimmed.indexOf('=')
        if (eq > 0) props[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
      }
      const missing = ['storeFile', 'storePassword', 'keyAlias', 'keyPassword'].filter((key) => !props[key])
      if (missing.length) {
        return statusFail('keystore.properties 缺少 ' + missing.join('、'), '补齐签名配置')
      }
      const storePath = join(runtime.root, 'android', 'app', props.storeFile)
      if (!existsSync(storePath)) {
        return statusFail(
          '签名文件不存在：' + storePath,
          '检查 storeFile 路径（相对 android/app/）',
        )
      }
      return statusOk(
        'android/keystore.properties · ' + props.keyAlias + ' · ' + formatBytes(statSync(storePath).size),
      )
    }),
  )

  push(
    check('android-version', 'Android APK', 'Android 版本号', ['apk'], async () => {
      const snapshot = getVersionSnapshot(runtime.root)
      if (snapshot.androidVersionCode == null || !snapshot.androidVersionName) {
        return statusFail(
          '无法读取 versionCode / versionName',
          '检查 android/app/build.gradle 中 defaultConfig 的版本字段',
        )
      }
      let detail =
        'versionName ' + snapshot.androidVersionName + ' · versionCode ' + snapshot.androidVersionCode
      if (ctx.version) {
        const nextCode =
          snapshot.androidVersionName === ctx.version
            ? snapshot.androidVersionCode
            : snapshot.androidVersionCode + 1
        detail += ' → 发布后 versionCode ' + nextCode
      }
      return statusOk(detail)
    }),
  )

  // ── Windows 桌面端 ──────────────────────────────────────
  push(
    check('desktop-rust', 'Windows 桌面端', 'Rust 工具链', ['desktop'], async () => {
      const cargo = runtime.cargo
      if (!cargo.cargoExe) {
        return statusFail(
          '未找到 cargo',
          '安装 Rust（https://rustup.rs），或在设置中填写 cargo bin 目录（通常为 %USERPROFILE%\\.cargo\\bin）',
        )
      }
      if (!cargo.rustcExe) {
        return statusWarn('找到 cargo 但未找到 rustc', '确认 Rust 工具链完整安装')
      }
      if (!cargo.cargoVersion) {
        return statusWarn(
          '已找到 cargo，但无法读取版本：' + cargo.cargoExe,
          '在普通终端执行 cargo --version 确认工具链可用；受限终端/沙箱可能阻止读取版本',
        )
      }
      return statusOk(
        cargo.cargoVersion + ' · ' + (cargo.rustcVersion || 'rustc ?') + ' · ' + cargo.dir,
      )
    }),
  )

  push(
    check('desktop-tauri', 'Windows 桌面端', 'Tauri CLI 与配置', ['desktop'], async () => {
      const cliPkg = readJsonIfExists(
        fullPath(runtime.root, 'node_modules', '@tauri-apps', 'cli', 'package.json'),
      )
      if (!cliPkg) {
        return statusFail('未安装 @tauri-apps/cli', '在项目根目录执行 npm install')
      }
      const tauriConf = fullPath(runtime.root, 'src-tauri', 'tauri.conf.json')
      if (!existsSync(tauriConf)) {
        return statusFail('缺少 src-tauri/tauri.conf.json', '确认 Tauri 工程完整')
      }
      return statusOk('@tauri-apps/cli ' + (cliPkg.version || '?') + ' · tauri.conf.json 存在')
    }),
  )

  push(
    check('desktop-webview2', 'Windows 桌面端', 'WebView2 运行时', ['desktop'], async () => {
      if (process.platform !== 'win32') {
        return statusWarn('当前不是 Windows，跳过 WebView2 检查', '桌面端发布仅支持 Windows')
      }
      const appDirs = [
        join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft', 'EdgeWebView', 'Application'),
        join(process.env.ProgramFiles || 'C:\\Program Files', 'Microsoft', 'EdgeWebView', 'Application'),
      ]
      for (const appDir of appDirs) {
        try {
          if (!existsSync(appDir)) continue
          const versions = readdirSync(appDir).filter((name) => /^\d+\./.test(name))
          if (versions.length) return statusOk('WebView2 ' + versions[0] + '（目录检测）')
        } catch {
          // 忽略
        }
      }
      const keys = [
        'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\' + WEBVIEW2_GUID,
        'HKLM\\SOFTWARE\\Microsoft\\EdgeUpdate\\Clients\\' + WEBVIEW2_GUID,
        'HKCU\\SOFTWARE\\Microsoft\\EdgeUpdate\\Clients\\' + WEBVIEW2_GUID,
      ]
      for (const key of keys) {
        const result = spawnSync('reg', ['query', key, '/v', 'pv'], {
          encoding: 'utf8',
          windowsHide: true,
          timeout: 5000,
        })
        if (result.status === 0) {
          const match = String(result.stdout || '').match(/pv\s+REG_SZ\s+([^\r\n]+)/)
          return statusOk('WebView2 ' + (match ? match[1].trim() : '已安装'))
        }
      }
      return statusWarn(
        '未检测到 WebView2 Runtime',
        'Windows 10 需要安装 Microsoft Edge WebView2 Runtime；Windows 11 通常已内置',
      )
    }),
  )

  push(
    check('desktop-bundle-dir', 'Windows 桌面端', '打包输出目录', ['desktop'], async () => {
      const dir = fullPath(runtime.root, 'src-tauri', 'target', 'release', 'bundle')
      try {
        const parent = fullPath(runtime.root, 'src-tauri', 'target', 'release')
        if (!existsSync(parent)) {
          return statusWarn('尚未构建过桌面端（target/release 不存在）', '首次构建会自动创建，耗时较长')
        }
        void dir
        return statusOk('src-tauri/target/release 可写')
      } catch (error) {
        return statusFail('无法访问打包目录：' + String(error?.message || error), '检查目录权限')
      }
    }),
  )

  // ── GitHub Release ───────────────────────────────────────
  if (ctx.githubRelease) {
    push(
      check('github-repo', 'GitHub Release', 'GitHub 仓库', ['apk', 'desktop'], async () => {
        const github = runtime.github
        if (!github.owner || !github.repo) {
          return statusFail(
            '未配置 GitHub owner/repo',
            '在设置中填写 owner 与 repo，或确认 git remote 指向 GitHub',
          )
        }
        return statusOk(github.owner + '/' + github.repo + ' · ' + github.source)
      }),
    )

    push(
      check('github-token', 'GitHub Release', 'GitHub Token', ['apk', 'desktop'], async () => {
        if (runtime.githubToken.token) {
          return statusOk('已找到 Token · ' + runtime.githubToken.source)
        }
        const gitExe = runtime.gitTool?.exe
        if (!gitExe) {
          return statusFail(
            '未找到 GitHub Token（同时未找到 git 命令）',
            '安装 Git for Windows，或在项目根目录 .env.ota 中添加 GITHUB_TOKEN=你的token（需要 repo 权限）',
          )
        }
        const result = await runShell(buildCommand([gitExe, 'credential', 'fill']), {
          cwd: runtime.root,
          timeoutMs: 8000,
          input: 'protocol=https\nhost=github.com\n\n',
          env: {
            GIT_TERMINAL_PROMPT: '0',
            GCM_INTERACTIVE: 'never',
          },
        })
        const match = String(result.stdout || '').match(/^password=(.+)$/m)
        if (match && match[1].trim()) {
          return statusOk('已找到 Token · Git 凭据管理器')
        }
        return statusFail(
          '未找到 GitHub Token',
          '在项目根目录 .env.ota 中添加 GITHUB_TOKEN=你的token（需要 repo 权限），或设置同名环境变量；也可用 Git 凭据管理器保存一次 GitHub 账号',
        )
      }),
    )

    push(
      check('github-api', 'GitHub Release', 'GitHub API 可访问', ['apk', 'desktop'], async () => {
        const github = runtime.github
        if (!github.owner || !github.repo) {
          return statusWarn('缺少 owner/repo，跳过 API 检查', '先配置 GitHub 仓库')
        }
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 10000)
        try {
          const headers = { 'User-Agent': 'DiveDeep-Release-Console' }
          if (runtime.githubToken.token) {
            headers.Authorization = 'Bearer ' + runtime.githubToken.token
          }
          const response = await fetch(
            'https://api.github.com/repos/' + github.owner + '/' + github.repo,
            { headers, signal: controller.signal },
          )
          if (response.status === 401) {
            return statusFail(
              'GitHub Token 无效（HTTP 401）',
              '重新生成 Token，确认勾选了 repo 权限，并更新 .env.ota',
            )
          }
          if (response.status === 404) {
            return statusFail(
              'GitHub 仓库不存在或无权限（HTTP 404）',
              '检查 owner/repo 与 Token 权限',
            )
          }
          if (response.status === 403) {
            return statusWarn('GitHub API 返回 403（可能是限流）', '稍后重试；发布上传仍可能成功')
          }
          if (!response.ok) {
            return statusWarn('GitHub API 返回 HTTP ' + response.status, '检查网络/代理')
          }
          const data = await response.json().catch(() => null)
          return statusOk(
            'HTTP 200 · ' +
              (data?.full_name || github.owner + '/' + github.repo) +
              (data?.private ? ' · private' : ''),
          )
        } catch (error) {
          return statusWarn(
            '无法连接 GitHub API：' + String(error?.message || error),
            '检查网络/代理；不影响本机构建，但 GitHub Release 上传可能失败',
          )
        } finally {
          clearTimeout(timer)
        }
      }),
    )
  }

  const results = await Promise.all(
    checks.map(async (item) => {
      const applies = item.appliesTo.some((target) => ctx.selected.includes(target))
      if (!applies) {
        return {
          id: item.id,
          group: item.group,
          title: item.title,
          appliesTo: item.appliesTo,
          applies: false,
          status: 'skip',
          detail: '未选择该发布目标',
          fix: '',
          blocking: false,
        }
      }
      try {
        const result = await item.run()
        return {
          id: item.id,
          group: item.group,
          title: item.title,
          appliesTo: item.appliesTo,
          applies: true,
          status: result.status,
          detail: result.detail,
          fix: result.fix || '',
          blocking: result.status === 'fail' && item.blocking !== false,
        }
      } catch (error) {
        return {
          id: item.id,
          group: item.group,
          title: item.title,
          appliesTo: item.appliesTo,
          applies: true,
          status: 'fail',
          detail: '检查执行异常：' + String(error?.message || error),
          fix: '查看发布控制台日志或手动执行对应命令排查',
          blocking: item.blocking !== false,
        }
      }
    }),
  )

  const visible = results.filter((item) => item.applies)
  const order = new Map(CHECK_GROUPS.map((group, index) => [group, index]))
  visible.sort((a, b) => {
    const groupDiff = (order.get(a.group) ?? 99) - (order.get(b.group) ?? 99)
    if (groupDiff !== 0) return groupDiff
    return checks.findIndex((item) => item.id === a.id) - checks.findIndex((item) => item.id === b.id)
  })

  const byTarget = {}
  for (const target of ctx.selected) {
    const items = visible.filter((item) => item.appliesTo.includes(target))
    byTarget[target] = {
      total: items.length,
      ok: items.filter((item) => item.status === 'ok').length,
      warn: items.filter((item) => item.status === 'warn').length,
      fail: items.filter((item) => item.status === 'fail').length,
      blocking: items.filter((item) => item.blocking).length,
    }
  }

  return {
    checkedAt: Date.now(),
    targets: ctx.selected,
    githubRelease: ctx.githubRelease,
    version: ctx.version,
    checks: visible,
    summary: {
      total: visible.length,
      ok: visible.filter((item) => item.status === 'ok').length,
      warn: visible.filter((item) => item.status === 'warn').length,
      fail: visible.filter((item) => item.status === 'fail').length,
      blocking: visible.filter((item) => item.blocking).length,
      canRun: visible.every((item) => !item.blocking),
    },
    byTarget,
    runtime: {
      envId: runtime.envId,
      cli: runtime.cli.path,
      github: {
        owner: runtime.github.owner,
        repo: runtime.github.repo,
        tokenPresent: Boolean(runtime.githubToken.token),
        tokenSource: runtime.githubToken.source,
      },
    },
  }
}
