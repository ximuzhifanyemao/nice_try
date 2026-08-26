import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { isTauri } from '@tauri-apps/api/core'
import App from './App.tsx'
import WidgetApp from './widget/WidgetApp'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './lib/Toast'
import { applyTheme, getInitialTheme } from './lib/theme'

// 在首帧渲染前应用主题，避免闪烁（HTML <head> 内联脚本会在 index.html 兜底）
applyTheme(getInitialTheme())

// 清理 PWA 时代残留的 Service Worker 与缓存，避免旧版页面被缓存拦截导致更新后仍显示旧内容
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister())
  })
}
if ('caches' in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => caches.delete(key))
  })
}

// Tauri 桌面版：渲染置顶计时小挂件；浏览器/移动端：渲染完整应用
if (isTauri()) {
  // 挂件固定深色风格，强制添加 dark class
  document.documentElement.classList.add('dark')
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ToastProvider>
        <AuthProvider>
          <WidgetApp />
        </AuthProvider>
      </ToastProvider>
    </StrictMode>,
  )
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
