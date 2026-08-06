import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
