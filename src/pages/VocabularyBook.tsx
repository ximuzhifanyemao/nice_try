import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadVocabulary, removeWordFromVocabulary, clearVocabulary, syncVocabularyFromCloud, removeWordFromCloud, clearVocabularyFromCloud, type VocabDay } from '../lib/vocabulary'
import { useAuth } from '../contexts/AuthContext'
import { loadEnglishDaily } from '../data/englishDaily'
import { lookupWord, getCachedLookup, type WordLookup } from '../lib/wordLookup'

// AI 查词结果卡片
function LookupResultCard({ data }: { data: WordLookup }) {
  return (
    <div className="mt-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40 p-3 space-y-2">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-[15px] font-bold text-purple-700 dark:text-purple-300">{data.word}</span>
        {data.phonetic && <span className="text-xs text-purple-400 dark:text-purple-400/70">{data.phonetic}</span>}
      </div>

      {data.meanings.length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-purple-400 dark:text-purple-400/70 mb-1">释义</p>
          <ul className="space-y-0.5">
            {data.meanings.map((m, i) => (
              <li key={i} className="text-xs text-gray-700 dark:text-slate-200 leading-relaxed">{m}</li>
            ))}
          </ul>
        </div>
      )}

      {data.mnemonic && (
        <div>
          <p className="text-[11px] font-medium text-purple-400 dark:text-purple-400/70 mb-0.5">助记</p>
          <p className="text-xs text-gray-700 dark:text-slate-200 leading-relaxed">{data.mnemonic}</p>
        </div>
      )}

      {data.collocations.length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-purple-400 dark:text-purple-400/70 mb-1">考研常用搭配</p>
          <ul className="space-y-0.5">
            {data.collocations.map((c, i) => (
              <li key={i} className="text-xs text-gray-700 dark:text-slate-200 leading-relaxed">· {c}</li>
            ))}
          </ul>
        </div>
      )}

      {data.example && (
        <div>
          <p className="text-[11px] font-medium text-purple-400 dark:text-purple-400/70 mb-0.5">例句</p>
          <p className="text-xs text-gray-700 dark:text-slate-200 leading-relaxed">{data.example}</p>
        </div>
      )}

      {data.examNote && (
        <div>
          <p className="text-[11px] font-medium text-purple-400 dark:text-purple-400/70 mb-0.5">考研考点</p>
          <p className="text-xs text-gray-700 dark:text-slate-200 leading-relaxed">{data.examNote}</p>
        </div>
      )}
    </div>
  )
}

