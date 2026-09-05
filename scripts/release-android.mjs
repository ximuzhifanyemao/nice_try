// ============================================================
// Android 一键发版脚本：构建 APK → 归置产物 → 发布 OTA
// 用法：npm run release:android
// 流程：
//   1. 构建 Web 并同步到 Android 工程（cap:sync，等价于 build:deploy + cap sync）
//   2. Gradle assembleRelease 打包 release APK
//   3. 把产物复制为 apk/kaoyan-tracker-v<版本>.apk 和 apk/DiveDeep.apk
//   4. 发布 OTA（upload-ota.mjs --skip-build，跳过重复的 Web 构建）
// 注意：assembleRelease 需要 android/keystore.properties 指向有效 keystore；
//       每次发版前请先在 package.json 提升 version，并同步 android/app/build.gradle
//       的 versionName / versionCode。
// ============================================================

import { existsSync, readdirSync, statSync, copyFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)

const ROOT = join(__dirname, '..')
const pkg = require('../package.json')
const VERSION = pkg.version
const ANDROID_DIR = join(ROOT, 'android')
const APK_DIR = join(ROOT, 'apk')
const GRADLE_CMD = process.platform === 'win32' ? 'gradlew.bat' : './gradlew'

function step(msg) {
  console.log(`\n📌 ${msg}\n`)
}

function run(cmd, { cwd = ROOT } = {}) {
  console.log(`▶ ${cmd}  (cwd: ${cwd})`)
  const res = spawnSync(cmd, { cwd, shell: true, stdio: 'inherit', env: { ...process.env, CI: 'false' } })
  if (res.status !== 0) {
    console.error(`❌ 命令失败（exit ${res.status}）: ${cmd}`)
    process.exit(res.status ?? 1)
  }
}

// ── 1. 构建 Web 并同步到 Android 工程（cap:sync 内部会先跑 build:deploy） ──
step('1/4 构建 Web 并同步 Android 工程')
run('npm run cap:sync')

// ── 2. Gradle 打包 release APK ──
step('2/4 构建 Android release APK (assembleRelease)')
run(`${GRADLE_CMD} assembleRelease --console=plain`, { cwd: ANDROID_DIR })

// ── 3. 归置产物：复制到 apk/（版本化命名 + 固定名 DiveDeep.apk） ──
step('3/4 归置 APK 产物')
const releaseDir = join(ANDROID_DIR, 'app', 'build', 'outputs', 'apk', 'release')
if (!existsSync(releaseDir)) {
  console.error(`❌ 未找到 Gradle 输出目录: ${releaseDir}`)
  process.exit(1)
}
const candidates = readdirSync(releaseDir)
  .filter((f) => f.endsWith('.apk') && !/unaligned|unsigned|mappings/i.test(f))
  .map((f) => ({ name: f, path: join(releaseDir, f), mtime: statSync(join(releaseDir, f)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime)
if (candidates.length === 0) {
  console.error(`❌ ${releaseDir} 下未找到 release APK`)
  process.exit(1)
}
const builtApk = candidates[0]
console.log(`   产物: ${builtApk.name} (${(statSync(builtApk.path).size / 1024 / 1024).toFixed(1)} MB)`)

mkdirSync(APK_DIR, { recursive: true })
const versionedApk = join(APK_DIR, `kaoyan-tracker-v${VERSION}.apk`)
const fixedApk = join(APK_DIR, 'DiveDeep.apk')
copyFileSync(builtApk.path, versionedApk)
copyFileSync(builtApk.path, fixedApk)
console.log(`   ✅ ${versionedApk}`)
console.log(`   ✅ ${fixedApk}`)

// ── 4. 发布 OTA（--skip-build：Web 已在第 1 步构建） ──
step('4/4 发布 OTA 更新')
run('node scripts/upload-ota.mjs --skip-build')

console.log(`\n🎉 Android v${VERSION} 发版完成！`)
console.log('   手机端到 App 内「检查更新」即可发现新版。\n')