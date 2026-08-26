import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { checkQrToken, confirmQrLogin } from '../lib/qrLogin'

export default function QrLogin() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const { user, loading: authLoading } = useAuth()
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      return
    }
    checkQrToken(token).then((s) => {
      setTokenValid(!!s && s.status === 'pending')
    })
  }, [token])

  const handleConfirm = async () => {
    setConfirming(true)
    setError('')
    const { error: err } = await confirmQrLogin(token)
    setConfirming(false)
    if (err) {
      setError(err)
    } else {
      setDone(true)
    }
  }

  // 未登录时引导先登录，登录后自动回来确认
  if (!authLoading && !user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 text-center">
          <p className="text-5xl mb-4">📱</p>
          <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-2">扫码登录</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
            请先登录您的账号，然后确认桌面端登录请求
          </p>
          <Link
            to={`/login?redirect=${encodeURIComponent('/qr-login?token=' + token)}`}
            className="inline-block w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            去登录
          </Link>
        </div>
      </div>
    )
  }

  // token 无效
  if (tokenValid === false) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 text-center">
          <p className="text-5xl mb-4">❌</p>
          <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-2">二维码已失效</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            请在桌面端重新生成二维码
          </p>
        </div>
      </div>
    )
  }

  // 确认成功
  if (done) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 text-center">
          <p className="text-5xl mb-4">✅</p>
          <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-2">登录成功</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            桌面端已自动登录，可以关闭此页面
          </p>
        </div>
      </div>
    )
  }

  // 等待确认
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 text-center">
        <p className="text-5xl mb-4">💻</p>
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-2">桌面端扫码登录</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
          当前账号：<span className="font-medium text-gray-700 dark:text-slate-300">{user?.email}</span>
        </p>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
          点击下方按钮确认在桌面端登录
        </p>
        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/30 dark:text-red-400 px-3 py-2 rounded-lg mb-4">
            {error}
          </p>
        )}
        <button
          onClick={handleConfirm}
          disabled={confirming || tokenValid === null}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
        >
          {confirming ? '确认中...' : tokenValid === null ? '验证中...' : '确认登录'}
        </button>
      </div>
    </div>
  )
}
