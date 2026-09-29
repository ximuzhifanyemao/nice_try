import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getCurrentTheme, setTheme as persistTheme, THEMES, type ThemeMode } from '../lib/theme'
import DesktopLogo from './DesktopLogo'
import { BlueIcons } from './BlueCircleIcon'
import { useEffect, useRef, useState } from 'react'

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
  { key: 'weeklySummary', label: '周总结', iconKey: 'goal', path: '/weekly-summary' },
  { key: 'vocab', label: '生词', iconKey: 'vocab', path: '/vocabulary' },
  { key: 'achievements', label: '成就', iconKey: 'achievements', path: '/achievements' },
  { key: 'goal', label: '目标', iconKey: 'goal', path: '/goal' },
  { key: 'profile', label: '我的', iconKey: 'profile', path: '/profile' },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getCurrentTheme())
  const [themeOpen, setThemeOpen] = useState(false)
  const themeMenuRef = useRef<HTMLDivElement>(null)
  const firstThemeItemRef = useRef<HTMLButtonElement>(null)
  const themeTriggerRef = useRef<HTMLButtonElement>(null)
  const currentTheme = THEMES.find((t) => t.key === themeMode) ?? THEMES[0]

  // 打开菜单时把焦点移到第一项；监听 Esc 关闭并把焦点交还触发器（带 cleanup）
  useEffect(() => {
    if (!themeOpen) return
    if (firstThemeItemRef.current) firstThemeItemRef.current.focus()
    else themeMenuRef.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setThemeOpen(false)
        themeTriggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [themeOpen])

  const getActiveKey = (): string => {
    const { pathname } = location
    if (pathname === '/') return 'home'
    if (pathname === '/timer') return 'timer'
    if (pathname === '/english-checkin') return 'checkin'
    if (pathname.startsWith('/my-records')) return 'records'
    if (pathname === '/summary') return 'summary'
    if (pathname === '/weekly-summary') return 'weeklySummary'
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

  const handlePickTheme = (key: ThemeMode) => {
    setThemeMode(persistTheme(key))
    setThemeOpen(false)
  }

  const items = user ? NAV_ITEMS : NAV_ITEMS.filter((i) => i.key === 'home' || i.key === 'profile')

  return (
    <aside className="theme-surface relative isolate flex w-56 flex-col bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 h-full shrink-0">
      {/* Logo：高度与窗口标题栏（h-12）一致，让顶部两条边落在同一水平线上 */}
      <Link
        to="/"
        className="flex h-12 shrink-0 items-center gap-2.5 border-b border-gray-200/80 px-4 text-sm font-semibold text-gray-700 transition-colors hover:text-slate-900 dark:border-slate-800/80 dark:text-slate-200 dark:hover:text-white"
        title="DiveDeep"
      >
        <DesktopLogo size={22} />
        <span className="truncate">DiveDeep</span>
      </Link>

      {/* 导航项：圆角块 + 左侧指示条；用 padding 而不是整宽高亮，边界更柔和 */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2.5">
        {items.map((item) => {
          const active = activeKey === item.key
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              title={item.label}
              aria-current={active ? 'page' : undefined}
              className={`relative flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] transition-colors duration-150 ${
                active
                  ? 'bg-indigo-50 font-medium text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-slate-100'
              }`}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-500 dark:bg-indigo-400"
                  aria-hidden="true"
                />
              )}
              <span className="shrink-0">{BlueIcons[item.iconKey]}</span>
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* 底部：主题选择 + 登录/登出（固定在侧边栏最底部） */}
      <div className="border-t border-gray-200 dark:border-slate-800 py-2 flex flex-col gap-1 shrink-0">
        {/* 主题选择器：向上弹出菜单 */}
        <div className="relative">
          <button
            ref={themeTriggerRef}
            onClick={() => setThemeOpen((v) => !v)}
            title="切换主题"
            aria-expanded={themeOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2.5 w-full px-4 h-9 rounded-md text-[15px] text-gray-600 dark:text-slate-300 hover:text-slate-900 hover:bg-gray-100 dark:hover:text-slate-100 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <span className="shrink-0">{currentTheme.dark ? BlueIcons.moon : BlueIcons.sun}</span>
            <span className="flex-1 text-left">主题</span>
            <span
              className="inline-block h-3.5 w-3.5 rounded-full border border-black/10 dark:border-white/20"
              style={{ background: currentTheme.swatch }}
            />
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${themeOpen ? 'rotate-180' : ''}`} aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {themeOpen && (
            <>
              {/* 点击任意位置关闭菜单 */}
              <div className="fixed inset-0 z-30" onClick={() => setThemeOpen(false)} />
              <div
                ref={themeMenuRef}
                role="menu"
                aria-label="主题选择"
                tabIndex={-1}
                className="absolute left-2 right-2 bottom-full mb-1 z-40 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl outline-none dark:border-slate-700 dark:bg-slate-800"
              >
                {THEMES.map((t, i) => (
                  <button
                    key={t.key}
                    role="menuitem"
                    onClick={() => handlePickTheme(t.key)}
                    ref={(el) => {
                      if (i === 0) firstThemeItemRef.current = el
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer ${
                      themeMode === t.key
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <span className="h-4 w-4 shrink-0 rounded-full border border-black/10 dark:border-white/20" style={{ background: t.swatch }} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium leading-tight">{t.name}</span>
                      <span className="block text-[11px] text-gray-400 dark:text-slate-500">{t.desc}</span>
                    </span>
                    {themeMode === t.key && (
                      <span className="ml-auto text-indigo-500 dark:text-indigo-300">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {user ? (
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 w-full px-4 h-9 rounded-md text-[15px] text-red-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <span className="shrink-0">{BlueIcons.logout}</span>
            <span>登出</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full mx-auto px-3 h-9 max-w-[170px] rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[15px] font-medium transition-colors"
          >
            <span className="shrink-0">{BlueIcons.login}</span>
            <span>登录</span>
          </Link>
        )}
      </div>
    </aside>
  )
}
