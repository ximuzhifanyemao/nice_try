# Tasks

- [x] Task 1: 切换模式窗口尺寸统一为逻辑单位（WidgetApp.tsx）
  - [x] 1.1 `import` 增加 `LogicalSize`（当前已导入 `PhysicalSize`、`PhysicalPosition`）
  - [x] 1.2 精简分支：`await appWindow.setSize(new PhysicalSize(WIDGET_W, WIDGET_H))` → `new LogicalSize(WIDGET_W, WIDGET_H)`（与 tauri.conf.json 的 width/height 一致，DPI 无关）
  - [x] 1.3 全功能分支：`currentMonitor()` 的 `monitor.size`（物理）按 `monitor.scaleFactor || 1` 换算为逻辑宽高后再 `min(FULL_W/FULL_H)` 钳制，`setSize` 用 `LogicalSize(w, h)`；保留下限（min(960, 逻辑宽) / min(700, 逻辑高)）与取显示器失败时 1600×1000 兜底
  - [x] 1.4 保持 `sanitizePosition` 与 `PhysicalPosition` 恢复逻辑不变（v1.13.28 已统一）
- [x] Task 2: 学习内容抽屉高度兜底（DesktopTimer.tsx）
  - [x] 2.1 抽屉面板类名增加 `max-h-[min(60vh,340px)]` 与 `overflow-y-auto`（内容超高时抽屉内部滚动，不溢出窗口）
  - [x] 2.2 确认抽屉遮罩、关闭按钮、Esc 收起逻辑不受影响
- [x] Task 3: 构建验证与走查
  - [x] 3.1 `npm run build:deploy` 通过（TypeScript 类型检查含 widget 代码，确认 LogicalSize 类型可用）
  - [x] 3.2 代码走查：确认所有 `setSize` 调用点均为逻辑单位；无残留 PhysicalSize 窗口尺寸调用；`LogicalPosition` 未误用

# Task Dependencies
- [Task 1] 独立；[Task 2] 独立（可与 Task 1 并行，不同文件）
- [Task 3] 依赖 [Task 1] 与 [Task 2]