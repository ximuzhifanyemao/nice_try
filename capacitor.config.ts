import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.kaoyan.tracker',
  appName: '考研追踪',
  webDir: 'dist',
  android: {
    backgroundColor: '#ffffffff',
    allowMixedContent: false,
  },
  plugins: {
    // AI 请求走原生网络栈，绕开 WebView fetch 在部分 ROM 上的崩溃/黑屏
    CapacitorHttp: {
      enabled: true,
    },
    LocalNotifications: {
      // 计时到点提醒使用本地通知（无需服务器推送）
      smallIcon: 'ic_stat_icon',
      iconColor: '#3b82f6',
    },
  },
}

export default config
