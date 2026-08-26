# Tasks

- [x] Task 1: 修复桌面端「Auth session missing!」登录失败
  - 排查 `src/widget/DesktopTimer.tsx` 的 `startQrLogin`/`handlePwdLogin` 与 `src/lib/supabase.ts`、`src/contexts/AuthContext.tsx` 会话逻辑
  - 在创建扫码会话前清除客户端中已失效/过期 session（`supabase.auth.signOut()` 或重置为 anon），避免携带过期 JWT 请求触发 PostgREST「Auth session missing!」
  - 校验：桌面端扫码登录与账号密码登录均成功并保持登录态
  - 完成：`startQrLogin`/`handlePwdLogin` 前置 `supabase.auth.signOut({ scope:'local' })`；setSession 捕获 `isAuthSessionMissingError`，命中则本地登出并提示「会话已过期，请重新扫码」
- [x] Task 2: 放大桌面「全部功能」窗口
  - 在 `src/widget/WidgetApp.tsx` 调整 FULL_W/FULL_H（如 960×640 → 1120×760），保证日历/列表完整展示
  - 校验：展开后日历等长内容同屏完整可见，无截断
  - 完成：FULL_W/H 1120×760，代码级验证通过
- [x] Task 3: 重设桌面侧边栏并突出登录/登出（浅色模式适配）
  - 在 `src/components/Sidebar.tsx` 改为加宽（约 180~200px）、图标+文字、随主题变浅/深色
  - 登录/登出入口改为明确的文字按钮（如「登录」/「登出」），并置于显眼位置
  - 校验：浅色模式下侧边栏样式协调、登录/登出入口清晰可见
  - 完成：宽 192px 横向行布局、`dark:` 适配、登录(indigo 文字按钮)/登出(红色文字按钮)
- [x] Task 4: 固定精简模式窗口并美化
  - 精简模式窗口禁用手动缩放（`resizable:false` 或运行时强制固定尺寸），并保存/恢复窗口位置与尺寸（Tauri `setPosition`/`getOuterPosition` + localStorage 或每次打开设置）
  - 在 `src/widget/WidgetApp.tsx`/`DesktopTimer.tsx` 优化精简模式布局与配色
  - 校验：重新打开挂件后尺寸/位置一致、布局不偏移；精简模式观感提升
  - 完成：tauri.conf `resizable:false`；移除 window-state 插件（Cargo.toml/lib.rs）；WidgetApp 用 localStorage(`kaoyan_widget_pos`)+`onMoved`/`setPosition` 持久化位置；进/出全功能切换 resizable 与位置；精简与全功能容器浅色适配
- [x] Task 5: 手机扫码改连续实时取景（类微信）
  - 评估并选型：优先集成与 Capacitor 8 兼容的原生扫码插件（如 `@magic-js/capacitor-barcode-scanner` 等，需确认 peer 兼容性）；若无合适插件，则修复 getUserMedia 卡住问题（排查 CAMERA 预授权/权限时机）
  - 实时取景失败时保留「拍照识别」兜底
  - 校验：打开扫码页即开始取景，对准二维码自动识别，无需手动拍照
  - 完成：ScanQr 挂载即 `getUserMedia` 后置相机 + `<video>` playsInline/autoplay/muted + rAF 抽帧 jsQR 自动识别；权限失败回退 no-camera + 「拍照识别」兜底；卸载关闭轨道
- [x] Task 6: 版本升级与全链路发布
  - 同步升版本号（package.json / `android/app/build.gradle` versionCode+1 / `src-tauri/tauri.conf.json`）
  - `npm run build:deploy` → `npx cap sync android` → `gradlew assembleRelease` → 复制 APK → `upload-ota.mjs` → `upload-release.mjs`；桌面 `npm run tauri build`
  - 校验：Web/APK/OTA/Release/桌面安装包产物版本一致
  - 部分完成：三端版本号已统一升到 1.10.0（package.json / build.gradle versionCode 44 / tauri.conf.json），`npm run build:deploy` 通过；实际 APK/OTA/Release/桌面安装包产物发布待执行

# Task Dependencies
- Task 2、3、4 均依赖 Task 1 已完成的桌面工程可正常构建运行
- Task 5（手机实时取景）相对独立，可与 Task 2/3/4 并行
- Task 6 依赖 Task 1~5 全部完成