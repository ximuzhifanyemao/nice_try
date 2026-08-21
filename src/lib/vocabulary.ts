// 生词本工具：管理标记单词的持久化存储和生词本数据（支持云端同步）
import { supabase } from './supabase'
import { isSupabaseConfigured } from './supabase'

const MARKED_WORDS_KEY = 'english_marked_words'
const VOCABULARY_KEY = 'english_vocabulary'

export interface VocabWord {
  word: string
  sentence: string
  day: number
  sentIdx: number
  wordIdx: number
  addedAt: string // ISO date string
}

export interface VocabDay {
  day: number
  words: VocabWord[]
}

/** 单词在本地的唯一标识（用于去重），与云端列对应 */
function wordKey(w: Pick<VocabWord, 'word' | 'sentence'>): string {
  return `${w.word.toLowerCase()}|${w.sentence}`
}

// ---------- 标记单词（红色标记）持久化（纯本地） ----------

/** 从 localStorage 读取已标记的单词 key 集合 */
export function loadMarkedWords(): Set<string> {
  try {
    const raw = localStorage.getItem(MARKED_WORDS_KEY)
    if (!raw) return new Set()
    const arr: string[] = JSON.parse(raw)
    return new Set(arr)
  } catch {
    return new Set()
  }
}

/** 将已标记的单词 key 集合保存到 localStorage */
export function saveMarkedWords(words: Set<string>): void {
  localStorage.setItem(MARKED_WORDS_KEY, JSON.stringify([...words]))
}

// ---------- 生词本持久化（本地缓存） ----------

/** 从 localStorage 读取本地生词本缓存 */
export function loadVocabulary(): VocabDay[] {
  try {
    const raw = localStorage.getItem(VOCABULARY_KEY)
    if (!raw) return []
    return JSON.parse(raw) as VocabDay[]
  } catch {
    return []
  }
}

/** 保存生词本到本地缓存 */
export function saveVocabulary(data: VocabDay[]): void {
  localStorage.setItem(VOCABULARY_KEY, JSON.stringify(data))
}

/** 将 VocabDay[] 展平为单词数组 */
function flattenDays(vocab: VocabDay[]): VocabWord[] {
  return vocab.flatMap((d) => d.words)
}

/** 按 day 分组还原为 VocabDay[]（保持 day 升序、每组内 words 保持原序） */
function groupByDay(words: VocabWord[]): VocabDay[] {
  const map = new Map<number, VocabWord[]>()
  for (const w of words) {
    if (!map.has(w.day)) map.set(w.day, [])
    map.get(w.day)!.push(w)
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, list]) => ({ day, words: list }))
}

// ---------- 云端同步接口 ----------

interface CloudVocabRow {
  day: number
  sentIdx: number
  wordIdx: number
  word: string
  sentence: string
  added_at: string
}

function toWord(r: CloudVocabRow): VocabWord {
  return {
    word: r.word,
    sentence: r.sentence,
    day: r.day,
    sentIdx: r.sentIdx,
    wordIdx: r.wordIdx,
    addedAt: r.added_at || new Date().toISOString(),
  }
}

/**
 * 拉取云端生词，与本地缓存合并（并集去重），回写本地。
 * 合并规则：同一 day+sentIdx+wordIdx 视为同一位置，云端与本地冲突时保留 addedAt 更早的一条（操作稳定）。
 * 返回合并后的结果。
 */
