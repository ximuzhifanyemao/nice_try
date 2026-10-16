# 简洁模式过渡动画 + 周总结逐日对比 + 全功能页面切换过渡

## 摘要

三部分改动，全部用 CSS keyframes / Tailwind 实现，不引入新依赖：
1. **简洁模式（胶囊条）过渡动画**：窗口尺寸由 Tauri `setSize` 原生控制无法 CSS 过渡（已确认），在内容层做**入场 + 出场**双向动画——展开时面板淡入上滑、收起时先播出场动画再缩窗，配合进度条/红线/状态色的平滑过渡，消除生硬感。
2. **周总结逐日对比**：新增「逐日对比」卡片，上半为周一~周日 7 组双柱图（上周灰柱 vs 本周靛蓝柱，带生长动画），下半为逐日明细行（本周时长 / 上周时长 / 差值箭头），兼顾直观与精确。
3. **全功能模式页面切换过渡**：侧边栏切页时页面内容淡入，避免瞬间闪切（纯 opacity 动画，不影响首页一屏布局）。

## 现状分析

### 简洁模式
- [WidgetApp.tsx](file:///e:/code_app/code-1/code_app/kaoyan-tracker/src/widget/WidgetApp.tsx)：下拉面板与环境光为条件渲染（L419-423、L357-368），瞬间出现瞬间消失；`closeDropdown`（L238-241）立即 `setDropdownOpen(false)` + `closeLayer()` 缩窗，内容无出场动画。容器 `rounded-full ↔ rounded-2xl`（L352-354）无过渡。
- [CapsuleStrip.tsx](file:///e:/code_app/code-1/code_app/kaoyan-tracker/src/widget/CapsuleStrip.tsx)：进度条填充宽度（L240-245）、目标线位置（L250-258）、note 提示（L209-212）、状态标签/计时颜色切换（L166-170、L216-222）均无过渡。
- [SubjectPicker.tsx](file:///e:/code_app/code-1/code_app/kaoyan-tracker/src/widget/SubjectPicker.tsx)：学习内容卡片已有滑入/飞回动画（L159-165），其 `setTimeout(() => onPick(...), 200)`（L190）依赖时序，改动时需保持兼容。
- 项目无动画库；Tailwind v4，keyframes 先例在 [index.css](file:///e:/code_app/code-1/code_app/kaoyan-tracker/src/index.css) L169-180（star-twinkle），Toast 已有 `toastIn` 动画。

### 周总结
- [WeeklySummary.tsx](file:///e:/code_app/code-1/code_app/kaoyan-tracker/src/pages/WeeklySummary.tsx)：`computeWeeklyComparison`（L229）只有周级总量对比，无逐日维度。
- [weeklyReflections.ts](file:///e:/code_app/code-1/code_app/kaoyan-tracker/src/lib/weeklyReflections.ts)：`WeekStat`（L55-65）无每日数据；`computeWeekStat`（L88-105）已有按周过滤的 `active` 日志可顺带聚合。`useLogs()` 数据已覆盖上一周，无需额外请求。
- 图表风格参考 [WeeklyChart.tsx](file:///e:/code_app/code-1/code_app/kaoyan-tracker/src/components/WeeklyChart.tsx)。

### 全功能模式
- [App.tsx](file:///e:/code_app/code-1/code_app/kaoyan-tracker/src/App.tsx) L244-275：`Routes` 直接渲染，路由切换无过渡。首页 `fillHeight` 严格一屏，过渡动画只能用 opacity（transform 位移可能干扰一屏布局）。

## 改动方案

### 1. `src/index.css` — 新增通用 keyframes
追加在现有动画附近：
- `widget-fade-in-up`：opacity 0→1 + translateY(8px)→0，0.22s ease-out（面板入场）
- `widget-fade-out-down`：opacity 1→0 + translateY(0)→(8px)，0.18s ease-in（面板出场）
- `widget-fade-in`：纯淡入 0.2s（环境光、note、目标线）
- `bar-grow`：scaleY(0)→1，origin bottom，0.5s ease-out（周总结双柱）
- `page-fade-in`：opacity 0→1，0.25s ease-out（全功能页面切换）

### 2. 简洁模式动画（`WidgetApp.tsx` + `CapsuleStrip.tsx`）

**WidgetApp.tsx**
- 新增 `dropdownClosing` state：`closeDropdown` 改为先 `setDropdownClosing(true)`（面板挂出场动画类 `animate-[widget-fade-out-down_0.18s_ease-in] forwards`），`setTimeout` 180ms 后再 `setDropdownOpen(false); setDropdownClosing(false); closeLayer()`。`openDropdown` 与 `applyMode`（模式切换）需复位 `dropdownClosing`；`quickStart` 走同一 `closeDropdown` 路径。
  - 兼容 SubjectPicker 的飞回时序：其 200ms 后调 `onPick`，面板出场 180ms + 缩窗，观感连贯；Esc/收起按钮同样走 `closeDropdown`。
- 外层容器（L352）加 `transition-[border-radius] duration-300`。
- 环境光装饰层（L359-367）加 `animate-[widget-fade-in_0.3s_ease-out]`。
- 面板包裹层（L419-423）：入场 `animate-[widget-fade-in-up_0.22s_ease-out]`，`dropdownClosing` 时切换为出场动画类。

**CapsuleStrip.tsx**
- 部分填充段（L241-244）加 `transition-[width] duration-500 ease-out`；整段底色（L236）加 `transition-colors duration-300`。
- 目标线容器（L251-253）加 `transition-[left] duration-500 ease-out`。
- note 提示（L210）加 `animate-[widget-fade-in_0.2s_ease-out]`。
- 状态标签（L166）与计时数字（L216）加 `transition-colors duration-300`。
- 不动任何窗口尺寸逻辑。

### 3. 周总结逐日对比（`weeklyReflections.ts` + `WeeklySummary.tsx`）

**weeklyReflections.ts**
- `WeekStat` 新增 `dailyHours: Record<string, number>`；`computeWeekStat` 遍历 `active` 日志按 `l.date` 累加 `subjects[].hours`（跳过 `deleted_at`，与 `computeSummary` 口径一致）。
- 新增 `DayDiff { dayIndex; thisDate; lastDate; thisHours; lastHours; diff }`；`WeeklyComparison` 新增 `dailyDiffs: DayDiff[]`（7 项，周一~周日，`addDays(parseISO(weekStart), i)` 生成日期，缺省 0，`diff` 保留两位）。

**WeeklySummary.tsx**
- 新增内联组件 `DailyCompareChart({ dailyDiffs, hasLastWeek })`，插在渐变对比卡（L469）与科目对比卡（L471）之间，`card p-5 space-y-3`：
  - 标题「逐日对比 · 本周 vs 上周」+ 图例（灰点=上周，靛蓝点=本周）。
  - 双柱区 `h-32`：`max = Math.max(1, ...全部时长)`，7 组 `flex-1`，每组两柱并排（`w-2.5 rounded-t`，上周 `bg-gray-300 dark:bg-slate-600`，本周 `bg-gradient-to-t from-indigo-500 to-violet-400`），柱高按 `hours/max` 百分比，`animate-[bar-grow_0.5s_ease-out]`；0 时长渲染 2px 占位点；本周柱 >0 时顶部标 `text-[9px]` 时长。
  - 每组底部标签：`周一`~`周日`（今天高亮，参考 WeeklyChart isToday）+ 差值小字（`↑+1.5` 绿 / `↓0.5` 红 / `—` 灰）。
  - 明细区（`border-t` 分隔，7 行）：每行 `M月d日` | 本周 `x.xh` | 上周 `x.xh` | 差值 chip（复用 DiffChip 配色逻辑，`!hasLastWeek` 显示「上周暂无」）。
  - 双周均无数据时随现有 `thisWeekHasNoData` 分支不渲染。
- 复用 `fmtNum`，不新增文件/依赖。

### 4. 全功能页面切换过渡（`App.tsx`）
- 用 `useLocation()` 取 `pathname`，给 `Routes` 外层包一层 `<div key={pathname} className="animate-[page-fade-in_0.25s_ease-out]">`（放在 `ScaleToFit` 内、`Routes` 外），每次切页重新挂载触发淡入。
- 仅 opacity，无 transform，不影响首页 `fillHeight` 一屏布局；移动端同一套 App 同样受益。

## 假设与决策
- 不引入 framer-motion；不动 Tauri `setSize` 逻辑（出场动画用延时卸载实现）。
- 逐日对比按星期对齐（周一对周一）；双柱 + 明细行同时满足直观与精确。
- 全功能整体动画本期只做「页面切换过渡」这一项最高收益改动；倒计时数字、打卡反馈、图表入场等如需要另开任务，避免一次改动面过大。

## 验证
1. `npm run build`（含 `tsc -b`）确认类型无误。
2. `npm run dev` → `/weekly-summary`：
   - 双柱高度比例、差值方向正确；切周次图表更新；上周无数据时仅本周柱、明细显示「上周暂无」；双周无数据时卡片不渲染。
3. `npm run dev` 桌面宽度下侧边栏切页：页面淡入，首页一屏布局不被破坏。
4. 简洁模式需 Tauri 验证：`npm run tauri dev`：
   - 展开：面板淡入上滑、圆角平滑；收起/选科开始：面板先淡出下滑再缩窗，无闪断；
   - 打卡后进度条宽度与红线平滑移动；暂停/继续颜色平滑切换。
5. 深浅色主题各过一遍。
