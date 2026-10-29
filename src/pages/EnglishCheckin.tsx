import { Component, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { loadEnglishDaily, type EnglishDay } from '../data/englishDaily'
import {
  ENGLISH_TOTAL_DAYS,
  fetchMyCheckins,
  createCheckin,
  deleteCheckin,
} from '../lib/englishCheckin'
import {
  addDayToVocabulary,
  loadMarkedWords,
  pushVocabularyToCloud,
  removeWordFromCloud,
  removeWordFromVocabulary,
} from '../lib/vocabulary'
import { getCachedLookup, lookupOffline, lookupWord, type WordLookup } from '../lib/wordLookup'
import { supabase } from '../lib/supabase'
import { postJson } from '../lib/httpRequest'
import {
  buildCorrectUserPrompt,
  chatCompletion,
  CORRECT_SYSTEM_PROMPT,
  extractJsonObject,
  isAiConfigured,
  loadAiConfig,
} from '../lib/aiModel'
import { useToast } from '../lib/Toast'
import { Icon } from '../components/Icon'
import LookupPromptFallback from '../components/LookupPromptFallback'
import {
  analyzeSentence,
  loadOpenedTerms,
  loadReadDays,
  loadReadingProgress,
  markSentenceRead,
  removeOpenedTerm,
  saveOpenedTerm,
  termIdForChip,
  termIdForSpan,
  termIdForWord,
  tokenizeRich,
  wordsEquivalent,
  type OpenedTermRecord,
  type ReadingMatch,
  type RichToken,
  type SentenceReading,
} from '../lib/englishReading'
import { buildSentenceChunks } from '../lib/englishBreakdown'
import './english-checkin.css'

const TOTAL = ENGLISH_TOTAL_DAYS

// ---------- 本地持久化 ----------

/** 打卡状态缓存：进入页面先用缓存秒出，再后台静默刷新 */
const CHECKINS_CACHE_KEY = 'kaoyan_english_checkins_cache'

interface CheckinsCache {
  userId?: string
  days: number[]
  savedAt: string
}

function loadCheckinsCache(userId: string): Set<number> | null {
  try {
    const raw = localStorage.getItem(CHECKINS_CACHE_KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as CheckinsCache
    if (!Array.isArray(c.days) || c.userId !== userId) return null
    return new Set(c.days)
  } catch {
    return null
  }
}

function saveCheckinsCache(userId: string, days: number[]): void {
  try {
    localStorage.setItem(
      CHECKINS_CACHE_KEY,
      JSON.stringify({ userId, days, savedAt: new Date().toISOString() }),
    )
  } catch {
    /* 忽略配额异常 */
  }
}

/** 解析 localStorage 中的 Record<key, value> 为 Map（非法值跳过） */
function loadRecordMap<T>(key: string): Map<string, T> {
  const map = new Map<string, T>()
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return map
    const obj = JSON.parse(raw) as Record<string, unknown>
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return map
    for (const [k, v] of Object.entries(obj)) {
      if (k && v != null) map.set(k, v as T)
    }
  } catch {
    /* ignore */
  }
  return map
}

function saveRecordMap<T>(key: string, map: Map<string, T>): void {
  try {
    localStorage.setItem(key, JSON.stringify(Object.fromEntries(map)))
  } catch {
    /* 忽略配额异常 */
  }
}

function removeRecordKey(key: string, mapKey: string): void {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return
    const obj = JSON.parse(raw) as Record<string, unknown>
    if (obj && typeof obj === 'object' && mapKey in obj) {
      delete obj[mapKey]
      localStorage.setItem(key, JSON.stringify(obj))
    }
  } catch {
    /* ignore */
  }
}

const TRANSLATION_KEY = 'kaoyan_english_translations'
const SCORE_KEY = 'kaoyan_english_scores'
const AI_RESULT_KEY = 'kaoyan_english_ai_results'

// ---------- AI 翻译批改 ----------

interface AiCorrection {
  score: number | null
  corrected: string
  issues: string[]
  suggestions: string[]
  backbone: string
  structure: string[]
  collocations: string[]
}

/** 兜底归一化 AI 返回，避免畸形结构导致 React 渲染崩溃 */
function normalizeAiCorrection(raw: any): AiCorrection {
  const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))
  const itemStr = (v: unknown): string => {
    if (typeof v === 'string') return v
    if (v && typeof v === 'object') {
      const first = Object.values(v as Record<string, unknown>).find((x) => typeof x === 'string')
      return first != null ? String(first) : JSON.stringify(v)
    }
    return v == null ? '' : String(v)
  }
  const strArr = (v: unknown) => (Array.isArray(v) ? v.map(itemStr).filter(Boolean) : [])
  const num = (v: unknown) =>
    typeof v === 'number' && Number.isFinite(v) ? v : v == null ? null : (Number(v) as number) || null
  return {
    score: num(raw?.score),
    corrected: str(raw?.corrected),
    issues: strArr(raw?.issues),
    suggestions: strArr(raw?.suggestions),
    backbone: str(raw?.backbone),
    structure: strArr(raw?.structure),
    collocations: strArr(raw?.collocations),
  }
}

interface EBState {
  hasError: boolean
}

class AiResultBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false }
  static getDerivedStateFromError(): EBState {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return <p className="ec-practice-error">AI 结果渲染异常，请重新点击批改</p>
    }
    return this.props.children
  }
}

const AI_CORRECT_URL = (import.meta.env.VITE_AI_CORRECT_URL as string | undefined)?.trim() || ''

// ---------- 翻译相似度打分 ----------

function calcTranslationScore(userText: string, refText: string): number {
  const u = userText.trim()
  const r = refText.trim()
  if (!u) return 0
  if (u === r) return 100

  const lcsLen = lcs(u, r)
  const charScore = ((2 * lcsLen) / (u.length + r.length)) * 100

  const tokenize = (s: string) => {
    const tokens: string[] = []
    const segs = s.split(/([\u4e00-\u9fff]+)/)
    for (const seg of segs) {
      if (/[\u4e00-\u9fff]/.test(seg)) {
        for (const ch of seg) tokens.push(ch)
      } else {
        tokens.push(...seg.split(/[^a-zA-Z0-9]+/).filter(Boolean).map((t) => t.toLowerCase()))
      }
    }
    return new Set(tokens)
  }
  const uSet = tokenize(u)
  const rSet = tokenize(r)
  const intersection = new Set([...uSet].filter((x) => rSet.has(x)))
  const union = new Set([...uSet, ...rSet])
  const wordScore = union.size > 0 ? (intersection.size / union.size) * 100 : 0

  return Math.round(charScore * 0.6 + wordScore * 0.4)
}

function lcs(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0 || n === 0) return 0
  let prev = new Array<number>(n + 1).fill(0)
  let cur = new Array<number>(n + 1).fill(0)
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1])
    }
    ;[prev, cur] = [cur, prev]
  }
  return prev[n]
}

// ---------- 颜色 ----------

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400'
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-green-100 dark:bg-green-900/30'
  if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30'
  return 'bg-red-100 dark:bg-red-900/30'
}

// ---------- 词条 ----------

interface ActiveTerm extends OpenedTermRecord {
  day: number
  sentence: string
}

type SheetKind = 'list' | 'plan' | 'words' | 'word' | null