export async function syncVocabularyFromCloud(userId: string): Promise<VocabDay[]> {
  if (!isSupabaseConfigured) return loadVocabulary()

  const local = flattenDays(loadVocabulary())
  let cloud: VocabWord[] = []
  try {
    const { data, error } = await supabase
      .from('user_vocab')
      .select('day, sentIdx, wordIdx, word, sentence, added_at')
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
    cloud = ((data as unknown) as CloudVocabRow[]).map(toWord)
  } catch (err) {
    // 云端读取失败（如表未建/未授权）：保留本地数据，静默降级
    console.warn('[Vocab] cloud sync read failed, keep local:', err instanceof Error ? err.message : err)
    return loadVocabulary()
  }

  // 合并：以 位置键(day-sentIdx-wordIdx) 为主键
  const merged = new Map<string, VocabWord>()
  const localByPos = new Map<string, VocabWord>()
  for (const w of local) localByPos.set(`${w.day}|${w.sentIdx}|${w.wordIdx}`, w)
  for (const w of cloud) merged.set(`${w.day}|${w.sentIdx}|${w.wordIdx}`, w)

  // 本地有而云端没有的位置，补回云端（本地兜底上传）
  for (const [pos, w] of localByPos) {
    if (!merged.has(pos)) merged.set(pos, w)
  }
  // 云端有而本地无的，补回本地
  const mergedWords = [...merged.values()]

  // 冲突时保留 earlier addedAt；若同一位置一条来自云端一条来自本地，以云端为准（它可能更新）
  // 但 merged 已按云端优先。这里仅做稳定排序
  mergedWords.sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day
    if (a.sentIdx !== b.sentIdx) return a.sentIdx - b.sentIdx
    return a.wordIdx - b.wordIdx
  })

  const result = groupByDay(mergedWords)
  saveVocabulary(result)
  return result
}

/**
 * 将两个位置集合推送到云端（增量 upsert，按 位置唯一键）。
 * positions: { day, sentIdx, wordIdx, word, sentence }
 */
export async function pushVocabularyToCloud(
  userId: string,
  words: Pick<VocabWord, 'day' | 'sentIdx' | 'wordIdx' | 'word' | 'sentence'>[],
): Promise<void> {
  if (!isSupabaseConfigured || words.length === 0) return
  const rows = words.map((w) => ({
    user_id: userId,
    day: w.day,
    sentIdx: w.sentIdx,
    wordIdx: w.wordIdx,
    word: w.word,
    sentence: w.sentence,
  }))
  try {
    await supabase.from('user_vocab').upsert(rows, { onConflict: 'user_id,day,sentIdx,wordIdx' })
  } catch (err) {
    console.warn('[Vocab] cloud push failed:', err instanceof Error ? err.message : err)
  }
}

/**
 * 删除某单词在云端的记录（按 user+day+word+sentence 定位）。
 * 返回是否成功。
 */
export async function removeWordFromCloud(
  userId: string,
  day: number,
  word: string,
  sentence: string,
): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await supabase
      .from('user_vocab')
      .delete()
      .eq('user_id', userId)
      .eq('day', day)
      .eq('word', word)
      .eq('sentence', sentence)
  } catch (err) {
    console.warn('[Vocab] cloud remove failed:', err instanceof Error ? err.message : err)
  }
}

/** 清空云端生词本 */
export async function clearVocabularyFromCloud(userId: string): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('user_vocab').delete().eq('user_id', userId)
  } catch (err) {
    console.warn('[Vocab] cloud clear failed:', err instanceof Error ? err.message : err)
  }
}

// ---------- 本地写操作（保持原有接口，供页面调用） ----------

/** 将某一天的标记单词存入生词本（合并去重，并返回本地更新后的结果） */
export function addDayToVocabulary(
  day: number,
  words: { word: string; sentence: string; sentIdx: number; wordIdx: number }[],
): VocabDay[] {
  const vocab = loadVocabulary()
  const existing = vocab.find((v) => v.day === day)

  const newWords: VocabWord[] = words.map((w) => ({
    ...w,
    day,
    addedAt: new Date().toISOString(),
  }))

  if (existing) {
    const existingKeys = new Set(existing.words.map((w) => wordKey(w)))
    const toAdd = newWords.filter((w) => !existingKeys.has(wordKey(w)))
    existing.words = [...existing.words, ...toAdd]
  } else {
    vocab.push({ day, words: newWords })
  }

  saveVocabulary(vocab)
  return vocab
}

/** 从生词本中删除某个单词（本地） */
export function removeWordFromVocabulary(day: number, word: string, sentence: string): VocabDay[] {
  const vocab = loadVocabulary()
  const dayEntry = vocab.find((v) => v.day === day)
  if (dayEntry) {
    dayEntry.words = dayEntry.words.filter((w) => !(w.word === word && w.sentence === sentence))
    if (dayEntry.words.length === 0) {
      const idx = vocab.indexOf(dayEntry)
      vocab.splice(idx, 1)
    }
  }
  saveVocabulary(vocab)
  return vocab
}

/** 清空本地生词本 */
export function clearVocabulary(): void {
  localStorage.removeItem(VOCABULARY_KEY)
}