# 发布 v1.14.2 执行计划（Web + Android + Desktop 三端）

## 仓库调研结论

| 项目                     | 现状                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 当前分支                   | `main`（与 `origin/main` 同步，无超前/落后提交）                                                                                                                     |
| 当前版本                   | `package.json: 1.14.1`（SemVer，本轮按 Bugfix 发布升至 **1.14.2**）                                                                                               |
| Android build.gradle   | 工作区存在 versionCode 79→80 / versionName 1.13.33→1.14.1 的未提交改动（用户选择不合并到本次提交，后续在 `feat/capacitor-android` 分支单独处理）                                           |
| 未跟踪文件                  | `android/kaoyan-tracker.keystore.old`（敏感旧密钥）、`翻译申请资料/`（无关文档目录）——均不进入版本控制（当前 `.gitignore` 未显式覆盖，本轮通过只 `add` 指定文件规避）                                      |
| Git 远端                 | HTTPS `https://github.com/ximuzhifanyemao/nice_try.git` ✅ 符合 HTTP 协议偏好                                                                                  |
| Git 凭证                 | **本地未配置 credential helper**，`git push` 时会触发交互登录（需 GitHub Token 或浏览器 OAuth），属于 **必须用户授权的阻塞点**                                                            |
| CloudBase CLI / gh CLI | 本机未安装（符合用户「不装本地 CLI、偏好 Git 触发自动部署」偏好）；Web 发布走 CloudBase Framework 对 GitHub main 的自动构建                                                                   |
| CloudBase 配置           | `cloudbaserc.json` → envId=`code-app-d3ggyfrxu0f39d17f`，buildCommand=`npm install && npm run build:deploy`，output=`dist` ✅ 与项目记忆一致                      |
| Supabase 生产配置          | `.env.production` 已填入：`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`、`VITE_AI_CORRECT_URL`（腾讯云 SCF）✅                                                      |
| OTA 上传配置               | `.env.ota` 需要 `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`（Desktop OTA 上传用）。`.gitignore` 已排除不提交。构建桌面 OTA 前需预验证该文件是否已填值。                                      |
| Rust / Tauri 工具链       | 根据项目记忆：`RUSTUP_HOME`、`CARGO_HOME` 指向 E 盘；MSVC `link.exe` 位于 `D:\app\visualstdio\VC\Tools\MSVC\14.39.33519\bin\Hostx64\x64`；使用 rsproxy.cn 国内镜像。构建前做一次预检。 |
| Capacitor / Android 分支 | 移动 APK 构建分支：`feat/capacitor-android`（独立分支，避免影响网站）。APK 产物输出到 `apk/`（`.gitignore` 已排除）。                                                                   |

### 本轮发布对应代码修复（2 个源文件）

1. `src/lib/subjects.ts` — `createUserSubject` / `updateUserSubject` 服务端重名检查、`ensureBuiltinMigration` 与 `recoverDeletedSubjects` TOCTOU 竞态二次防护、`getAvailableSubjects` 显示层按名称去重、`listDuplicateSubjectNames` 检测接口、`getCategoryLabel` 中文分组标签映射
2. `src/components/StudyTimer.tsx` — 使用 `getCategoryLabel` 翻译 math/english/politics 分组标签为中文；管理列表分类徽章翻译；新增/编辑科目客户端重名预检 toast；重复科目清理警告条

***

## 涉及的文件与模块

| 文件                                    | 变更类型   | 说明                                           |
| ------------------------------------- | ------ | -------------------------------------------- |
| `package.json`                        | **改**  | 版本号 `1.14.1 → 1.14.2`（仅版本号，无其他改动）            |
| `src/lib/subjects.ts`                 | **已改** | 本轮修复的后端逻辑（见上方），需提交                           |
| `src/components/StudyTimer.tsx`       | **已改** | 本轮修复的前端 UI 变化（见上方），需提交                       |
| `android/app/build.gradle`            | 不提交    | versionCode/versionName 升级留到 Android 分支再统一处理 |
| `android/kaoyan-tracker.keystore.old` | 不提交    | 敏感旧密钥文件；建议后续手动删除或加入 `.gitignore`             |
| `翻译申请资料/`                             | 不提交    | 无关业务代码的文档目录                                  |

