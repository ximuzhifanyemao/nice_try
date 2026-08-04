import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="bg-slate-700 dark:bg-slate-800 dark:border-b dark:border-slate-700 text-white shadow-md sticky top-0 z-50 transition-colors duration-200">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg sm:text-xl font-bold tracking-wide">
          考研倒计时
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="text-white/70 truncate max-w-[160px]">{user.email}</span>
              <Link to="/" className="hover:text-slate-200 dark:hover:text-slate-300 transition-colors">首页</Link>
              <Link to="/my-records" className="hover:text-slate-200 dark:hover:text-slate-300 transition-colors">我的记录</Link>
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
          {/* 主题切换按钮 */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile: hamburger + theme toggle */}
        <div className="sm:hidden flex items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <button
            className="p-1 cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="菜单"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden bg-slate-700 dark:bg-slate-900/95 px-4 py-3 space-y-2 text-sm border-t border-white/10 dark:border-slate-700">
          {user ? (
            <>
              <div className="text-white/70 pb-1 border-b border-white/20 dark:border-slate-700 truncate">{user.email}</div>
              <Link to="/" onClick={closeMenu} className="block py-1 hover:text-slate-200">首页</Link>
              <Link to="/my-records" onClick={closeMenu} className="block py-1 hover:text-slate-200">我的记录</Link>
              <button
                onClick={() => { handleSignOut(); closeMenu() }}
                className="block w-full text-left py-1 hover:text-slate-200 cursor-pointer"
              >
                登出
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu} className="block py-1 hover:text-slate-200">登录</Link>
              <Link to="/register" onClick={closeMenu} className="block py-1 hover:text-slate-200">注册</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
