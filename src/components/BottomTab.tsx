import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon, type IconName } from './Icon'

interface TabItem {
  key: string
  label: string
  icon: IconName
  path: string
}

export default function BottomTab() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const allTabs: TabItem[] = [
    { key: 'home', label: '首页', icon: 'home', path: '/' },
    { key: 'checkin', label: '打卡', icon: 'book', path: '/english-checkin' },
    { key: 'records', label: '记录', icon: 'pencil', path: '/my-records' },
    { key: 'timer', label: '计时', icon: 'clock', path: '/timer' },
    { key: 'summary', label: '统计', icon: 'chart', path: '/summary' },
    { key: 'health', label: '健康', icon: 'activity', path: '/health' },
    { key: 'profile', label: user ? '我的' : '登录', icon: 'user', path: user ? '/profile' : '/login' },
  ]
  // 未登录时只显示首页和登录，隐藏需要登录的功能入口
  const tabs = user ? allTabs : allTabs.filter((t) => t.key === 'home' || t.key === 'profile')

  const getActiveKey = (): string => {
    const { pathname } = location
    if (pathname === '/') return 'home'
    if (pathname === '/english-checkin') return 'checkin'
    if (pathname === '/my-records' || pathname === '/my-records/new' || /^\/my-records\/[^/]+\/edit$/.test(pathname)) return 'records'
    if (pathname === '/timer') return 'timer'
    if (pathname === '/summary') return 'summary'
    if (pathname === '/health') return 'health'
    return 'profile'
  }

  const activeKey = getActiveKey()

  return (
    <nav className="flex sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/70 bg-white/90 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/90 pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab) => {
        const active = activeKey === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            aria-current={active ? 'page' : undefined}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors cursor-pointer ${
              active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
            }`}
          >
            <span
              className={`flex items-center justify-center rounded-full transition-all duration-200 ${
                active
                  ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 w-10 h-6 shadow-sm shadow-indigo-200/60 dark:shadow-none'
                  : 'w-6 h-6'
              }`}
            >
              <Icon name={tab.icon} size={active ? 17 : 18} strokeWidth={active ? 2.1 : 1.8} />
            </span>
            <span className={active ? 'font-semibold' : 'font-medium'}>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}