***

## 实现步骤（按依赖顺序）

### 阶段 0：预检（执行后立即产出报告，不修改任何状态）

1. 质量门禁：`npx tsc --noEmit` 再次校验 TypeScript 通过；`npm run lint`（oxlint）跑一次
2. Rust/Desktop 构建环境：

   - 验证 `$env:RUSTUP_HOME` 指向 E 盘；`rustc --version`、`cargo --version` 正常

   - 验证 `link.exe` 在 PATH 中；或构建 Tauri 前临时 `$env:PATH += ';D:\app\visualstdio\VC\Tools\MSVC\14.39.33519\bin\Hostx64\x64'`

   - crates.io 镜像：检查 `%CARGO_HOME%\config.toml` 是否有 rsproxy.cn 源

   - Rust 默认工具链：`stable-x86_64-pc-windows-msvc`
3. Android 构建环境：

   - 本机 JDK 版本（`java -version`，建议 17+）；`$env:JAVA_HOME` 是否指向 jdk-\* 目录

   - Android SDK 路径（`$env:ANDROID_HOME` 或 `$env:ANDROID_SDK_ROOT`）

   - Gradle Wrapper 是否可用（`android/gradlew.bat` 存在）
4. OTA 环境变量：读取 `.env.ota` 验证 `SUPABASE_URL`、`SUPABASE_SERVICE_KEY` 非空（仅 Desktop OTA 需要）

### 阶段 1：版本号更新与 Git 归档（仅 main 分支）

1. 修改 `package.json`：`version` 从 `1.14.1` → `1.14.2`
2. 构建产物完整性预检（非必须，可选跳过）：`npm run build:deploy`（`tsc -b && vite build`）确认 `dist/` 生成成功
3. Git 提交（仅以下 3 个文件，严格排除其他）：

   ```
   git add package.json src/lib/subjects.ts src/components/StudyTimer.tsx
   git commit -m "[fix]: 修复计时器科目重复创建 & 分组标签英文显示

   - 服务端 createUserSubject/updateUserSubject 增加同用户重名拦截
   - ensureBuiltinMigration / recoverDeletedSubjects 插入前即时二次查重关闭 TOCTOU 竞态
   - getAvailableSubjects 显示层按名称去重；管理面板新增重复科目清理警告条
   - 新增 getCategoryLabel：math→数学、english→英语、politics→政治
   - StudyTimer 分组标题/分类徽章统一走翻译函数
   - 新增/编辑科目前端重名即提示，避免无效请求"
   ```
4. Git 打语义化 Tag：`git tag -a v1.14.2 -m "Release v1.14.2 - 科目去重 & 分组标签中文修复"`

### 阶段 2：推送到 GitHub（阻塞点 — 需要用户交互授权）

1. `git push origin main` — 因 **Git 无 credential helper**，推送会触发 GitHub 登录弹窗或要求输入 Token，**该步骤必须由用户在出现的弹窗中完成授权**，若授权失败整次发布暂停，不进入后续步骤。
2. `git push origin v1.14.2` — 同样需要用户授权
3. GitHub 推送成功验证：在浏览器打开 `https://github.com/ximuzhifanyemao/nice_try` 确认 main 分支最新 commit 与 tag v1.14.2 均可见（需用户确认或截图）

### 阶段 3：Web 端（CloudBase）自动部署

1. CloudBase Framework 自动拉取最新 main 并执行 `npm install && npm run build:deploy`，输出部署到
   `https://notoday-code-app-d3ggyfrxu0f39d17f.webapps.tcloudbase.com`（项目记忆中的域名；若不同则以 CloudBase 控制台为准）
