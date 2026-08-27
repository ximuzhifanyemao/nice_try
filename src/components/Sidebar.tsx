import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toggleTheme } from '../lib/theme'
import Logo from './Logo'
import { useState, type ReactNode } from 'react'

/** 统一的线性 SVG 图标集合（lucide 风格描边），保证所有入口视觉一致 */
function SvgIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="w-[18px] h-[18px] shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const ICONS: Record<string, ReactNode> = {
  home: (
    <SvgIcon>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-6h6v6" />
    </SvgIcon>
  ),
  timer: (
    <SvgIcon>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2" />
      <path d="M9 2h6" />
    </SvgIcon>
  ),
  checkin: (
    <SvgIcon>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </SvgIcon>
  ),
  records: (
    <SvgIcon>
      <path d="M12 20h9" />
      <path d="M16.5 3.5l4 4L7 21H3v-4L16.5 3.5z" />
    </SvgIcon>
  ),
  summary: (
    <SvgIcon>
      <path d="M3 3v18h18" />
      <path d="M7 16v-5" />
      <path d="M12 16V8" />
      <path d="M17 16v-3" />
    </SvgIcon>
  ),
  vocab: (
    <SvgIcon>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </SvgIcon>
  ),
  achievements: (
    <SvgIcon>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.6V22h4v-7.4" />
      <path d="M12 14.6A5.5 5.5 0 0 0 18 9V6H6v3a5.5 5.5 0 0 0 6 5.6z" />
    </SvgIcon>
  ),
  goal: (
    <SvgIcon>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </SvgIcon>
  ),
  profile: (
    <SvgIcon>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
    </SvgIcon>
  ),
  sun: (
    <SvgIcon>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </SvgIcon>
  ),
  moon: (
    <SvgIcon>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </SvgIcon>
  ),
  login: (
    <SvgIcon>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
    </SvgIcon>
  ),
  logout: (
    <SvgIcon>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </SvgIcon>
  ),
}

interface NavItem {
  key: string
  label: string
  icon: string
  path: string
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: '首页', icon: 'home', path: '/' },
  { key: 'timer', label: '计时', icon: 'timer', path: '/timer' },
  { key: 'checkin', label: '打卡', icon: 'checkin', path: '/english-checkin' },
  { key: 'records', label: '记录', icon: 'records', path: '/my-records' },
  { key: 'summary', label: '统计', icon: 'summary', path: '/summary' },
  { key: 'vocab', label: '生词', icon: 'vocab', path: '/vocabulary' },
  { key: 'achievements', label: '成就', icon: 'achievements', path: '/achievements' },
  { key: 'goal', label: '目标', icon: 'goal', path: '/goal' },
  { key: 'profile', label: '我的', icon: 'profile', path: '/profile' },
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
        <Logo size={18} />
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
            <span className="shrink-0 text-indigo-500 dark:text-indigo-400">{ICONS[item.icon]}</span>
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* 底部：主题切换 + 登录/登出 + 关闭 */}
      <div className="border-t border-gray-200 dark:border-slate-800 py-2 flex flex-col gap-1 shrink-0">
        <button
          onClick={handleToggleTheme}
          title={isDark ? '亮色' : '暗色'}
          className="flex items-center gap-2 w-full px-3 h-8 rounded-md text-[13px] text-gray-600 dark:text-slate-300 hover:text-slate-900 hover:bg-gray-100 dark:hover:text-slate-100 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
        >
          <span className="shrink-0 text-gray-500 dark:text-slate-400">{isDark ? ICONS.sun : ICONS.moon}</span>
          <span>{isDark ? '亮色' : '暗色'}</span>
        </button>
        {user ? (
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 h-8 rounded-md text-[13px] text-red-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <span className="shrink-0 text-red-500">{ICONS.logout}</span>
            <span>登出</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full mx-auto px-3 h-8 max-w-[146px] rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-medium transition-colors"
          >
            <span className="shrink-0">{ICONS.login}</span>
            <span>登录</span>
          </Link>
        )}
      </div>
    </aside>
  )
}