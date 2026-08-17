import { useEffect, useMemo, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ENGLISH_DAILY, type EnglishDay } from '../data/englishDaily'
import { fetchMyCheckins, createCheckin, deleteCheckin } from '../lib/englishCheckin'
import { loadMarkedWords, saveMarkedWords, addDayToVocabulary } from '../lib/vocabulary'
import { supabase } from '../lib/supabase'

const TOTAL = 150

// ---------- AI 翻译批改 ----------

interface AiCorrection {
  score: number | null
  corrected: string
  issues: string[]
  suggestions: string[]
  backbone: string
  structure: string[]
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

/** 切分片段是无空格的粘连文本，对照原句 en 还原出空格，让单词可读 */
function restoreChunkSpaces(chunk: string, orig: string): string {
  if (!chunk) return chunk
  // 去掉原句空格，建立「去空格索引 -> 原句索引」映射
  let stripped = ''
  const map: number[] = []
  for (let i = 0; i < orig.length; i++) {
    if (/\s/.test(orig[i])) continue
    stripped += orig[i]
    map.push(i)
  }
  // 片段也去掉空格再匹配，避免数据里残留的空格导致匹配失败
  const needle = chunk.replace(/\s+/g, '')
  if (!needle) return chunk
  const start = stripped.indexOf(needle)
  if (start === -1) return chunk // 无法匹配则原样显示
  const end = start + needle.length - 1
  return orig.slice(map[start], map[end] + 1)
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
    const refText = day?.zh || ''
    const score = calcTranslationScore(userText, refText)
    setScores(prev => { const next = new Map(prev); next.set(key, score); return next })
  }, [translations])

  // 调用 Supabase Edge Function 完成 AI 翻译批改
  const handleAiCorrect = useCallback(async (dayIdx: number, sentIdx: number) => {
    const key = `${dayIdx}-${sentIdx}`
    if (aiLoading.has(key)) return
    const userText = translations.get(key) || ''
    const day = ENGLISH_DAILY.find(d => d.day === dayIdx)
    const refText = day?.zh || ''
    const sentence = day?.sentences[sentIdx]?.en || ''

    setAiLoading(prev => new Set(prev).add(key))
    setAiError(null)
    try {
      let result: AiCorrection
      if (AI_CORRECT_URL) {
        // 走腾讯云 SCF 云函数（国内节点直连讯飞）；加超时防止 WebView 长时间挂起导致黑屏
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 30000)
        try {
          const resp = await fetch(AI_CORRECT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ en: sentence, userTranslation: userText, refTranslation: refText }),
            signal: controller.signal,
          })
          const json = await resp.json().catch(() => ({}))
          if (!resp.ok || !json.ok) throw new Error(json.error || `AI 批改失败（${resp.status}）`)
          result = json.data
        } finally {
          clearTimeout(timer)
        }
      } else {
        // 回退：Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('ai-correct', {
          body: { en: sentence, userTranslation: userText, refTranslation: refText },
        })
        if (error) throw new Error(error.message || 'AI 批改失败')
        result = data as AiCorrection
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
                    onClick={() => handleAiCorrect(dayData.day, sentIdx)}
                    disabled={!translations.get(tKey)?.trim() || aiLoading.has(tKey)}
                    className="px-3 py-1 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {aiLoading.has(tKey) ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        批改中...
                      </>
                    ) : (
                      <>AI 纠正</>
                    )}
                  </button>
                </div>

                {/* AI 批改结果 */}
                {aiResults.get(tKey) && (() => {
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
                      {r.backbone && (
                        <div className="rounded-md border border-purple-200 dark:border-purple-700/50 bg-white/60 dark:bg-slate-900/40 px-3 py-2">
                          <p className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-1">句子主干</p>
                          <p className="text-sm leading-relaxed text-gray-800 dark:text-slate-100 break-words">{r.backbone}</p>
                        </div>
                      )}
                      {r.structure.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">结构解析</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            {r.structure.map((item, i) => (
                              <li key={i} className="text-xs text-gray-700 dark:text-slate-200 break-words">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
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