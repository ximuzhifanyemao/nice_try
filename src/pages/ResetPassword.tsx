import { useState, useEffect, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Status = 'checking' | 'invalid' | 'ready'

/**
 * 重置密码：从邮件链接的 URL hash 中提取恢复令牌（access_token/refresh_token），
 * 建立恢复会话后允许用户设置新密码（updateUser），完成后登出并引导重新登录。
 */
export default function ResetPassword() {
  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // 链接形如 <origin>/#/reset-password#access_token=xxx&refresh_token=yyy&type=recovery
      // 取最后一个 # 之后的参数段进行解析（HashRouter 分段不影响此处取参）
      const hash = window.location.hash
      const params = new URLSearchParams(hash.split('#').pop() ?? '')
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const expiresAt = Number(params.get('expires_at') ?? 0)

      if (!accessToken || !refreshToken || (expiresAt && expiresAt * 1000 < Date.now())) {
        if (!cancelled) setStatus('invalid')
        return
      }

      // 用恢复令牌建立会话（幂等：Supabase 初始化时若已自动识别的同一令牌，重复设置无副作用）
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      if (cancelled) return
      if (sessionError) {
        setStatus('invalid')
        return
      }
      setStatus('ready')
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('新密码至少需要6位')
      return
    }
    if (password !== confirm) {
      setError('两次输入的密码不一致')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(true)
    // 结束恢复会话，避免重置后的旧令牌会话残留
    await supabase.auth.signOut()
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-6">
      <div className="w-full max-w-sm">
        {/* 品牌头部 */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-2 h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-600 shadow-[0_8px_24px_-8px_rgba(99,102,241,0.55)] flex items-center justify-center text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 9.5V21h14V9.5" />
            </svg>
          </div>
          <h1 className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-2xl font-bold text-transparent dark:from-indigo-400 dark:to-violet-400">DiveDeep</h1>
          <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">设置新密码</p>
        </div>

        <div className="card p-6 sm:p-7">
          {success ? (
            <div className="text-center py-2">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                <span className="text-2xl text-emerald-500 dark:text-emerald-400">✓</span>
              </div>
              <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-slate-100">密码已重置</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">请使用新密码重新登录。</p>
              <Link to="/login" className="mt-5 inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
                去登录
              </Link>
            </div>
          ) : status === 'checking' ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 dark:border-slate-700 border-t-indigo-500" />
              <p className="text-xs text-gray-500 dark:text-slate-400">正在验证重置链接…</p>
            </div>
          ) : status === 'invalid' ? (
            <div className="text-center py-2">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
                <span className="text-2xl text-red-500 dark:text-red-400">✕</span>
              </div>
              <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-slate-100">链接无效或已过期</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                请重新申请密码重置链接。
              </p>
              <Link to="/forgot-password" className="mt-5 inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
                重新申请
              </Link>
              <p className="mt-3">
                <Link to="/login" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                  返回登录
                </Link>
              </p>
            </div>
          ) : (
            <>
              <h2 className="mb-4 text-center text-lg font-semibold text-gray-800 dark:text-slate-100">设置新密码</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="label">
                    新密码
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

                <div>
                  <label htmlFor="confirm" className="label">
                    确认新密码
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="再次输入新密码"
                    className="input"
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 dark:text-red-400 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                  {loading ? '提交中...' : '确认重置'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}