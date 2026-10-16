# 电脑程序专属化改造 + 新版本发布（v1.15.0）

## Context（为什么做这件事）

需求来自用户：**「桌面端改成独有的，不要沿用网页端或者手机端的应用」**，并把「推送新的 GitHub Release / APK / NSIS」作为本次一并交付。

现状：网页端、安卓 App、电脑程序（Tauri）三者**共用同一套 React 代码**。桌面端已经从「宽屏分支（`useWideLayout()`）」这条路做过一轮适配（我的 / 记录 / 打卡 / 计时 等页面已是桌面双栏），但仍有两类明显残留：

1. **整页没做桌面分支**：登录 / 注册 / 找回密码 / 重置密码 / 二维码登录 / 扫码页 —— 桌面窗口里就是手机那套「整屏居中 `max-w-sm` 单卡片」；扫码页还在调用摄像头。
2. **桌面端仍在用浏览器做法**：导出数据与分享图走 `<a download>`（文件只能落进浏览器下载目录，不能让用户选路径）；更新提示沿用「已打开浏览器下载页」的网页话术；记录页空态/加载态是手机式居中大虚线框。

目标产出：电脑程序在**外观与交互上都是为桌面设计的一套形态**，同时保持网页/手机零回归；并发布一版包含全部改动的 GitHub Release（APK + NSIS + MSI）与 OTA。

> 上次会话已完成并待发布的内容：桌面端系统通知（tauri-plugin-notification）、今日目标线漂移修复、记录页每日时间轴图表。本次一并发布。

## 一、桌面端专属化改造

### 1. 认证页面桌面专属形态（4 个页面）
涉及：[Login.tsx](src/pages/Login.tsx)（无 `wide` 分支，`min-h-[70vh] flex items-center justify-center` + `max-w-sm` 居中单卡片）、[Register.tsx](src/pages/Register.tsx)、[ForgotPassword.tsx](src/pages/ForgotPassword.tsx)、[ResetPassword.tsx](src/pages/ResetPassword.tsx)。

- 新增共用外壳 `src/components/AuthDialogShell.tsx`（4 处复用，避免写 4 份）：`wide` 时渲染桌面双栏 —— 左栏品牌区（`DesktopLogo` + 产品名 + 3 条能力要点，`max-w-[420px]`），右栏表单卡片（`max-w-[380px]`，垂直居中，`h-full` 撑满内容列）。
- 各页面在 `wide` 时 `return` 新布局分支，**窄屏分支原样保留**（沿用仓库既有约定：`if (wide) return (...)`）。
- 表单细节桌面化：Enter 直接提交（沿用现有 `<form onSubmit>`）、错误提示内联、按钮高度按桌面尺寸，不再用 `min-h-[70vh]` 撑满屏幕。
- 「扫码登录」Tab 保留（这是电脑端唯一的免密登录通道），但二维码区域按桌面尺寸（约 180px）呈现，提示文案改成「用手机 DiveDeep 扫码确认」，不再出现手机专属话术。

### 2. 扫码页在桌面端不再调用摄像头
[ScanQr.tsx](src/pages/ScanQr.tsx)：桌面端（`wide`）改为一个说明面板（「扫码登录在手机上完成」+ 返回入口），不渲染相机预览、不做 `URL.createObjectURL(file)` 选图逻辑。手机/网页端行为不变。

### 3. 原生「另存为」替换浏览器下载（桌面专属交互）
涉及 [export.ts](src/lib/export.ts)（`URL.createObjectURL` + `<a download>`）与 [shareCard.ts](src/lib/shareCard.ts)。

采用 `tauri-plugin-dialog` + `tauri-plugin-fs`（推荐方案，已核对 `save` 命令会把用户选中的路径动态加入 fs scope，**无需静态 scope 配置**）：

- Rust：[Cargo.toml](src-tauri/Cargo.toml) 追加 **精确版本** `tauri-plugin-dialog = "2.7.2"`、`tauri-plugin-fs = "2.5.2"`（`tauri` 锁在 2.11.5，dialog 2.8.x / fs 2.6+ 都要求 `tauri ^2.12`，cargo 会解析不到）；[lib.rs](src-tauri/src/lib.rs) 注册两个插件；[capabilities/default.json](src-tauri/capabilities/default.json) 追加 `dialog:allow-save`、`fs:allow-write-text-file`、`fs:allow-write-file`。
- npm：`@tauri-apps/plugin-dialog@2.7.2`、`@tauri-apps/plugin-fs@2.5.2`（**精确版本，不加 `^`**，否则会漂到与 Rust 侧不匹配的版本）。
- 前端：`isTauri()` 分流 —— 桌面端 `save()` 拿路径 → `writeTextFile`（JSON/CSV）/ `writeFile`（PNG，PNG 用 `atob` 手工解码，**不要 `fetch(data:)`**，CSP 的 `connect-src` 只允许 `'self'`）；网页/安卓保持 `<a download>`。
- 顺带把 [package.json](package.json) 里 `@tauri-apps/plugin-notification` 从 `^2.4.0` 钉成精确 `2.4.0`（同类版本漂移隐患）。

