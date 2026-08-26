# 桌面挂件与扫码体验打磨 Spec

## Why
桌面端挂件有 5 处问题影响使用：登录会报「Auth session missing!」、手机扫码需手动拍照、展开「全部功能」后窗口太小日历被截断、侧边栏在浅色模式下观感别扭且登录/登出入口不明显、精简模式窗口可被随意缩放导致下次错位且样式简陋。

## What Changes
- 修复桌面端登录（扫码 + 账号密码）报「Auth session missing!」，登录态可持久化，重启不丢失
- 手机扫码页改为像微信一样的**连续实时扫码**，无需每次手动拍照；保留「拍照识别」作为兜底
- 增大“全部功能”展开窗口尺寸，并解除内容垂直裁切，确保日历等页面完整展示或可滚动
- 重新设计侧边栏：图标+文字导航、颜色跟随亮/暗主题、突出登录/登出与主题切换入口
- 精简模式：固定窗口尺寸（禁止手动缩放）、记忆窗口位置避免错位、优化挂件样式

## Impact
- Affected specs: 登录扫码（qrLogin、Login、ScanQr、QrLogin）、桌面挂件（WidgetApp、Sidebar、DesktopTimer）
- Affected code: `src/widget/WidgetApp.tsx`、`src/widget/DesktopTimer.tsx`、`src/components/Sidebar.tsx`、`src/pages/ScanQr.tsx`、`src/lib/qrLogin.ts`、`src-tauri/tauri.conf.json`；若引入原生扫码插件，涉及 `android/` 与 `package.json`
- **BREAKING**: 手机端若引入原生扫码插件，需 `npx cap sync android` 并重新打包 APK；桌面端需重新 `npm run tauri build`

## ADDED Requirements

### Requirement: 桌面端登录稳定成功
系统 SHALL 保证电脑端扫码登录和账号密码登录均成功，不再返回「Auth session missing!」，并在应用重启后仍保持登录态。

#### Scenario: 扫码登录成功
- **WHEN** 用户在桌面端发起扫码登录并用手机确认
- **THEN** 桌面端完成会话建立并进入已登录状态，无「Auth session missing!」错误，重启后仍为已登录

#### Scenario: 账号密码登录成功
- **WHEN** 用户在桌面端「全部功能」页用账号密码登录
- **THEN** 登录成功并持久化，重启后不失效

### Requirement: 连续实时扫码
系统 SHALL 在手机端提供类似微信的连续实时扫码，自动识别二维码并确认登录，无需每次手动拍照。

#### Scenario: 连续扫码
- **WHEN** 用户打开扫码页并授权相机
- **THEN** 摄像头取景持续运行，对准二维码自动识别并确认，成功后进入确认成功页
- **AND** 若无实时摄像头能力，提供「拍照识别」作为兜底，二者均可完成登录确认

### Requirement: 展开窗口尺寸与完整展示
系统 SHALL 在桌面端展开「全部功能」时使用足够大的窗口，并确保页面内容（含日历）完整呈现或滚动可见，不再被裁切。

#### Scenario: 展开全部功能
- **WHEN** 用户点击「全部功能」展开
- **THEN** 窗口放大到可完整显示日历等主要内容，内容可滚动，无黑屏/裁切

## MODIFIED Requirements

### Requirement: 桌面端侧边栏
系统 SHALL 重新设计桌面端侧边栏：采用图标+文字导航（替代仅图标的窄栏），颜色跟随亮/暗主题（浅色模式不再黑底突兀），并在底部醒目地提供登录/登出入口与主题切换。

### Requirement: 精简模式挂件
系统 SHALL 将精简模式窗口设为固定尺寸（禁止手动缩放），记忆窗口位置避免下次错位，并优化挂件视觉样式。

## REMOVED Requirements
（无）