2. **人工验证（需用户执行）**：

   - 打开线上域名，确认 JS / CSS 无 404

   - 登录后进入「计时」页，确认：a) 分组标题显示「数学」「英语」而非 `math` `english`；b) 科目列表不再出现多个同名科目（英语等只剩 1 个）；c) 管理列表若有历史重复显示橙色清理提示条；d) 新建同名科目时客户端 toast 立即拦截

### 阶段 4：Android APK 构建（feat/capacitor-android 分支）

1. 切换到 Capacitor 专用分支：`git checkout feat/capacitor-android`，然后 `git merge main` 把阶段 1-2 的修复合并进分支；如出现冲突优先用 main 侧的 StudyTimer.tsx / subjects.ts
2. 版本号同步：手动更新 `android/app/build.gradle` 的 `versionCode`（当前在 main 工作区中显示为 79→80，在 capacitor 分支实际值可能不同，**在 capacitor 分支原值基础上 +1**）；`versionName` 统一为 `1.14.2`
3. 同步 Web 资源到 Android 资产：`npm run cap:sync`（= build:deploy + npx cap sync）
4. 构建 Release APK：

   - 若 Keystore 密码/别名已知：运行 `cd android ; ./gradlew.bat assembleRelease`（Windows 用 `gradlew.bat`），产物输出到 `android/app/build/outputs/apk/release/`

   - 把生成的 `app-release.apk` 移动并重命名到 `apk/kaoyan-tracker-v1.14.2.apk`（`.gitignore` 已排除 apk/，可放心存放）
5. **注意**：若 Android SDK / JDK / Gradle 环境不完整，构建会报错；此步为 **阻塞点**，需要用户确认环境是否就绪或后续手动构建。
6. **人工验证（需用户执行）**：安装 APK 到手机 → 进入「计时」页，验证同阶段 3 的 a/b/c/d 四点（或扫码登录 BLE 计时相关非回归检查）

### 阶段 5：Tauri Desktop 构建 + Supabase OTA 更新

1. 切回 main 分支（`git checkout main`），确保代码与阶段 2 推送一致
2. 注入 Tauri 依赖的环境变量（若未在系统级持久化）：

   ```powershell
   $env:RUSTUP_HOME = "E:\.rustup"   # 以实际路径为准，阶段 0 预检会确认
   $env:CARGO_HOME  = "E:\.cargo"
   $env:PATH       += ";D:\app\visualstdio\VC\Tools\MSVC\14.39.33519\bin\Hostx64\x64"
   ```
3. 构建桌面安装包：`npm run build:desktop`（≈10-20 分钟，产物在 `src-tauri/target/release/bundle/msi/` 与 `nsis/`）
4. 上传到 Supabase 并写入 OTA 版本表：`npm run ota:desktop`（从 `.env.ota` 读取 service\_key；上传 MSI/EXE 到 `desktop-bundles` Storage 桶；在 `desktop_versions` 表中把本版本 `is_active` 置为 `true`，其他旧版本置为 `false`，同时写入签名 hash）
5. **人工验证（需用户执行）**：

   - 在桌面完整版（full mode）设置或版本页点「检查更新」，应弹出发现 v1.14.2

   - 或手动安装新 MSI/EXE 后验证：科目分组标签中文、无重复科目、重名拦截等（同 Web 端验证项）

### 阶段 6：收尾

1. 汇总三端发布结果（成功/失败/跳过原因）到本计划文末的「发布结果摘要」区块
2. 若有新的 `.gitignore` 规则需要补充（如 `*.keystore.old`），另开一次小提交，不混入本次发布提交；可选，由用户决定

***

## 依赖与注意事项

- **所有变更严格按 \[类型]: 描述 的 commit message 格式**（本次 `[fix]: ...`）

