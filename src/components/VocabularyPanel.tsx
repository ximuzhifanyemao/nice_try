import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { loadEnglishDaily } from '../data/englishDaily'
import {
  clearVocabulary,
  clearVocabularyFromCloud,
  loadVocabulary,
  removeWordFromCloud,
  removeWordFromVocabulary,
  syncVocabularyFromCloud,
  type VocabDay,
} from '../lib/vocabulary'
import { getCachedLookup, lookupWord, type WordLookup } from '../lib/wordLookup'
import { useWideLayout } from '../App'
import { Icon } from './Icon'
import EmptyState from './EmptyState'
import LookupPromptFallback from './LookupPromptFallback'

export interface VocabularyStats {
  days: number
  words: number
}

interface VocabularyPanelProps {
  /** 把天数 / 词数回传给「记一记」页头与分区角标 */
  onStatsChange?: (stats: VocabularyStats) => void
}

/** AI 查词结果卡片 */
function LookupResultCard({ data }: { data: WordLookup }) {
  return (
    <div className="mt-2 space-y-2 rounded-lg border border-purple-100 bg-purple-50 p-3 dark:border-purple-800/40 dark:bg-purple-900/20">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-[15px] font-bold text-purple-700 dark:text-purple-300">{data.word}</span>
        {data.phonetic && (
          <span className="text-xs text-purple-400 dark:text-purple-400/70">{data.phonetic}</span>
        )}
      </div>

      {data.meanings.length > 0 && (
        <div>
          <p className="mb-1 text-[11px] font-medium text-purple-400 dark:text-purple-400/70">释义</p>
          <ul className="space-y-0.5">
            {data.meanings.map((m, i) => (
              <li key={i} className="text-xs leading-relaxed text-gray-700 dark:text-slate-200">
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.mnemonic && (
        <div>
          <p className="mb-0.5 text-[11px] font-medium text-purple-400 dark:text-purple-400/70">助记</p>
          <p className="text-xs leading-relaxed text-gray-700 dark:text-slate-200">{data.mnemonic}</p>
        </div>
      )}

      {data.collocations.length > 0 && (
        <div>
          <p className="mb-1 text-[11px] font-medium text-purple-400 dark:text-purple-400/70">考研常用搭配</p>
          <ul className="space-y-0.5">
            {data.collocations.map((c, i) => (
              <li key={i} className="text-xs leading-relaxed text-gray-700 dark:text-slate-200">
                · {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.example && (
        <div>
          <p className="mb-0.5 text-[11px] font-medium text-purple-400 dark:text-purple-400/70">例句</p>
          <p className="text-xs leading-relaxed text-gray-700 dark:text-slate-200">{data.example}</p>
        </div>
      )}

      {data.examNote && (
        <div>
          <p className="mb-0.5 text-[11px] font-medium text-purple-400 dark:text-purple-400/70">考研考点</p>
          <p className="text-xs leading-relaxed text-gray-700 dark:text-slate-200">{data.examNote}</p>
        </div>
      )}
    </div>
  )
}

/**
 * 「记一记 · 生词」分区。
 *
 * 内容来自原「生词本」页面：在英语长难句打卡里点开生词会自动收录，
 * 这里按 Day 分组回看、AI 查词、移除或清空；数据仍走原来的 localStorage + 云端同步。
 */
export default function VocabularyPanel({ onStatsChange }: VocabularyPanelProps) {
  const wide = useWideLayout()
  const { user } = useAuth()
  const [vocab, setVocab] = useState<VocabDay[]>([])
  const [syncing, setSyncing] = useState(false)
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set())
  const [confirmClear, setConfirmClear] = useState(false)
  // AI 查词状态：结果 Map<单词小写, 结果>、加载中 Set、错误信息
  const [lookupResults, setLookupResults] = useState<Map<string, WordLookup>>(new Map())
  const [lookupLoading, setLookupLoading] = useState<Set<string>>(new Set())
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [lookupErrorWord, setLookupErrorWord] = useState('')

  const userId = user?.id
  const refresh = useCallback(() => setVocab(loadVocabulary()), [])

  // 登录后进入分区时同步云端生词（合并本地 + 云端并回写）
  useEffect(() => {
    refresh()
    if (!userId) {
      setSyncing(false)
      return
    }
    let cancelled = false
    setSyncing(true)
    syncVocabularyFromCloud(userId)
      .then((list) => {
        if (!cancelled) setVocab(list)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSyncing(false)
      })
    return () => {
      cancelled = true
    }
  }, [refresh, userId])

  // 参考译文懒加载：生词非空才加载语料 chunk（day → zh 映射，仅占用少量内存）
  const [dayZh, setDayZh] = useState<Map<number, string>>(new Map())
  useEffect(() => {
    if (vocab.length === 0) return
    let cancelled = false
    loadEnglishDaily()
      .then((daily) => {
        if (cancelled) return
        const map = new Map<number, string>()
        for (const d of daily) if (d.zh) map.set(d.day, d.zh)
        setDayZh(map)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [vocab.length])

  const totalWords = vocab.reduce((sum, d) => sum + d.words.length, 0)

  useEffect(() => {
    onStatsChange?.({ days: vocab.length, words: totalWords })
  }, [onStatsChange, totalWords, vocab.length])

  const handleRemove = async (day: number, word: string, sentence: string) => {
    const updated = removeWordFromVocabulary(day, word, sentence)
    setVocab(updated)
    if (userId) {
      try {
        await removeWordFromCloud(userId, day, word, sentence)
      } catch {
        /* 本地已移除，云端下次同步会补删 */
      }
    }
  }

  const handleClear = async () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    clearVocabulary()
    setVocab([])
    setConfirmClear(false)
    if (userId) {
      try {
        await clearVocabularyFromCloud(userId)
      } catch {
        /* 忽略 */
      }
    }
  }

  // AI 查词：命中缓存直接展示，否则调用后端
  const handleLookup = useCallback(
    async (word: string) => {
      const key = word.toLowerCase()
      if (lookupLoading.has(key) || lookupResults.has(key)) return
      const cached = getCachedLookup(word)
      if (cached) {
        setLookupResults((prev) => {
          const next = new Map(prev)
          next.set(key, cached)
          return next
        })
        return
      }
      setLookupLoading((prev) => new Set(prev).add(key))
      setLookupError(null)
      setLookupErrorWord('')
      try {
        const result = await lookupWord(word)
        setLookupResults((prev) => {
          const next = new Map(prev)
          next.set(key, result)
          return next
        })
      } catch (e) {
        const aborted = e instanceof Error && e.name === 'AbortError'
        setLookupErrorWord(word)
        setLookupError(
          aborted ? 'AI 查词超时，请检查网络后重试' : e instanceof Error ? e.message : 'AI 查词失败，请稍后重试',
        )
      } finally {
        setLookupLoading((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }
    },
    [lookupLoading, lookupResults],
  )

  const toggleExpand = (day: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  const getDayTranslation = (day: number) => dayZh.get(day) || ''

  if (vocab.length === 0) {
    if (syncing) {
      return (
        <div className="card flex items-center justify-center gap-2 py-14 text-xs text-gray-400 dark:text-slate-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
          生词同步中…
        </div>
      )
    }
    return (
      <EmptyState
        icon="vocab"
        title="还没有生词"
        desc="在「英语长难句打卡」里点开句中划线词或任意生词，会自动收进这里"
        action={{ label: '去英语打卡', to: '/english-checkin' }}
      />
    )
  }

  return (
    <div className="space-y-3">
      {/* 顶部统计与清空 */}
      <div className="card flex flex-wrap items-center gap-2 px-3 py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
          <Icon name="vocab" size={14} />
        </span>
        <span className="text-xs font-semibold text-gray-800 dark:text-slate-100">英语生词</span>
        <span className="text-[11px] text-gray-500 dark:text-slate-400">
          {vocab.length} 天 · 共 {totalWords} 个
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/english-checkin"
            className="cursor-pointer text-[11px] font-medium text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
          >
            去英语打卡
          </Link>
          <button
            type="button"
            onClick={() => void handleClear()}
            onBlur={() => setConfirmClear(false)}
            className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
              confirmClear
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
            }`}
          >
            {confirmClear ? '确认清空' : '清空'}
          </button>
        </div>
      </div>

      {lookupError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700 dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-300">
          AI 查词失败：{lookupError}
          {lookupErrorWord && <LookupPromptFallback word={lookupErrorWord} />}
        </div>
      )}

      {/* 按天分组：宽屏两栏铺开，避免一整条竖排 */}
      <div className={wide ? 'grid grid-cols-2 items-start gap-4' : 'space-y-4'}>
        {vocab.map((dayEntry) => {
          const isExpanded = expandedDays.has(dayEntry.day)
          const dayTranslation = getDayTranslation(dayEntry.day)

          return (
            <div key={dayEntry.day} className="card overflow-hidden">
              <button
                type="button"
                onClick={() => toggleExpand(dayEntry.day)}
                aria-expanded={isExpanded}
                aria-label={`Day ${dayEntry.day}，${dayEntry.words.length} 个生词，${isExpanded ? '收起' : '展开'}`}
                className="flex w-full cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-800 dark:text-slate-100">
                    Day {dayEntry.day}
                  </span>
                  <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[11px] font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    {dayEntry.words.length} 词
                  </span>
                </div>
                <Icon
                  name="chevronDown"
                  size={15}
                  className={`text-gray-400 transition-transform dark:text-slate-500 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-slate-700">
                  {dayEntry.words.map((w, wi) => {
                    const key = w.word.toLowerCase()
                    const result = lookupResults.get(key)
                    const loading = lookupLoading.has(key)
                    return (
                      <div
                        key={`${w.word}-${w.sentIdx}-${w.wordIdx}`}
                        className={`px-4 py-3 ${
                          wi !== dayEntry.words.length - 1
                            ? 'border-b border-gray-50 dark:border-slate-700/50'
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] font-bold text-red-600 dark:text-red-400">{w.word}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-slate-400">
                              {w.sentence}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => void handleLookup(w.word)}
                              disabled={loading}
                              className="cursor-pointer rounded-md bg-purple-500 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
                              title="AI 查词"
                            >
                              {loading ? '查词中…' : 'AI 查词'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleRemove(dayEntry.day, w.word, w.sentence)}
                              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                              title="移除"
                              aria-label={`移除 ${w.word}`}
                            >
                              <Icon name="x" size={13} />
                            </button>
                          </div>
                        </div>
                        {result && <LookupResultCard data={result} />}
                      </div>
                    )
                  })}

                  {/* 参考译文（折叠显示） */}
                  {dayTranslation && (
                    <details className="border-t border-gray-100 px-4 py-2 dark:border-slate-700">
                      <summary className="cursor-pointer select-none text-xs text-gray-400 dark:text-slate-500">
                        参考译文
                      </summary>
                      <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-slate-400">
                        {dayTranslation}
                      </p>
                    </details>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
