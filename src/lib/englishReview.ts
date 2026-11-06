// 英语长难句「逐句自评 + 待复习」：
// 每句精读后按三档自评（全对 / 1-2 处有误 / 多处不懂），
// 非「全对」的句子自动进入待复习清单，回看时重新标为「全对」即自动移出。
// 数据按用户存本机 localStorage，结构与阅读进度一致，按 `${userKey}:${day}` 分天；
// 登录后同时写入 Supabase（english_assessments 表）实现跨设备同步：
// 本地秒出 → 后台拉取云端合并（同一句按时间戳新者胜）→ 本地有而云端缺的兜底上传。
import { supabase, isSupabaseConfigured } from './supabase'
import type { VocabWord } from './vocabulary'

export type AssessmentLevel = 'full' | 'minor' | 'many'

export const ASSESSMENT_LEVELS: AssessmentLevel[] = ['full', 'minor', 'many']

export const ASSESSMENT_META: Record<AssessmentLevel, { label: string; hint: string }> = {
  full: { label: '全对', hint: '完全读懂，不进入复习' },
  minor: { label: '1-2 处有误', hint: '个别地方没把握' },
  many: { label: '多处不懂', hint: '需要重点复习' },
}

const ASSESSMENT_KEY = 'kaoyan_english_assessments'

interface AssessmentRecord {
  level: AssessmentLevel
  at: string
}

/** 外层键 `${userKey}:${day}`，内层键句子下标 */
type AssessmentStore = Record<string, Record<string, AssessmentRecord>>

function isLevel(value: unknown): value is AssessmentLevel {
  return value === 'full' || value === 'minor' || value === 'many'
}

function readStore(): AssessmentStore {
  try {
    const raw = localStorage.getItem(ASSESSMENT_KEY)
    if (!raw) return {}
    const obj = JSON.parse(raw) as AssessmentStore
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {}
  } catch {
    return {}
  }
}

function writeStore(store: AssessmentStore): void {
  try {
    localStorage.setItem(ASSESSMENT_KEY, JSON.stringify(store))
  } catch {
    /* 配额异常时忽略 */
  }
}

export interface SentenceAssessment {
  sentIdx: number
  level: AssessmentLevel
  at: string
}

/** 某用户某天每句的自评（按句子顺序） */
export function loadDayAssessments(userKey: string, day: number): SentenceAssessment[] {
  const dayMap = readStore()[`${userKey}:${day}`]
  if (!dayMap) return []

  const out: SentenceAssessment[] = []
  for (const [key, record] of Object.entries(dayMap)) {
    const sentIdx = Number(key)
    if (!Number.isInteger(sentIdx) || sentIdx < 0) continue
    if (!record || !isLevel(record.level)) continue
    out.push({
      sentIdx,
      level: record.level,
      at: typeof record.at === 'string' ? record.at : '',
    })
  }
  return out.sort((a, b) => a.sentIdx - b.sentIdx)
}

/** 记录某一句的自评，返回该天更新后的全部自评 */
export function saveSentenceAssessment(
  userKey: string,
  day: number,
  sentIdx: number,
  level: AssessmentLevel,
): SentenceAssessment[] {
  const store = readStore()
  const key = `${userKey}:${day}`
  const dayMap = store[key] ?? {}
  dayMap[String(sentIdx)] = { level, at: new Date().toISOString() }
  store[key] = dayMap
  writeStore(store)
  return loadDayAssessments(userKey, day)
}

export interface ReviewItem extends SentenceAssessment {
  day: number
}

/** 某用户全部待复习句子（跨天，按 Day / 句子顺序） */
export function loadReviewItems(userKey: string): ReviewItem[] {
  const store = readStore()
  const prefix = `${userKey}:`
  const items: ReviewItem[] = []

  for (const [key, dayMap] of Object.entries(store)) {
    if (!key.startsWith(prefix) || !dayMap || typeof dayMap !== 'object') continue
    const day = Number(key.slice(prefix.length))
    if (!Number.isInteger(day) || day < 1) continue

    for (const [sentKey, record] of Object.entries(dayMap)) {
      const sentIdx = Number(sentKey)
      if (!Number.isInteger(sentIdx) || sentIdx < 0) continue
      if (!record || !isLevel(record.level) || record.level === 'full') continue
      items.push({
        day,
        sentIdx,
        level: record.level,
        at: typeof record.at === 'string' ? record.at : '',
      })
    }
  }

  return items.sort((a, b) => a.day - b.day || a.sentIdx - b.sentIdx)
}

// ---------- 综合复习队列（待复习句子 + 生词本穿插） ----------

export type ReviewSessionStep =
  | { kind: 'sentence'; day: number; sentIdx: number }
  | { kind: 'word'; word: VocabWord }

/**
 * 把待复习句子与生词本单词交错成一个复习队列：
 * - 每个句子先入队，再在其后按需插入 1 个生词，形成「句子 → 生词 → 句子」的节奏；
 * - 生词优先选与待复习句同句、同天、再其余生词，最多插入 min(生词数, 句子数) 个，不重复；
 * - 生词少于句子时按均匀间隔插入，不会全部堆在开头或结尾；
 * - 没有生词时退化为纯句子队列。
 */
