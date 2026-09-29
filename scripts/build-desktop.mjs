// ============================================================
// 桌面端构建脚本（避开终端宿主导入的 CI 环境变量）
// 用法：npm run build:desktop
// 背景：Trae 终端会注入 CI=true/CI=1，而 tauri CLI 的 --ci
//       只接受布尔值 true/false，CI=1 会导致构建报错。
//       这里在启动 tauri build 前先把 CI 强制置为 false。
// 后处理：在受限沙箱内构建时，产物会带 Windows「低完整性级别」标签，
//       NSIS 安装包（.exe 本体）被双击运行时进程会继承该级别，
//       无法写入 %TEMP% 而报「Error writing temporary file.
//       Make sure your temp folder is valid.」。构建完成后统一把
//       安装包完整性级别修正为 Medium（需文件所有者权限，失败仅告警）。
// ============================================================

import { spawnSync } from 'child_process'
import { readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Windows 上 spawnSync 不能直接执行 .cmd/.bat，需经 shell 启动.
const res = spawnSync('npx tauri build', {
  shell: true,
  stdio: 'inherit',
  env: { ...process.env, CI: 'false' },
})

if ((res.status ?? 1) !== 0) process.exit(res.status ?? 1)

// ── 修正安装包完整性级别：防止沙箱构建产物带 Low IL 导致双击安装失败 ──
if (process.platform === 'win32') {
  const bundleDirs = [
    join(ROOT, 'src-tauri', 'target', 'release', 'bundle', 'nsis'),
    join(ROOT, 'src-tauri', 'target', 'release', 'bundle', 'msi'),
  ]
  const installers = []
  for (const dir of bundleDirs) {
    if (!existsSync(dir)) continue
    for (const name of readdirSync(dir)) {
      if (/\.(exe|msi)$/i.test(name)) installers.push(join(dir, name))
    }
  }
  for (const file of installers) {
    const r = spawnSync('icacls', [file, '/setintegritylevel', 'medium'], { stdio: 'ignore' })
    console.log(
      r.status === 0
        ? `✅ 已修正安装包完整性级别: ${file}`
        : `⚠️ 安装包完整性级别修正失败（非致命，可手动执行 icacls "<file>" /setintegritylevel medium）: ${file}`,
    )
  }
}