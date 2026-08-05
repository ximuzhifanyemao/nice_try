import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

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

  const quickLinks = [
    { label: '记录', icon: '📝', path: '/my-records' },
    { label: '总结', icon: '📊', path: '/summary' },
    { label: '计时', icon: '⏱️', path: '/timer' },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      {/* 用户信息卡片 */}
      <div className="rounded-xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shrink-0">
          {avatarText}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-gray-800 dark:text-slate-100 truncate">{email}</p>
          {createdAt && (
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              注册于 {createdAt}
            </p>
          )}
        </div>
      </div>

      {/* 快捷入口 */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">快捷入口</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col items-center gap-2 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              <span className="text-2xl leading-none">{link.icon}</span>
              <span className="text-sm text-gray-700 dark:text-slate-200">{link.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 退出登录 */}
      <button
        onClick={handleSignOut}
        className="w-full rounded-xl bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 py-3 font-medium transition-colors hover:bg-red-100 dark:hover:bg-red-900/50 cursor-pointer"
      >
        退出登录
      </button>
    </div>
  )
}
