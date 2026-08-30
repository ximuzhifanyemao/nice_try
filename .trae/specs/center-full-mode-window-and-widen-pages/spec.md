# 全功能模式：页面宽度适配减少留白 + 展开窗口显式居中 Spec

## Why
电脑版「全部功能」窗口较宽（1600 或钳制后的大尺寸），但除首页外的页面根容器仍按 `max-w-2xl/3xl/4xl` 限制（为移动/网页设计的窄容器），两侧留白过多、内容区细长，体验差；另外当精简窗口停在屏幕右上角时点「全部功能」展开，窗口尺寸变大后仍以原位置为锚点，一半窗口伸出桌面，用户得手动拖回（现有 `center()` 在这条路径下不可靠）。

## What Changes
- **新增"宽页面"布局上下文**：扩展首页已用的 `HomeLayoutContext`，增加 `wide` 标志（`forceTwoCol` 时 `wide=true`）；「全部功能」模式下非首页页面根容器在 `wide` 时放开宽度限制（max-w 上限放宽到如 1280px，`max-w-[1280px]`），内容随窗口自适应，消灭两侧过多留白；网页/移动端维持现有窄容器不变。
- **展开窗口显式居中**：`applyMode(true)` 由"`setSize` 后依赖 `center()`"改为**自行计算窗口中心**：用 `currentMonitor()` 的 `position` + `size`（物理像素）算出显示器中心，再按目标窗口物理宽高（逻辑尺寸 × scaleFactor）反推左上角，用 `PhysicalPosition` 显式 `setPosition`，保证展开后窗口始终以显示器中心对齐、完整落在屏幕内；`center()` 保留作兜底。
- 精简模式（`applyMode(false)`）的尺寸/位置恢复逻辑、v1.13.28 的 `PhysicalPosition` 恢复、`sanitizePosition` 校验等保持不变。

## Impact
- Affected specs: 桌面布局（App/WidgetApp）、全部功能页面宽度
- Affected code:
  - `src/App.tsx`（`HomeLayoutContext` 增加 `wide`，向非首页页面透传）
  - `src/pages/MyRecords.tsx`、`Summary.tsx`、`Settings.tsx`、`Profile.tsx`、`Health.tsx`、`Achievements.tsx`、`GoalPage.tsx`、`EnglishCheckin.tsx`、`VocabularyBook.tsx`、`Trash.tsx`、`NewRecord.tsx`、`EditRecord.tsx`、`TimerPage.tsx`（根容器按 `wide` 放宽宽度）
  - `src/widget/WidgetApp.tsx`（`applyMode(true)` 显式居中）
- 无数据库/接口改动，**不涉及 BREAKING**

## ADDED Requirements

### Requirement: 全功能模式下页面宽度自适应
系统在「全部功能」窗口下除首页外的页面 SHALL 放宽内容宽度上限，使内容随窗口宽度自适应扩展，大幅减少左右留白。

#### Scenario: 展开全功能后查看记录/统计
- **WHEN** 用户展开「全部功能」并进入「记录」「统计」「设置」「健康」等任一页面
- **THEN** 页面内容宽度扩展至接近窗口宽度（上限约 1280px），左右不再出现大段空白，内容区利用率明显提升
- **AND** 普通网页/移动端浏览时保持原有窄容器宽度，不受影响

### Requirement: 「全部功能」展开窗口显式居中
系统在从精简切到「全部功能」时 SHALL 将窗口按显示器中心对齐展开，无论精简窗口当前停在哪（如右上角），展开后窗口完整可见且居中。

#### Scenario: 精简窗口在右上角时展开
- **WHEN** 用户把精简窗口拖到屏幕右上角后点击「全部功能」
- **THEN** 展开后的窗口以显示器中心对称放置，整窗完整落在屏幕内，无需手动拖动
- **AND** 宽屏/窄屏（钳制尺寸）下均居中，显示器切换或副屏断开时不会跑出桌面

## MODIFIED Requirements

### Requirement: 全部功能展开位置
将依赖 `center()` 的展开逻辑改为基于 `currentMonitor().position/size` 显式计算并 `setPosition` 居中（含钳制尺寸换算），确保与 DPI、显示器坐标系无关地居中。

## REMOVED Requirements
（无）