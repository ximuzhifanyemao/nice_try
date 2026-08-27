# Tasks

- [x] Task 1: 桌面端 Logo 改用应用真实图标图片
  - 修改 `src/components/Logo.tsx`：将 CSS 渐变圆角方块 + SVG「D」近似图形改为渲染应用真实图标图片（用 Vite 资源导入 `public/icons/icon-*.webp` 中的一张，Web 与桌面共用同一 dist 资源），保留 `size` prop 与圆角样式
  - 校验：桌面应用侧边栏顶部、全功能标题栏、精简标题栏显示的图标与电脑应用安装图标（exe/ico）视觉一致，Web 端同一 Logo 组件不受影响
- [x] Task 2: APK 分发文件名为 DiveDeep.apk
  - 修改 `scripts/upload-ota.mjs`：`APK_PATH` 改为 `apk/DiveDeep.apk`，`APK_STORAGE_NAME` 改为 `DiveDeep.apk`
  - 修改 `scripts/upload-release.mjs`：`APK_PATH` 与 `ASSET_NAME` 改为 `DiveDeep.apk`
  - 校验：本地 `apk/DiveDeep.apk`、OTA 存储对象名、GitHub Release 资产名三者一致
- [x] Task 3: 修复桌面最小化按钮
  - 在 `src-tauri/capabilities/default.json` 的 permissions 中补上 `core:window:allow-minimize`
  - 校验：点击全功能/精简标题栏的「─」最小化按钮，窗口正常最小化到任务栏，无静默失效
- [x] Task 4: 「全部功能」窗口固定尺寸、不可缩放/拖动，首页整屏完整展示
  - 修改 `src/widget/WidgetApp.tsx` 的 `toggleMode`：进入全部功能时 `setResizable(false)`（当前为 true）；全功能标题栏移除/禁用 `data-tauri-drag-region`，使窗口不可拖动移动；精简挂件保持可拖动 + 位置记忆不变
  - 调整全功能窗口尺寸（FULL_W/FULL_H）与首页/App 布局（`src/pages/Home.tsx`、`src/components/Calendar.tsx`、`src/App.tsx` 的 fillHeight/溢出处理），使首页（倒计时、连续打卡/本周进度卡、英语打卡入口、日历）在该固定尺寸下整屏完整显示、无需滚动
  - 校验：展开全部功能后窗口固定不可缩放/拖动，日历完整可见无滚动条；返回精简计时后挂件恢复可拖动并记忆位置
- [x] Task 5: 版本号同步与全链路发布
  - 同步升版本号：`package.json` version、`android/app/build.gradle`（versionCode +1 / versionName）、`src-tauri/tauri.conf.json` version
  - `npm run build:deploy` → git commit + push → `npx cap sync android` → `gradlew assembleRelease` → 复制 APK 到 `apk/DiveDeep.apk` → `node scripts/upload-ota.mjs` → `node scripts/upload-release.mjs` → `npm run tauri build`（桌面 MSI+NSIS 上传 GitHub Release）
  - 校验：Web / APK / OTA / GitHub Release / 桌面安装包产物版本一致，APK 资产名为 DiveDeep.apk

# Task Dependencies
- Task 4 依赖 Task 1 完成后桌面工程可正常构建运行
- Task 1、2、3 相互独立，可并行
- Task 5 依赖 Task 1~4 全部完成
