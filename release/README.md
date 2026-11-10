# DiveDeep 发布控制台

本地发布工具：输入版本号，勾选要发布的目标（Web / Android APK / Windows 桌面端），
先检查本机环境，再按「先构建、后发布」的顺序执行。

- 不引入任何第三方依赖，只用 Node.js 内置模块。
- 只监听 `127.0.0.1`，不会把发布接口暴露到局域网。
- 支持演练模式：只检查和打印命令，不写版本、不构建、不上传。
- 发布日志、历史、配置都保存在 `release/` 下，默认不提交到 Git。

## 快速开始

1. 安装 Node.js 22+。
2. 双击项目根目录的 `release.cmd`，或在项目根目录执行：

        npm run release:ui

3. 浏览器会自动打开 `http://127.0.0.1:4780/`。
4. 输入版本号，选择目标，先点「检查环境」；没问题后点「开始发布」。

只想检查环境、不启动界面：

        npm run release:check

或：

        release.cmd --check

## 发布前会检查什么

| 目标 | 检查项 |
|------|--------|
| 通用 | Node.js 22+、npm、项目可写、Git 仓库/工作区、依赖、磁盘空间 |
| Web | CloudBase CLI 路径/版本/登录状态、环境 ID、.env.production、public/_redirects、站点可访问性 |
| APK | JDK 21、Android SDK（platform 36 / build-tools）、Gradle、keystore、versionCode、Supabase OTA 配置 |
| 桌面端 | cargo/rustc、Tauri CLI、tauri.conf.json、WebView2、打包目录、Supabase OTA 配置 |
| GitHub | owner/repo、GitHub Token、GitHub API 连通性 |

检查结果分「通过 / 警告 / 失败」：失败项会阻止正式发布，警告项不阻止。
演练模式下即使有阻塞项也会继续打印计划，方便先看完整流程。

## 每个目标做什么

### Web

1. `npm run build:deploy`（tsc + vite build）
2. `<CloudBase CLI> hosting deploy dist -e <环境ID> --verify`

站点地址使用配置里的 `cloudbase.siteUrl`，发布完成后可点开确认。

### Android APK

1. `npm run build:deploy`
2. `npx cap sync android`
3. `android\gradlew.bat assembleRelease --console=plain`
4. 把产物复制为 `apk/kaoyan-tracker-v<版本>.apk` 和 `apk/DiveDeep.apk`
5. `node scripts/upload-ota.mjs --skip-build`（Supabase Storage + app_versions 表）
6. 如勾选 GitHub Release：`node scripts/upload-release.mjs --no-desktop`

### Windows 桌面端

1. `npm run build:desktop`（Tauri build，会自动先构建 Web）
2. `node scripts/upload-desktop-update.mjs`（Supabase Storage + desktop_versions 表）
3. 如勾选 GitHub Release：`node scripts/upload-release.mjs --no-apk`

### 版本号会改哪些文件

发布时统一修改，保证三端版本一致：

- package.json
- package-lock.json（根版本）
- android/app/build.gradle 的 versionName / versionCode（新版本时 versionCode +1）
- src-tauri/tauri.conf.json

程序不会自动 `git commit` 或打本地 tag；确认产物没问题后，请自己提交并推送。

> 注意：如果本次勾选 GitHub Release，`upload-release.mjs` 会按远端当前 HEAD 创建 tag，
> 而版本号改动是发布过程中才写入的。若希望 tag 与源码版本一致，建议先手动把版本号改好并提交，
> 再用相同版本号运行（版本号已一致时不会重复修改）；或者接受 tag 指向上一个提交。

## 配置

首次启动时会在 `release/config.json` 自动生成本机配置（CLI 路径、JDK、SDK、cargo、
GitHub owner/repo 等）。该文件已加入 .gitignore。

也可以直接编辑 `release/config.json`，或点击界面右上角「设置」修改：

