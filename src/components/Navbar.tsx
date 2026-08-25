import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toggleTheme } from '../lib/theme'

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
    <nav className="hidden sm:block bg-slate-700 dark:bg-slate-800 dark:border-b dark:border-slate-700 text-white shadow-md sticky top-0 z-50 transition-colors duration-200">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg sm:text-xl font-bold tracking-wide">
          大学深埋
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-3 text-sm">
          <button
            onClick={handleToggleTheme}
            title={isDark ? '切换到亮色模式' : '切换到暗色模式'}
            className="rounded bg-white/15 px-3 py-1 hover:bg-white/25 transition-colors cursor-pointer"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          {user ? (
            <>
              <span className="text-white/70 truncate max-w-[160px]">{user.email}</span>
              <Link to="/" className="hover:text-slate-200 dark:hover:text-slate-300 transition-colors">🏠 首页</Link>
              <Link to="/my-records" className="hover:text-slate-200 dark:hover:text-slate-300 transition-colors">📝 记录</Link>
              <Link to="/timer" className="hover:text-slate-200 dark:hover:text-slate-300 transition-colors">⏱️ 计时</Link>
              <Link to="/summary" className="hover:text-slate-200 dark:hover:text-slate-300 transition-colors">📊 统计</Link>
              <Link to="/profile" className="hover:text-slate-200 dark:hover:text-slate-300 transition-colors">👤 我的</Link>
              <button
                onClick={handleSignOut}
                className="rounded bg-white/15 px-3 py-1 hover:bg-white/25 transition-colors cursor-pointer"
              >
                登出
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-slate-200 dark:hover:text-slate-300 transition-colors">登录</Link>
              <Link
                to="/register"
                className="rounded bg-white/15 px-3 py-1 hover:bg-white/25 transition-colors"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
