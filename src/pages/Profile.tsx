import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUpdateContext } from '../contexts/UpdateContext'
import AppVersion from '../components/AppVersion'
import { Capacitor } from '@capacitor/core'

export default function Profile() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { status, checkForUpdate, downloadAndInstall, updateInfo, error } = useUpdateContext()
  const [checkingText, setCheckingText] = useState('')

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

      {/* 生词本入口 */}
      <Link
        to="/vocabulary"
        className="flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700"
      >
        <span className="text-xl leading-none">📖</span>
        <span className="text-sm font-medium text-gray-700 dark:text-slate-200">生词本</span>
      </Link>

      {/* 设置入口 */}
      <Link
        to="/settings"
        className="flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700"
      >
        <span className="text-xl leading-none">⚙️</span>
        <span className="text-sm font-medium text-gray-700 dark:text-slate-200">设置（倒计时 · 科目 · 主题）</span>
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

      {/* 检查更新 */}
      <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700">
        <button
          onClick={async () => {
            setCheckingText('正在检查...')
            await checkForUpdate()
            setCheckingText('')
          }}
          className="w-full flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">🔄</span>
            <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
              {checkingText || (status === 'available' ? '发现新版本!' : status === 'up_to_date' ? '已是最新版本' : status === 'error' ? '检查失败' : '检查更新')}
            </span>
          </div>
          <span className="text-gray-400 dark:text-slate-500 text-sm">›</span>
        </button>

        {status === 'available' && updateInfo && (
          <div className="mt-3 border-t border-gray-100 dark:border-slate-700 pt-3">
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
              新版本 v{updateInfo.version}
              {updateInfo.fileSize && `（${(updateInfo.fileSize / 1024).toFixed(0)} KB）`}
            </p>
            {Capacitor.isNativePlatform() ? (
              <button
                onClick={() => downloadAndInstall(updateInfo)}
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 cursor-pointer transition-colors"
              >
                下载并安装
              </button>
            ) : (
              <p className="text-xs text-gray-400 dark:text-slate-500">请在手机 App 中下载安装</p>
            )}
          </div>
        )}

        {status === 'downloading' && (
          <div className="mt-3 border-t border-gray-100 dark:border-slate-700 pt-3">
            <p className="text-xs text-blue-600 dark:text-blue-400">正在下载更新...</p>
          </div>
        )}

        {status === 'error' && (
          <p className="mt-2 text-xs text-red-500 dark:text-red-400">
            {error || '检查失败'}
          </p>
        )}
      </div>

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