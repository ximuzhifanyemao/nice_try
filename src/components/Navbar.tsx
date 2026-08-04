import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="bg-blue-600 text-white shadow-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg sm:text-xl font-bold tracking-wide">
          考研倒计时
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="text-white/70 truncate max-w-[160px]">{user.email}</span>
              <Link to="/" className="hover:text-blue-200 transition-colors">首页</Link>
              <Link to="/my-records" className="hover:text-blue-200 transition-colors">我的记录</Link>
              <button
                onClick={handleSignOut}
                className="rounded bg-white/15 px-3 py-1 hover:bg-white/25 transition-colors cursor-pointer"
              >
                登出
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-200 transition-colors">登录</Link>
              <Link
                to="/register"
                className="rounded bg-white/15 px-3 py-1 hover:bg-white/25 transition-colors"
              >
                注册
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-1 cursor-pointer"
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

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden bg-blue-700 px-4 py-3 space-y-2 text-sm">
          {user ? (
            <>
              <div className="text-white/70 pb-1 border-b border-white/20 truncate">{user.email}</div>
              <Link to="/" onClick={closeMenu} className="block py-1 hover:text-blue-200">首页</Link>
              <Link to="/my-records" onClick={closeMenu} className="block py-1 hover:text-blue-200">我的记录</Link>
              <button
                onClick={() => { handleSignOut(); closeMenu() }}
                className="block w-full text-left py-1 hover:text-blue-200 cursor-pointer"
              >
                登出
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu} className="block py-1 hover:text-blue-200">登录</Link>
              <Link to="/register" onClick={closeMenu} className="block py-1 hover:text-blue-200">注册</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
