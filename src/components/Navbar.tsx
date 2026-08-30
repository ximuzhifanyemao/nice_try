import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toggleTheme } from '../lib/theme'
import DesktopLogo from './DesktopLogo'
import { BlueIcons } from './BlueCircleIcon'
import { Icon, type IconName } from './Icon'

/** 桌面端导航链接（图标 + 文字） */
function NavLink({ to, icon, label }: { to: string; icon: IconName; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
    >
      <Icon name={icon} size={15} />
      <span>{label}</span>
    </Link>
  )
}

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const handleToggleTheme = () => {
    const next = toggleTheme()
    setIsDark(next === 'dark')
  }

  return (
    // 移动端隐藏顶部横幅（导航由底部 Tab 承担），桌面端保留导航栏
    <nav className="hidden sm:block sticky top-0 z-50 border-b border-gray-200/60 bg-white/85 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-950/70 transition-colors duration-200">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2.5">
        <Link to="/" className="flex items-center gap-2">
          <DesktopLogo size={26} />
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-lg font-bold tracking-wide text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-indigo-400">
            DiveDeep
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-1 text-sm">
          <button
            onClick={handleToggleTheme}
            title={isDark ? '切换到亮色模式' : '切换到暗色模式'}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
          >
            {isDark ? BlueIcons.moon : BlueIcons.sun}
          </button>
          {user ? (
            <>
              <span className="hidden lg:block max-w-[180px] truncate pr-1 text-xs text-gray-400 dark:text-slate-500">
                {user.email}
              </span>
              <NavLink to="/" icon="home" label="首页" />
              <NavLink to="/my-records" icon="pencil" label="记录" />
              <NavLink to="/timer" icon="clock" label="计时" />
              <NavLink to="/summary" icon="chart" label="统计" />
              <NavLink to="/profile" icon="user" label="我的" />
              <button
                onClick={handleSignOut}
                className="ml-1 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-red-500/10 dark:hover:text-red-400 cursor-pointer"
              >
                <Icon name="arrowRight" size={15} className="rotate-180" />
                <span>登出</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                登录
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 hover:shadow-[0_4px_16px_-6px_rgba(79,70,229,0.6)]"
              >
                免费注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}