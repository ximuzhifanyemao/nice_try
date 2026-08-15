import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface TabItem {
  key: string
  label: string
  icon: string
  path: string
}

export default function BottomTab() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const allTabs: TabItem[] = [
    { key: 'home', label: '首页', icon: '🏠', path: '/' },
    { key: 'checkin', label: '打卡', icon: '📖', path: '/english-checkin' },
    { key: 'records', label: '记录', icon: '📝', path: '/my-records' },
    { key: 'timer', label: '计时', icon: '⏱️', path: '/timer' },
    { key: 'summary', label: '统计', icon: '📊', path: '/summary' },
    { key: 'profile', label: user ? '我的' : '登录', icon: '👤', path: user ? '/profile' : '/login' },
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
    return 'profile'
  }

  const activeKey = getActiveKey()

  return (
    <nav className="flex sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => navigate(tab.path)}
          aria-current={activeKey === tab.key ? 'page' : undefined}
          className={`flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors cursor-pointer ${
            activeKey === tab.key ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          <span className="text-lg leading-none">{tab.icon}</span>
          <span className="mt-0.5">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}