- `npm run build:deploy`（而非 `build`）是 CloudBase 官方构建命令，**不要切换**到 `npm run build`，避免 TypeScript 环境差异导致构建失败（项目记忆 Hard Constraints）

- Git 推送、CloudBase 结果确认、APK 安装验证、桌面 OTA 验证 4 处 **必须人工介入**；工具无法替代

- `.env.ota`（含 `SUPABASE_SERVICE_KEY`）与 keystore 相关文件 **绝对禁止提交到 Git**

- 桌面 OTA：`desktop_versions` 表的 RLS 策略需要允许匿名读取 `is_active = true` 记录（项目记忆已配置），只需确保 `ota:desktop` 脚本成功把本版本 is\_active 置 true

***

## 验证清单（每通过一项标记 ✅，失败/跳过标注 ❌/⏭ 并附原因）

| #    | 验证项                                          | 负责方    | 结果     |
| ---- | -------------------------------------------- | ------ | ------ |
| V0.1 | `tsc --noEmit` 0 errors                      | Agent  | <br /> |
| V0.2 | `oxlint` 0 errors                            | Agent  | <br /> |
| V0.3 | Rust + MSVC 路径可用                             | Agent  | <br /> |
| V0.4 | Android JDK/SDK/Gradle 可用                    | Agent  | <br /> |
| V0.5 | `.env.ota` 中 `SUPABASE_SERVICE_KEY` 非空       | Agent  | <br /> |
| V1.1 | `package.json` version = 1.14.2              | Agent  | <br /> |
| V1.2 | Commit 仅含 3 个指定文件，无 keystore/资料              | Agent  | <br /> |
| V2.1 | `git push origin main` 成功（需要用户授权弹窗）          | **用户** | <br /> |
| V2.2 | `git push origin v1.14.2` 成功                 | **用户** | <br /> |
| V2.3 | GitHub 网页上可见新 commit + tag                   | **用户** | <br /> |
| V3.1 | CloudBase 构建成功 + 线上站点可访问                     | **用户** | <br /> |
| V3.2 | 线上「数学/英语」分组中文、不重复、重名拦截                       | **用户** | <br /> |
| V4.1 | feat/capacitor-android 分支成功合并 main           | Agent  | <br /> |
| V4.2 | APK `assembleRelease` 构建成功                   | Agent  | <br /> |
| V4.3 | APK 安装后功能非回归验证                               | **用户** | <br /> |
| V5.1 | `npm run build:desktop` 产出 MSI + EXE         | Agent  | <br /> |
| V5.2 | `npm run ota:desktop` 上传成功 + is\_active=true | Agent  | <br /> |
| V5.3 | 桌面端「检查更新」可发现 v1.14.2                         | **用户** | <br /> |

***

## 风险与应对

