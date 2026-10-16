import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getCurrentTheme, setTheme as persistTheme, THEMES, type ThemeMode } from '../lib/theme'
import DesktopLogo from './DesktopLogo'
import { BlueIcons } from './BlueCircleIcon'
import { Icon } from './Icon'
import { useEffect, useRef, useState } from 'react'

interface NavItem {
  key: string
  label: string
  iconKey: keyof typeof BlueIcons
  path: string
}

/**
 * 侧边栏主导航：顺序对应用户「首页 → 计时 → 打卡 → 记录 → 统计 → 周总结 → 生词 → 成就 → 目标 → 我的」的心智模型。
 * 桌面端侧边栏是常驻导航，因此所有功能入口都必须在这里有一席之地，
 * 「我的」只作为账号与数据管理的落点，不再承担「二级功能索引页」的职责。
 */
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

/**
 * 路径前缀 → 窗口标题。
 * 桌面端窗口标题栏左侧显示当前页面名（桌面软件的惯例），
 * 与侧边栏共用同一份命名，避免两处各写一套而叫法不一致。
 * 顺序即优先级：更长的路径（/my-records/new）必须排在父路径（/my-records）前面。
 */
const PAGE_TITLES: [string, string][] = [
  ['/my-records/new', '新建记录'],
  ['/my-records', '记录'],
  ['/profile', '我的'],
  ['/summary', '统计'],
  ['/weekly-summary', '周总结'],
  ['/timer', '计时'],
  ['/trash', '回收站'],
  ['/achievements', '成就'],
  ['/goal', '目标'],
  ['/english-checkin', '打卡'],
  ['/vocabulary', '生词'],
  ['/settings', '设置'],
  ['/scan-qr', '扫码登录'],
  ['/', '首页'],
]

/** 取窗口标题栏要显示的页面名；未收录的路径回落到产品名 */
export function desktopPageTitle(pathname: string): string {
  for (const [prefix, title] of PAGE_TITLES) {
    if (prefix === '/' ? pathname === '/' : pathname.startsWith(prefix)) return title
  }
  return 'DiveDeep'
}

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

      {/* 底部：账号信息 + 快捷操作（设置 / 主题 / 登出）。
          作为 shrink-0 的最后一个 flex 子项固定在侧边栏底部：导航再长也只有 nav 内部滚动，
          这些入口在任何窗口高度下都不需要滚动就能看到；padding 与 nav 的 px-2.5 py-2.5 对齐，
          避免在最后一行下方留出一条空白带。
          桌面软件的惯例是「设置 / 主题 / 退出」常驻在左下角，用户不必先进「我的」再找。 */}
      <div className="shrink-0 border-t border-gray-200 p-2.5 dark:border-slate-800">
        {/* 账号一行：头像 + 邮箱（点击进「我的」） */}
        {user && (
          <Link
            to="/profile"
            title={user.email ?? '我的'}
            className="mb-1 flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800/50"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-bold text-white">
              {(user.email ?? '我').slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-gray-700 dark:text-slate-200">
                {user.email ?? '我的账号'}
              </span>
            </span>
          </Link>
        )}

        {/* 设置 / 主题 / 登出：一行图标按钮，悬停出提示，点击即达 */}
        <div className="flex items-center gap-0.5">
          <Link
            to="/settings"
            title="设置（倒计时 · 科目 · 提醒 · 进度条样式）"
            aria-label="设置"
            className="flex h-8 flex-1 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
          >
            <Icon name="settings" size={16} />
          </Link>
          <div className="relative flex-1">
            <button
              ref={themeTriggerRef}
              onClick={() => setThemeOpen((v) => !v)}
              title={`主题：${currentTheme.name}`}
              aria-label="切换主题"
              aria-expanded={themeOpen}
              aria-haspopup="menu"
              className="flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
            >
              {currentTheme.dark ? BlueIcons.moon : BlueIcons.sun}
              <span
                className="inline-block h-3.5 w-3.5 rounded-full border border-black/10 dark:border-white/20"
                style={{ background: currentTheme.swatch }}
              />
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
                  className="absolute bottom-full left-0 right-0 z-40 mb-1 min-w-[168px] rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl outline-none dark:border-slate-700 dark:bg-slate-800"
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
              title="登出"
              aria-label="登出"
              className="flex h-8 flex-1 cursor-pointer items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-400 dark:hover:bg-red-500/10"
            >
              {BlueIcons.logout}
            </button>
          ) : (
            <Link
              to="/login"
              title="登录"
              className="flex h-8 flex-[2] cursor-pointer items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            >
              <span className="shrink-0">{BlueIcons.login}</span>
              <span>登录</span>
            </Link>
          )}
        </div>
      </div>
    </aside>
  )
}
