# Tasks

- [x] Task 1: 展开「全部功能」时窗口显式居中（WidgetApp.tsx）
  - [x] 1.1 `applyMode(true)` 中在计算逻辑宽高 w/h 后，读取 `currentMonitor()`（失败兜底）：用 `monitor.position + monitor.size/2` 求显示器物理中心，目标窗口物理宽高 = 逻辑 w/h × `monitor.scaleFactor || 1`，算出左上角物理坐标，`await appWindow.setPosition(new PhysicalPosition(cx - wPhys/2, cy - hPhys/2))`
  - [x] 1.2 保留 `setResizable(true) → setSize(LogicalSize(w,h)) → setResizable(false) → setAlwaysOnTop(false)` 顺序不变；`setPosition` 在 `setSize` 之后调用；`center()` 保留作异常兜底
  - [x] 1.3 不改变 `applyMode(false)` 精简分支、`sanitizePosition`、`switchingRef`、`PhysicalPosition` 恢复逻辑
- [x] Task 2: 全功能模式页面宽度自适应（App.tsx + 各页面）
  - [x] 2.1 `src/App.tsx`：`HomeLayoutContext` 值扩展为 `{ twoCol, wide }`，`forceTwoCol` 时两者均为 true；默认 `{ twoCol:false, wide:false }`
  - [x] 2.2 首页 `Home.tsx` 解构保持兼容（`const { twoCol } = ...` 不受影响）
  - [x] 2.3 新建或复用一个小工具（如 `useWideLayout()`，从 `useContext(HomeLayoutContext)` 返回 `wide`），供页面读取
  - [x] 2.4 将以下页面根容器由固定 `max-w-*` 改为条件类：`wide ? 'max-w-[1280px]' : 原值`（保留 `mx-auto px-4 py-4` 等其余类不变）：
      MyRecords.tsx（max-w-3xl）、Summary.tsx（max-w-4xl）、Settings.tsx（max-w-2xl）、Profile.tsx（max-w-3xl）、Health.tsx、Achievements.tsx（max-w-4xl）、GoalPage.tsx（max-w-3xl）、EnglishCheckin.tsx、VocabularyBook.tsx、Trash.tsx（max-w-3xl）、NewRecord.tsx、EditRecord.tsx、TimerPage.tsx（max-w-2xl）
  - [x] 2.5 确认移动端/网页普通模式（wide=false）下各页面宽度与现状完全一致，无回归
- [x] Task 3: 构建验证与走查
  - [x] 3.1 `npm run build:deploy` 通过
  - [x] 3.2 代码走查：`setPosition` 居中公式正确（物理单位一致）；所有改动页面均正确处理 wide 分支；HomeLayoutContext 默认值与消费方兼容

# Task Dependencies
- [Task 1] 独立于 [Task 2]（不同文件）
- [Task 3] 依赖 [Task 1] 与 [Task 2]