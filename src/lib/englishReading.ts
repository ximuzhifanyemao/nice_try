// 英语长难句「逐句精读」工具：
// 1) 句子分词（带原文偏移，便于把短语整段包成可点击的虚线重点）
// 2) 从 ai.collocations 中解析「短语 + 释义」，并在句子里找出对应片段
// 3) 本篇阅读进度、已点开词条的本地持久化
//
// 这里的匹配不需要百分百精确——它的作用只是给句子加几处「可点的虚线提示」，
// 解析失败时短语仍会以下方 chip 的形式完整展示，不影响精读。

// ---------- 分词 ----------

export interface RichToken {
  text: string
  isWord: boolean
  start: number
  end: number
  /** 单词在整句中的序号；非单词为 -1 */
  wordIdx: number
  /** 小写归一化后的词形；非单词为空串 */
  lower: string
}

const WORD_RE_SRC = "[A-Za-z]+(?:['’-][A-Za-z]+)*"

/** 把句子拆成单词与非单词 token，并保留在原文中的字符偏移 */
export function tokenizeRich(text: string): RichToken[] {
  const tokens: RichToken[] = []
  const re = new RegExp(`(${WORD_RE_SRC})|([^A-Za-z]+)`, 'g')
  let wordIdx = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m[1]) {
      tokens.push({
        text: m[1],
        isWord: true,
        start: m.index,
        end: m.index + m[1].length,
        wordIdx: wordIdx++,
        lower: normalizeWord(m[1]),
      })
      continue
    }
    if (m[2]) {
      let offset = m.index
      for (const ch of m[2]) {
        tokens.push({
          text: ch,
          isWord: false,
          start: offset,
          end: offset + ch.length,
          wordIdx: -1,
          lower: '',
        })
        offset += ch.length
      }
    }
  }
  return tokens
}

// ---------- 词形归一 / 变体 ----------

const STOP = new Set(
  (
    'a an the and or but if while when as of to in on at for from by with without into onto about over ' +
    'under between among through during before after above below up down out off than that this these ' +
    'those it its they them their there here we us our you your he him his she her i me my mine not no ' +
    'nor so such very too also only just even still yet ever never all any both each few more most other ' +
    'some own same can could may might must shall should will would be am is are was were been being ' +
    'have has had having do does did done doing'
  ).split(/\s+/),
)

const IRREGULAR: Record<string, string> = {
  am: 'be', is: 'be', are: 'be', was: 'be', were: 'be', been: 'be', being: 'be',
  has: 'have', had: 'have', having: 'have',
  does: 'do', did: 'do', done: 'do', doing: 'do',
  made: 'make', spent: 'spend', took: 'take', taken: 'take', gave: 'give', given: 'give',
  got: 'get', gotten: 'get', went: 'go', gone: 'go', came: 'come', saw: 'see', seen: 'see',
  found: 'find', thought: 'think', brought: 'bring', held: 'hold', kept: 'keep', led: 'lead',
  left: 'leave', meant: 'mean', met: 'meet', paid: 'pay', put: 'put', read: 'read',
  ran: 'run', said: 'say', sold: 'sell', sent: 'send', set: 'set', showed: 'show', shown: 'show',
  sat: 'sit', spoke: 'speak', spoken: 'speak', stood: 'stand', told: 'tell',
  understood: 'understand', wrote: 'write', written: 'write', began: 'begin', begun: 'begin',
  became: 'become', chose: 'choose', chosen: 'choose', drew: 'draw', drawn: 'draw',
  drove: 'drive', driven: 'drive', fell: 'fall', fallen: 'fall', felt: 'feel', grew: 'grow',
  grown: 'grow', knew: 'know', known: 'know', lost: 'lose', rose: 'rise', risen: 'rise',
  sought: 'seek', wore: 'wear', worn: 'wear', taught: 'teach', caught: 'catch', built: 'build',
  bought: 'buy', fought: 'fight', hung: 'hang', heard: 'hear', laid: 'lay', lent: 'lend',
  lit: 'light', rode: 'ride', ridden: 'ride', sang: 'sing', sung: 'sing', sank: 'sink',
  sunk: 'sink', slept: 'sleep', slid: 'slide', threw: 'throw', thrown: 'throw', woke: 'wake',
  woken: 'wake', won: 'win', wound: 'wind',
}

