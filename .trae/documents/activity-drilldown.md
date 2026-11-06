# 学习内容逐级展开（科目 → 分支 → 内容）实施计划

## 摘要

把「学习内容」的选择交互从「所有分支一次性铺开」改为三级逐层下钻：

```
数学                      ← 首层只看到：套卷、高数、线代
 ├ 高数  → 听课、练习、复盘   ← 点击分支后才看到其内容
 ├ 线代  → 听课、练习、复盘
 └ 套卷  → 直接开始计时（顶层内容）
```

生效范围：全功能计时页（`/timer`）+ 简洁模式胶囊条下拉。数据模型不变（仍是 `高数/听课` 这样的路径字符串），只改渲染与交互状态；打卡记录表、周报、日历等展示层已用 `formatActivityLabel` 显示为「数学 · 高数 · 听课」，无需改动。

## 现状分析

- 数据层 [subjects.ts](file:///e:/code_app/code-1/code_app/kaoyan-tracker/src/lib/subjects.ts#L336-L427)：`getActivityTreeForSubject(subjectId)` 已返回 `{ groups, leaves }`——`groups` 是按首段归类的分支（高数、线代），`leaves` 是不含 `/` 的顶层内容（如你现有的「套卷」）。**这一层不需要改。**
- 全功能计时页 [StudyTimer.tsx](file:///e:/code_app/code-1/code_app/kaoyan-tracker/src/components/StudyTimer.tsx#L1036-L1093)：面板里用 `actTree.groups.map(...)` 把所有分支和内容一次性铺开；缺少「当前选中分支」状态。
- 简洁模式下拉 [SubjectPicker.tsx](file:///e:/code_app/code-1/code_app/kaoyan-tracker/src/widget/SubjectPicker.tsx#L380-L417)：同样把所有分支平铺在底部卡片里；`Esc` 只区分「有科目选择」和「关闭」两级。
- 下拉窗口高度 [WidgetApp.tsx](file:///e:/code_app/code-1/code_app/kaoyan-tracker/src/widget/WidgetApp.tsx#L388-L449)：由 `ResizeObserver` 观察 `contentRef` 内容块自动加高/回落，下钻导致内容变矮时窗口会自动收缩，**无需改动**。
- 编辑器 [ActivityTreeEditor.tsx](file:///e:/code_app/code-1/code_app/kaoyan-tracker/src/components/ActivityTreeEditor.tsx)：保持「学习内容清单 + 分支勾选」矩阵模型（已确认）。该模型支持让「套卷」成为分支并只勾选「练习 / 复盘」。
- 打卡记录表单 [LogForm.tsx](file:///e:/code_app/code-1/code_app/kaoyan-tracker/src/components/LogForm.tsx#L223-L241)：是多选表单，逐级下钻会破坏多选体验；**保持现状**（已按分支分行展示）。

## 变更方案

### 1. `src/components/StudyTimer.tsx`（全功能计时页）

**新增状态**（在 `pendingSubject` 附近，约 L200）：

```ts
/** 已展开的分支名（如「高数」）；null = 还停在首层的分支列表 */
const [pendingGroup, setPendingGroup] = useState<string | null>(null)
```

**重置逻辑**：在 `useEffect` 中监听 `pendingSubject` / `pomoPendingSubject`，任一变化即 `setPendingGroup(null)`；这样切换科目、点「取消」、切换正计时/番茄钟后都回到首层，不需要在每个分支里散落 `setPendingGroup(null)`。

**面板重写**（L1036-L1093 的 IIFE）：
- 取 `tree = getActivityTreeForSubject(actSubjectId)`。
- `tree.groups.length === 0` → 维持现有平铺 chips（英语这类无分支科目，行为零变化）。
- 有分支且 `pendingGroup` 为空 → **首层**：
  - 头部保持「科目名 · 选择学习内容」+「取消」。
  - 用一个 `grid grid-cols-2 gap-1.5` 同时渲染「分支格子」和「顶层内容格子」：
    - 分支格子：`{分支名}` + 右侧 `{n} 项` + chevron 图标，点击 `setPendingGroup(g.name)`。
    - 顶层内容格子（`tree.leaves`）：只显示名称，点击直接 `handleStart(subjectId, leaf)`（番茄钟模式则 `startPomodoro`），风格略淡以区分「可直接开始」。
  - 顺序：分支在前，顶层内容在后（与用户期望的「套卷、高数、线代」同层可见一致）。
- 有分支且 `pendingGroup` 命中 → **第二层**：
  - 头部改为「科目名 · 高数 · 选择学习内容」，右侧按钮从「取消」换成「返回」（点击仅 `setPendingGroup(null)`）。
  - chips 只渲染该分支的 `g.activities`，点击 `handleStart(subjectId, buildActivityPath(g.name, a))` / `startPomodoro(...)`。
  - 若 `pendingGroup` 已不在 `tree.groups` 中（编辑后分支被删），回落到首层。

**样式**：沿用面板现有的 indigo 浅底容器与 chip 样式；分支格子加 `border` + chevron，顶层内容格子不加 chevron。

### 2. `src/widget/SubjectPicker.tsx`（简洁模式下拉）

**新增状态**（`pendingSubject` 附近，L50）：

```ts
const [pendingGroup, setPendingGroup] = useState<string | null>(null)
```

**交互**：
- 点科目（L128）：`setPendingGroup(null)` 后再 `setPendingSubject(subj.id)`。
- 底部卡片内部改为与全功能页一致的逻辑：首层 = 分支行 + 顶层内容；点分支进入第二层，点顶层内容直接 `onPick(pendingSubject, leaf, mode)`（沿用 200ms `leaving` 飞回动画）。
- 第二层头部：「科目名 · 高数」+「返回」按钮（仅退出分支，不关闭下拉）。
- 卡片内首层用 `grid grid-cols-2 gap-1`（分支行中性底 + chevron + 项数，顶层内容用现有 chip 风格），第二层用现有 wrap chips。
- `Esc`（L109-L120）改为三级：`pendingGroup` → 清分支；否则 `pendingSubject` → 回科目列表；否则 `onClose()`。依赖数组补 `pendingGroup`。
- 分支格子点击**不**触发 `leaving` 动画（只有最终选中内容才飞回收起）。
- 窗口高度：内容块仍在 `contentRef` 内，`ResizeObserver` 自动适配合适高度，无需改动 `WidgetApp.tsx`。

### 3. `src/components/ActivityTreeEditor.tsx`（仅文案）

底部说明文字改为清楚描述两种用法：
「分支可以是「高数」「线代」，也可以是「套卷」；每个分支自己勾选包含的内容。计时时先看到分支名，点进去才看到该分支的内容；不在任何分支里的内容会直接出现在首层，点了立即开始。」

不改任何逻辑（已确认保留矩阵式编辑器）。

### 4. `src/dev/preview.tsx`（验证用假数据）

给 `s-math-branch`（数学(分层)）追加一个顶层内容 `'套卷'`，使首层恰好是「高数、线代、套卷」三种格子混排，用于截图核对；同时它仍保留 4 项 × 2 分支的内容，验证第二层。

## 假设与决策

- **首层格子构成**（已确认）：分支名 + 未分层的顶层内容都算首层格子；顶层内容点击直接开始计时。
- **套卷作为分支**：若希望点「套卷」后还能选「练习 / 复盘」，在编辑器中把「套卷」建成一个分支并只勾选这两项；本次不做自动迁移（用户现有数据里「套卷」是顶层内容，点了会直接开始计时）。
- **编辑器保持不变**（已确认）。
- **范围**：全功能计时页 + 简洁模式下拉（已确认）；打卡记录表单维持分支分行展示。
- **数据格式不变**：仍存 `高数/听课` 路径，云端 `user_subjects.activities` 与 `daily_logs.subjects[].activity` 无需迁移。
- **分支格子只能进入、不能直接开始**：分支至少有一项内容（编辑器不会产生空内容分支），因此不需要「空分支直接计时」的兜底分支。

## 验证

1. `npx tsc -b --pretty false` 与 `npx oxlint`（无新增 error/warning）。
2. 预览台截图（`npm run dev` + `node scripts/dev/shot.mjs`）：
   - 简洁模式下拉 `preview.html?preview=1&view=dropdown`：点「数学(分层)」后首层只有 `高数 / 线代 / 套卷` 三种格子；点「高数」后只显示 4 项内容；`Esc` 逐级返回；窗口高度随内容变化。
   - 全功能页 `preview.html?preview=1&view=full#/timer`：点左侧「数学(分层)」→ 首层三格 → 点「高数」→ 四项内容 → 点内容开始计时；「返回」回到首层。
   - 无分支科目（英语）点开后行为与现状一致（直接列出 单词/阅读/长难句）。
3. 回归检查：番茄钟模式下同一套下钻逻辑可用；铸铁后的计时标题、胶囊条显示仍为「数学 · 高数 · 听课」。
4. 完成后重新执行 `npm run build:desktop` 出包（需在非沙箱环境加载 MSVC 环境变量）。
