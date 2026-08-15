import { useEffect, useMemo, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ENGLISH_DAILY, type EnglishDay, type DayAnalysisItem } from '../data/englishDaily'
import { fetchMyCheckins, createCheckin, deleteCheckin } from '../lib/englishCheckin'

const TOTAL = 150

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
  // 匹配单词（含缩写如 don't, it's）+ 非单词字符
  const re = /([a-zA-Z]+(?:'[a-zA-Z]+)?)|([^a-zA-Z]+)/g
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

  // 标记单词：Set<"dayIdx-sentIdx-wordIdx">
  const [markedWords, setMarkedWords] = useState<Set<string>>(new Set())
  // 翻译输入：Map<"dayIdx-sentIdx", string>
  const [translations, setTranslations] = useState<Map<string, string>>(new Map())
  // 打分结果：Map<"dayIdx-sentIdx", number | null>
  const [scores, setScores] = useState<Map<string, number | null>>(new Map())

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

      {/* 原文 */}
      <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-bold">Day {dayData.day}</h2>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 text-xs">{dayData.type}</span>
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300 text-xs">{dayData.source}</span>
            {isDone && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs">已打卡</span>}
          </div>
        </div>

        <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 mb-1">点击单词标记不认识的词（标红），方便对照翻译时定位</p>

        <div className="mt-3 space-y-4">
          {dayData.sentences.map((s, sentIdx) => {
            const tokens = tokenizeSentence(s.en)
            const markedCount = tokens.filter(t => t.isWord && markedWords.has(`${dayData.day}-${sentIdx}-${t.idx}`)).length
            return (
              <div key={sentIdx} className="border-l-2 border-green-400 dark:border-green-500 pl-3">
                {s.num && <span className="text-green-600 dark:text-green-400 font-semibold">{s.num} </span>}
                <p className="text-[15px] leading-relaxed text-gray-800 dark:text-slate-100 select-none">
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
                        title="点击标记为不认识的词"
                      >{t.text}</span>
                    ) : (
                      <span key={i}>{t.text}</span>
                    )
                  )}
                </p>
                {markedCount > 0 && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">{markedCount} 个生词已标记</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 逐句翻译 + 打分 */}
      <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700">
        <h3 className="text-sm font-bold text-gray-700 dark:text-slate-200 mb-2">我的翻译</h3>
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">逐句翻译后点击「打分」对比参考译文</p>
        {dayData.sentences.map((s, sentIdx) => {
          const tKey = `${dayData.day}-${sentIdx}`
          const scoreVal = scores.get(tKey)
          return (
            <div key={sentIdx} className="mb-4 last:mb-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{s.num} 句</span>
                {scoreVal != null && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreBg(scoreVal)} ${scoreColor(scoreVal)}`}>
                    相似度 {scoreVal}%
                  </span>
                )}
              </div>
              <textarea
                value={translations.get(tKey) || ''}
                onChange={e => {
                  const v = e.target.value
                  setTranslations(prev => { const next = new Map(prev); next.set(tKey, v); return next })
                  setScores(prev => { const next = new Map(prev); next.delete(tKey); return next })
                }}
                placeholder="在此输入你的翻译..."
                rows={2}
                className="w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 px-3 py-2 text-sm text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
              />
              <button
                onClick={() => handleScore(dayData.day, sentIdx)}
                disabled={!translations.get(tKey)?.trim()}
                className="mt-1 px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                打分
              </button>
            </div>
          )
        })}
      </div>

      {/* 参考译文 */}
      <details className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700" open>
        <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-slate-300 select-none">参考译文</summary>
        <p className="mt-2 text-[15px] leading-relaxed text-gray-700 dark:text-slate-200">{dayData.zh}</p>
      </details>

      {/* 长难句解析 */}
      {dayData.analysis && dayData.analysis.length > 0 && (
        <details className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700">
          <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-slate-300 select-none">
            长难句解析（{dayData.analysis.length} 句）
          </summary>
          <div className="mt-3 space-y-4">
            {dayData.analysis.map((a: DayAnalysisItem, ai: number) => (
              <AnalysisCard key={ai} item={a} />
            ))}
          </div>
        </details>
      )}

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

// ---------- 解析卡片子组件 ----------

function AnalysisCard({ item }: { item: DayAnalysisItem }) {
  return (
    <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-3 space-y-2">
      <span className="text-xs font-bold text-green-600 dark:text-green-400">{item.sentNum}</span>

      {/* 词汇 */}
      {item.vocab.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">词汇</p>
          <div className="flex flex-wrap gap-1.5">
            {item.vocab.map((v, vi) => (
              <span key={vi} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 text-xs">
                <b className="text-amber-800 dark:text-amber-300">{v.word}</b>
                <span className="text-amber-600 dark:text-amber-400">{v.meaning}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 断句 */}
      {item.split && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">断句划分</p>
          <p className="text-[13px] leading-relaxed text-gray-700 dark:text-slate-200 whitespace-pre-line">
            {item.split.split('\n').map((line, li) => (
              <span key={li}>
                {line.split('//').map((seg, si) => (
                  <span key={si} className={si % 2 === 1 ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}>
                    {si > 0 && <span className="text-gray-300 dark:text-slate-600 mx-0.5">//</span>}
                    {seg}
                  </span>
                ))}
                {li < item.split.split('\n').length - 1 && <br />}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* 语法分析 */}
      {item.grammar.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">语法分析</p>
          <ul className="list-disc list-inside space-y-0.5">
            {item.grammar.map((g, gi) => (
              <li key={gi} className="text-[13px] text-gray-600 dark:text-slate-300">{g}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 参考译文（单句） */}
      {item.ref && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">单句译文</p>
          <p className="text-[13px] leading-relaxed text-gray-600 dark:text-slate-300">{item.ref}</p>
        </div>
      )}
    </div>
  )
}