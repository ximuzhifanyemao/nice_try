// 生词本 AI 查词：调用 AI 翻译批改云函数（腾讯云 SCF / Supabase Edge Function）查询考研单词释义
import { supabase } from './supabase'

export interface WordLookup {
  word: string
  phonetic: string
  meanings: string[]
  mnemonic: string
  collocations: string[]
  example: string
  examNote: string
}

// 优先走腾讯云 SCF 云函数（国内节点直连讯飞，稳定快速）；未配置时回退到 Supabase Edge Function
const AI_CORRECT_URL = (import.meta.env.VITE_AI_CORRECT_URL as string | undefined)?.trim() || ''

const LOOKUP_CACHE_KEY = 'english_word_lookup_cache'

// ---------- 本地缓存（按单词缓存，重复查看不消耗 token） ----------

export function loadLookupCache(): Record<string, WordLookup> {
  try {
    const raw = localStorage.getItem(LOOKUP_CACHE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, WordLookup>
  } catch {
    return {}
  }
}

function saveLookupCache(cache: Record<string, WordLookup>): void {
  try {
    localStorage.setItem(LOOKUP_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // 缓存写入失败时静默忽略，不影响查词
  }
}

/** 读取某个单词的缓存结果（无则返回 null） */
export function getCachedLookup(word: string): WordLookup | null {
  const key = word.toLowerCase()
  return loadLookupCache()[key] || null
}

// ---------- 调用后端查词 ----------

/** 查询单词的考研释义，命中缓存直接返回，否则调用后端并写入缓存 */
export async function lookupWord(word: string): Promise<WordLookup> {
  const cached = getCachedLookup(word)
  if (cached) return cached

  let result: WordLookup
  if (AI_CORRECT_URL) {
    // 腾讯云 SCF 云函数；加超时防止 WebView 长时间挂起导致黑屏
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 30000)
    try {
      const resp = await fetch(AI_CORRECT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'lookup', word }),
        signal: controller.signal,
      })
      const json = await resp.json().catch(() => ({}))
      if (!resp.ok || !json.ok) throw new Error(json.error || `AI 查词失败（${resp.status}）`)
      result = json.data
    } finally {
      clearTimeout(timer)
    }
  } else {
    // 兜底：Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('ai-correct', {
      body: { action: 'lookup', word },
    })
    if (error) throw new Error(error.message || 'AI 查词失败')
    result = data as WordLookup
  }

  const cache = loadLookupCache()
  cache[word.toLowerCase()] = result
  saveLookupCache(cache)
  return result
}
