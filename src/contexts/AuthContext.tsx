import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { loadUserSubjects, resetSubjectCache } from '../lib/subjects'
import type { Session, User } from '@supabase/supabase-js'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signUp: (email: string, password: string) => Promise<{ error: Error | null; needsEmailConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    // 环境变量未配置时，跳过网络请求，直接给出友好错误（避免请求占位域名导致超时）
    if (!isSupabaseConfigured) {
      setError('后端服务未配置，请检查部署环境变量设置')
      setLoading(false)
      return () => {
        cancelled = true
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (cancelled) return
      if (sessionError) {
        console.error('[Auth] getSession error:', sessionError.message)
        setError('认证服务连接失败，部分功能可能不可用')
      }
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch((err) => {
      if (cancelled) return
      console.error('[Auth] getSession failed:', err)
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('认证服务连接超时，请检查网络后刷新重试')
      } else {
        setError('认证服务连接失败，部分功能可能不可用')
      }
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      // 登录成功后加载该用户的云端自定义科目；登出时清空科目缓存
      if (session?.user) {
        loadUserSubjects(session.user.id)
      } else {
        resetSubjectCache()
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    // 如果 user 存在但 session 为空，说明需要邮箱确认
    const needsEmailConfirmation = !error && !!data.user && !data.session
    return { error, needsEmailConfirmation }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, error, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
