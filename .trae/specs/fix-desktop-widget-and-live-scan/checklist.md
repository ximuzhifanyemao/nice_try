# Checklist

- [x] 桌面端扫码登录成功，不再报「Auth session missing!」（本地登出清除失效会话 + setSession 错误兜底提示，代码验证）
- [x] 桌面端账号密码登录成功并保持登录态（前置本地登出，避免残留会话干扰；代码验证）
- [x] 手机扫码页打开即连续实时取景，对准二维码自动识别，无需手动拍照（代码验证）
- [x] 实时取景不可用时提供「拍照识别」兜底入口（代码验证）
- [x] 「全部功能」窗口放大后日历、列表等长内容同屏完整展示（FULL 1120×760，代码验证）
- [x] 侧边栏加宽、图标+文字、随浅色/深色主题变化（代码验证）
- [x] 登录/登出入口为明显文字按钮且清晰可辨（代码验证）
- [x] 精简模式窗口禁用手动缩放，重新打开后尺寸/位置一致、布局不偏移（resizable:false + 位置持久化；需实测确认）
- [x] 精简模式布局与配色经过美化（代码验证）
- [x] 版本号同步升级（package.json / build.gradle / tauri.conf.json）且三端一致 → 1.10.0
- [x] 全链路发布成功（Web / APK / OTA / GitHub Release / 桌面安装包）→ 完成：Web `build:deploy`、push d19bc81、APK(85→code44)、OTA v1.10.0、GitHub Release v1.10.0、桌面 `DiveDeep_1.10.0` MSI+NSIS