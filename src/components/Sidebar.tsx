import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toggleTheme } from '../lib/theme'
import { useState } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'

interface NavItem {
  key: string
  label: string
  icon: string
  path: string
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: '首页', icon: '🏠', path: '/' },
  { key: 'timer', label: '计时', icon: '⏱️', path: '/timer' },
  { key: 'checkin', label: '打卡', icon: '📖', path: '/english-checkin' },
  { key: 'records', label: '记录', icon: '📝', path: '/my-records' },
  { key: 'summary', label: '统计', icon: '📊', path: '/summary' },
  { key: 'vocab', label: '生词', icon: '📕', path: '/vocabulary' },
  { key: 'achievements', label: '成就', icon: '🏆', path: '/achievements' },
  { key: 'goal', label: '目标', icon: '🎯', path: '/goal' },
  { key: 'profile', label: '我的', icon: '👤', path: '/profile' },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  const appWindow = getCurrentWindow()

  const getActiveKey = (): string => {
    const { pathname } = location
    if (pathname === '/') return 'home'
    if (pathname === '/timer') return 'timer'
    if (pathname === '/english-checkin') return 'checkin'
    if (pathname.startsWith('/my-records')) return 'records'
    if (pathname === '/summary') return 'summary'
    if (pathname === '/vocabulary') return 'vocab'
    if (pathname === '/achievements') return 'achievements'
    if (pathname === '/goal') return 'goal'
    return pathname === '/profile' ? 'profile' : ''
  }

  const activeKey = getActiveKey()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const handleToggleTheme = () => {
    const next = toggleTheme()
    setIsDark(next === 'dark')
  }

  const items = user ? NAV_ITEMS : NAV_ITEMS.filter((i) => i.key === 'home' || i.key === 'profile')

  return (
    <aside className="flex w-14 flex-col bg-slate-900 border-r border-slate-800 h-full shrink-0">
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center justify-center h-11 border-b border-slate-800 text-base shrink-0"
        title="大学深埋"
      >
        📚
      </Link>

      {/* 导航项 */}
      <nav className="flex-1 overflow-y-auto py-2">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => navigate(item.path)}
            title={item.label}
            className={`flex flex-col items-center justify-center w-full py-2 px-1 text-[10px] transition-all cursor-pointer relative ${
              activeKey === item.key
                ? 'text-indigo-400 bg-slate-800/50'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            {activeKey === item.key && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-indigo-400" />
            )}
            <span className="text-sm leading-none">{item.icon}</span>
            <span className="mt-0.5">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* 底部：主题切换 + 登录/登出 + 关闭 */}
      <div className="border-t border-slate-800 py-2 flex flex-col items-center gap-1 shrink-0">
        <button
          onClick={handleToggleTheme}
          title={isDark ? '亮色' : '暗色'}
          className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer text-xs"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
        {user ? (
          <button
            onClick={handleSignOut}
            title="登出"
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-red-400 hover:bg-slate-800/50 transition-colors cursor-pointer text-xs"
          >
            🚪
          </button>
        ) : (
          <Link
            to="/login"
            title="登录"
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-indigo-400 hover:bg-slate-800/50 transition-colors text-xs"
          >
            🔑
          </Link>
        )}
        <button
          onClick={() => appWindow.close()}
          title="关闭"
          className="w-7 h-7 flex items-center justify-center rounded-md text-slate-600 hover:text-red-400 hover:bg-slate-800/50 transition-colors cursor-pointer text-xs"
        >
          ✕
        </button>
      </div>
    </aside>
  )
}
