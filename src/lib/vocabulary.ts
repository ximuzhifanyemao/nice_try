// 生词本工具：管理标记单词的持久化存储和生词本数据

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

// ---------- 标记单词（红色标记）持久化 ----------

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

// ---------- 生词本持久化 ----------

/** 从 localStorage 读取生词本数据 */
export function loadVocabulary(): VocabDay[] {
  try {
    const raw = localStorage.getItem(VOCABULARY_KEY)
    if (!raw) return []
    return JSON.parse(raw) as VocabDay[]
  } catch {
    return []
  }
}

/** 保存生词本数据到 localStorage */
export function saveVocabulary(data: VocabDay[]): void {
  localStorage.setItem(VOCABULARY_KEY, JSON.stringify(data))
}

/** 将某一天的标记单词存入生词本（合并去重） */
export function addDayToVocabulary(
  day: number,
  words: { word: string; sentence: string; sentIdx: number; wordIdx: number }[]
): VocabDay[] {
  const vocab = loadVocabulary()
  const existing = vocab.find((v) => v.day === day)

  const newWords: VocabWord[] = words.map((w) => ({
    ...w,
    day,
    addedAt: new Date().toISOString(),
  }))

  if (existing) {
    // 合并去重：按 word + sentence 去重
    const existingKeys = new Set(existing.words.map((w) => `${w.word}|${w.sentence}`))
    const toAdd = newWords.filter((w) => !existingKeys.has(`${w.word}|${w.sentence}`))
    existing.words = [...existing.words, ...toAdd]
  } else {
    vocab.push({ day, words: newWords })
  }

  saveVocabulary(vocab)
  return vocab
}

/** 从生词本中删除某个单词 */
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

/** 清空生词本 */
export function clearVocabulary(): void {
  localStorage.removeItem(VOCABULARY_KEY)
}