function toRecord(t: ActiveTerm): OpenedTermRecord {
  return {
    id: t.id,
    term: t.term,
    word: t.word,
    meaning: t.meaning,
    headword: t.headword,
    headwordIdx: t.headwordIdx,
    sentIdx: t.sentIdx,
    startWordIdx: t.startWordIdx,
    charStart: t.charStart,
    charEnd: t.charEnd,
    related: t.related,
    isPhrase: t.isPhrase,
    at: t.at,
  }
}

function vocabWordIdx(t: OpenedTermRecord): number {
  if (t.headwordIdx >= 0) return t.headwordIdx
  if (t.startWordIdx >= 0) return t.startWordIdx
  return -1
}

function hashWord(word: string): number {
  let hash = 0
  for (let i = 0; i < word.length; i++) hash = (hash * 31 + word.charCodeAt(i)) % 1000
  return hash
}

function extractPos(lookup: WordLookup | null): string {
  const first = lookup?.meanings[0] ?? ''
  const matched = first.match(/^([a-z]{1,5})\./)
  return matched ? matched[1] : ''
}

function collectLegacyMarkedWords(day: number, dayData: EnglishDay) {
  const marked = loadMarkedWords()
  if (marked.size === 0) return []
  const words: { word: string; sentence: string; sentIdx: number; wordIdx: number }[] = []
  for (let si = 0; si < dayData.sentences.length; si++) {
    const sentence = dayData.sentences[si]
    for (const token of tokenizeRich(sentence.en)) {
      if (!token.isWord) continue
      if (marked.has(`${day}-${si}-${token.wordIdx}`)) {
        words.push({ word: token.text, sentence: sentence.en, sentIdx: si, wordIdx: token.wordIdx })
      }
    }
  }
  return words
}

