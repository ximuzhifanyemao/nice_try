import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AppVersion from '../components/AppVersion'

export default function Profile() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const email = user?.email ?? ''
  const avatarText = email.slice(0, 1).toUpperCase() || '我'
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('zh-CN')
    : ''

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 space-y-4">
      {/* 用户信息 */}
      <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold shrink-0">
          {avatarText}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 dark:text-slate-100 truncate">{email}</p>
          {createdAt && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              注册于 {createdAt}
            </p>
          )}
        </div>
      </div>

      {/* 成就入口 */}
      <Link
        to="/achievements"
        className="flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700"
      >
        <span className="text-xl leading-none">🏅</span>
        <span className="text-sm font-medium text-gray-700 dark:text-slate-200">成就</span>
      </Link>

      {/* 目标与承诺金入口 */}
      <Link
        to="/goal"
        className="flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700"
      >
        <span className="text-xl leading-none">🎯</span>
        <span className="text-sm font-medium text-gray-700 dark:text-slate-200">目标与承诺金</span>
      </Link>

      {/* 回收站入口 */}
      <Link
        to="/trash"
        className="flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700"
      >
        <span className="text-xl leading-none">🗑️</span>
        <span className="text-sm font-medium text-gray-700 dark:text-slate-200">回收站</span>
      </Link>

      {/* 版本信息 */}
      <AppVersion />

      {/* 退出登录 */}
      <button
        onClick={handleSignOut}
        className="w-full rounded-xl bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 py-3 font-medium transition-colors hover:bg-red-100 dark:hover:bg-red-900/50 cursor-pointer text-sm"
      >
        退出登录
      </button>
    </div>
  )
}