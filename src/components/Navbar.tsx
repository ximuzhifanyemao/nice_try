import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="bg-slate-700 dark:bg-slate-800 dark:border-b dark:border-slate-700 text-white shadow-md sticky top-0 z-50 transition-colors duration-200">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg sm:text-xl font-bold tracking-wide">
          我还有梦想
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-3 text-sm">
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