export default function VocabularyBook() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [vocab, setVocab] = useState<VocabDay[]>([])
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set())
  const [confirmClear, setConfirmClear] = useState(false)
  // AI 查词状态：结果 Map<单词小写, 结果>、加载中 Set、错误信息
  const [lookupResults, setLookupResults] = useState<Map<string, WordLookup>>(new Map())
  const [lookupLoading, setLookupLoading] = useState<Set<string>>(new Set())
  const [lookupError, setLookupError] = useState<string | null>(null)

  const refresh = () => setVocab(loadVocabulary())
  const userId = user?.id

  // 登录后进入页面时同步云端生词（合并本地+云端并回写）
  useEffect(() => {
    refresh()
    if (userId) {
      syncVocabularyFromCloud(userId)
        .then(setVocab)
        .catch(() => {})
    }
  }, [userId])

  // 参考译文懒加载：生词本非空才加载语料 chunk（day → zh 映射，仅占用少量内存）
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
    return () => { cancelled = true }
  }, [vocab.length])

  const handleRemove = async (day: number, word: string, sentence: string) => {
    const updated = removeWordFromVocabulary(day, word, sentence)
    setVocab(updated)
    if (userId) {
      try {
        await removeWordFromCloud(userId, day, word, sentence)
      } catch { /* 忽略 */ }
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
      } catch { /* 忽略 */ }
    }
  }

  // AI 查词：命中缓存直接展示，否则调用后端
  const handleLookup = useCallback(async (word: string) => {
    const key = word.toLowerCase()
    if (lookupLoading.has(key) || lookupResults.has(key)) return
    const cached = getCachedLookup(word)
    if (cached) {
      setLookupResults(prev => { const next = new Map(prev); next.set(key, cached); return next })
      return
    }
    setLookupLoading(prev => new Set(prev).add(key))
    setLookupError(null)
    try {
      const result = await lookupWord(word)
      setLookupResults(prev => { const next = new Map(prev); next.set(key, result); return next })
    } catch (e) {
      const aborted = e instanceof Error && e.name === 'AbortError'
      setLookupError(
        aborted
          ? 'AI 查词超时，请检查网络后重试'
          : e instanceof Error ? e.message : 'AI 查词失败，请稍后重试'
      )
    } finally {
      setLookupLoading(prev => { const next = new Set(prev); next.delete(key); return next })
    }
  }, [lookupLoading, lookupResults])

  const toggleExpand = (day: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  const totalWords = vocab.reduce((sum, d) => sum + d.words.length, 0)

  // 获取某天的参考译文（未加载完成时返回空串，译文折叠区自然隐藏）
  const getDayTranslation = (day: number) => {
    return dayZh.get(day) || ''
  }

  if (vocab.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-4">
        <div className="rounded-xl bg-white dark:bg-slate-800 p-8 shadow-sm border border-gray-100 dark:border-slate-700 text-center">
          <p className="text-4xl mb-3">📖</p>
          <p className="text-gray-600 dark:text-slate-300 font-medium">生词本为空</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            在「英语长难句打卡」中点击不认识的单词标记为红色，打卡后自动存入生词本
          </p>
          <button
            onClick={() => navigate('/english-checkin')}
            className="mt-4 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            去打卡
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 space-y-4">
      {/* 顶部统计 */}
      <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold">生词本</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {vocab.length} 天 · 共 {totalWords} 个生词
            </p>
          </div>
          <button
            onClick={handleClear}
            onBlur={() => setConfirmClear(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              confirmClear
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            {confirmClear ? '确认清空' : '清空'}
          </button>
        </div>
      </div>

      {lookupError && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">AI 查词失败：{lookupError}</div>
      )}

      {/* 按天分组展示 */}
      {vocab.map((dayEntry) => {
        const isExpanded = expandedDays.has(dayEntry.day)
        const dayTranslation = getDayTranslation(dayEntry.day)

        return (
          <div key={dayEntry.day} className="rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            {/* 天标题 */}
            <button
              onClick={() => toggleExpand(dayEntry.day)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-800 dark:text-slate-100">Day {dayEntry.day}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[11px] font-medium">
                  {dayEntry.words.length} 词
                </span>
              </div>
              <span className={`text-gray-400 dark:text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {/* 单词列表 */}
            {isExpanded && (
              <div className="border-t border-gray-100 dark:border-slate-700">
                {dayEntry.words.map((w, wi) => (
                  <div
                    key={`${w.word}-${w.sentIdx}-${w.wordIdx}`}
                    className={`px-4 py-3 ${wi !== dayEntry.words.length - 1 ? 'border-b border-gray-50 dark:border-slate-700/50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-bold text-red-600 dark:text-red-400">
                          {w.word}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {w.sentence}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleLookup(w.word)}
                          disabled={lookupLoading.has(w.word.toLowerCase())}
                          className="px-2.5 py-1 rounded-md bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-xs font-medium transition-colors cursor-pointer"
                          title="AI 查词"
                        >
                          {lookupLoading.has(w.word.toLowerCase()) ? '查词中…' : 'AI 查词'}
                        </button>
                        <button
                          onClick={() => handleRemove(dayEntry.day, w.word, w.sentence)}
                          className="text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer text-lg leading-none mt-0.5"
                          title="移除"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    {lookupResults.get(w.word.toLowerCase()) && (
                      <LookupResultCard data={lookupResults.get(w.word.toLowerCase())!} />
                    )}
                  </div>
                ))}

                {/* 参考译文（折叠显示） */}
                {dayTranslation && (
                  <details className="px-4 py-2 border-t border-gray-100 dark:border-slate-700">
                    <summary className="text-xs text-gray-400 dark:text-slate-500 cursor-pointer select-none">参考译文</summary>
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{dayTranslation}</p>
                  </details>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}