import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toggleTheme } from '../lib/theme'
import DesktopLogo from './DesktopLogo'
import { BlueIcons } from './BlueCircleIcon'

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
    <nav className="hidden sm:block bg-slate-800 dark:bg-slate-900 dark:border-b dark:border-slate-800 text-white sticky top-0 z-50 transition-colors duration-200">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg sm:text-xl font-bold tracking-wide">
          <DesktopLogo size={24} />
          DiveDeep
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-3 text-sm">
          <button
            onClick={handleToggleTheme}
            title={isDark ? '切换到亮色模式' : '切换到暗色模式'}
            className="rounded-md bg-white/10 px-2.5 py-1 hover:bg-white/20 transition-colors cursor-pointer"
          >
            {isDark ? BlueIcons.moon : BlueIcons.sun}
          </button>
          {user ? (
            <>
              <span className="text-white/60 truncate max-w-[160px]">{user.email}</span>
              <Link to="/" className="flex items-center gap-1 hover:text-slate-200 dark:hover:text-slate-300 transition-colors">
                {BlueIcons.home}<span>首页</span>
              </Link>
              <Link to="/my-records" className="flex items-center gap-1 hover:text-slate-200 dark:hover:text-slate-300 transition-colors">
                {BlueIcons.records}<span>记录</span>
              </Link>
              <Link to="/timer" className="flex items-center gap-1 hover:text-slate-200 dark:hover:text-slate-300 transition-colors">
                {BlueIcons.timer}<span>计时</span>
              </Link>
              <Link to="/summary" className="flex items-center gap-1 hover:text-slate-200 dark:hover:text-slate-300 transition-colors">
                {BlueIcons.summary}<span>统计</span>
              </Link>
              <Link to="/profile" className="flex items-center gap-1 hover:text-slate-200 dark:hover:text-slate-300 transition-colors">
                {BlueIcons.profile}<span>我的</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-md bg-white/10 px-2.5 py-1 hover:bg-white/20 transition-colors cursor-pointer flex items-center gap-1"
              >
                {BlueIcons.logout}<span>登出</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="flex items-center gap-1 hover:text-slate-200 dark:hover:text-slate-300 transition-colors">
                {BlueIcons.login}<span>登录</span>
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-white/10 px-2.5 py-1 hover:bg-white/20 transition-colors flex items-center gap-1"
              >
                {BlueIcons.settings}<span>注册</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
