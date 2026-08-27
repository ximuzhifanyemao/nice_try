import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toggleTheme } from '../lib/theme'
import DesktopLogo from './DesktopLogo'
import { BlueIcons } from './BlueCircleIcon'
import { useState } from 'react'

interface NavItem {
  key: string
  label: string
  iconKey: keyof typeof BlueIcons
  path: string
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: '首页', iconKey: 'home', path: '/' },
  { key: 'timer', label: '计时', iconKey: 'timer', path: '/timer' },
  { key: 'checkin', label: '打卡', iconKey: 'checkin', path: '/english-checkin' },
  { key: 'records', label: '记录', iconKey: 'records', path: '/my-records' },
  { key: 'summary', label: '统计', iconKey: 'summary', path: '/summary' },
  { key: 'vocab', label: '生词', iconKey: 'vocab', path: '/vocabulary' },
  { key: 'achievements', label: '成就', iconKey: 'achievements', path: '/achievements' },
  { key: 'goal', label: '目标', iconKey: 'goal', path: '/goal' },
  { key: 'health', label: '健康', iconKey: 'health', path: '/health' },
  { key: 'profile', label: '我的', iconKey: 'profile', path: '/profile' },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

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
    if (pathname === '/health') return 'health'
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
    <aside className="flex w-48 flex-col bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 h-full shrink-0">
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center justify-start gap-2 px-3 h-11 border-b border-gray-200 dark:border-slate-800 text-sm font-semibold text-gray-700 dark:text-slate-200 shrink-0"
        title="DiveDeep"
      >
        <DesktopLogo size={22} />
        <span className="truncate">DiveDeep</span>
      </Link>

      {/* 导航项 */}
      <nav className="flex-1 overflow-y-auto py-2">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => navigate(item.path)}
            title={item.label}
            className={`flex items-center gap-2 w-full px-3 py-2 text-[13px] text-left transition-all cursor-pointer relative ${
              activeKey === item.key
                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-slate-300 hover:text-slate-900 hover:bg-gray-100 dark:hover:text-slate-100 dark:hover:bg-slate-800/40'
            }`}
          >
            {activeKey === item.key && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r bg-indigo-500" />
            )}
            <span className="shrink-0">{BlueIcons[item.iconKey]}</span>
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* 底部：主题切换 + 登录/登出 */}
      <div className="border-t border-gray-200 dark:border-slate-800 py-2 flex flex-col gap-1 shrink-0">
        <button
          onClick={handleToggleTheme}
          title={isDark ? '亮色' : '暗色'}
          className="flex items-center gap-2 w-full px-3 h-8 rounded-md text-[13px] text-gray-600 dark:text-slate-300 hover:text-slate-900 hover:bg-gray-100 dark:hover:text-slate-100 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
        >
          <span className="shrink-0">{isDark ? BlueIcons.moon : BlueIcons.sun}</span>
          <span>{isDark ? '亮色' : '暗色'}</span>
        </button>
        {user ? (
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 h-8 rounded-md text-[13px] text-red-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <span className="shrink-0">{BlueIcons.logout}</span>
            <span>登出</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full mx-auto px-3 h-8 max-w-[146px] rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-medium transition-colors"
          >
            <span className="shrink-0">{BlueIcons.login}</span>
            <span>登录</span>
          </Link>
        )}
      </div>
    </aside>
  )
}
