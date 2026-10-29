import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { loadUserSubjects, resetSubjectCache, hydrateUserSubjects, ensureBuiltinMigration } from '../lib/subjects'
// 登录后自动结算过期承诺（不再依赖打开「目标与承诺金」页）。
// commitments.ts 仅依赖 supabase/dailyLogs，与 AuthContext 无循环依赖，故直接在此触发。
import { settleExpiredCommitments } from '../lib/commitments'
import { bankRunningTimers, clearTimerLocalState } from '../lib/timerSync'
import { runAutoFlush } from '../lib/timerOutbox'
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
  /**
   * 是否由用户主动点了「登出」。
   * session 变 null 除了主动登出，还可能来自 token 刷新失败/网络抖动（隐式掉线），
   * 后者必须保留正在进行的计时与待入库队列，否则「在计时长」会被静默清掉。
   */
  const explicitSignOutRef = useRef(false)

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
      // 恢复会话后立即同步恢复该用户的自定义科目本地缓存，
      // 让科目列表在云端返回前即可显示（避免冷启动先内置后自定义）
      if (session?.user) {
        hydrateUserSubjects(session.user.id)
        // 老用户把历史用过的内置科目迁移为自定义科目（幂等，仅首次生效）
        ensureBuiltinMigration(session.user.id)
        // 登录/恢复会话后自动结算过期承诺（fire-and-forget，吞错绝不阻塞登录；RPC 幂等）
        void settleExpiredCommitments(session.user.id).catch(() => {})
        // 本机还有未入库的计时时长：恢复会话后立刻尝试补传
        void runAutoFlush()
      }
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
        // 老用户把历史用过的内置科目迁移为自定义科目（幂等，仅首次生效）
        ensureBuiltinMigration(session.user.id)
        // 登录后自动结算过期承诺（fire-and-forget，吞错；onAuthStateChange 覆盖 SIGNED_IN 等事件）
        void settleExpiredCommitments(session.user.id).catch(() => {})
        // 登录后立刻尝试补传本机未入库的计时（含掉线期间暂存的那些）
        void runAutoFlush()
      } else {
        resetSubjectCache()
        /* 主动登出才清「进行中的计时」（防止与下一登录用户串用）；
           隐式掉线（token 刷新失败等）保留：待入库队列里的时长还在，
           同号重新登录后会自动补传。
           待入库队列本身任何时候都不清，条目自带归属用户，不会串号。 */
        if (explicitSignOutRef.current) {
          explicitSignOutRef.current = false
          clearTimerLocalState()
        }
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
    explicitSignOutRef.current = true
    // 登出前先把正在计时/专注的时长封存进待入库队列，别让「退出登录」把这段时间吞掉
    bankRunningTimers(user?.id ?? null)
    try {
      await supabase.auth.signOut()
    } finally {
      // 事件回调没及时到达时兜底复位，避免标志长期为真
      window.setTimeout(() => {
        explicitSignOutRef.current = false
      }, 3000)
    }
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
