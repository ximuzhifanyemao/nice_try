# 精简挂件：窗口尺寸统一逻辑单位，修复 408 科目两排与抽屉滚动 Spec

## Why
电脑程序"启动即精简模式"时 408 四门科目横着一排；但从「全部功能」切回「精简」后，408 变成两排、选学习内容还得滚轮。根因是窗口尺寸单位混用：`tauri.conf.json` 的 `width/height` 是逻辑像素（DPI 感知），而代码切换模式时用的是 `PhysicalSize(380×520)`（物理像素）。在高 DPI 缩放下（笔记本 125%/150% 常见），物理 380 对应逻辑仅约 304px，视口变窄导致科目自动换行成两排、抽屉内容溢出需滚动；启动路径按逻辑 380 渲染则是一排。两个入口渲染出的布局不一致。

## What Changes
- **切换模式统一使用逻辑尺寸**：`applyMode` 中精简模式 `setSize` 改用 `LogicalSize(WIDGET_W, WIDGET_H)`（与 config 一致，DPI 无关）；「全部功能」展开分支先把 `currentMonitor()` 的物理尺寸按 `scaleFactor` 换算成逻辑尺寸再钳制，同样用 `LogicalSize` 设置——保证两个入口下窗口实际可见宽度一致，408 科目布局稳定为一排。
- **抽屉加高度兜底**：学习内容抽屉面板增加 `max-h` + `overflow-y-auto`，即使未来学习内容极多也不会把内容挤出窗口需要全局滚动。
- 不改动窗口位置持久化（`onMoved` 物理坐标与 `PhysicalPosition` 恢复在 v1.13.28 已统一，保持不变）。

## Impact
- Affected specs: 桌面挂件（WidgetApp / DesktopTimer）
- Affected code:
  - `src/widget/WidgetApp.tsx`（`setSize` 改用 `LogicalSize`；全功能尺寸钳制换算为逻辑单位）
  - `src/widget/DesktopTimer.tsx`（抽屉加高度上限与内部滚动兜底）
- 无数据库/接口改动，**不涉及 BREAKING**

## ADDED Requirements

### Requirement: 切换模式窗口尺寸按逻辑单位生效
系统在切换精简/全部功能模式时 SHALL 使用逻辑尺寸设置窗口大小（与 `tauri.conf.json` 一致），使同一模式下窗口实际内容宽度与 DPI 无关、两次入口渲染结果一致。

#### Scenario: 全功能切回精简后 408 仍一排
- **WHEN** 用户在高 DPI（125%/150%）环境下从「全部功能」切回「精简计时」
- **THEN** 精简窗口内容宽度与"启动即精简"一致，408 四门科目保持横着一排，无需滚动即可看到全部学习内容
- **AND** 科目按钮、活动抽屉布局与启动路径完全一致

#### Scenario: 全功能展开钳制同样按逻辑单位
- **WHEN** 用户在窄屏点「全部功能」展开
- **THEN** 展开尺寸按显示器逻辑工作区钳制并居中，与精简尺寸单位一致，无窗口溢出

### Requirement: 学习内容抽屉超高兜底
学习内容抽屉 SHALL 有最大高度限制，内容超出时在抽屉内部滚动，不溢出窗口、不遮挡底部按钮。

#### Scenario: 学习内容较多时
- **WHEN** 某科目学习内容按钮较多，抽屉内容高度超过窗口可用空间
- **THEN** 抽屉固定最大高度并在内部出现滚动条，遮罩与关闭按钮仍可用，窗口整体无滚动

## MODIFIED Requirements

### Requirement: 精简模式窗口尺寸
将切换时的 `PhysicalSize` 改为 `LogicalSize`（380×520 与 config 逻辑像素一致），消除 DPI 缩放导致的视口变窄与布局跳变。

## REMOVED Requirements
（无）