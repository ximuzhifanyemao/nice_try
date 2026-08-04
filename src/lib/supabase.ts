import { createClient } from '@supabase/supabase-js'

let supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? ''
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '缺少 Supabase 环境变量，请检查 .env 文件。\n' +
    '需要设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY'
  )
}

// 规范化 URL：
// 1. 去掉首尾空白
// 2. 确保有 https:// 前缀
// 3. 剥离多余的路径后缀（如 /rest/v1、/auth/v1、/storage/v1、/realtime/v1 等）
// 4. 去掉末尾斜杠
try {
  const rawUrl = supabaseUrl.trim()
  const urlObj = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
  // 只保留 protocol + host，丢弃 pathname（用户常误填 /rest/v1 等路径）
  const normalized = `${urlObj.protocol}//${urlObj.hostname}`

  if (urlObj.pathname && urlObj.pathname !== '/') {
    console.warn(
      `[Supabase] 自动修正 URL：原 URL 包含多余路径 "${urlObj.pathname}"，已剥离。\n` +
      `  原值: ${supabaseUrl}\n` +
      `  修正: ${normalized}\n` +
      `  建议在 Vercel 环境变量中将 VITE_SUPABASE_URL 改为仅包含域名（无路径）。`
    )
  }

  supabaseUrl = normalized
} catch (e) {
  // URL 解析失败时，兜底的简单规范化
  console.warn('[Supabase] URL 解析失败，使用兜底规范化方式')
  supabaseUrl = supabaseUrl.trim().replace(/\/+$/, '')
  // 剥离常见的路径后缀
  supabaseUrl = supabaseUrl.replace(/\/(rest|auth|storage|realtime)\/v\d+.*$/i, '')
  if (!/^https?:\/\//i.test(supabaseUrl)) {
    supabaseUrl = `https://${supabaseUrl}`
  }
}

// 验证 Supabase URL 格式：必须是 https://<project-id>.supabase.co 格式
const supabaseUrlPattern = /^https:\/\/[a-z0-9]+\.supabase\.co$/
if (!supabaseUrlPattern.test(supabaseUrl)) {
  console.warn(
    `[Supabase] URL 格式可能不正确: "${supabaseUrl}"\n` +
    '期望格式: https://<project-id>.supabase.co\n' +
    '请检查 Vercel 环境变量 VITE_SUPABASE_URL 是否正确。'
  )
}

// 带超时的 fetch 封装，避免在移动端因网络问题长时间挂起
const REQUEST_TIMEOUT_MS = 10000 // 10 秒超时

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  return fetch(input, {
    ...init,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId))
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: fetchWithTimeout,
  },
})
