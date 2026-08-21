import { useEffect, useMemo, useState, useCallback, Component } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ENGLISH_DAILY, type EnglishDay } from '../data/englishDaily'
import { fetchMyCheckins, createCheckin, deleteCheckin } from '../lib/englishCheckin'
import { loadMarkedWords, saveMarkedWords, addDayToVocabulary, pushVocabularyToCloud } from '../lib/vocabulary'
import { supabase } from '../lib/supabase'
import { postJson } from '../lib/httpRequest'

const TOTAL = 150

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

// 兜底归一化 AI 返回：强制所有字段为字符串/字符串数组/数字，杜绝畸形结构导致 React 渲染崩溃
function normalizeAiCorrection(raw: any): AiCorrection {
  const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))
  // 模型偶发把 issues/suggestions/structure 返回成对象列表（如 {问题, 建议}），
  // 这里提取首个字符串字段，避免前端渲染成 [object Object]
  const itemStr = (v: unknown): string => {
    if (typeof v === 'string') return v
    if (v && typeof v === 'object') {
      const first = Object.values(v as Record<string, unknown>).find(x => typeof x === 'string')
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

// 局部错误边界：AI 卡片渲染异常时只显示错误提示，避免整个页面崩溃变黑屏
interface EBState { hasError: boolean }
class AiResultBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false }
  static getDerivedStateFromError(): EBState { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return <p className="text-xs text-red-500">AI 结果渲染异常，请重新点击解析</p>
    }
    return this.props.children
  }
}

// CloudBase 云函数 HTTP 地址（国内节点直连讯飞，稳定）；未配置时回退到 Supabase Edge Function
const AI_CORRECT_URL = (import.meta.env.VITE_AI_CORRECT_URL as string | undefined)?.trim() || ''

// ---------- 翻译相似度打分 ----------

/** 计算两个字符串的相似度，返回 0-100 的分数 */
function calcTranslationScore(userText: string, refText: string): number {
  const u = userText.trim()
  const r = refText.trim()
  if (!u) return 0
  if (u === r) return 100

  // 1. 字符级相似度（最长公共子序列比率）
  const lcsLen = lcs(u, r)
  const charScore = (2 * lcsLen) / (u.length + r.length) * 100

  // 2. 词级相似度（Jaccard）
  const tokenize = (s: string) => {
    const tokens: string[] = []
    // 中文按字符拆，英文/数字按词拆
    const segs = s.split(/([\u4e00-\u9fff]+)/)
    for (const seg of segs) {
      if (/[\u4e00-\u9fff]/.test(seg)) {
        for (const ch of seg) tokens.push(ch)
      } else {
        tokens.push(...seg.split(/[^a-zA-Z0-9]+/).filter(Boolean).map(t => t.toLowerCase()))
      }
    }
    return new Set(tokens)
  }
  const uSet = tokenize(u)
  const rSet = tokenize(r)
  const intersection = new Set([...uSet].filter(x => rSet.has(x)))
  const union = new Set([...uSet, ...rSet])
  const wordScore = union.size > 0 ? (intersection.size / union.size) * 100 : 0

  // 综合：字符 60% + 词 40%
  return Math.round(charScore * 0.6 + wordScore * 0.4)
}

function lcs(a: string, b: string): number {
  const m = a.length, n = b.length
  if (m === 0 || n === 0) return 0
  // 使用滚动数组节省内存
  let prev = new Array(n + 1).fill(0)
  let cur = new Array(n + 1).fill(0)
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1])
    }
    ;[prev, cur] = [cur, prev]
  }
  return prev[n]
}

// ---------- 单词分词 ----------

interface Token {
  text: string
  isWord: boolean
  idx: number
}

