import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { isTauri } from '@tauri-apps/api/core'
import App from './App.tsx'
import WidgetApp from './widget/WidgetApp'
import Sidebar from './components/Sidebar'
import DesktopLogo from './components/DesktopLogo'
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

/** 视口宽度媒体查询，与 Tailwind 的 sm 断点（min-width: 640px）保持一致 */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', onChange)
    setMatches(mql.matches)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/**
 * 网站桌面端布局：与电脑程序（Tauri「全部功能」模式）一致的「顶栏 + 左侧边栏」布局。
 * 顶部栏不含窗口控制按钮，用「网页版」标识；内容区按高度自适应、首页双栏单屏。
 */
function WebDesktopLayout() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-gray-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-slate-800 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <DesktopLogo size={22} />
          <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">DiveDeep</span>
        </div>
        <span className="text-xs text-gray-400 dark:text-slate-600">网页版</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <App hideBottomTab hideNavbar sidebar={<Sidebar />} fillHeight forceTwoCol />
      </div>
    </div>
  )
}

/** 网站根组件：宽屏用电脑程序同款侧边栏布局，窄屏（手机/App）保留底部 Tab 移动布局 */
function WebRoot() {
  const isDesktop = useMediaQuery('(min-width: 640px)')
  return isDesktop ? <WebDesktopLayout /> : <App />
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
      <WebRoot />
    </StrictMode>,
  )
}