| 风险                                               | 概率                                 | 影响                 | 应对策略                                                                                                                            |
| ------------------------------------------------ | ---------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Git push 因无凭证助手失败                                | **高**                              | 后续所有步骤无法开始         | 弹出浏览器 OAuth / 要求输入 Personal Access Token；在推送前用 `RequestAuthorization` 工具提醒用户授权                                                  |
| CloudBase 自动构建未触发（GitHub webhook 未配或延迟）          | 中                                  | 网站访问不到新版本          | 建议用户登录 CloudBase 控制台手动触发一次构建；或若用户稍后想装 CloudBase CLI，可手动 `cloudbase framework:deploy`，但与"不装 CLI"偏好冲突                             |
| Android JDK/SDK/Gradle 不完整                       | 高（Android SDK 常随 Android Studio 装） | APK 构建阶段跳过         | 标记 Step 4 为⏭跳过，提供用户后续手动操作步骤                                                                                                     |
| Rust/Tauri 构建失败（环境变量、镜像、磁盘空间）                    | 中                                  | Desktop 发布失败       | 阶段 0 预检详细列出每个缺失项；缺失 `RUSTUP_HOME` / `link.exe` 时在阶段 21 注入；crates.io 超时重试 2 次，仍失败则建议用户稍后网络好时单独跑桌面构建子流程                           |
| `.env.ota` 未填 `SUPABASE_SERVICE_KEY`             | 中                                  | Desktop OTA 上传无法完成 | 阶段 0 预检若发现为空则直接把阶段 5 的 ota:upload 步标记为阻塞，等候用户补填                                                                                 |
| APK/桌面构建过程中磁盘空间不足                                | 低                                  | 构建被中断              | MSI/APK 体积在 50-200MB，建议保证 E 盘 ≥5GB 可用；`src-tauri/target` 构建缓存占用较大                                                               |
| 桌面版本表 `desktop_versions` 中 RLS 策略或 Storage 桶权限异常 | 低                                  | 已上传但客户端看不到更新       | 通过 Supabase SQL Editor 快速核对：`SELECT * FROM desktop_versions WHERE is_active = true`；确认 Storage `desktop-bundles` 桶为公开读或有 RLS 放行 |
| 合并 `main → feat/capacitor-android` 时冲突           | 中                                  | Android 分支推进受阻     | 冲突优先用 main 侧的 `src/lib/subjects.ts`、`src/components/StudyTimer.tsx`；Android 侧冲突用当前分支内容；冲突不确定时暂停并询问用户                            |

***

## 发布结果摘要（发布完成后填写）

```
版本：v1.14.2
类型：Bugfix（科目去重 + 分组标签中文）
提交范围：package.json version bump + 2 个修复文件 + Android/Desktop 打包版本号
Git tag：v1.14.2（38e5312）
Git commits：
  7062128 [fix] 科目去重 & 分组标签中文（3 files）
  3d2fe25 [release] 同步 v1.14.2 打包版本号（Android versionCode 80 / Desktop tauri 1.14.2）

[平台]    [状态]   [产物 / 访问地址]                                    [备注]
────────────────────────────────────────────────────────────────────────────────
Web      ✅推送    https://notoday-code-app-d3ggyfrxu0f39d17f.webapps.tcloudbase.com
         ⏭验证    CloudBase 自动构建已触发；测试域名日流量超限，需控制台/自定义域名验证
Android  ✅       apk/kaoyan-tracker-v1.14.2.apk（17.85MB，签名 CN=DiveDeep，versionCode 80）
Desktop  ✅       Supabase desktop-bundles：MSI 3.46MB + EXE 2.54MB；desktop_versions is_active=true(v1.14.2)
```

### 执行过程中的关键决策与偏差

1. **Android 打包分支变更**：`feat/capacitor-android` 分支已严重过时（基于 v1.3.4，src 仅 50 文件 vs main 81 文件、67 个文件分叉），且该分支代码无法编译 main 的修复（缺 `upsertLogSafely` 等 API）。经确认 **main 分支自身完整维护 android/（81 文件）+ capacitor.config.ts + keystore**，故改为在 main 上直接构建 APK。切换时 106 个「main 跟踪/工作区 untracked」文件经备份→切换→哈希比对确认全部一致后安全清理。
2. **cap:sync 顺带更新**了 `android/app/capacitor.build.gradle`、`android/capacitor.settings.gradle`（Capacitor 插件同步产物），未提交（非核心代码）。
3. **旧分支提交 e2b6085**（feat/capacitor-android 上 cherry-pick 的 4 文件提交）已留在该分支未推送，不影响 main。

### 待用户验证清单

- [ ] **Web**：CloudBase 控制台确认构建成功；访问线上站点（或自定义域名）→ 计时页确认分组「数学/英语」中文、科目不重复、重名拦截生效

- [ ] **Android**：安装 `apk/kaoyan-tracker-v1.14.2.apk` 到手机验证上述 3 点

- [ ] **Desktop**：桌面端「检查更新」应提示 v1.14.2（已发布 OTA），或手动安装 MSI/EXE 验证