| 字段 | 说明 |
|------|------|
| cloudbase.cliPath | CloudBase CLI 路径，例如 D:\cloudbase-cli\cloudbase.cmd |
| cloudbase.envId | CloudBase 环境 ID |
| cloudbase.siteUrl | 线上网站地址，用于发布后验证 |
| cloudbase.deployArgs | 额外部署参数，默认 ["--verify"]，可加 --safe |
| android.javaHome | JDK 21 目录 |
| android.sdkDir | Android SDK 目录 |
| desktop.cargoBin | cargo/rustc 所在目录，通常是 %USERPROFILE%\.cargo\bin |
| desktop.bundles | 例如 nsis,msi；留空使用 Tauri 默认 |
| github.owner / repo | GitHub 仓库 |
| github.tokenEnv | Token 环境变量名，默认 GITHUB_TOKEN |
| server.port | 控制台端口，修改后需重启 |
| options.allowDirty | 默认是否允许未提交改动 |
| options.stepTimeoutMinutes | 单个步骤超时，默认 40 分钟 |

想重新自动检测本机路径：退出程序，删除 `release/config.json`，再启动。

### GitHub Token

`scripts/upload-release.mjs` 依次从以下位置找 Token：

1. 环境变量 `GITHUB_TOKEN` / `GH_TOKEN`
2. 项目根目录 `.env.ota` 中的 `GITHUB_TOKEN=...`
3. Git 凭据管理器（`git credential fill`）

推荐在 `.env.ota` 里加一行（该文件已忽略，不会提交）：

        GITHUB_TOKEN=ghp_xxxxxxxx

### Supabase OTA

APK / 桌面端 OTA 依赖项目根目录 `.env.ota`：

        SUPABASE_URL=https://<project>.supabase.co
        SUPABASE_SERVICE_KEY=<service_role key>

## 命令行用法

        release.cmd                                     启动 Web 控制台
        release.cmd --check                             只检查环境
        release.cmd 1.18.0 --targets web --dry-run      演练 Web 发布
        release.cmd 1.18.0 --targets apk,desktop --yes  跳过确认直接发布

常用参数：

- `--targets web,apk,desktop`：目标列表，默认全部
- `--dry-run`：演练模式
- `--yes` / `-y`：跳过交互确认
- `--no-github`：不创建 GitHub Release
- `--allow-dirty`：允许工作区有未提交改动
- `--port 4780`：控制台端口
- `--no-open`：启动控制台但不自动打开浏览器

## 日志、历史与产物

- 实时日志：界面底部的 release log 终端
- 日志文件：`release/logs/<runId>.log`
- 发布历史：`release/history.json`（界面「发布历史」可回看）
- APK：`apk/kaoyan-tracker-v<版本>.apk`、`apk/DiveDeep.apk`
- 桌面安装包：`src-tauri/target/release/bundle/nsis`、`src-tauri/target/release/bundle/msi`

## 注意事项

- 正式发布会修改版本文件并上传，无法自动回滚；建议先用「演练模式」看一遍计划。
- 如果构建中途失败，版本文件可能已经更新；修正后可以用同一版本重试，versionCode 不会重复递增。
- 工作区不干净时默认阻止发布，避免 GitHub Release 的 tag 与源码不一致。
- 如果从受限终端 / 沙箱里运行，npm、CloudBase CLI 等子进程可能报 spawn EPERM；
  这是终端限制，不是发布程序的问题，请直接双击 `release.cmd` 或从普通 PowerShell 运行。
- 发布控制台只监听 `127.0.0.1`；使用完关闭窗口即可。

## 文件结构

        release/
        ├── index.mjs             命令行入口 / 启动控制台
        ├── server.mjs            本地 HTTP + SSE 服务
        ├── public/               控制台页面
        ├── lib/
        │   ├── config.mjs        配置读取/保存
        │   ├── detect.mjs        本机工具链探测
        │   ├── runtime.mjs       运行时环境快照
        │   ├── checks.mjs        发布前检查
        │   ├── versioning.mjs    版本号与版本文件
        │   ├── pipeline.mjs      发布计划与执行
        │   ├── history.mjs       发布历史
        │   └── util.mjs          通用工具
        ├── config.example.json   配置示例
        ├── config.json           本机配置（自动生成，不提交）
        ├── history.json          发布历史（不提交）
        └── logs/                 发布日志（不提交）
