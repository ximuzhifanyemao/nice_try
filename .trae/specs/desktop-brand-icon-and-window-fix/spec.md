# 桌面品牌图标统一与窗口修复 Spec

## Why
品牌已统一为 DiveDeep 后仍有 4 处不一致影响使用体验：桌面应用左侧 Logo 是 CSS 绘制的近似图形而非应用真实图标、分发 APK 文件名仍是旧名 `kaoyan-tracker.apk`、桌面最小化按钮因缺少权限完全不生效、展开「全部功能」后窗口可被随意缩放/拖动且日历仍无法整屏完整显示。

## What Changes
- 桌面应用内所有品牌 Logo 展示位（侧边栏、全功能标题栏、精简标题栏）改用**电脑应用真实图标图片**，不再用 CSS 渐变近似图形
- 分发 APK 文件名改为 `DiveDeep.apk`，OTA 存储名与 GitHub Release 资产名同步更新
- 修复桌面最小化按钮：在 Tauri 能力配置中补上 `core:window:allow-minimize` 权限
- 「全部功能」窗口固定尺寸、不可缩放、不可拖动；精简挂件保持可拖动+记忆位置不变
- 「全部功能」窗口尺寸/首页布局调整，使首页含日历的内容**整屏完整显示、无需滚动**

## Impact
- Affected specs: 桌面挂件（WidgetApp）、侧边栏（Sidebar）、品牌 Logo（Logo）、OTA/Release 发布脚本、Tauri 能力配置
- Affected code: `src/widget/WidgetApp.tsx`、`src/components/Sidebar.tsx`、`src/components/Logo.tsx`、`src/components/Navbar.tsx`（如需）、`src-tauri/capabilities/default.json`、`scripts/upload-ota.mjs`、`scripts/upload-release.mjs`、`src/pages/Home.tsx` 与 `src/components/Calendar.tsx`/`Countdown.tsx`（如需调布局）、`apk/` 产物路径
- 发布相关：版本号同步（package.json / build.gradle / tauri.conf.json），全链路发布（Web / APK / OTA / GitHub Release / 桌面 MSI+NSIS）

## ADDED Requirements

### Requirement: 桌面端 Logo 使用应用真实图标
系统 SHALL 让桌面应用内所有品牌 Logo 展示位（侧边栏顶部、全功能窗口标题栏、精简挂件标题栏）显示与电脑应用自身图标一致的图标图片，而非 CSS 绘制的近似图形。

#### Scenario: 桌面应用内图标统一
- **WHEN** 用户打开 DiveDeep 桌面应用（精简挂件或展开全部功能）
- **THEN** 侧边栏顶部与两个标题栏左侧均显示与电脑应用安装图标（exe/ico）一致的 DiveDeep 图标图片

### Requirement: APK 分发文件名为 DiveDeep
系统 SHALL 以 `DiveDeep.apk` 作为分发文件名：本地产物、Supabase OTA 存储对象、GitHub Release 资产均使用该名称。

#### Scenario: OTA 与 Release 以 DiveDeep.apk 发布
- **WHEN** 执行全链路发布
- **THEN** 本地 `apk/DiveDeep.apk` 上传到 OTA 存储（对象名 `DiveDeep.apk`）并以 `DiveDeep.apk` 挂到 GitHub Release，下载链接指向该文件

### Requirement: 桌面最小化按钮生效
系统 SHALL 使桌面端「全功能」与「精简」标题栏的最小化按钮可正常将窗口最小化到任务栏。

#### Scenario: 点击最小化
- **WHEN** 用户点击桌面端任意标题栏的「─」最小化按钮
- **THEN** 应用窗口最小化到任务栏，无报错、无静默失效

### Requirement: 全部功能窗口固定且首页整屏完整展示
系统 SHALL 让「全部功能」窗口为固定尺寸（不可缩放、不可拖动），并在该固定尺寸下使首页（含日历）内容整屏完整显示，无需滚动。

#### Scenario: 展开全部功能
- **WHEN** 用户在精简挂件点击「全部功能」展开
- **THEN** 窗口切换到固定尺寸（不可手动缩放、标题栏不可拖动移动），首页倒计时、统计卡、英语打卡入口与日历整屏完整可见，无需滚动即可看到完整日历

#### Scenario: 返回精简挂件
- **WHEN** 用户点击「精简计时」返回
- **THEN** 窗口恢复精简尺寸，仍可拖动移动并记忆位置（与现状一致）

## MODIFIED Requirements
（无）

## REMOVED Requirements
（无）
