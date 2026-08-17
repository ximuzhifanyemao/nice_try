// 统一的 POST JSON 请求封装：
// - 原生平台走 Capacitor 原生 HTTP（OkHttp 网络栈），绕开某些 Android WebView 对特定域名
//   fetch 时崩溃/黑屏的问题（如 OPPO/vivo ColorOS 上访问腾讯云 SCF 函数地址）。
// - Web 端回退到标准 fetch，并带 AbortController 超时。
import { Capacitor, CapacitorHttp } from '@capacitor/core'

export interface JsonPostResult {
  ok: boolean
  status: number
  /** 已解析的响应体（异常时为 {}） */
  body: any
}

/** 制造一个 name='AbortError' 的错误，让上层统一按"超时"提示 */
function timeoutError(): Error {
  const e = new Error('timeout')
  e.name = 'AbortError'
  return e
}

export async function postJson(url: string, body: unknown, timeoutMs = 30000): Promise<JsonPostResult> {
  if (Capacitor.isNativePlatform() && typeof CapacitorHttp?.post === 'function') {
    // 原生网络栈：走 CapacitorHttp，用 Promise.race 兜底超时
    return await Promise.race([
      CapacitorHttp.post({
        url,
        headers: { 'Content-Type': 'application/json' },
        data: body,
      }).then(
        (res) => ({
          ok: res.status >= 200 && res.status < 300,
          status: res.status,
          body: res.data,
        })
      ),
      new Promise<never>((_, reject) => setTimeout(() => reject(timeoutError()), timeoutMs)),
    ])
  }

  // Web 端 / 无原生桥：标准 fetch + AbortController 超时
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const json = await resp.json().catch(() => ({}))
    return { ok: resp.ok, status: resp.status, body: json }
  } finally {
    clearTimeout(timer)
  }
}