function contentTermWords(term: string): string[] {
  const out: string[] = []
  const re = /[A-Za-z]+(?:['’-][A-Za-z]+)*/g
  let m: RegExpExecArray | null
  while ((m = re.exec(term)) !== null) {
    const word = m[0]
    if (word.length > 1 && !/^(sb|sbs|sth|sths|somebody|something|someone|do|doing|done)$/i.test(word)) {
      out.push(word)
    }
  }
  return [...new Set(out)]
}

// ---------- 页面 ----------

export default function EnglishCheckin() {
  const { user } = useAuth()
  const userKey = user?.id ?? 'anon'
  const toast = useToast()

  const [daily, setDaily] = useState<EnglishDay[]>([])
  const [dailyError, setDailyError] = useState<string | null>(null)
  const [checkins, setCheckins] = useState<Set<number>>(new Set())
  const [checkinsLoading, setCheckinsLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(1)
  const [idx, setIdx] = useState(0)
  const [showSummary, setShowSummary] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [readSet, setReadSet] = useState<Set<number>>(new Set())
  const [openedTerms, setOpenedTerms] = useState<OpenedTermRecord[]>([])
  const [activeSheet, setActiveSheet] = useState<SheetKind>(null)
  const [activeTerm, setActiveTerm] = useState<ActiveTerm | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeChunk, setActiveChunk] = useState<number | null>(null)

  const [translations, setTranslations] = useState<Map<string, string>>(
    () => loadRecordMap<string>(TRANSLATION_KEY),
  )
  const [scores, setScores] = useState<Map<string, number>>(
    () => loadRecordMap<number>(SCORE_KEY),
  )
  const [aiResults, setAiResults] = useState<Map<string, AiCorrection>>(
    () => loadRecordMap<AiCorrection>(AI_RESULT_KEY),
  )
  const [aiLoading, setAiLoading] = useState<Set<string>>(new Set())
  const [aiError, setAiError] = useState<string | null>(null)

  const [lookup, setLookup] = useState<WordLookup | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)

  const pageRef = useRef<HTMLDivElement>(null)
  const pickedDayRef = useRef(false)
  const activeTermRef = useRef<ActiveTerm | null>(null)
  activeTermRef.current = activeTerm
  const practiceKeyRef = useRef('')

  // ---------- 打卡记录 ----------

  useEffect(() => {
    pickedDayRef.current = false
    if (!user) {
      setCheckins(new Set())
      setCheckinsLoading(false)
      return
    }

    const cached = loadCheckinsCache(user.id)
    if (cached) {
      setCheckins(cached)
      setCheckinsLoading(false)
      if (!pickedDayRef.current) {
        let target = 0
        for (let d = 1; d <= TOTAL; d++) {
          if (!cached.has(d)) {
            target = d
            break
          }
        }
        setSelectedDay(target || TOTAL)
      }
    } else {
      setCheckinsLoading(true)
    }

    let cancelled = false
    fetchMyCheckins(user.id)
      .then((list) => {
        if (cancelled) return
        const set = new Set(list.map((c) => c.day))
        setCheckins(set)
        saveCheckinsCache(user.id, list.map((c) => c.day))
        if (!pickedDayRef.current) {
          let target = 0
          for (let d = 1; d <= TOTAL; d++) {
            if (!set.has(d)) {
              target = d
              break
            }
          }
          setSelectedDay(target || TOTAL)
        }
      })
      .catch((e) => {
        if (!cancelled && !cached) setError(e instanceof Error ? e.message : '打卡记录加载失败')
      })
      .finally(() => {
        if (!cancelled) setCheckinsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  // 语料懒加载
  useEffect(() => {
    let cancelled = false
    loadEnglishDaily()
      .then((data) => {
        if (!cancelled) setDaily(data)
      })
      .catch((e) => {
        if (!cancelled) setDailyError(e instanceof Error ? e.message : '语料加载失败')
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 切换篇目：优先停在第一句未读
  useEffect(() => {
    const data = daily.find((d) => d.day === selectedDay)
    if (!data) return
    const progress = loadReadingProgress(userKey, selectedDay)
    setReadSet(progress)
    setOpenedTerms(loadOpenedTerms(userKey, selectedDay))
    setRevealed(false)
    setAiError(null)
    setShowSummary(false)
    setActiveSheet(null)
    setActiveTerm(null)
    const firstUnread = data.sentences.findIndex((_, i) => !progress.has(i))
    setIdx(firstUnread === -1 ? 0 : firstUnread)
  }, [selectedDay, daily, userKey])

  // 切换句子：收起答案、清掉上一句的 AI 错误与已选意群
  useEffect(() => {
    setRevealed(false)
    setAiError(null)
    setActiveChunk(null)
  }, [selectedDay, idx])

  // 抽屉：锁滚动 + Esc 关闭
  useEffect(() => {
    if (!activeSheet) return
    document.documentElement.classList.add('ec-sheet-lock')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveSheet(null)
        setActiveTerm(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.classList.remove('ec-sheet-lock')
      window.removeEventListener('keydown', onKey)
    }
  }, [activeSheet])

  // 词条抽屉：先展示本地缓存，再查离线词典（0 费用）
  const lookupTarget = activeSheet === 'word' && activeTerm ? activeTerm.headword : ''
  useEffect(() => {
    setLookup(null)
    setLookupError(null)
    if (!lookupTarget) {
      setLookupLoading(false)
      return
    }

    let cancelled = false
    setLookupLoading(true)
    const cached = getCachedLookup(lookupTarget)
    if (cached) {
      setLookup(cached)
      setLookupLoading(false)
      return
    }

    lookupOffline(lookupTarget)
      .then((result) => {
        if (cancelled) return
        if (result) setLookup(result)
        setLookupLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLookupLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [lookupTarget])

  // ---------- 派生状态 ----------

  const nextDay = useMemo(() => {
    for (let d = 1; d <= TOTAL; d++) if (!checkins.has(d)) return d
    return TOTAL + 1
  }, [checkins])
  const lastDoneDay = Math.min(nextDay - 1, TOTAL)
  const allDone = nextDay > TOTAL

  const dayData = useMemo(() => daily.find((d) => d.day === selectedDay), [daily, selectedDay])
  const sentenceCount = dayData?.sentences.length ?? 0
  const currentIdx = Math.min(idx, Math.max(0, sentenceCount - 1))
  const sentence = dayData?.sentences[currentIdx]
  const isDone = checkins.has(selectedDay)
  const isNext = selectedDay === nextDay
  const isLastSentence = sentenceCount > 0 && currentIdx === sentenceCount - 1
  const readCount = Math.min(readSet.size, sentenceCount)
  const dayOpenedCount = openedTerms.length
  const openedIds = useMemo(() => new Set(openedTerms.map((t) => t.id)), [openedTerms])

  const reading = useMemo(
    () => (sentence ? analyzeSentence(sentence.en, sentence.ai?.collocations ?? []) : null),
    [sentence],
  )

  const translationKey = dayData ? `${dayData.day}-${currentIdx}` : ''
  practiceKeyRef.current = translationKey
  const currentTranslation = translations.get(translationKey) ?? ''
  const rawScore = scores.get(translationKey)
  const currentScore = typeof rawScore === 'number' && Number.isFinite(rawScore) ? rawScore : null
  const currentAi = aiResults.get(translationKey) ?? null
  const currentAiLoading = aiLoading.has(translationKey)

  const analysisItem = dayData?.analysis?.find((a) => a.sentNum === sentence?.num)
  const chunks = useMemo(
    () => (sentence ? buildSentenceChunks(sentence, analysisItem) : []),
    [sentence, analysisItem],
  )
  const grammar = analysisItem?.grammar ?? []
  const activeChunkInfo = activeChunk != null ? chunks[activeChunk] ?? null : null

  const allReadDays = useMemo(() => {
    const set = loadReadDays(userKey)
    // 已打卡的篇目视为已读（即使本地进度记录缺失，计划格也应有读过的标记）
    for (const day of checkins) set.add(day)
    // readSet 是本篇实时进度：变化时触发重算，并把当前篇并入结果
    if (readSet.size > 0) set.add(selectedDay)
    return set
  }, [userKey, selectedDay, readSet, checkins])

  // ---------- 基础操作 ----------

  function scrollToPageTop() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        pageRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      })
    })
  }

  function markCurrentRead() {
    const next = markSentenceRead(userKey, selectedDay, currentIdx)
    setReadSet(next)
  }

  function goNext() {
    if (!dayData || !sentence) return
    markCurrentRead()
    if (isLastSentence) {
      setShowSummary(true)
    } else {
      setIdx(currentIdx + 1)
      setRevealed(false)
    }
    scrollToPageTop()
  }

  function goPrev() {
    if (currentIdx <= 0) return
    setIdx(currentIdx - 1)
    setRevealed(false)
    scrollToPageTop()
  }

  function pickDay(day: number, fromStart = false) {
    pickedDayRef.current = true
    const data = daily.find((d) => d.day === day)
    const progress = loadReadingProgress(userKey, day)
    setSelectedDay(day)
    setShowSummary(false)
    setRevealed(false)
    setActiveChunk(null)
    setActiveSheet(null)
    setActiveTerm(null)
    setError(null)
    setReadSet(progress)
    setOpenedTerms(loadOpenedTerms(userKey, day))
    if (data) {
      const firstUnread = data.sentences.findIndex((_, i) => !progress.has(i))
      setIdx(fromStart || firstUnread === -1 ? 0 : firstUnread)
    } else {
      setIdx(0)
    }
    scrollToPageTop()
  }

  function jumpToSentence(index: number) {
    setIdx(index)
    setShowSummary(false)
    setRevealed(false)
    setActiveChunk(null)
    setActiveSheet(null)
    setActiveTerm(null)
    scrollToPageTop()
  }

  function openSheet(kind: Exclude<SheetKind, null>) {
    if (kind === 'words' || kind === 'plan') {
      setOpenedTerms(loadOpenedTerms(userKey, selectedDay))
    }
    setActiveSheet(kind)
  }

  function closeSheet() {
    setActiveSheet(null)
    setActiveTerm(null)
  }

  function addToVocab(record: OpenedTermRecord, sentenceText: string) {
    const payload = {
      word: record.word,
      sentence: sentenceText,
      sentIdx: record.sentIdx,
      wordIdx: vocabWordIdx(record),
    }
    addDayToVocabulary(selectedDay, [payload])
    if (user) {
      void pushVocabularyToCloud(user.id, [{ ...payload, day: selectedDay }]).catch(() => {})
    }
  }

  function showTerm(record: OpenedTermRecord) {
    const existing = openedTerms.find((t) => t.id === record.id)
    const finalRecord = existing ?? record
    if (!existing) {
      saveOpenedTerm(userKey, selectedDay, finalRecord)
      setOpenedTerms((prev) => {
        const next = [...prev.filter((t) => t.id !== finalRecord.id), finalRecord]
        next.sort((a, b) => a.sentIdx - b.sentIdx || a.startWordIdx - b.startWordIdx)
        return next
      })
    }
    addToVocab(finalRecord, sentence?.en ?? '')
    setActiveTerm({ ...finalRecord, day: selectedDay, sentence: sentence?.en ?? '' })
    setActiveSheet('word')
  }

  function openMatch(match: ReadingMatch) {
    if (!sentence) return
    const record: OpenedTermRecord = {
      id: termIdForSpan(currentIdx, match.start, match.charStart, match.charEnd),
      term: sentence.en.slice(match.charStart, match.charEnd) || match.term,
      word: match.headword,
      meaning: match.meaning,
      headword: match.headword,
      headwordIdx: match.headwordIdx,
      sentIdx: currentIdx,
      startWordIdx: match.start,
      charStart: match.charStart,
      charEnd: match.charEnd,
      related: match.related,
      isPhrase: match.end > match.start,
      at: new Date().toISOString(),
    }
    showTerm(record)
  }

  function openToken(token: RichToken) {
    if (!sentence) return
    const record: OpenedTermRecord = {
      id: termIdForWord(currentIdx, token.wordIdx),
      term: token.text,
      word: token.text,
      meaning: '',
      headword: token.text,
      headwordIdx: token.wordIdx,
      sentIdx: currentIdx,
      startWordIdx: token.wordIdx,
      charStart: token.start,
      charEnd: token.end,
      related: [],
      isPhrase: false,
      at: new Date().toISOString(),
    }
    showTerm(record)
  }

  function openChip(chipIndex: number) {
    if (!reading || !sentence) return
    const chip = reading.chips[chipIndex]
    if (!chip) return
    const matched = reading.chipMatches.get(chip.raw)
    if (matched) {
      openMatch(matched)
      return
    }

    const candidates = contentTermWords(chip.term)
    let found: RichToken | undefined
    for (const raw of candidates) {
      found = reading.words.find((w) => wordsEquivalent(w.lower, raw))
      if (found) break
    }
    const id = termIdForChip(currentIdx, chipIndex)
    const existing = openedTerms.find((t) => t.id === id)
    if (existing) {
      setActiveTerm({ ...existing, day: selectedDay, sentence: sentence.en })
      addToVocab(existing, sentence.en)
      setActiveSheet('word')
      return
    }
    const startWordIdx = found?.wordIdx ?? 8000 + chipIndex
    const record: OpenedTermRecord = {
      id,
      term: chip.term,
      word: found?.text ?? candidates[0] ?? chip.term,
      meaning: chip.meaning,
      headword: found?.text ?? candidates[0] ?? chip.term,
      headwordIdx: found?.wordIdx ?? -1,
      sentIdx: currentIdx,
      startWordIdx,
      charStart: found?.start ?? -1,
      charEnd: found?.end ?? -1,
      related: candidates,
      isPhrase: true,
      at: new Date().toISOString(),
    }
    showTerm(record)
  }

  function openRelatedWord(word: string) {
    if (!reading || !sentence) return
    const found =
      reading.words.find((w) => w.lower === word.toLowerCase()) ??
      reading.words.find((w) => wordsEquivalent(w.lower, word))
    const id = found
      ? termIdForWord(currentIdx, found.wordIdx)
      : termIdForChip(currentIdx, 500 + hashWord(word))
    const existing = openedTerms.find((t) => t.id === id)
    if (existing) {
      setActiveTerm({ ...existing, day: selectedDay, sentence: sentence.en })
      addToVocab(existing, sentence.en)
      setActiveSheet('word')
      return
    }
    const record: OpenedTermRecord = {
      id,
      term: word,
      word: word,
      meaning: '',
      headword: found?.text ?? word,
      headwordIdx: found?.wordIdx ?? -1,
      sentIdx: currentIdx,
      startWordIdx: found?.wordIdx ?? 9000 + hashWord(word),
      charStart: found?.start ?? -1,
      charEnd: found?.end ?? -1,
      related: [],
      isPhrase: false,
      at: new Date().toISOString(),
    }
    showTerm(record)
  }

  function openStoredTerm(record: OpenedTermRecord) {
    const sentenceText = daily.find((d) => d.day === selectedDay)?.sentences[record.sentIdx]?.en ?? ''
    addToVocab(record, sentenceText)
    setActiveTerm({ ...record, day: selectedDay, sentence: sentenceText })
    setActiveSheet('word')
  }

  function handleToggleSave() {
    if (!activeTerm) return
    const saved = openedIds.has(activeTerm.id)
    if (saved) {
      removeOpenedTerm(userKey, selectedDay, activeTerm.id)
      setOpenedTerms((prev) => prev.filter((t) => t.id !== activeTerm.id))
      removeWordFromVocabulary(selectedDay, activeTerm.word, activeTerm.sentence)
      if (user) {
        void removeWordFromCloud(user.id, selectedDay, activeTerm.word, activeTerm.sentence).catch(() => {})
      }
      toast.show('已移出生词本')
    } else {
      const at = new Date().toISOString()
      const record = { ...toRecord(activeTerm), at }
      saveOpenedTerm(userKey, selectedDay, record)
      setOpenedTerms((prev) => [...prev.filter((t) => t.id !== record.id), record])
      addToVocab(record, activeTerm.sentence)
      setActiveTerm({ ...activeTerm, at })
      toast.show('已加入生词本')
    }
  }

  async function handleAiLookup() {
    if (!activeTerm || lookupLoading) return
    const target = activeTerm.headword
    const termId = activeTerm.id
    setLookupLoading(true)
    setLookupError(null)
    try {
      const result = await lookupWord(target)
      if (activeTermRef.current?.id === termId) setLookup(result)
    } catch (e) {
      const aborted = e instanceof Error && e.name === 'AbortError'
      if (activeTermRef.current?.id === termId) {
        setLookupError(
          aborted
            ? 'AI 查词超时，请检查网络后重试'
            : e instanceof Error ? e.message : 'AI 查词失败，请稍后重试',
        )
      }
    } finally {
      if (activeTermRef.current?.id === termId) setLookupLoading(false)
    }
  }

  // ---------- 翻译练习 ----------

  function handleTranslationChange(value: string) {
    if (!translationKey) return
    setTranslations((prev) => {
      const next = new Map(prev)
      next.set(translationKey, value)
      saveRecordMap(TRANSLATION_KEY, next)
      return next
    })
    setScores((prev) => {
      if (!prev.has(translationKey)) return prev
      const next = new Map(prev)
      next.delete(translationKey)
      removeRecordKey(SCORE_KEY, translationKey)
      return next
    })
    setAiResults((prev) => {
      if (!prev.has(translationKey)) return prev
      const next = new Map(prev)
      next.delete(translationKey)
      removeRecordKey(AI_RESULT_KEY, translationKey)
      return next
    })
    setAiError(null)
  }

  function handleScore() {
    if (!sentence) return
    const score = calcTranslationScore(currentTranslation, sentence.ref)
    setScores((prev) => {
      const next = new Map(prev)
      next.set(translationKey, score)
      saveRecordMap(SCORE_KEY, next)
      return next
    })
  }

  async function handleAiCorrect() {
    if (!sentence || !currentTranslation.trim() || currentAiLoading) return
    const key = translationKey
    setAiLoading((prev) => new Set(prev).add(key))
    setAiError(null)
    try {
      let result: AiCorrection
      const aiConfig = loadAiConfig()
      if (isAiConfigured(aiConfig)) {
        const content = await chatCompletion(aiConfig, [
          { role: 'system', content: CORRECT_SYSTEM_PROMPT },
          {
            role: 'user',
            content: buildCorrectUserPrompt(sentence.en, currentTranslation, sentence.ref),
          },
        ])
        const parsed = extractJsonObject(content)
        if (!parsed) throw new Error('AI 返回格式无法解析，请更换模型后重试')
        result = normalizeAiCorrection(parsed)
      } else if (AI_CORRECT_URL) {
        const { ok, status, body } = await postJson(AI_CORRECT_URL, {
          en: sentence.en,
          userTranslation: currentTranslation,
          refTranslation: sentence.ref,
        })
        if (!ok || !body?.ok) throw new Error(body?.error || `AI 批改失败（${status}）`)
        result = normalizeAiCorrection(body.data)
      } else {
        const { data, error: invokeError } = await supabase.functions.invoke('ai-correct', {
          body: { en: sentence.en, userTranslation: currentTranslation, refTranslation: sentence.ref },
        })
        if (invokeError) throw new Error(invokeError.message || 'AI 批改失败')
        result = normalizeAiCorrection(data)
      }
      setAiResults((prev) => {
        const next = new Map(prev)
        next.set(key, result)
        saveRecordMap(AI_RESULT_KEY, next)
        return next
      })
    } catch (e) {
      const aborted = e instanceof Error && e.name === 'AbortError'
      setAiResults((prev) => {
        if (!prev.has(key)) return prev
        const next = new Map(prev)
        next.delete(key)
        removeRecordKey(AI_RESULT_KEY, key)
        return next
      })
      if (practiceKeyRef.current === key) {
        setAiError(
          aborted
            ? 'AI 批改超时，请检查网络后重试'
            : e instanceof Error ? e.message : 'AI 批改失败，请稍后重试',
        )
      }
    } finally {
      setAiLoading((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  // ---------- 打卡 ----------

  async function handleCheckIn(day: number) {
    if (!user) {
      setError('请先登录后再打卡')
      return
    }
    if (busy || checkins.has(day) || day !== nextDay || day > TOTAL) return
    setBusy(true)
    setError(null)
    try {
      await createCheckin(user.id, day)

      const data = daily.find((d) => d.day === day)
      if (data) {
        const legacyWords = collectLegacyMarkedWords(day, data)
        if (legacyWords.length > 0) {
          addDayToVocabulary(day, legacyWords)
          try {
            await pushVocabularyToCloud(
              user.id,
              legacyWords.map((w) => ({ ...w, day })),
            )
          } catch {
            /* 本地已保存，云端失败不阻塞打卡 */
          }
        }
      }

      const next = new Set(checkins)
      next.add(day)
      setCheckins(next)
      saveCheckinsCache(user.id, [...next])
      toast.show(`Day ${day} 打卡成功`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '打卡失败，请稍后重试')
    } finally {
      setBusy(false)
    }
  }

  async function handleUndo() {
    if (!user || lastDoneDay < 1 || busy) return
    if (!window.confirm(`确定撤销 Day ${lastDoneDay} 的打卡？阅读进度与生词本会保留。`)) return
    setBusy(true)
    setError(null)
    try {
      await deleteCheckin(user.id, lastDoneDay)
      const next = new Set(checkins)
      next.delete(lastDoneDay)
      setCheckins(next)
      saveCheckinsCache(user.id, [...next])
      pickedDayRef.current = true
      setSelectedDay(lastDoneDay)
      setShowSummary(false)
      setRevealed(false)
      setIdx(0)
      setReadSet(loadReadingProgress(userKey, lastDoneDay))
      setOpenedTerms(loadOpenedTerms(userKey, lastDoneDay))
      setActiveSheet(null)
      setActiveTerm(null)
      toast.show(`已撤销 Day ${lastDoneDay} 打卡`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '撤销失败，请稍后重试')
    } finally {
      setBusy(false)
    }
  }

  function handleGoNextDay() {
    if (allDone) return
    pickDay(Math.min(nextDay, TOTAL))
  }

  function reviewThisDay() {
    setShowSummary(false)
    setIdx(0)
    setRevealed(false)
    scrollToPageTop()
  }

  // ---------- 句内渲染 ----------

  function renderSentence(readingData: SentenceReading): ReactNode {
    if (!sentence) return null
    const matchByStart = new Map(readingData.matches.map((m) => [m.start, m]))
    const items: ReactNode[] = []

    for (let i = 0; i < readingData.tokens.length; i++) {
      const token = readingData.tokens[i]
      if (!token.isWord) {
        items.push(<span key={`t-${token.start}`}>{token.text}</span>)
        continue
      }

      const match = matchByStart.get(token.wordIdx)
      if (match) {
        const saved =
          openedIds.has(termIdForSpan(currentIdx, match.start, match.charStart, match.charEnd)) ||
          (match.start === match.end && openedIds.has(termIdForWord(currentIdx, token.wordIdx)))
        items.push(
          <button
            type="button"
            key={`m-${match.charStart}`}
            className={`ec-key${saved ? ' is-opened' : ''}`}
            onClick={() => openMatch(match)}
            title={match.meaning || match.term}
          >
            {sentence.en.slice(match.charStart, match.charEnd)}
          </button>,
        )
        while (i + 1 < readingData.tokens.length && readingData.tokens[i + 1].end <= match.charEnd) {
          i++
        }
        continue
      }

      const saved = openedIds.has(termIdForWord(currentIdx, token.wordIdx))
      items.push(
        <button
          type="button"
          key={`w-${token.wordIdx}`}
          className={`ec-word${saved ? ' is-marked' : ''}`}
          onClick={() => openToken(token)}
          title="查看释义并收词"
        >
          {token.text}
        </button>,
      )
    }
    return items
  }

  // 语料/打卡记录加载中
  if (daily.length === 0 || checkinsLoading) {
    return (
      <div className="ec-page">
        <div className="ec-loading">
          {dailyError ? (
            <>
              <p>语料加载失败：{dailyError}</p>
              <Link to="/" className="ec-ghost" style={{ maxWidth: 220 }}>
                返回首页
              </Link>
            </>
          ) : (
            <>
              <div className="ec-loading-spinner" />
              <p>正在准备今天的句子…</p>
            </>
          )}
        </div>
      </div>
    )
  }

  if (!dayData || !sentence) {
    return (
      <div className="ec-page">
        <div className="ec-loading">
          <p>未找到 Day {selectedDay} 的语料</p>
          <Link to="/" className="ec-ghost" style={{ maxWidth: 220 }}>
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  const sheetSaved = openedTerms.some((t) => t.id === activeTerm?.id)
  const sheetMeaning =
    activeTerm?.meaning ||
    (lookup ? lookup.meanings.join('；') : '') ||
    (lookupLoading ? '正在查询本地词典…' : '本地词库暂未收录，可用 AI 查词补充。')
  const sheetPos = extractPos(lookup)
  const hasHighlight =
    !!activeTerm &&
    activeTerm.charStart >= 0 &&
    activeTerm.charEnd > activeTerm.charStart &&
    activeTerm.charEnd <= activeTerm.sentence.length
  const contextBefore = activeTerm && hasHighlight ? activeTerm.sentence.slice(0, activeTerm.charStart) : ''
  const contextHighlight = activeTerm && hasHighlight ? activeTerm.sentence.slice(activeTerm.charStart, activeTerm.charEnd) : ''
  const contextAfter = activeTerm && hasHighlight ? activeTerm.sentence.slice(activeTerm.charEnd) : ''

  const sheetLabel =
    activeSheet === 'word'
      ? activeTerm?.term || '词条'
      : activeSheet === 'list'
        ? '本篇句子'
        : activeSheet === 'words'
          ? '本篇生词'
          : activeSheet === 'plan'
            ? '打卡计划'
            : ''

  return (
    <div ref={pageRef} className={`ec-page${showSummary ? ' is-summary' : ''}`}>
      <header className="ec-topbar">
        <button
          type="button"
          className="ec-icon-btn"
          onClick={() => openSheet('list')}
          title="本篇句子"
          aria-label="本篇句子"
        >
          <Icon name="list" size={20} />
        </button>
        <div className="ec-topbar-center">
          <h1 className="ec-topbar-title">长难句精读</h1>
          <p className="ec-topbar-sub">
            Day {selectedDay} · {dayData.type} {dayData.source}
          </p>
        </div>
        <div className="ec-topbar-right">
          <button
            type="button"
            className="ec-icon-btn"
            onClick={() => openSheet('words')}
            title={`本篇生词 ${dayOpenedCount}`}
            aria-label={`本篇生词 ${dayOpenedCount}`}
          >
            <Icon name="vocab" size={19} />
          </button>
          <button
            type="button"
            className="ec-icon-btn"
            onClick={() => openSheet('plan')}
            title="打卡计划"
            aria-label="打卡计划"
          >
            <Icon name="calendar" size={19} />
          </button>
        </div>
      </header>

      {!showSummary ? (
        <>
          <section className="ec-head">
            <div className="ec-badge-row">
              <span className="ec-badge">
                <Icon name="book" size={14} />
                Day {selectedDay}
              </span>
              <span className="ec-badge-sub">
                {isDone ? '已打卡 · 随时回看' : isNext ? '按计划精读' : `需先完成 Day ${nextDay}`}
              </span>
            </div>
            <div className="ec-meta-row">
              <span className="ec-progress-text">
                第 <b>{currentIdx + 1}</b> / {sentenceCount} 句
              </span>
              <button
                type="button"
                className="ec-review-chip"
                onClick={() => openSheet('list')}
                title="查看本篇全部句子"
              >
                已读 <span className="ec-review-chip-num">{readCount}</span> 句
              </button>
            </div>
            <div className="ec-track">
              <i style={{ width: `${sentenceCount ? (readCount / sentenceCount) * 100 : 0}%` }} />
            </div>
          </section>

          {error && <div className="ec-error">{error}</div>}

          <section className="ec-study" key={`${selectedDay}-${currentIdx}`}>
            <p className="ec-sentence">{renderSentence(reading!)}</p>

            {!revealed && (
              <>
                <div className="ec-hints">
                  <span className="ec-hint">
                    <Icon name="hand" size={25} />
                    读懂这句话！
                  </span>
                  <span className="ec-hint">
                    <Icon name="sparkles" size={25} />
                    领会意思（不翻译更棒）
                  </span>
                  <span className="ec-hint">
                    <span className="ec-sos">SOS</span>
                    遇到生词别慌！点它！
                  </span>
                </div>
                <div className="ec-reveal-wrap">
                  <button type="button" className="ec-reveal-btn" onClick={() => setRevealed(true)}>
                    <Icon name="sparkles" size={19} />
                    点击显示答案
                  </button>
                </div>
              </>
            )}

            {revealed && (
              <div className="ec-answer">
                <div className="ec-panel">
                  <div className="ec-block-title">
                    <span className="ec-tag is-purple">析</span>
                    意群切分
                    <span className="ec-block-hint">点任意意群，看它的意思和语法成分</span>
                  </div>

                  <div className="ec-ref-line">
                    <span className="ec-ref-label">参考译文</span>
                    <p className="ec-translation">{sentence.ref}</p>
                  </div>

                  {sentence.ai?.backbone && (
                    <div className="ec-backbone ec-backbone-compact">
                      <span className="ec-backbone-label">句子主干</span>
                      <p>{sentence.ai.backbone}</p>
                    </div>
                  )}

                  {chunks.length > 0 && (
                    <div className="ec-chunk-row">
                      {chunks.map((chunk, i) => (
                        <span className="ec-chunk-wrap" key={`${chunk.start}-${i}`}>
                          {i > 0 && <span className="ec-slash">/</span>}
                          <button
                            type="button"
                            className={`ec-chunk ec-chunk-${i % 6}${activeChunk === i ? ' is-active' : ''}`}
                            onClick={() => setActiveChunk(activeChunk === i ? null : i)}
                            aria-expanded={activeChunk === i}
                            title="查看这一部分的意思和句子成分"
                          >
                            {chunk.text}
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {activeChunkInfo && (
                    <div className="ec-chunk-detail">
                      <div className="ec-chunk-detail-head">
                        <span className="ec-chunk-detail-text">{activeChunkInfo.text}</span>
                        <button
                          type="button"
                          className="ec-chunk-detail-close"
                          onClick={() => setActiveChunk(null)}
                          aria-label="收起意群解析"
                        >
                          <Icon name="x" size={14} />
                        </button>
                      </div>
                      <div className="ec-chunk-detail-block">
                        <span className="ec-chunk-detail-label">这一部分的意思</span>
                        <p>{activeChunkInfo.zh || '暂无整块释义，可参考上方整句参考译文理解。'}</p>
                      </div>
                      <div className="ec-chunk-detail-block">
                        <span className="ec-chunk-detail-label">句子成分</span>
                        <p className="ec-chunk-detail-grammar">{activeChunkInfo.grammar}</p>
                        {activeChunkInfo.explanation && (
                          <p className="ec-chunk-detail-explain">{activeChunkInfo.explanation}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {sentence.ai && sentence.ai.structure.length > 0 && (
                    <details className="ec-structure-details">
                      <summary>查看全部成分解析（{sentence.ai.structure.length}）</summary>
                      <ul className="ec-structure">
                        {sentence.ai.structure.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </details>
                  )}

                  {grammar.length > 0 && (
                    <div className="ec-grammar-note">
                      <b>语法提示</b>
                      <ul className="ec-grammar-list">
                        {grammar.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {reading && reading.chips.length > 0 && (
                  <div className="ec-panel">
                    <div className="ec-block-title">
                      <span className="ec-tag">词</span>
                      短语搭配
                    </div>
                    <div className="ec-colloc-chips">
                      {reading.chips.map((chip, i) => (
                        <button
                          type="button"
                          className="ec-colloc-chip"
                          key={`${chip.raw}-${i}`}
                          onClick={() => openChip(i)}
                          title="查看释义"
                        >
                          <span className="ec-colloc-term">{chip.term}</span>
                          {chip.meaning && <span className="ec-colloc-meaning">{chip.meaning}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <details className="ec-practice" key={`practice-${translationKey}`}>
                  <summary className="ec-practice-summary">
                    <Icon name="pencil" size={15} />
                    <span>翻译练习</span>
                    <span className="ec-practice-hint">写一句自己的译文，看看和参考译文的差距</span>
                    {currentScore != null && (
                      <span className={`ec-score-pill ${scoreBg(currentScore)} ${scoreColor(currentScore)}`}>
                        相似度 {currentScore}%
                      </span>
                    )}
                    <Icon name="chevronDown" size={16} className="ec-practice-chevron" />
                  </summary>
                  <div className="ec-practice-body">
                    <textarea
                      className="ec-textarea"
                      value={currentTranslation}
                      onChange={(e) => handleTranslationChange(e.target.value)}
                      placeholder="在此输入你的翻译…"
                      rows={2}
                    />
                    <div className="ec-practice-actions">
                      <button
                        type="button"
                        className="ec-btn-score"
                        onClick={handleScore}
                        disabled={!currentTranslation.trim()}
                      >
                        打分
                      </button>
                      <button
                        type="button"
                        className="ec-btn-ai"
                        onClick={handleAiCorrect}
                        disabled={!currentTranslation.trim() || currentAiLoading}
                        title="AI 批改会消耗 AI 调用额度，仅在需要时点击"
                      >
                        {currentAiLoading ? (
                          <>
                            <span className="ec-spinner" />
                            批改中…
                          </>
                        ) : (
                          <>
                            <Icon name="sparkles" size={13} />
                            AI 批改
                          </>
                        )}
                      </button>
                      {currentScore != null && (
                        <span className={`ec-score-pill ${scoreBg(currentScore)} ${scoreColor(currentScore)}`}>
                          本地相似度 {currentScore}%
                        </span>
                      )}
                    </div>

                    {aiError && <p className="ec-practice-error">AI 批改失败：{aiError}</p>}

                    {currentAi && (
                      <AiResultBoundary>
                        <div className="ec-ai-card">
                          <div className="ec-ai-head">
                            <b>AI 批改</b>
                            {currentAi.score != null && (
                              <span className={`ec-score-pill ${scoreBg(currentAi.score)} ${scoreColor(currentAi.score)}`}>
                                AI 评分 {currentAi.score}
                              </span>
                            )}
                          </div>
                          {currentAi.corrected && (
                            <div className="ec-ai-block">
                              <p className="ec-ai-label">修正译文</p>
                              <p>{currentAi.corrected}</p>
                            </div>
                          )}
                          {currentAi.issues.length > 0 && (
                            <div className="ec-ai-block">
                              <p className="ec-ai-label">存在的问题</p>
                              <ul className="ec-ai-list">
                                {currentAi.issues.map((issue, i) => (
                                  <li key={i}>{issue}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {currentAi.suggestions.length > 0 && (
                            <div className="ec-ai-block">
                              <p className="ec-ai-label">改进建议</p>
                              <ul className="ec-ai-list">
                                {currentAi.suggestions.map((sug, i) => (
                                  <li key={i}>{sug}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </AiResultBoundary>
                    )}
                  </div>
                </details>
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="ec-summary">
          <div className="ec-summary-icon">
            <Icon name="check" size={32} />
          </div>
          <p className="ec-summary-eyebrow">
            Day {selectedDay} · {readCount >= sentenceCount ? 'Complete' : `${readCount} / ${sentenceCount}`}
          </p>
          <h2 className="ec-summary-title">
            {readCount >= sentenceCount ? '这一篇，读完了。' : '这一篇，先读到这里。'}
          </h2>
          <p className="ec-summary-text">
            {dayData.type} {dayData.source} · 共 <b>{sentenceCount}</b> 句。
            {readCount < sentenceCount
              ? `还有 ${sentenceCount - readCount} 句未读，可以随时回看。`
              : '每一句都留下了阅读痕迹。'}
          </p>

          <div className={`ec-checkin-badge${isDone ? ' is-done' : ''}`}>
            <Icon name="check" size={13} />
            {isDone
              ? `Day ${selectedDay} 已打卡`
              : isNext
                ? '可以完成今日打卡'
                : `打卡需先完成 Day ${nextDay}`}
          </div>

          <div className="ec-summary-stats">
            <div className="ec-summary-stat">
              <b>{sentenceCount}</b>
              <span>句子</span>
            </div>
            <div className="ec-summary-stat">
              <b>{dayOpenedCount}</b>
              <span>本篇生词</span>
            </div>
            <div className="ec-summary-stat">
              <b>{readCount}</b>
              <span>已读</span>
            </div>
          </div>

          {error && <div className="ec-error">{error}</div>}

          <div className="ec-summary-actions">
            {isDone ? (
              allDone ? (
                <button type="button" className="ec-primary" disabled>
                  {TOTAL} 天全部完成
                </button>
              ) : (
                <button type="button" className="ec-primary" onClick={handleGoNextDay}>
                  继续 Day {nextDay}
                  <Icon name="arrowRight" size={17} />
                </button>
              )
            ) : isNext ? (
              <button
                type="button"
                className="ec-primary"
                onClick={() => handleCheckIn(selectedDay)}
                disabled={busy}
              >
                {busy ? '打卡中…' : `完成 Day ${selectedDay} 打卡`}
              </button>
            ) : (
              <button type="button" className="ec-primary" onClick={handleGoNextDay}>
                去做 Day {nextDay} 打卡
                <Icon name="arrowRight" size={17} />
              </button>
            )}

            <button type="button" className="ec-ghost" onClick={reviewThisDay}>
              回看本篇
            </button>
            <button type="button" className="ec-ghost" onClick={() => openSheet('words')}>
              本篇生词 {dayOpenedCount}
            </button>
            <Link to="/vocabulary" className="ec-ghost">
              打开生词本
            </Link>
          </div>

          <p className="ec-summary-note">
            打卡按 Day 1 到 Day {TOTAL} 顺序推进；翻译练习、阅读进度和生词都会自动保存在本机，回到任意一天都能接着读。
          </p>
        </section>
      )}

      {!showSummary &&
        createPortal(
          <div className="ec-footer">
            <div className="ec-footer-inner">
              <button
                type="button"
                className="ec-footer-prev"
                onClick={goPrev}
                disabled={currentIdx === 0}
                aria-label="上一句"
              >
                <Icon name="arrowLeft" size={20} />
              </button>
              <div className="ec-footer-mid">
                <div className="ec-footer-step">
                  第 <b>{currentIdx + 1}</b> / {sentenceCount} 句
                </div>
                <div className="ec-footer-track">
                  <i style={{ width: `${sentenceCount ? ((currentIdx + 1) / sentenceCount) * 100 : 0}%` }} />
                </div>
              </div>
              <button type="button" className="ec-footer-next" onClick={goNext}>
                {isLastSentence ? '完成本篇' : '下一句'}
                <Icon name={isLastSentence ? 'check' : 'arrowRight'} size={18} />
              </button>
            </div>
          </div>,
          document.body,
        )}

      {activeSheet &&
        createPortal(
          <div className="ec-overlay">
            <button
              type="button"
              className="ec-backdrop"
              onClick={closeSheet}
              aria-label="关闭"
            />
            <div className="ec-sheet" role="dialog" aria-modal="true" aria-label={sheetLabel}>
              <div className="ec-sheet-handle" />
              <button type="button" className="ec-sheet-close" onClick={closeSheet} aria-label="关闭">
                <Icon name="x" size={18} />
              </button>

              {activeSheet === 'word' && activeTerm && (
                <>
                  <p className="ec-sheet-eyebrow">
                    Day {activeTerm.day} · 第 {activeTerm.sentIdx + 1} 句 ·{' '}
                    {activeTerm.isPhrase ? '短语搭配' : '生词'}
                  </p>
                  <h2 className="ec-word-title">{activeTerm.term || activeTerm.word}</h2>
                  <p className="ec-word-meaning">{sheetMeaning}</p>
                  <div className="ec-word-meta">
                    {sheetPos && <span className="ec-pos">{sheetPos}</span>}
                    {lookup?.phonetic && <span className="ec-phonetic">{lookup.phonetic}</span>}
                    {sheetSaved && (
                      <span className="ec-saved-tag">
                        <Icon name="check" size={12} />
                        已收进生词本
                      </span>
                    )}
                  </div>

                  <p className="ec-context">
                    {hasHighlight ? (
                      <>
                        {contextBefore}
                        <mark>{contextHighlight}</mark>
                        {contextAfter}
                      </>
                    ) : (
                      activeTerm.sentence
                    )}
                  </p>

                  <button
                    type="button"
                    className={`ec-save-row${sheetSaved ? ' is-on' : ''}`}
                    onClick={handleToggleSave}
                    aria-pressed={sheetSaved}
                  >
                    <span className="ec-save-box">{sheetSaved && <Icon name="check" size={14} />}</span>
                    <span className="ec-save-text">{sheetSaved ? '已加入生词本' : '加入生词本'}</span>
                    <span className="ec-save-note">
                      {sheetSaved ? '再次点击移出' : '点击重新加入'}
                    </span>
                  </button>

                  {activeTerm.isPhrase && activeTerm.related.length > 0 && (
                    <>
                      <p className="ec-section-label">短语拆解</p>
                      <div className="ec-related-chips">
                        {activeTerm.related.map((word) => (
                          <button
                            type="button"
                            className="ec-related-chip"
                            key={word}
                            onClick={() => openRelatedWord(word)}
                          >
                            {word}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <p className="ec-section-label">
                    词典释义{activeTerm.isPhrase ? ` · ${activeTerm.headword}` : ''}
                  </p>

                  {lookup ? (
                    <div className="ec-lookup-card">
                      {lookup.meanings.length > 0 && (
                        <ul className="ec-lookup-list">
                          {lookup.meanings.map((meaning, i) => (
                            <li key={i}>{meaning}</li>
                          ))}
                        </ul>
                      )}
                      {lookup.mnemonic && (
                        <p className="ec-lookup-line">
                          <b>助记</b>
                          <span>{lookup.mnemonic}</span>
                        </p>
                      )}
                      {lookup.collocations.length > 0 && (
                        <p className="ec-lookup-line">
                          <b>搭配</b>
                          <span>{lookup.collocations.join('；')}</span>
                        </p>
                      )}
                      {lookup.example && (
                        <p className="ec-lookup-line">
                          <b>例句</b>
                          <span>{lookup.example}</span>
                        </p>
                      )}
                      {lookup.examNote && (
                        <p className="ec-lookup-line">
                          <b>考点</b>
                          <span>{lookup.examNote}</span>
                        </p>
                      )}
                    </div>
                  ) : lookupLoading ? (
                    <p className="ec-about-p">正在查询本地词典…</p>
                  ) : (
                    <p className="ec-about-p">
                      本地词库未收录「{activeTerm.headword}」，可以调用 AI 查词补充释义。
                    </p>
                  )}

                  {lookupError && <p className="ec-practice-error">{lookupError}</p>}

                  {!lookup && !lookupLoading && (
                    <LookupPromptFallback word={activeTerm.headword} />
                  )}

                  {!lookup && !lookupLoading && (
                    <button
                      type="button"
                      className="ec-ai-lookup-btn"
                      onClick={handleAiLookup}
                      disabled={lookupLoading}
                    >
                      <Icon name="sparkles" size={14} />
                      AI 查词 · {activeTerm.headword}
                    </button>
                  )}

                  <div className="ec-sheet-actions">
                    <button type="button" className="ec-primary" onClick={closeSheet}>
                      记下了
                    </button>
                    <Link to="/vocabulary" className="ec-ghost" onClick={closeSheet}>
                      查看生词本
                    </Link>
                  </div>
                </>
              )}

              {activeSheet === 'list' && (
                <>
                  <p className="ec-sheet-eyebrow">Day {selectedDay}</p>
                  <h2 className="ec-sheet-title">本篇句子</h2>
                  <p className="ec-sheet-sub">
                    {sentenceCount} 句 · 已读 {readCount} 句 · 生词 {dayOpenedCount} 个
                  </p>
                  <div className="ec-list">
                    {dayData.sentences.map((item, i) => {
                      const done = readSet.has(i)
                      const words = openedTerms.filter((t) => t.sentIdx === i).length
                      return (
                        <button
                          type="button"
                          className={`ec-list-item${i === currentIdx ? ' is-current' : ''}`}
                          key={`${item.num}-${i}`}
                          onClick={() => jumpToSentence(i)}
                        >
                          <span className="ec-list-no">{i + 1}</span>
                          <span className="ec-list-body">
                            <span className="ec-list-snippet">{item.en}</span>
                            <span className="ec-list-status">
                              <span
                                className={`ec-status-dot${done ? ' is-done' : ''}${i === currentIdx ? ' is-current' : ''}`}
                              />
                              {done ? '已读' : '未读'} · 第 {i + 1} 句
                            </span>
                          </span>
                          <span className="ec-list-count">{words > 0 ? `${words} 词` : ''}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {activeSheet === 'words' && (
                <>
                  <p className="ec-sheet-eyebrow">Day {selectedDay}</p>
                  <h2 className="ec-sheet-title">本篇生词</h2>
                  <p className="ec-sheet-sub">点开即收词 · 共 {dayOpenedCount} 个</p>
                  {openedTerms.length === 0 ? (
                    <p className="ec-about-p">
                      还没有点开词条。回到句子，点击任意单词或虚线短语，释义会自动收进生词本，不用等到打卡。
                    </p>
                  ) : (
                    <div className="ec-list">
                      {openedTerms.map((record) => (
                        <button
                          type="button"
                          className="ec-list-item"
                          key={record.id}
                          onClick={() => openStoredTerm(record)}
                        >
                          <span className="ec-list-body">
                            <span className="ec-list-snippet">{record.term}</span>
                            <span className="ec-list-status">
                              {record.meaning || '点击查看释义'}
                            </span>
                          </span>
                          <span className="ec-list-count">第 {record.sentIdx + 1} 句</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="ec-sheet-actions">
                    <Link to="/vocabulary" className="ec-primary" onClick={closeSheet}>
                      打开生词本
                    </Link>
                    <button type="button" className="ec-ghost" onClick={closeSheet}>
                      继续精读
                    </button>
                  </div>
                </>
              )}

              {activeSheet === 'plan' && (
                <>
                  <p className="ec-sheet-eyebrow">{TOTAL} 天计划</p>
                  <h2 className="ec-sheet-title">打卡计划</h2>
                  <p className="ec-sheet-sub">按顺序打卡 · 任意一天都可以随时回看</p>

                  <div className="ec-plan-stats">
                    <div className="ec-plan-stat">
                      <b>{checkins.size}</b>
                      <span>已打卡</span>
                    </div>
                    <div className="ec-plan-stat">
                      <b>{allReadDays.size}</b>
                      <span>读过篇目</span>
                    </div>
                    <div className="ec-plan-stat">
                      <b>
                        {readCount}/{sentenceCount}
                      </b>
                      <span>本篇进度</span>
                    </div>
                  </div>

                  <div className="ec-plan-grid">
                    {Array.from({ length: TOTAL }, (_, i) => i + 1).map((day) => {
                      const done = checkins.has(day)
                      const next = day === nextDay && !done
                      const read = allReadDays.has(day)
                      const selected = day === selectedDay
                      return (
                        <button
                          type="button"
                          key={day}
                          className={`ec-day${done ? ' is-done' : ''}${next ? ' is-next' : ''}${read ? ' is-read' : ''}${selected ? ' is-selected' : ''}`}
                          onClick={() => pickDay(day)}
                          title={`Day ${day}`}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>

                  {error && <div className="ec-error">{error}</div>}

                  <div className="ec-sheet-actions">
                    {allDone ? (
                      <button type="button" className="ec-primary" disabled>
                        {TOTAL} 天已全部完成
                      </button>
                    ) : isDone ? (
                      selectedDay === lastDoneDay ? (
                        <button
                          type="button"
                          className="ec-ghost"
                          onClick={handleUndo}
                          disabled={busy}
                        >
                          <span className="ec-danger-text">撤销 Day {lastDoneDay} 打卡</span>
                        </button>
                      ) : (
                        <p className="ec-about-p">
                          Day {selectedDay} 已打卡。撤销仅支持最近一次（Day {lastDoneDay}）。
                        </p>
                      )
                    ) : isNext ? (
                      <button
                        type="button"
                        className="ec-primary"
                        onClick={() => handleCheckIn(selectedDay)}
                        disabled={busy}
                      >
                        {busy ? '打卡中…' : `完成 Day ${selectedDay} 打卡`}
                      </button>
                    ) : (
                      <button type="button" className="ec-primary" onClick={handleGoNextDay}>
                        回到 Day {nextDay}
                        <Icon name="arrowRight" size={17} />
                      </button>
                    )}

                    {lastDoneDay >= 1 && !allDone && !(isDone && selectedDay === lastDoneDay) && (
                      <button
                        type="button"
                        className="ec-ghost"
                        onClick={handleUndo}
                        disabled={busy}
                      >
                        <span className="ec-danger-text">撤销最近打卡 Day {lastDoneDay}</span>
                      </button>
                    )}

                    <button type="button" className="ec-ghost" onClick={closeSheet}>
                      继续阅读
                    </button>
                  </div>

                  <div className="ec-about">
                    <p className="ec-about-p">
                      <b>顺序打卡：</b>英语打卡从 Day 1 依次解锁，完成当前篇后才能推进到下一天。
                    </p>
                    <p className="ec-about-p">
                      <b>精读进度：</b>读过的句子保存在本机，回到某一天会从第一句未读开始。
                    </p>
                    <p className="ec-about-p">
                      <b>即点即收：</b>点击虚线短语或任意单词，词条会自动进入生词本，无需等到打卡。
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
