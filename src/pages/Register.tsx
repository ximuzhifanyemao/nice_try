import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import DesktopLogo from '../components/DesktopLogo'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email.includes('@')) {
      setError('请输入有效的邮箱地址')
      return
    }
    if (password.length < 6) {
      setError('密码至少需要6位')
      return
    }

    setLoading(true)
    const { error: authError, needsEmailConfirmation } = await signUp(email, password)
    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    if (needsEmailConfirmation) {
      setSuccess('注册成功！请检查邮箱并点击确认链接，然后返回登录。')
      return
    }

    navigate('/')
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
          <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">注册一个账号，开始记录你的学习</p>
        </div>

        <div className="card p-6 sm:p-7">
          <h2 className="mb-4 text-center text-lg font-semibold text-gray-800 dark:text-slate-100">创建账号</h2>

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

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 dark:text-red-400 px-3 py-2 rounded-lg">{error}</p>
            )}

            {success && (
              <div className="text-sm text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400 border border-green-200 px-3 py-2 rounded-lg">
                {success}
              </div>
            )}

            {!success && (
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5"
              >
                {loading ? '注册中...' : '注册'}
              </button>
            )}
          </form>

          <p className="mt-4 text-center text-sm text-gray-500 dark:text-slate-400">
            已有账号？{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              去登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}