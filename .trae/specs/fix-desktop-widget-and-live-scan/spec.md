# 桌面挂件与手机扫码体验修复 Spec

## Why
桌面版（Tauri 挂件）与手机扫码在真实使用中出现多处问题：桌面端登录报「Auth session missing!」、手机扫码需手动拍照、'全部功能'窗口过小、侧边栏与登录/登出 UI 在浅色模式下别扭、精简模式窗口可被拖拽/改变大小导致下次打开错位。这些直接影响每日计时与登录体验。

## What Changes
- **修复桌面端登录失败**：清除失效/过期的 Supabase session 干扰，让扫码登录与账号密码登录都能建立并持久化有效会话，不再报「Auth session missing!」。
- **手机扫码改为实时取景（类微信）**：入口进入即连续识别二维码，无需手动按拍照；拍照识别降级为兜底方案。
- **放大「全部功能」窗口**：扩展宽度/高度，保证日历、列表等同屏完整展示。
- **重设桌面侧边栏与登录/登出 UI**：侧边栏加宽并随主题切换浅色/深色，登录/登出入口更明显。
- **固定精简模式窗口**：禁止手动缩放、保存并恢复窗口位置与尺寸，下次打开保持一致，并美化精简模式布局。

## Impact
- 受影响规范：桌面挂件（DesktopTimer/WidgetApp/Sidebar）、扫码登录（ScanQr/qrLogin）
- 受影响代码：
  - `src/lib/supabase.ts`、`src/contexts/AuthContext.tsx`、`src/widget/DesktopTimer.tsx`（登录会话）
  - `src/pages/ScanQr.tsx`、`src/lib/qrLogin.ts`（手机实时扫码）
  - `src/widget/WidgetApp.tsx`、`src/components/Sidebar.tsx`（桌面 UI 与窗口尺寸/位置）
  - `src-tauri/tauri.conf.json`、`src-tauri/src/lib.rs`（窗口 resizable/尺寸/位置持久化）
  - `android/app/src/main/AndroidManifest.xml`、可能新增原生扫码插件（手机实时取景）

## ADDED Requirements
### Requirement: 桌面端登录会话建立
系统在桌面端登录时 SHALL 清除客户端中已失效/过期的会话，使扫码登录与账号密码登录均能成功建立并持久化有效会话。

#### Scenario: 扫码登录成功
- **WHEN** 用户在桌面挂件的登录区点击「扫码」，用手机扫码并在确认页确认
- **THEN** 桌面端提示登录成功，界面显示已登录状态，不再出现「Auth session missing!」

#### Scenario: 账号密码登录成功
- **WHEN** 用户在桌面挂件点击「账号密码」，输入正确的邮箱密码
- **THEN** 登录成功并保持登录态，无报错

### Requirement: 手机实时扫码取景
系统手机端扫码页 SHALL 在打开后直接进入连续取景识别，对准二维码即自动识别，无需手动按「拍照」。

#### Scenario: 实时识别登录二维码
- **WHEN** 用户打开扫码页并对准电脑屏幕上的二维码
- **THEN** 自动识别并跳转确认登录，全程无手动拍照动作

#### Scenario: 实时取景不可用的降级
- **WHEN** 当前设备 WebView 无法启动实时相机
- **THEN** 页面保留“拍照识别”作为兜底入口，并给出清晰引导

### Requirement: 桌面侧边栏随主题并突出登录/登出
桌面「全部功能」模式侧边栏 SHALL 加宽、展示图标+文字、随浅色/深色主题变化，并把登录/登出入口放到明显位置。

#### Scenario: 浅色模式下查看侧边栏
- **WHEN** 桌面端使用浅色主题并展开「全部功能」
- **THEN** 侧边栏为浅色样式、图标与文字清晰可读，登录/登出按钮有明确文字标签

### Requirement: 精简模式窗口尺寸稳定
精简模式下窗口 SHALL 禁止用户手动缩放，并保存/恢复窗口位置与尺寸，保证下次打开布局一致。

#### Scenario: 重新打开挂件
- **WHEN** 用户关闭并重新打开精简模式挂件
- **THEN** 窗口尺寸与位置与上次一致，不因手动拖动/缩放而错位

## MODIFIED Requirements
### Requirement: 「全部功能」窗口尺寸
原窗口尺寸过小导致日历展示不全，改为足够容纳完整内容的更大尺寸（横向与纵向增加），并保证缩放后内容自适应。

## REMOVED Requirements
无