### 4. 更新流程按桌面重写（本次不接应用内静默更新）
[AppVersion.tsx](src/components/AppVersion.tsx)、[useAppUpdate.ts](src/hooks/useAppUpdate.ts)、[Profile.tsx](src/pages/Profile.tsx)：

- 桌面端文案从「已在浏览器打开下载页」改为桌面说法（「已用默认浏览器打开安装包下载页，下载后运行安装包完成更新」），并在桌面「我的」账号面板里把「检查更新」呈现为桌面行样式（对齐 `Section`/`SettingRow` 既有形态）。
- **不接 `tauri-plugin-updater`**：它要求 minisign 密钥对并在 v1.15.0 起就固化进已发布版本的 `pubkey`（换钥 = 老客户端永久拒收新包，私钥丢失 = 老用户再也收不到更新），且要改 `bundle.createUpdaterArtifacts`、`build-desktop.mjs`、`upload-desktop-update.mjs` 与 `latest.json` 契约。收益（少两次点击）小于不可逆风险，放到下一版单独做。

### 5. 桌面端手机式残留清理
[MyRecords.tsx](src/pages/MyRecords.tsx)：`recordsList` 的空态（`rounded-2xl border-dashed py-14 text-center`）与加载态在桌面分支改为桌面样式（左对齐面板 + 说明 + 「+ 新建今日记录」按钮，去掉整块居中大虚线框）。手机分支不变。

## 二、新版本发布（v1.15.0）

版本号需 3 处同步（沿用仓库既有约定）：
- [package.json](package.json) `version` → `1.15.0`
- [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json) `version` → `1.15.0`（`upload-desktop-update.mjs` / `upload-release.mjs` 都按它过滤产物，必须一致）
- [android/app/build.gradle](android/app/build.gradle) `versionName "1.15.0"` / `versionCode 88`（当前是 1.14.9 / 87，落后于 package.json，必须补上）

发布顺序：
1. 校验：`npx tsc -b`、`npx oxlint`、`npm run build:deploy`、`cargo check --manifest-path src-tauri/Cargo.toml`（确认解析出 dialog 2.7.2 / fs 2.5.2、无重复 tauri 版本）。
2. 桌面端：`npm run build:desktop`（内部先跑 `build:deploy`，产出 NSIS `.exe` + MSI；注意 `$env:CI='false'` 由脚本处理）→ `npm run ota:desktop`（上传到 Supabase `desktop-bundles` + 写 `desktop_versions`，供国内直连检测更新）。
3. 安卓：`npm run release:android`（cap:sync → `assembleRelease` → 归置 `apk/kaoyan-tracker-v1.15.0.apk` 与 `apk/DiveDeep.apk` → `upload-ota.mjs --skip-build` 写 `app_versions`）。`android/keystore.properties` 与 `android/kaoyan-tracker.keystore` 均已存在，可正常签名。
4. GitHub Release：`npm run release:upload`（[upload-release.mjs](scripts/upload-release.mjs) 会上传 APK + 名称含 `1.15.0` 的 NSIS `.exe` 与 MSI，并创建 `v1.15.0` Release + 生成更新日志）。令牌来源：`GITHUB_TOKEN`/`GH_TOKEN` → `.env.ota` → git 凭据管理器（本机 `gh` 未安装，走凭据管理器/`.env.ota`）。
5. 代码入库：把当前工作区改动（含本次改造）提交到 `main` 并 `push`（远端 `https://github.com/ximuzhifanyemao/nice_try.git`）。

## 三、验证

- 布局：用预览台截图核对桌面端（`node scripts/dev/shot.mjs --url "http://localhost:5173/preview.html?preview=1&view=full&logs=5#/<路由>" --w 1440 --h 900`，首次调用常空白，需重跑一次），重点看 `/login`、`/my-records`、`/profile`、`/scan-qr`；窄屏（`--w 420`）确认手机分支零回归。
- 原生保存：桌面安装包安装后点「导出数据」，确认弹出系统「另存为」对话框并落盘。
- 通知：桌面端点开「设置 → 提醒」开关不再出现「浏览器设置」文案，到点弹 Windows 系统 Toast。
- 目标线：计时页进度尺在保存一笔记录后不再向右跳。
- 产物核对：GitHub Release 里同时有 `DiveDeep.apk`、`*_1.15.0_x64-setup.exe`、`*_1.15.0_x64_en-US.msi`；Supabase `app_versions` / `desktop_versions` 均有 1.15.0 记录。

## 四、本版不做（下一版）

- `tauri-plugin-updater` 应用内静默更新（含 minisign 密钥生成与保管、`latest.json` 托管、bundle/OTA 链路改造）。
- 桌面专属增强：全局快捷键、右键菜单、多窗口/托盘。

## 五、待确认（如与预期不符请直接指出）

1. 版本号定为 **1.15.0**（原 1.14.14）。
2. 桌面登录页**保留**「用手机扫码登录」入口（仅重排为桌面形态），不删功能。
3. 发布**一个**新版本，把「桌面专属化 + 上次的提醒/目标线/时间轴修复」打包在一起，而不是先发旧、再发新。