const SPELLING: Record<string, string> = {
  behaviour: 'behavior', behaviours: 'behaviors', colour: 'color', colours: 'colors',
  favour: 'favor', favours: 'favors', labour: 'labor', neighbour: 'neighbor',
  centre: 'center', programme: 'program', analyse: 'analyze', analysed: 'analyzed',
  organisation: 'organization', organise: 'organize', recognise: 'recognize',
  defence: 'defense', offence: 'offense', travelling: 'traveling', cancelled: 'canceled',
}

function normalizeWord(w: string): string {
  return w
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/^'+|'+$/g, '')
}

function variants(word: string): Set<string> {
  const out = new Set<string>()
  const add = (x: string | null | undefined) => {
    if (x && x.length > 0) out.add(x)
  }
  const w = normalizeWord(word)
  if (!w) return out

  const bases = [w, w.replace(/-/g, '')]
  for (const base of bases) {
    add(base)
    if (!base) continue
    if (base.endsWith("'s")) {
      const s = base.slice(0, -2)
      add(s)
      if (IRREGULAR[s]) add(IRREGULAR[s])
    }
    if (IRREGULAR[base]) add(IRREGULAR[base])
    if (SPELLING[base]) add(SPELLING[base])
    if (base.length <= 3) continue

    if (base.endsWith('ies')) add(base.slice(0, -3) + 'y')
    if (base.endsWith('ied')) add(base.slice(0, -3) + 'y')
    if (base.endsWith('ier')) add(base.slice(0, -3) + 'y')
    if (base.endsWith('ily')) add(base.slice(0, -3) + 'y')
    if (base.endsWith('es')) {
      add(base.slice(0, -2))
      add(base.slice(0, -1))
    }
    if (base.endsWith('s') && !/(ss|us|is)$/.test(base)) add(base.slice(0, -1))
    if (base.endsWith('ly')) add(base.slice(0, -2))
    if (base.endsWith('ed')) {
      const s = base.slice(0, -2)
      add(s)
      add(s + 'e')
      if (s.length > 2 && s[s.length - 1] === s[s.length - 2]) add(s.slice(0, -1))
    }
    if (base.endsWith('ing')) {
      const s = base.slice(0, -3)
      add(s)
      add(s + 'e')
      if (s.length > 2 && s[s.length - 1] === s[s.length - 2]) add(s.slice(0, -1))
    }
    if (base.endsWith('est')) {
      const s = base.slice(0, -3)
      add(s)
      add(s + 'e')
    }
    if (base.endsWith('er')) {
      const s = base.slice(0, -2)
      add(s)
      add(s + 'e')
    }
  }
  return out
}

/** 两个单词是否可视为同一词（含常见屈折、英式/美式拼写） */
export function wordsEquivalent(a: string, b: string): boolean {
  const x = normalizeWord(a)
  const y = normalizeWord(b)
  if (!x || !y) return false
  if (x === y) return true
  if (x.length <= 2 || y.length <= 2) {
    // 短词只允许 be/have/do 这类真正的助动词变体，避免 as→a、is→i 之类的误配
    const xv = variants(x)
    const yv = variants(y)
    for (const v of xv) {
      if (yv.has(v) && (v === 'be' || v === 'have' || v === 'do')) return true
    }
    return false
  }
  const xv = variants(x)
  const yv = variants(y)
  for (const v of xv) {
    if (v.length >= 3 && yv.has(v)) return true
  }
  return false
}

// ---------- 搭配解析 ----------

export interface ParsedCollocation {
  raw: string
  term: string
  meaning: string
}

interface PatternPart {
  word?: string
  wild?: boolean
  max?: number
}

const PLACEHOLDER_WORDS = new Set([
  'sb', 'sbs', 'sth', 'sths', 'somebody', 'something', 'someone', "one's", 'oneself',
  'do', 'doing', 'done',
])

const WILDCARD_LETTERS = new Set(['a', 'b', 'x', 'y'])

/** 把 `fat pay rise（丰厚加薪）` 拆成 term / meaning */
export function parseCollocation(raw: string): ParsedCollocation {
  const text = String(raw || '').trim()
  if (!text) return { raw: text, term: '', meaning: '' }

  let cut = -1
  let meaning = ''
  const re = /[（(]([^）)]*)[）)]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (/[\u4e00-\u9fff]/.test(m[1])) {
      cut = m.index
      meaning = m[1].trim()
      break
    }
  }
  if (cut === -1) {
    const colon = text.search(/[：:]/)
    if (colon > 0) {
      cut = colon
      meaning = text.slice(colon + 1).trim()
    }
  }

  let term = (cut >= 0 ? text.slice(0, cut) : text).trim()
  term = term.replace(/[（(][^）)]*[）)]/g, ' ').replace(/\s+/g, ' ').trim()
  // 只去掉末尾的普通句点，保留 ... / … 这类省略号（如 exchange...for...）
  if (/[.。]$/.test(term) && !/(\.\.\.|…)$/.test(term)) term = term.slice(0, -1).trim()

  return { raw: text, term, meaning }
}