export function buildReviewMix(
  items: ReviewItem[],
  vocabWords: VocabWord[],
): ReviewSessionStep[] {
  const steps: ReviewSessionStep[] = items.map((item) => ({
    kind: 'sentence',
    day: item.day,
    sentIdx: item.sentIdx,
  }))
  if (items.length === 0 || vocabWords.length === 0) return steps

  // 去重，避免同一单词 + 同一例句在一次会话里出现多次
  const seen = new Set<string>()
  const unique = vocabWords.filter((w) => {
    const key = `${w.word.toLowerCase()}|${w.sentence}`
    if (!w.word || seen.has(key)) return false
    seen.add(key)
    return true
  })
  if (unique.length === 0) return steps

  const sentenceKeys = new Set(items.map((i) => `${i.day}|${i.sentIdx}`))
  const dayKeys = new Set(items.map((i) => i.day))
  const prioritized = [
    ...unique.filter((w) => sentenceKeys.has(`${w.day}|${w.sentIdx}`)),
    ...unique.filter(
      (w) => !sentenceKeys.has(`${w.day}|${w.sentIdx}`) && dayKeys.has(w.day),
    ),
    ...unique.filter((w) => !dayKeys.has(w.day)),
  ]

  // 一次会话最多每个句子配一个生词，避免复习时间被生词本无限拉长
  const count = Math.min(prioritized.length, items.length)
  const chosen = prioritized.slice(0, count)
  const wordAfter = new Map<number, VocabWord>()
  for (let j = 0; j < count; j++) {
    const idx = Math.min(
      items.length - 1,
      Math.floor(((j + 1) * items.length) / (count + 1)),
    )
    wordAfter.set(idx, chosen[j])
  }

  const out: ReviewSessionStep[] = []
  items.forEach((item, i) => {
    out.push({ kind: 'sentence', day: item.day, sentIdx: item.sentIdx })
    const word = wordAfter.get(i)
    if (word) out.push({ kind: 'word', word })
  })
  return out
}

// ---------- 云端同步（english_assessments 表） ----------

interface CloudAssessmentRow {
  day: number
  sent_idx: number
  level: string
  updated_at: string | null
}

/** 解析 ISO 时间戳；无效值按 0 处理（比任何有效时间都旧） */
function tsOf(iso: string | null | undefined): number {
  if (!iso) return 0
  const t = Date.parse(iso)
  return Number.isNaN(t) ? 0 : t
}

/**
 * 拉取云端自评，与本地合并后回写本地，并把本地较新的记录兜底上传。
 * 合并规则：同一句 (day, sent_idx) 按时间戳新者胜（重新自评会覆盖旧档位）。
 * 返回是否成功与云端通信（失败时本地数据原样保留，界面无需刷新）。
 */
export async function syncAssessmentsFromCloud(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false

  let cloudRows: CloudAssessmentRow[] = []
  try {
    const { data, error } = await supabase
      .from('english_assessments')
      .select('day, sent_idx, level, updated_at')
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
    cloudRows = (data as unknown as CloudAssessmentRow[] | null) ?? []
  } catch (err) {
    // 云端读取失败（如表未建/未授权/离线）：保留本地数据，静默降级
    console.warn('[Assess] cloud sync read failed, keep local:', err instanceof Error ? err.message : err)
    return false
  }

  const cloudByPos = new Map<string, CloudAssessmentRow>()
  for (const row of cloudRows) {
    if (!Number.isInteger(row.day) || !Number.isInteger(row.sent_idx)) continue
    if (!isLevel(row.level)) continue
    cloudByPos.set(`${row.day}|${row.sent_idx}`, row)
  }

  const store = readStore()
  const prefix = `${userId}:`
  const toPush: {
    user_id: string
    day: number
    sent_idx: number
    level: AssessmentLevel
    updated_at: string
  }[] = []

  // 本地较新（或云端缺失）的记录：推送到云端
  for (const [key, dayMap] of Object.entries(store)) {
    if (!key.startsWith(prefix) || !dayMap || typeof dayMap !== 'object') continue
    const day = Number(key.slice(prefix.length))
    if (!Number.isInteger(day) || day < 1) continue
    for (const [sentKey, record] of Object.entries(dayMap)) {
      const sentIdx = Number(sentKey)
      if (!Number.isInteger(sentIdx) || sentIdx < 0) continue
      if (!record || !isLevel(record.level)) continue
      const cloud = cloudByPos.get(`${day}|${sentIdx}`)
      if (!cloud || tsOf(record.at) > tsOf(cloud.updated_at)) {
        toPush.push({
          user_id: userId,
          day,
          sent_idx: sentIdx,
          level: record.level,
          updated_at: record.at || new Date().toISOString(),
        })
      }
    }
  }

  // 云端较新（或本地缺失）的记录：写回本地
  for (const row of cloudByPos.values()) {
    const dayKey = `${prefix}${row.day}`
    const local = store[dayKey]?.[String(row.sent_idx)]
    if (!local || tsOf(row.updated_at) > tsOf(local.at)) {
      const dayMap = store[dayKey] ?? {}
      dayMap[String(row.sent_idx)] = {
        level: row.level as AssessmentLevel,
        at: row.updated_at ?? new Date().toISOString(),
      }
      store[dayKey] = dayMap
    }
  }
  writeStore(store)

  if (toPush.length > 0) {
    try {
      await supabase
        .from('english_assessments')
        .upsert(toPush, { onConflict: 'user_id,day,sent_idx' })
    } catch (err) {
      // 上传失败不影响本地已合并的结果，下次同步会重试
      console.warn('[Assess] cloud backfill failed:', err instanceof Error ? err.message : err)
    }
  }
  return true
}

/** 单句自评写入云端（fire-and-forget，失败不阻塞本地流程） */
export async function pushAssessmentToCloud(
  userId: string,
  day: number,
  sentIdx: number,
  level: AssessmentLevel,
): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('english_assessments').upsert(
      [
        {
          user_id: userId,
          day,
          sent_idx: sentIdx,
          level,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'user_id,day,sent_idx' },
    )
  } catch (err) {
    console.warn('[Assess] cloud push failed:', err instanceof Error ? err.message : err)
  }
}
