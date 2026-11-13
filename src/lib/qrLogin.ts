import { supabase } from './supabase'
import { APP_SITE_URL } from './appLinks'

/** 轮询间隔 */
const POLL_INTERVAL = 2000

/** 超时时间（5 分钟） */
const TIMEOUT_MS = 5 * 60 * 1000

export interface QrSession {
  token: string
  status: 'pending' | 'confirmed' | 'expired'
  session_access_token: string | null
  session_refresh_token: string | null
}

/** 生成随机 token */
function generateToken(): string {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** 桌面端：创建扫码登录会话，返回二维码内容 URL */
export async function createQrSession(): Promise<{ token: string; qrUrl: string }> {
  const token = generateToken()
  const { error } = await supabase.from('qr_login_sessions').insert({
    token,
    status: 'pending',
  })
  if (error) throw new Error('创建扫码会话失败：' + error.message)
  return {
    token,
    qrUrl: `${APP_SITE_URL}/#/qr-login?token=${token}`,
  }
}

/** 轮询控制句柄：调用方可通过 cancelled = true 终止轮询 */
export interface PollHandle {
  cancelled: boolean
}

/** 桌面端：轮询扫码状态，成功时返回 session tokens */
export function pollQrSession(
  token: string,
  onStatus: (status: string) => void,
): { promise: Promise<{ accessToken: string; refreshToken: string } | null>; handle: PollHandle } {
  const handle: PollHandle = { cancelled: false }

  const promise = new Promise<{ accessToken: string; refreshToken: string } | null>((resolve, reject) => {
    const startedAt = Date.now()
    let timerId: ReturnType<typeof setTimeout> | null = null

    const poll = async () => {
      if (handle.cancelled) {
        resolve(null)
        return
      }

      if (Date.now() - startedAt > TIMEOUT_MS) {
        onStatus('expired')
        resolve(null)
        return
      }

      const { data, error } = await supabase
        .from('qr_login_sessions')
        .select('status, session_access_token, session_refresh_token')
        .eq('token', token)
        .maybeSingle()

      if (handle.cancelled) {
        resolve(null)
        return
      }

      if (error) {
        reject(new Error('查询扫码状态失败：' + error.message))
        return
      }

      if (!data) {
        reject(new Error('扫码会话不存在'))
        return
      }

      const status = data.status as 'pending' | 'confirmed' | 'expired'
      onStatus(status)

      if (status === 'confirmed' && data.session_access_token && data.session_refresh_token) {
        const { error: delErr } = await supabase.from('qr_login_sessions').delete().eq('token', token)
        if (delErr) {
          console.warn('[qr-login] 删除已消费的 token 行失败，session tokens 可能仍存在于数据库中', delErr)
        }
        resolve({
          accessToken: data.session_access_token,
          refreshToken: data.session_refresh_token,
        })
        return
      }

      if (status === 'expired') {
        resolve(null)
        return
      }

      timerId = setTimeout(poll, POLL_INTERVAL)
    }

    poll()

    // 暴露清理：handle.cancelled = true 时下一次 poll 会提前 return
    // 同时提供 cleanup 让调用方可清除残留 timer
    return () => {
      if (timerId) clearTimeout(timerId)
    }
  })

  return { promise, handle }
}

/**
 * 是否为「服务端会话已失效」类错误。
 * getSession 只读本地缓存：token 没到期不代表服务端还有这个 session
 * （其他设备全局登出、刷新令牌轮换/复用检测都会把 session 直接删掉），
 * 此时把本地 token 写进扫码表，桌面端 setSession 只会报一句
 * 难以理解的 "Auth session missing!"。
 */
function isInvalidSessionError(err: { name?: string; status?: number; message?: string }): boolean {
  const msg = err.message ?? ''
  return (
    err.name === 'AuthSessionMissingError' ||
    err.status === 401 ||
    err.status === 403 ||
    /session_not_found|Auth session missing|Invalid Refresh Token/i.test(msg)
  )
}

/** 手机端：确认登录，将当前 session 写入扫码会话 */
export async function confirmQrLogin(
  token: string,
): Promise<{ error: string | null }> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) {
    return { error: '请先登录后再确认' }
  }

  // 先做一次服务端校验，确认这套 session 在服务端仍然有效再交给桌面端
  const { error: verifyError } = await supabase.auth.getUser()
  if (verifyError) {
    if (verifyError.name === 'AuthRetryableFetchError' || !verifyError.status) {
      return { error: '网络错误，请检查连接后重试' }
    }
    if (isInvalidSessionError(verifyError)) {
      return { error: '手机端登录状态已失效，请重新登录后再扫码确认' }
    }
    return { error: '确认失败：' + verifyError.message }
  }

  // 校验过程中可能触发过 token 刷新（refresh token 会轮换），以最新 session 为准
  const { data: latestData } = await supabase.auth.getSession()
  const session = latestData.session ?? sessionData.session

  const { error } = await supabase
    .from('qr_login_sessions')
    .update({
      status: 'confirmed',
      session_access_token: session.access_token,
      session_refresh_token: session.refresh_token,
      user_id: session.user.id,
      confirmed_at: new Date().toISOString(),
    })
    .eq('token', token)

  if (error) {
    return { error: '确认失败：' + error.message }
  }

  return { error: null }
}

/** 手机端：查询 token 是否存在且有效 */
export async function checkQrToken(token: string): Promise<QrSession | null> {
  const { data, error } = await supabase
    .from('qr_login_sessions')
    .select('token, status, session_access_token, session_refresh_token')
    .eq('token', token)
    .maybeSingle()

  if (error || !data) return null
  return data as QrSession
}