/** 将英文句子拆分为可点击的单词 token */
function tokenizeSentence(text: string): Token[] {
  const tokens: Token[] = []
  let wordIdx = 0
  // 匹配单词（含缩写 don't, it's 和连字符词 co-operative, state-of-the-art）
  const re = /([a-zA-Z]+(?:[-'][a-zA-Z]+)*)|([^a-zA-Z]+)/g
  let m
  while ((m = re.exec(text)) !== null) {
    if (m[1]) {
      tokens.push({ text: m[1], isWord: true, idx: wordIdx++ })
    } else if (m[2]) {
      // 非单词字符，按字符拆分
      for (const ch of m[2]) {
        tokens.push({ text: ch, isWord: false, idx: -1 })
      }
    }
  }
  return tokens
}

// ---------- 长难句切分还原 ----------

/** 切分片段是无空格的粘连文本，对照原句 en 还原出空格，让单词可读。
 * 数据里可能存在三种噪音：① 单词粘连；② 讲解性括号注释（如 (that)、(at least)，
 * 括号或括号内的词在原句中并不存在）；③ 连字符/撇号/引号被 PDF 抽取改写（-- vs -、’ vs '）。
 * 这里通过「标点折叠 + 多候选匹配」尽可能把片段还原成原句中的连续子串。 */
function restoreChunkSpaces(chunk: string, orig: string): string {
  if (!chunk) return chunk
  const needleRaw = chunk.replace(/\s+/g, '')
  if (!needleRaw) return chunk

  // 原句去掉空格，并记录「去空格下标 -> 原句下标」映射
  const origMap: number[] = []
  let strippedBuilder = ''
  for (let i = 0; i < orig.length; i++) {
    if (/\s/.test(orig[i])) continue
    strippedBuilder += orig[i]
    origMap.push(i)
  }

  // 标点折叠：连字符/破折号统一为 '-'（连续多个合并成一个）、撇号统一为 "'"、引号统一为 '"'
  const foldChar = (c: string): { out: string; skip: boolean } => {
    if (/[\u002D\u2010-\u2015]/.test(c)) return { out: '-', skip: false }
    if (/[\u0027\u2018\u2019\u201A\u201B]/.test(c)) return { out: "'", skip: false }
    if (/[\u0022\u201C\u201D\u201E\u201F]/.test(c)) return { out: '"', skip: false }
    return { out: c, skip: false }
  }

  // 从「去空格字符串」折叠，同时记录折叠下标 -> 去空格下标
  let folded = ''
  const foldMap: number[] = []
  let prevDash = false
  for (let i = 0; i < strippedBuilder.length; i++) {
    const { out, skip } = foldChar(strippedBuilder[i])
    if (skip) continue
    if (out === '-') {
      if (prevDash) continue // 合并连续连字符
      prevDash = true
      folded += '-'
      foldMap.push(i)
      continue
    }
    prevDash = false
    folded += out
    foldMap.push(i)
  }

  // 片段同样折叠
  const foldChunk = (s: string): string =>
    s
      .replace(/[\u002D\u2010-\u2015]+/g, '-')
      .replace(/[\u0027\u2018\u2019\u201A\u201B]+/g, "'")
      .replace(/[\u0022\u201C\u201D\u201E\u201F]+/g, '"')

  const F = foldChunk(needleRaw)
  // 候选片段（按优先级生成，最终取「最长命中」以保留最多原文信息）：
  // 1) 原样 2) 去掉括号保留内容 3) 去掉整组括号 4) 先整组再去残留括号
  const candidates = [
    F,
    F.replace(/[()]/g, ''),
    F.replace(/\([^()]*\)/g, ''),
    F.replace(/\([^()]*\)/g, '').replace(/[()]/g, ''),
  ]

  let bestStart = -1
  let bestLen = 0
  for (const cand of candidates) {
    if (!cand) continue
    const idx = folded.indexOf(cand)
    if (idx !== -1 && cand.length > bestLen) {
      bestStart = idx
      bestLen = cand.length
    }
  }

  if (bestStart === -1) return chunk // 无法匹配则原样显示
  const startOrig = origMap[foldMap[bestStart]]
  const endOrig = origMap[foldMap[bestStart + bestLen - 1]]
  return orig.slice(startOrig, endOrig + 1)
}

// ---------- 颜色工具 ----------

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

// ---------- 页面组件 ----------

export default function EnglishCheckin() {
  const { user } = useAuth()
  const [checkins, setCheckins] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 标记单词：Set<"dayIdx-sentIdx-wordIdx">，从 localStorage 初始化
  const [markedWords, setMarkedWords] = useState<Set<string>>(() => loadMarkedWords())
  // 翻译输入：Map<"dayIdx-sentIdx", string>
  const [translations, setTranslations] = useState<Map<string, string>>(new Map())
  // 打分结果：Map<"dayIdx-sentIdx", number | null>
  const [scores, setScores] = useState<Map<string, number | null>>(new Map())
  // AI 批改结果：Map<"dayIdx-sentIdx", AiCorrection | null>
  const [aiResults, setAiResults] = useState<Map<string, AiCorrection | null>>(new Map())
  // AI 批改进行中的句子：Set<"dayIdx-sentIdx">
  const [aiLoading, setAiLoading] = useState<Set<string>>(new Set())
  // AI 批改错误信息
  const [aiError, setAiError] = useState<string | null>(null)
  // 预生成「解析」卡片展开状态：Set<"dayIdx-sentIdx">
  const [showAnalysis, setShowAnalysis] = useState<Set<string>>(new Set())

  const completedDays = useMemo(() => new Set(checkins), [checkins])
  const nextDay = useMemo(() => {
    for (let d = 1; d <= TOTAL; d++) if (!completedDays.has(d)) return d
    return TOTAL + 1
  }, [completedDays])
  const lastDoneDay = nextDay - 1
  const progress = (completedDays.size / TOTAL) * 100
  const allDone = nextDay > TOTAL

  useEffect(() => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    fetchMyCheckins(user.id)
      .then((list) => {
        const set = new Set(list.map((c) => c.day))
        setCheckins(set)
        for (let d = 1; d <= TOTAL; d++) {
          if (!set.has(d)) { setSelectedDay(d); break }
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [user])

  const dayData: EnglishDay = ENGLISH_DAILY.find((d) => d.day === selectedDay) ?? ENGLISH_DAILY[0]
  const isDone = completedDays.has(selectedDay)
  const isNext = selectedDay === nextDay

  const handleCheckIn = async () => {
    if (!user || isDone || nextDay > TOTAL || busy) return
    setBusy(true); setError(null)
    try {
      await createCheckin(user.id, nextDay)

      // 收集当天标记的生词，存入生词本
      const dayVocabWords: { word: string; sentence: string; sentIdx: number; wordIdx: number }[] = []
      const dayData = ENGLISH_DAILY.find((d) => d.day === nextDay)
      if (dayData) {
        for (let si = 0; si < dayData.sentences.length; si++) {
          const tokens = tokenizeSentence(dayData.sentences[si].en)
          for (const t of tokens) {
            if (t.isWord && markedWords.has(`${nextDay}-${si}-${t.idx}`)) {
              dayVocabWords.push({ word: t.text, sentence: dayData.sentences[si].en, sentIdx: si, wordIdx: t.idx })
            }
          }
        }
        if (dayVocabWords.length > 0) {
          addDayToVocabulary(nextDay, dayVocabWords)
          // 同步推送到云端生词本（登录用户）
          try {
            await pushVocabularyToCloud(
              user.id,
              dayVocabWords.map((w) => ({ ...w, day: nextDay })),
            )
          } catch { /* 忽略同步失败，本地已保存 */ }
        }
      }

      const set = new Set(checkins); set.add(nextDay); setCheckins(set)
      setSelectedDay(nextDay + 1 > TOTAL ? TOTAL : nextDay + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : '打卡失败')
    } finally { setBusy(false) }
  }

  const handleUndo = async () => {
    if (!user || lastDoneDay < 1 || busy) return
    setBusy(true); setError(null)
    try {
      await deleteCheckin(user.id, lastDoneDay)
      const set = new Set(checkins); set.delete(lastDoneDay); setCheckins(set)
      setSelectedDay(lastDoneDay)
    } catch (e) {
      setError(e instanceof Error ? e.message : '撤销失败')
    } finally { setBusy(false) }
  }

  const toggleWord = useCallback((dayIdx: number, sentIdx: number, wordIdx: number) => {
    const key = `${dayIdx}-${sentIdx}-${wordIdx}`
    setMarkedWords(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      saveMarkedWords(next)
      return next
    })
  }, [])

  const handleScore = useCallback((dayIdx: number, sentIdx: number) => {
    const key = `${dayIdx}-${sentIdx}`
    const userText = translations.get(key) || ''
    const day = ENGLISH_DAILY.find(d => d.day === dayIdx)
    const refText = day?.sentences[sentIdx]?.ref || ''
    const score = calcTranslationScore(userText, refText)
    setScores(prev => { const next = new Map(prev); next.set(key, score); return next })
  }, [translations])

  // 展开/收起预生成「解析」卡片（本地数据，不消耗 AI token）
  const toggleAnalysis = useCallback((dayIdx: number, sentIdx: number) => {
    const key = `${dayIdx}-${sentIdx}`
    setShowAnalysis(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // 调用 Supabase Edge Function 完成 AI 翻译批改
  const handleAiCorrect = useCallback(async (dayIdx: number, sentIdx: number) => {
    const key = `${dayIdx}-${sentIdx}`
    if (aiLoading.has(key)) return
    const userText = translations.get(key) || ''
    const day = ENGLISH_DAILY.find(d => d.day === dayIdx)
    const sentence = day?.sentences[sentIdx]?.en || ''
    // 参考译文只取当前这一句的（来自逐句译文 ref），不要传整段译文，
    // 否则模型会把"修正译文"直接输出成整段参考译文
    const refText = day?.sentences[sentIdx]?.ref || ''

    setAiLoading(prev => new Set(prev).add(key))
    setAiError(null)
    try {
      let result: AiCorrection
      if (AI_CORRECT_URL) {
        // 走腾讯云 SCF 云函数；原生平台用原生网络栈，绕开 WebView fetch 崩溃黑屏
        const { ok, status, body } = await postJson(AI_CORRECT_URL, {
          en: sentence,
          userTranslation: userText,
          refTranslation: refText,
        })
        if (!ok || !body?.ok) throw new Error(body?.error || `AI 批改失败（${status}）`)
        result = normalizeAiCorrection(body.data)
      } else {
        // 回退：Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('ai-correct', {
          body: { en: sentence, userTranslation: userText, refTranslation: refText },
        })
        if (error) throw new Error(error.message || 'AI 批改失败')
        result = normalizeAiCorrection(data)
      }
      setAiResults(prev => { const next = new Map(prev); next.set(key, result); return next })
    } catch (e) {
      const aborted = e instanceof Error && e.name === 'AbortError'
      setAiError(
        aborted
          ? 'AI 批改超时，请检查网络后重试'
          : e instanceof Error ? e.message : 'AI 批改失败，请稍后重试'
      )
    } finally {
      setAiLoading(prev => { const next = new Set(prev); next.delete(key); return next })
    }
  }, [translations, aiLoading])

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 space-y-4">
      {/* 进度条 */}
      <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold">英语长难句打卡</h1>
          <span className="text-sm text-gray-500 dark:text-slate-400">{completedDays.size}/{TOTAL} 天</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden mt-3">
          <div className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
          {allDone ? '🎉 恭喜完成全部 150 天打卡！' : `按顺序打卡，接下来是 Day ${nextDay}`}
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 px-3 py-2 text-sm text-red-600 dark:text-red-300">{error}</div>
      )}

      {aiError && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">AI 批改失败：{aiError}</div>
      )}

      {/* 逐句翻译：原文 + 翻译输入框放在一起 */}
      <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700">
        <h2 className="text-lg font-bold mb-1">Day {dayData.day}</h2>
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 text-xs">{dayData.type}</span>
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300 text-xs">{dayData.source}</span>
          {isDone && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs">已打卡</span>}
        </div>
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">点击单词标记生词 · 逐句翻译后点击「打分」</p>

        <div className="space-y-5">
          {dayData.sentences.map((s, sentIdx) => {
            const tokens = tokenizeSentence(s.en)
            const tKey = `${dayData.day}-${sentIdx}`
            const scoreVal = scores.get(tKey)
            const markedCount = tokens.filter(t => t.isWord && markedWords.has(`${dayData.day}-${sentIdx}-${t.idx}`)).length

            return (
              <div key={sentIdx} className="border border-gray-100 dark:border-slate-700 rounded-lg p-3">
                {/* 原文 */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">{s.num}</span>
                  {scoreVal != null && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreBg(scoreVal)} ${scoreColor(scoreVal)}`}>
                      相似度 {scoreVal}%
                    </span>
                  )}
                </div>
                <p className="text-[15px] leading-relaxed text-gray-800 dark:text-slate-100 mb-2 select-none">
                  {tokens.map((t, i) =>
                    t.isWord ? (
                      <span
                        key={i}
                        onClick={() => toggleWord(dayData.day, sentIdx, t.idx)}
                        className={`cursor-pointer transition-colors rounded px-0.5 ${
                          markedWords.has(`${dayData.day}-${sentIdx}-${t.idx}`)
                            ? 'bg-red-200 text-red-700 dark:bg-red-900/50 dark:text-red-400 font-medium'
                            : 'hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                      >{t.text}</span>
                    ) : (
                      <span key={i}>{t.text}</span>
                    )
                  )}
                </p>
                {markedCount > 0 && (
                  <p className="text-xs text-red-500 dark:text-red-400 mb-2">{markedCount} 个生词已标记</p>
                )}

                {/* 翻译输入 */}
                <textarea
                  value={translations.get(tKey) || ''}
                  onChange={e => {
                    const v = e.target.value
                    setTranslations(prev => { const next = new Map(prev); next.set(tKey, v); return next })
                    setScores(prev => { const next = new Map(prev); next.delete(tKey); return next })
                    setAiResults(prev => { const next = new Map(prev); next.delete(tKey); return next })
                  }}
                  placeholder="在此输入你的翻译..."
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 px-3 py-2 text-sm text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleScore(dayData.day, sentIdx)}
                    disabled={!translations.get(tKey)?.trim()}
                    className="px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    打分
                  </button>
                  <button
                    onClick={() => toggleAnalysis(dayData.day, sentIdx)}
                    disabled={!s.ai}
                    title={s.ai ? '查看句子主干/结构/搭配解析' : '该句暂无预生成解析'}
                    className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    解析
                  </button>
                  <button
                    onClick={() => handleAiCorrect(dayData.day, sentIdx)}
                    disabled={!translations.get(tKey)?.trim() || aiLoading.has(tKey)}
                    title="AI 批改会消耗 AI 调用额度，仅在需要时点击"
                    className="px-3 py-1 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {aiLoading.has(tKey) ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        批改中...
                      </>
                    ) : (
                      <>AI 批改</>
                    )}
                  </button>
                </div>

                {/* 预生成解析（本地数据，不消耗 AI token） */}
                {showAnalysis.has(tKey) && s.ai && (
                  <div className="mt-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">句子解析</span>
                    </div>
                    {s.ai.backbone && (
                      <div className="rounded-md border border-emerald-200 dark:border-emerald-700/50 bg-white/60 dark:bg-slate-900/40 px-3 py-2">
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1">句子主干</p>
                        <p className="text-sm leading-relaxed text-gray-800 dark:text-slate-100 break-words">{s.ai.backbone}</p>
                      </div>
                    )}
                    {s.ai.structure.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">结构解析</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          {s.ai.structure.map((item, i) => (
                            <li key={i} className="text-xs text-gray-700 dark:text-slate-200 break-words">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {s.ai.collocations.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">短语搭配</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          {s.ai.collocations.map((item, i) => (
                            <li key={i} className="text-xs text-gray-700 dark:text-slate-200 break-words">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* AI 批改结果 */}
                {aiResults.get(tKey) && (
                  <AiResultBoundary>
                    {(() => {
                  const r = aiResults.get(tKey)!
                  return (
                    <div className="mt-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-300">AI 批改</span>
                        {r.score != null && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreBg(r.score)} ${scoreColor(r.score)}`}>
                            AI 评分 {r.score}
                          </span>
                        )}
                      </div>
                      {r.corrected && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">修正译文</p>
                          <p className="text-sm leading-relaxed text-gray-800 dark:text-slate-100 break-words">{r.corrected}</p>
                        </div>
                      )}
                      {r.issues.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-red-500 dark:text-red-400 mb-1">存在的问题</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            {r.issues.map((issue, i) => (
                              <li key={i} className="text-xs text-gray-700 dark:text-slate-200 break-words">{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {r.suggestions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">改进建议</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            {r.suggestions.map((sug, i) => (
                              <li key={i} className="text-xs text-gray-700 dark:text-slate-200 break-words">{sug}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                    })()}
                  </AiResultBoundary>
                )}

                {/* 长难句解析 */}
                {dayData.analysis && (() => {
                  const aItem = dayData.analysis.find(a => a.sentNum === s.num)
                  if (!aItem) return null
                  const hasContent = aItem.vocab.length > 0 || aItem.split || aItem.grammar.length > 0 || aItem.ref
                  if (!hasContent) return null
                  return (
                    <details className="mt-2 group">
                      <summary className="cursor-pointer text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 select-none font-medium">
                        长难句解析
                      </summary>
                      <div className="mt-2 space-y-2 pl-1">
                        {aItem.vocab.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">单词</p>
                            <div className="flex flex-wrap gap-1">
                              {aItem.vocab.map((v, vi) => (
                                <span key={vi} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/20 text-xs">
                                  <span className="font-medium text-purple-700 dark:text-purple-300">{v.word}</span>
                                  <span className="text-gray-500 dark:text-slate-400">{v.meaning}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {aItem.split && (() => {
                          // 用 / 分隔各切分段，并对照原句还原空格使单词可读
                          const parts = aItem.split.split('//').map((p) => p.trim())
                          const restored = parts.map((p) => restoreChunkSpaces(p, s.en))
                          return (
                            <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">切分</p>
                              <p className="text-xs leading-relaxed text-gray-600 dark:text-slate-300 font-mono break-words">
                                {restored.map((part, pi) => (
                                  <span key={pi}>
                                    {pi > 0 && <span className="text-red-400 dark:text-red-500 font-bold mx-0.5">/</span>}
                                    {part}
                                  </span>
                                ))}
                              </p>
                            </div>
                          )
                        })()}
                        {aItem.grammar.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">语法</p>
                            <ul className="list-disc list-inside space-y-0.5">
                              {aItem.grammar.map((g, gi) => (
                                <li key={gi} className="text-xs text-gray-600 dark:text-slate-300">{g}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {aItem.ref && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">逐句译文</p>
                            <p className="text-xs text-gray-600 dark:text-slate-300 break-words">{aItem.ref}</p>
                          </div>
                        )}
                      </div>
                    </details>
                  )
                })()}

                {/* 逐句参考译文 */}
                {s.ref && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 select-none font-medium">
                      参考译文
                    </summary>
                    <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-slate-200 break-words">{s.ref}</p>
                  </details>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 参考译文 */}
      <details className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700" open>
        <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-slate-300 select-none">参考译文</summary>
        <p className="mt-2 text-[15px] leading-relaxed text-gray-700 dark:text-slate-200">{dayData.zh}</p>
      </details>

      {/* 打卡按钮 */}
      <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700 space-y-3">
        <button
          onClick={handleCheckIn}
          disabled={!isNext || isDone || allDone || busy || loading}
          className="w-full rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:text-gray-500 dark:disabled:text-slate-400 text-white py-3 text-base font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {allDone ? '全部完成 🎉' : isDone ? `Day ${selectedDay} 已打卡 ✓` : isNext ? `完成今日打卡 Day ${nextDay}` : `Day ${selectedDay} 待打卡`}
        </button>
        {lastDoneDay >= 1 && (
          <button
            onClick={handleUndo}
            disabled={busy}
            className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent text-gray-600 dark:text-slate-300 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50"
          >
            撤销 Day {lastDoneDay} 打卡
          </button>
        )}
      </div>

      {/* 150 天进度网格 */}
      <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700">
        <p className="text-sm font-medium text-gray-600 dark:text-slate-300 mb-3">150 天进度</p>
        <div className="grid grid-cols-10 gap-1.5">
          {ENGLISH_DAILY.map((d) => {
            const done = completedDays.has(d.day)
            const isCurrent = d.day === nextDay
            return (
              <button
                key={d.day}
                onClick={() => setSelectedDay(d.day)}
                title={`Day ${d.day}`}
                className={`aspect-square rounded-md text-[11px] flex items-center justify-center transition-colors cursor-pointer border ${
                  done ? 'bg-green-500 text-white border-green-500'
                    : isCurrent ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'
                }`}
              >
                {d.day}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}