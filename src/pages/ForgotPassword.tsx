import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/** 忘记密码：输入邮箱 → 发送重置链接（链接跳回 /reset-password 设置新密码） */
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.includes('@')) {
      setError('请输入有效的邮箱地址')
      return
    }

    setLoading(true)
    // 重置链接跳回本系统的重置密码页（HashRouter 路径需以 /#/ 形式拼接），
    // 使用当前 origin 自动适配本地调试与正式线上域名
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/#/reset-password`,
    })
    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }
    setSent(true)
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
          <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">找回密码，重新出发</p>
        </div>

        <div className="card p-6 sm:p-7">
          {sent ? (
            <div className="text-center py-2">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                <span className="text-2xl text-emerald-500 dark:text-emerald-400">✓</span>
              </div>
              <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-slate-100">邮件已发送</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                如果该邮箱已注册，我们已向 <span className="font-medium text-gray-700 dark:text-slate-300">{email}</span> 发送密码重置链接，请查收邮件并按提示设置新密码。
              </p>
              <p className="mt-2 text-xs text-gray-400 dark:text-slate-500">如未收到，请检查垃圾邮件箱，或确认输入的邮箱为注册邮箱。</p>
              <Link to="/login" className="mt-5 inline-block text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                返回登录
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mb-4 text-center text-lg font-semibold text-gray-800 dark:text-slate-100">忘记密码</h2>
              <p className="mb-4 text-center text-xs text-gray-500 dark:text-slate-400">
                输入注册邮箱，我们将发送密码重置链接
              </p>
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

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 dark:text-red-400 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                  {loading ? '发送中...' : '发送重置链接'}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-gray-500 dark:text-slate-400">
                想起密码了？{' '}
                <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                  返回登录
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}