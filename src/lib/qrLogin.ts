import { supabase } from './supabase'

/** 扫码登录网站地址（手机扫码打开的页面） */
const QR_LOGIN_SITE = 'https://notoday-code-app-d3ggyfrxu0f39d17f.webapps.tcloudbase.com'

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
    qrUrl: `${QR_LOGIN_SITE}/#/qr-login?token=${token}`,
  }
}

/** 桌面端：轮询扫码状态，成功时返回 session tokens */
export function pollQrSession(
  token: string,
  onStatus: (status: string) => void,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now()

    const poll = async () => {
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

      if (error) {
        reject(new Error('查询扫码状态失败：' + error.message))
        return
      }

      if (!data) {
        reject(new Error('扫码会话不存在'))
        return
      }

      onStatus(data.status)

      if (data.status === 'confirmed' && data.session_access_token && data.session_refresh_token) {
        // 拿到 session 后删除该行
        await supabase.from('qr_login_sessions').delete().eq('token', token)
        resolve({
          accessToken: data.session_access_token,
          refreshToken: data.session_refresh_token,
        })
        return
      }

      if (data.status === 'expired') {
        resolve(null)
        return
      }

      setTimeout(poll, POLL_INTERVAL)
    }

    poll()
  })
}

/** 手机端：确认登录，将当前 session 写入扫码会话 */
export async function confirmQrLogin(
  token: string,
): Promise<{ error: string | null }> {
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData.session
  if (!session) {
    return { error: '请先登录后再确认' }
  }

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
