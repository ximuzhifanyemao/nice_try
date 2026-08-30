# Tasks

- [x] Task 1: 精简挂件实现「学习内容」吸附式抽屉选择器（DesktopTimer.tsx）
  - [x] 1.1 移除原 `pendingSubject` 流式活动面板（插入科目列表下方的渲染分支）
  - [x] 1.2 新增抽屉状态（打开科目 + 收起逻辑），抽屉用绝对定位覆盖在科目区上方、贴窗口底部边缘滑入（CSS transition transform）
  - [x] 1.3 抽屉内居中展示该科目全部学习内容按钮，点击即调用现有 `handleStart(subjectId, activity)` 开始计时并收起
  - [x] 1.4 支持遮罩点击 / 抽屉关闭按钮 / Esc 收起；无学习内容的科目保持直接开始计时，不弹抽屉
  - [x] 1.5 抽屉样式与新版深色玻璃风格一致（slate-900 渐变、圆角、阴影、动画）；确认 380×520 下布局无滚动、无裁切
- [x] Task 2: 展开「全部功能」窗口钳制到显示器工作区 + 模式切换位置防竞态（WidgetApp.tsx）
  - [x] 2.1 `applyMode(true)` 中先取 `currentMonitor()` 工作区（`availableSize`/物理尺寸），目标宽高 = min(1600, 工作区宽) × min(1000, 工作区高)，再 `center()` 展开
  - [x] 2.2 加 `isSwitching` ref，在 `applyMode` 执行期间置位；`onMoved` 回调发现切换中则跳过 `localStorage` 写入，切换完成后复位并恢复持久化
  - [x] 2.3 保持精简模式 `sanitizePosition` 边距校验逻辑不变；确认「精简靠右 → 全功能 → 精简」全流程位置不丢失
- [x] Task 3: 构建验证
  - [x] 3.1 `npm run build:deploy` 通过（TypeScript 类型检查含 widget 代码）
  - [x] 3.2 代码走查：确认无旧流式活动面板残留、onMoved 竞态路径已覆盖

# Task Dependencies
- [Task 2] 不依赖 [Task 1]（不同组件文件，可与 Task 1 并行）
- [Task 3] 依赖 [Task 1] 与 [Task 2]