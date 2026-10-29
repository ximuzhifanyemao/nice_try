// 生词本离线查词：优先本地离线考研词典（0 费用），其次用户自己配置的大模型，
// 未配置时才回退到腾讯云 SCF / Supabase Edge Function。
import { loadOfflineDict } from '../data/offlineDict'
import { supabase } from './supabase'
import { postJson } from './httpRequest'
import {
  chatCompletion,
  extractJsonObject,
  isAiConfigured,
  loadAiConfig,
  LOOKUP_SYSTEM_PROMPT,
  lookupUserPrompt,
} from './aiModel'

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

// ---------- 本地离线词典查询（0 费用，优先于 AI） ----------

/** 简单词形还原，匹配离线词库中的原形词（不足 3 字母直接返回原样） */
function stemWord(w: string, dict: Record<string, string>): string {
  if (w.length <= 3) return w
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3)
  if (w.endsWith('ied') && w.length > 4) return w.slice(0, -3) + 'y'
  if (w.endsWith('ed') && w.length > 4 && !w.endsWith('eed')) return w.slice(0, -2)
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y'
  if (w.endsWith('es') && w.length > 4 && dict[w.slice(0, -2)]) return w.slice(0, -2)
  if (w.endsWith('s') && w.length > 3 && dict[w.slice(0, -1)] && !w.endsWith('ss') && !w.endsWith('us')) return w.slice(0, -1)
  return w
}

/** 从离线词库查询释义（未收录返回 null）；词库为独立懒加载 chunk，首次调用时加载 */
export async function lookupOffline(word: string): Promise<WordLookup | null> {
  const dict = await loadOfflineDict()
  const w = word.toLowerCase()
  const meaning = dict[w] || dict[stemWord(w, dict)]
  if (!meaning) return null
  return {
    word: w,
    phonetic: '',
    meanings: meaning.split(/[；;]/).map((s) => s.trim()).filter(Boolean),
    mnemonic: '',
    collocations: [],
    example: '',
    examNote: '',
  }
}

// ---------- 调用后端查词（离线未收录时兜底） ----------

function normalizeAiLookup(raw: Record<string, unknown> | null, word: string, content: string): WordLookup {
  if (!raw) {
    return {
      word,
      phonetic: '',
      meanings: [],
      mnemonic: `（未获取结构化词条，以下是 AI 原始输出）\n\n${content}`,
      collocations: [],
      example: '',
      examNote: '',
    }
  }
  const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))
  const strArr = (v: unknown) =>
    Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : []
  return {
    word: str(raw.word) || word,
    phonetic: str(raw.phonetic),
    meanings: strArr(raw.meanings),
    mnemonic: str(raw.mnemonic),
    collocations: strArr(raw.collocations),
    example: str(raw.example),
    examNote: str(raw.examNote),
  }
}

/** 查询单词的考研释义：缓存 → 本地离线词典 → 用户模型 → 云函数兜底 */
export async function lookupWord(word: string): Promise<WordLookup> {
  const cached = getCachedLookup(word)
  if (cached) return cached

  // 本地离线词典优先，0 费用；词典 chunk 加载失败时静默降级走 AI
  try {
    const offline = await lookupOffline(word)
    if (offline) return offline
  } catch { /* 词典加载失败，降级 AI */ }

  let result: WordLookup
  const aiConfig = loadAiConfig()
  if (isAiConfigured(aiConfig)) {
    const content = await chatCompletion(
      aiConfig,
      [
        { role: 'system', content: LOOKUP_SYSTEM_PROMPT },
        { role: 'user', content: lookupUserPrompt(word) },
      ],
      { maxTokens: 1200, timeoutMs: 45000 },
    )
    result = normalizeAiLookup(extractJsonObject(content), word, content)
  } else if (AI_CORRECT_URL) {
    // 腾讯云 SCF 云函数；原生平台用原生网络栈，绕开 WebView fetch 崩溃黑屏。
    // 查词给较短超时，云函数不可用时尽快落到提示词兜底，不让用户干等。
    const { ok, status, body } = await postJson(AI_CORRECT_URL, { action: 'lookup', word }, 15000)
    if (!ok || !body?.ok) throw new Error(body?.error || `AI 查词失败（${status}）`)
    result = body.data
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