function termPattern(term: string): PatternPart[] {
  const tokens: { lower: string; upperSingle: boolean }[] = []
  const re = /([A-Za-z]+(?:['’-][A-Za-z]+)*)|(\.{2,}|…+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(term)) !== null) {
    if (m[2]) {
      tokens.push({ lower: '…', upperSingle: false })
      continue
    }
    const rawWord = m[1]
    const lower = normalizeWord(rawWord).replace(/\.+$/, '')
    if (!lower) continue
    tokens.push({ lower, upperSingle: /^[A-Z]$/.test(rawWord) })
  }

  // do/doing/done 只有在 term 同时含 sb/sth 时才当占位符，否则就是普通动词
  const hasObjectPlaceholder = tokens.some(
    (t) => t.lower !== 'do' && t.lower !== 'doing' && t.lower !== 'done' && PLACEHOLDER_WORDS.has(t.lower),
  )

  const pattern: PatternPart[] = []
  for (const t of tokens) {
    if (t.lower === '…') {
      pattern.push({ wild: true, max: 12 })
      continue
    }
    const isObjectForm = ['do', 'doing', 'done'].includes(t.lower)
    const isPlaceholder =
      (!isObjectForm && PLACEHOLDER_WORDS.has(t.lower)) ||
      (isObjectForm && hasObjectPlaceholder) ||
      (t.upperSingle && WILDCARD_LETTERS.has(t.lower))
    if (isPlaceholder) pattern.push({ wild: true, max: 4 })
    else pattern.push({ word: t.lower })
  }

  // 合并连续通配，避免 `... sth` 变成两个相邻 wildcard
  const merged: PatternPart[] = []
  for (const p of pattern) {
    const last = merged[merged.length - 1]
    if (p.wild && last?.wild) {
      last.max = Math.max(last.max ?? 4, p.max ?? 4)
    } else {
      merged.push({ ...p })
    }
  }
  return merged
}

function matchPatternAt(
  words: RichToken[],
  text: string,
  start: number,
  pattern: PatternPart[],
): number | null {
  const rec = (si: number, pi: number): number | null => {
    if (pi >= pattern.length) return si - 1
    const p = pattern[pi]
    if (p.wild) {
      const min = 1
      const remainingLiteral = pattern.slice(pi + 1).filter((x) => x.word).length
      const maxAllowed = Math.min(words.length - remainingLiteral, si + (p.max ?? 4))
      if (maxAllowed < si + min) return null

      if (pi === pattern.length - 1) {
        // 末尾通配至少吃掉一个词：si 本身就是第一个待吃词，不能要求 end >= si + 1
        if (si >= words.length) return null
        const hardEnd = Math.min(maxAllowed, words.length - 1, si + 5)
        let end = si
        for (let i = si + 1; i <= hardEnd; i++) {
          const gap = text.slice(words[i - 1].end, words[i].start)
          if (/[.,;:!?()]/.test(gap)) break
          end = i
        }
        return end
      }

      for (let end = si + min; end <= maxAllowed; end++) {
        const res = rec(end, pi + 1)
        if (res != null) return res
      }
      return null
    }

    if (si >= words.length) return null
    if (!wordsEquivalent(p.word ?? '', words[si].lower)) return null
    return rec(si + 1, pi + 1)
  }
  return rec(start, 0)
}

// ---------- 句内重点片段 ----------

export interface ReadingMatch extends ParsedCollocation {
  start: number
  end: number
  charStart: number
  charEnd: number
  headword: string
  headwordIdx: number
  /** 短语中的实义词，供词条抽屉做「短语拆解」 */
  related: string[]
}

export interface SentenceReading {
  tokens: RichToken[]
  words: RichToken[]
  chips: ParsedCollocation[]
  /** 句内实际画虚线的重点（最多 maxInline 处，互不重叠） */
  matches: ReadingMatch[]
  /** 每个搭配对应的首次命中（即使因数量上限没有画进句子，点 chip 仍可定位） */
  chipMatches: Map<string, ReadingMatch>
}

const EMPTY_READING: SentenceReading = {
  tokens: [],
  words: [],
  chips: [],
  matches: [],
  chipMatches: new Map(),
}

function contentWords(pattern: PatternPart[]): string[] {
  return pattern
    .filter((p) => p.word && p.word.length > 1 && !STOP.has(p.word))
    .map((p) => p.word as string)
}

function makeMatch(
  parsed: ParsedCollocation,
  pattern: PatternPart[],
  words: RichToken[],
  text: string,
  start: number,
  end: number,
): ReadingMatch {
  const span = words.slice(start, end + 1)
  const content = contentWords(pattern)
  const ranked = [...content].sort((a, b) => b.length - a.length)

  let headToken: RichToken | undefined
  for (const head of ranked) {
    headToken = span.find((w) => wordsEquivalent(w.lower, head))
    if (headToken) break
  }
  if (!headToken) {
    for (const head of ranked) {
      headToken = words.find((w) => wordsEquivalent(w.lower, head))
      if (headToken) break
    }
  }
  if (!headToken) {
    headToken = span.find((w) => w.lower.length > 1 && !STOP.has(w.lower)) ?? span[0]
  }

  // 整条搭配都是虚词（all too / rather than 等）时，直接整段作为生词主词，
  // 避免把 "all" / "the" 这种虚词收进生词本
  const headword =
    content.length > 0
      ? headToken?.text ?? parsed.term
      : parsed.term || headToken?.text || text.slice(words[start].start, words[end].end)
  const related = [...new Set(content)]
  return {
    ...parsed,
    start,
    end,
    charStart: words[start].start,
    charEnd: words[end].end,
    headword,
    headwordIdx: headToken?.wordIdx ?? -1,
    related,
  }
}

/** 分析一句英文：分词 + 解析搭配 + 标出句内重点 */
export function analyzeSentence(
  text: string,
  rawCollocations: string[],
  maxInline = 6,
): SentenceReading {
  if (!text) return EMPTY_READING
  const tokens = tokenizeRich(text)
  const words = tokens.filter((t) => t.isWord)
  const chips = rawCollocations
    .map((raw) => parseCollocation(raw))
    .filter((c) => c.term && !/[\u4e00-\u9fff+＋]/.test(c.term))

  const candidates: ReadingMatch[] = []
  const chipMatches = new Map<string, ReadingMatch>()

  for (const chip of chips) {
    const pattern = termPattern(chip.term)
    if (!pattern.some((p) => p.word)) continue
    for (let start = 0; start < words.length; start++) {
      const end = matchPatternAt(words, text, start, pattern)
      if (end != null && end >= start) {
        const match = makeMatch(chip, pattern, words, text, start, end)
        chipMatches.set(chip.raw, match)
        candidates.push(match)
        break
      }
    }
  }

  // 同一片段只保留一条（不同搭配可能指向同一处）
  const bySpan = new Map<string, ReadingMatch>()
  for (const m of candidates) {
    const key = `${m.start}-${m.end}`
    const existing = bySpan.get(key)
    if (!existing || (!existing.meaning && m.meaning)) bySpan.set(key, m)
  }

  // 长片段优先，尽量保留信息量大的搭配；再按出现顺序排序
  const sorted = [...bySpan.values()].sort(
    (a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start,
  )
  const kept: ReadingMatch[] = []
  for (const m of sorted) {
    if (kept.some((k) => !(m.end < k.start || m.start > k.end))) continue
    kept.push(m)
  }
  kept.sort((a, b) => a.start - b.start)

  return { tokens, words, chips, matches: kept.slice(0, maxInline), chipMatches }
}

// ---------- 阅读进度 ----------

const READING_PROGRESS_KEY = 'kaoyan_english_reading_progress'
const OPENED_TERM_KEY = 'kaoyan_english_opened_terms'

type NumberListStore = Record<string, number[]>

function readNumberListStore(): NumberListStore {
  try {
    const raw = localStorage.getItem(READING_PROGRESS_KEY)
    if (!raw) return {}
    const obj = JSON.parse(raw) as NumberListStore
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {}
  } catch {
    return {}
  }
}

function writeNumberListStore(store: NumberListStore): void {
  try {
    localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(store))
  } catch {
    /* 配额异常时忽略 */
  }
}

function progressKey(userKey: string, day: number): string {
  return `${userKey}:${day}`
}

/** 某用户某天的已读句子下标集合 */
export function loadReadingProgress(userKey: string, day: number): Set<number> {
  const list = readNumberListStore()[progressKey(userKey, day)]
  return new Set(Array.isArray(list) ? list.filter((n) => Number.isInteger(n) && n >= 0) : [])
}

/** 标记某句已读，返回更新后的集合 */
export function markSentenceRead(userKey: string, day: number, sentIdx: number): Set<number> {
  const store = readNumberListStore()
  const key = progressKey(userKey, day)
  const current = new Set(Array.isArray(store[key]) ? store[key] : [])
  current.add(sentIdx)
  store[key] = [...current].sort((a, b) => a - b)
  writeNumberListStore(store)
  return current
}

/** 某用户读过的所有天（至少读过一句即算） */
export function loadReadDays(userKey: string): Set<number> {
  const store = readNumberListStore()
  const prefix = `${userKey}:`
  const days = new Set<number>()
  for (const [key, list] of Object.entries(store)) {
    if (!key.startsWith(prefix) || !Array.isArray(list) || list.length === 0) continue
    const day = Number(key.slice(prefix.length))
    if (Number.isInteger(day) && day > 0) days.add(day)
  }
  return days
}

// ---------- 已点开的词条 ----------

export interface OpenedTermRecord {
  /** 稳定的本句唯一标识，如 p:2:5-7 / w:2:5 / c:2:1 */
  id: string
  /** 点击的原文片段 */
  term: string
  /** 收进生词本的主词（短语时取实义词） */
  word: string
  meaning: string
  headword: string
  headwordIdx: number
  sentIdx: number
  startWordIdx: number
  charStart: number
  charEnd: number
  /** 短语里可单独点击拆解的实义词 */
  related: string[]
  isPhrase: boolean
  at: string
}

type OpenedTermStore = Record<string, Record<string, OpenedTermRecord>>

function readOpenedStore(): OpenedTermStore {
  try {
    const raw = localStorage.getItem(OPENED_TERM_KEY)
    if (!raw) return {}
    const obj = JSON.parse(raw) as OpenedTermStore
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {}
  } catch {
    return {}
  }
}

function writeOpenedStore(store: OpenedTermStore): void {
  try {
    localStorage.setItem(OPENED_TERM_KEY, JSON.stringify(store))
  } catch {
    /* 配额异常时忽略 */
  }
}

function scoreTermId(t: OpenedTermRecord): number {
  const at = Date.parse(t.at)
  return Number.isFinite(at) ? at : 0
}

/** 某用户某天已点开的所有词条（按句子顺序） */
export function loadOpenedTerms(userKey: string, day: number): OpenedTermRecord[] {
  const dayMap = readOpenedStore()[userKey]
  if (!dayMap) return []
  return Object.entries(dayMap)
    .filter(([key, t]) => key.startsWith(`${day}:`) && t && typeof t === 'object')
    .map(([, t]) => t)
    .sort((a, b) => a.sentIdx - b.sentIdx || a.startWordIdx - b.startWordIdx || scoreTermId(a) - scoreTermId(b))
}

/** 读取一条已点开的词条 */
export function loadOpenedTerm(
  userKey: string,
  day: number,
  id: string,
): OpenedTermRecord | null {
  return readOpenedStore()[userKey]?.[`${day}:${id}`] ?? null
}

/** 保存（或覆盖）一条已点开的词条 */
export function saveOpenedTerm(userKey: string, day: number, term: OpenedTermRecord): void {
  const store = readOpenedStore()
  if (!store[userKey]) store[userKey] = {}
  store[userKey][`${day}:${term.id}`] = term
  writeOpenedStore(store)
}

/** 删除一条已点开的词条 */
export function removeOpenedTerm(userKey: string, day: number, id: string): void {
  const store = readOpenedStore()
  const dayMap = store[userKey]
  if (!dayMap) return
  delete dayMap[`${day}:${id}`]
  if (Object.keys(dayMap).length === 0) delete store[userKey]
  writeOpenedStore(store)
}

/** 词条 id：优先用句子内字符偏移，保证同一片段始终复用同一条记录 */
export function termIdForSpan(sentIdx: number, startWordIdx: number, start: number, end: number): string {
  return `p:${sentIdx}:${startWordIdx}:${start}-${end}`
}

export function termIdForWord(sentIdx: number, startWordIdx: number): string {
  return `w:${sentIdx}:${startWordIdx}`
}

export function termIdForChip(sentIdx: number, chipIndex: number): string {
  return `c:${sentIdx}:${chipIndex}`
}
