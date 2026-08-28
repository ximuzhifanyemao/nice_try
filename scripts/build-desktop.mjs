// ============================================================
// 桌面端构建脚本（避开终端宿主导入的 CI 环境变量）
// 用法：npm run build:desktop
// 背景：Trae 终端会注入 CI=true/CI=1，而 tauri CLI 的 --ci
//       只接受布尔值 true/false，CI=1 会导致构建报错。
//       这里在启动 tauri build 前先把 CI 强制置为 false。
// ============================================================

import { spawnSync } from 'child_process'

// Windows 上 spawnSync 不能直接执行 .cmd/.bat，需经 shell 启动.
const res = spawnSync('npx tauri build', {
  shell: true,
  stdio: 'inherit',
  env: { ...process.env, CI: 'false' },
})

process.exit(res.status ?? 1)