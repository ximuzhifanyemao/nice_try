import { useState, useEffect, useRef, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { createQrSession, pollQrSession } from '../lib/qrLogin'
import DesktopLogo from '../components/DesktopLogo'

type Tab = 'password' | 'qr'
type QrStatus = 'loading' | 'waiting' | 'success' | 'expired' | 'error'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>('password')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [qrDataUrl, setQrDataUrl] = useState('')
  const [qrStatus, setQrStatus] = useState<QrStatus>('loading')
  const [qrError, setQrError] = useState('')
  const cancelledRef = useRef(false)

  const redirect = searchParams.get('redirect') || '/'

  const startQr = async () => {
    cancelledRef.current = false
    setQrStatus('loading')
    setQrError('')
    try {
      const { token, qrUrl } = await createQrSession()
      const dataUrl = await QRCode.toDataURL(qrUrl, {
        width: 200,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
      if (cancelledRef.current) return
      setQrDataUrl(dataUrl)
      setQrStatus('waiting')
      const { promise, handle } = pollQrSession(token, (status) => {
        if (status === 'expired') setQrStatus('expired')
      })
      // 组件卸载时取消轮询
      const checkCancelled = setInterval(() => {
        if (cancelledRef.current) {
          handle.cancelled = true
          clearInterval(checkCancelled)
        }
      }, 500)
      const result = await promise
      clearInterval(checkCancelled)
      if (cancelledRef.current) return
      if (result) {
        setQrStatus('success')
        const { error: e } = await supabase.auth.setSession({
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
        })
        if (cancelledRef.current) return
        if (e) {
          setQrStatus('error')
          setQrError('登录失败：' + e.message)
          return
        }
        setTimeout(() => navigate(redirect), 800)
      } else {
        setQrStatus('expired')
      }
    } catch (err) {
      if (cancelledRef.current) return
      setQrStatus('error')
      setQrError(err instanceof Error ? err.message : '未知错误')
    }
  }

  useEffect(() => {
    if (tab !== 'qr') return
    startQr()
    return () => {
      cancelledRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.includes('@')) {
      setError('请输入有效的邮箱地址')
      return
    }
    if (password.length < 6) {
      setError('密码至少需要6位')
      return
    }

    setLoading(true)
    const { error: authError } = await signIn(email, password)
    setLoading(false)

    if (authError) {
      if (authError.message.includes('Email not confirmed')) {
        setError('邮箱尚未确认，请检查收件箱并点击确认链接后再登录')
      } else {
        setError(authError.message === 'Invalid login credentials'
          ? '邮箱或密码错误'
          : authError.message)
      }
      return
    }

    navigate(redirect)
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-6">
      <div className="w-full max-w-sm">
        {/* 品牌头部 */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-2 h-12 w-12 rounded-2xl bg-white dark:bg-slate-800 shadow-[0_8px_24px_-8px_rgba(99,102,241,0.55)] flex items-center justify-center overflow-hidden">
            <DesktopLogo size={48} />
          </div>
          <h1 className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-2xl font-bold text-transparent dark:from-indigo-400 dark:to-violet-400">DiveDeep</h1>
          <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">登录后开启你的考研学习之旅</p>
        </div>

        <div className="card p-6 sm:p-7">
        <h2 className="mb-4 text-center text-lg font-semibold text-gray-800 dark:text-slate-100">欢迎回来</h2>

        {/* Tab 切换 */}
        <div className="seg mb-5">
          <button
            type="button"
            onClick={() => setTab('password')}
            className={`seg-item ${tab === 'password' ? 'seg-item-active' : 'seg-item-idle'}`}
          >
            账号密码
          </button>
          <button
            type="button"
            onClick={() => setTab('qr')}
            className={`seg-item ${tab === 'qr' ? 'seg-item-active' : 'seg-item-idle'}`}
          >
            扫码登录
          </button>
        </div>

        {tab === 'password' ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">
                  邮箱
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="label">
                  密码
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少6位"
                  className="input"
                  required
                />
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                  忘记密码？
                </Link>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 dark:text-red-400 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? '登录中...' : '登录'}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-500 dark:text-slate-400">
              还没有账号？{' '}
              <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                去注册
              </Link>
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center text-center py-2">
            {qrStatus === 'success' ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-2xl text-emerald-500 dark:text-emerald-400">✓</span>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-slate-200">登录成功</p>
              </div>
            ) : qrStatus === 'expired' ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                  <span className="text-2xl text-amber-500 dark:text-amber-400">⏰</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400">二维码已过期</p>
                <button
                  type="button"
                  onClick={startQr}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  重新生成
                </button>
              </div>
            ) : qrStatus === 'error' ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                  <span className="text-2xl text-red-500 dark:text-red-400">✕</span>
                </div>
                <p className="text-sm text-red-500 dark:text-red-400 max-w-[220px]">{qrError}</p>
                <button
                  type="button"
                  onClick={startQr}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  重试
                </button>
              </div>
            ) : qrStatus === 'loading' ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-200 dark:border-slate-700 border-t-indigo-500" />
                <p className="text-xs text-gray-500 dark:text-slate-400">生成二维码中…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  用已登录的手机 App 扫描下方二维码
                </p>
                {qrDataUrl && (
                  <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 p-2 bg-white">
                    <img src={qrDataUrl} alt="登录二维码" className="rounded-lg" width={180} height={180} />
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  <p className="text-xs text-gray-500 dark:text-slate-400">等待手机确认…</p>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-slate-500">
                  打开手机 App/网页登录后扫码即可在此登录
                </p>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
