import { createClient } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

let supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? ''
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''

/** 是否已正确配置 Supabase 环境变量（未配置时 UI 应展示友好错误而非白屏） */
export const isSupabaseConfigured = Boolean(supabaseUrl.trim() && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.error(
    '[Supabase] 缺少环境变量 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY，请检查部署环境配置。\n' +
    '部署平台（Vercel/CloudBase）需要在环境变量中设置这两个值，或在项目根目录提供 .env.production。'
  )
}

// 规范化 URL：
// 1. 去掉首尾空白
// 2. 确保有 https:// 前缀
// 3. 剥离多余的路径后缀（如 /rest/v1、/auth/v1、/storage/v1、/realtime/v1 等）
// 4. 去掉末尾斜杠
// 未配置环境变量时使用占位 URL，避免 createClient 抛错导致整站白屏（错误由 UI 层展示）
const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY = 'placeholder-anon-key'

if (!isSupabaseConfigured) {
  supabaseUrl = PLACEHOLDER_URL
} else {
  try {
    const rawUrl = supabaseUrl.trim()
    const urlObj = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
    // 只保留 protocol + host，丢弃 pathname（用户常误填 /rest/v1 等路径）
    const normalized = `${urlObj.protocol}//${urlObj.hostname}`

    if (import.meta.env.DEV && urlObj.pathname && urlObj.pathname !== '/') {
      console.warn(
        `[Supabase] 自动修正 URL：原 URL 包含多余路径 "${urlObj.pathname}"，已剥离。\n` +
        `  原值: ${supabaseUrl}\n` +
        `  修正: ${normalized}\n` +
        `  建议将 VITE_SUPABASE_URL 改为仅包含域名（无路径）。`
      )
    }

    supabaseUrl = normalized
  } catch {
    // URL 解析失败时，兜底的简单规范化
    if (import.meta.env.DEV) console.warn('[Supabase] URL 解析失败，使用兜底规范化方式')
    supabaseUrl = supabaseUrl.trim().replace(/\/+$/, '')
    // 剥离常见的路径后缀
    supabaseUrl = supabaseUrl.replace(/\/(rest|auth|storage|realtime)\/v\d+.*$/i, '')
    if (!/^https?:\/\//i.test(supabaseUrl)) {
      supabaseUrl = `https://${supabaseUrl}`
    }
  }

  // 验证 Supabase URL 格式：必须是 https://<project-id>.supabase.co 格式
  const supabaseUrlPattern = /^https:\/\/[a-z0-9]+\.supabase\.co$/
  if (import.meta.env.DEV && !supabaseUrlPattern.test(supabaseUrl)) {
    console.warn(
      `[Supabase] URL 格式可能不正确: "${supabaseUrl}"\n` +
      '期望格式: https://<project-id>.supabase.co\n' +
      '请检查 VITE_SUPABASE_URL 是否正确。'
    )
  }
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

/**
 * Capacitor 原生环境下的 Storage Adapter
 * 将 Supabase session 持久化到原生 Preferences（SharedPreferences / NSUserDefaults），
 * 比 WebView 的 localStorage 更可靠，App 升级或系统清理缓存后不会丢失登录态。
 * Web 环境继续使用 Supabase 默认的 localStorage。
 */
const nativeStorageAdapter = {
  getItem: async (key: string) => {
    const { value } = await Preferences.get({ key })
    return value ?? null
  },
  setItem: async (key: string, value: string) => {
    await Preferences.set({ key, value })
  },
  removeItem: async (key: string) => {
    await Preferences.remove({ key })
  },
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : PLACEHOLDER_URL,
  isSupabaseConfigured ? supabaseAnonKey : PLACEHOLDER_KEY,
  {
    global: {
      fetch: fetchWithTimeout,
    },
    auth: {
      // 原生环境用 Preferences 存储 session；Web 环境用默认 localStorage
      storage: Capacitor.isNativePlatform() ? nativeStorageAdapter : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

/** 最新 APK 下载地址（Supabase Storage 公开桶，作为网站/App 的 APK 下载源） */
export const apkDownloadUrl = supabase.storage
  .from('ota-bundles')
  .getPublicUrl('DiveDeep.apk').data.publicUrl
