import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from './Icon'
import {
  EXAM_SECTIONS,
  EXAM_TYPES,
  EXAM_YEARS,
  filterQuestions,
  getQuestionsByIds,
  loadAllPapers,
  loadPaper,
  type ExamPaper,
  type ExamQuestion,
  type ExamQuestionType,
  type ExamSection,
} from '../lib/exam408'

/** 真题科目 / 题型的中文名：选择器与卡片共用一份，避免各写一套 */
export const SECTION_LABELS: Record<ExamSection, string> = {
  ds: '数据结构',
  co: '计组',
  os: '操作系统',
  cn: '计算机网络',
}

export const TYPE_LABELS: Record<ExamQuestionType, string> = {
  single: '单选',
  comprehensive: '综合',
}

/** 结果列表一次最多渲染多少条，避免一次性挂几百个节点 */
const RESULT_LIMIT = 60

const SELECT_CLS =
  'h-8 cursor-pointer rounded-lg border border-gray-200 bg-gray-50 px-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-indigo-500/40'

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

interface ExamQuestionPickerProps {
  open: boolean
  /** 外部已关联的题目 id，打开时复制到内部草稿 */
  value: string[]
  onCancel: () => void
  onConfirm: (ids: string[]) => void
}

/** 408 真题选择弹窗：按年份懒加载题库，支持科目 / 题型 / 关键词筛选与多选 */
export default function ExamQuestionPicker({ open, value, onCancel, onConfirm }: ExamQuestionPickerProps) {
  const [draft, setDraft] = useState<Set<string>>(() => new Set(value))
  const [year, setYear] = useState<number | 'all'>('all')
  const [section, setSection] = useState<ExamSection | 'all'>('all')
  const [type, setType] = useState<ExamQuestionType | 'all'>('all')
  const [keyword, setKeyword] = useState('')
  const [papers, setPapers] = useState<ExamPaper[]>([])
  const [loading, setLoading] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [detail, setDetail] = useState<Map<string, ExamQuestion>>(new Map())

  // 打开时把外部值复制进草稿：取消不修改原值，确定才提交
  useEffect(() => {
    if (open) setDraft(new Set(value))
  }, [open, value])

  // Esc 关闭
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  // 按当前年份加载：全部年份走 loadAllPapers，单年只加载该年分片
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setLoadFailed(false)
    const task = year === 'all' ? loadAllPapers() : loadPaper(year).then((paper) => [paper])
    task
      .then((list) => {
        if (cancelled) return
        setPapers(list)
        setLoadFailed(list.length === 0)
      })
      .catch(() => {
        if (cancelled) return
        setPapers([])
        setLoadFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, year])

  const results = useMemo(
    () => filterQuestions(papers, { section, type, keyword }),
    [papers, section, type, keyword],
  )

  const resultIds = useMemo(() => new Set(results.map((q) => q.id)), [results])
  const draftKey = useMemo(() => [...draft].sort().join(','), [draft])

  // 已选但被筛掉的题目：单独取一次题面，用于展示可移除的 chip
  useEffect(() => {
    if (!open || !draftKey) {
      setDetail(new Map())
      return
    }
    let cancelled = false
    getQuestionsByIds(draftKey.split(','))
      .then((map) => {
        if (!cancelled) setDetail(map)
      })
      .catch(() => {
        if (!cancelled) setDetail(new Map())
      })
    return () => {
      cancelled = true
    }
  }, [open, draftKey])

  const chipIds = useMemo(() => [...draft].filter((id) => !resultIds.has(id)), [draft, resultIds])

  const toggleDraft = useCallback((id: string) => {
    setDraft((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const removeDraft = useCallback((id: string) => {
    setDraft((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  if (!open) return null

  const shown = results.slice(0, RESULT_LIMIT)

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="关联 408 真题"
    >
      <div
        className="flex max-h-[82vh] w-[min(920px,96vw)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-slate-700">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
            <Icon name="cards" size={16} />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">关联 408 真题</h3>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">已选 {draft.size} 题</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            title="关闭"
            aria-label="关闭"
            className="ml-auto flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* 已选但不在当前筛选结果里的题目：避免用户误以为选择丢了 */}
        {chipIds.length > 0 && (
          <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-gray-100 px-4 py-2 dark:border-slate-700">
            <span className="shrink-0 text-[10px] font-semibold text-gray-400 dark:text-slate-500">
              已选（不在当前结果）
            </span>
            {chipIds.map((id) => {
              const q = detail.get(id)
              return (
                <span
                  key={id}
                  title={q ? q.stem : id}
                  className="inline-flex max-w-full items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10.5px] font-medium text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300"
                >
                  <span className="max-w-[220px] truncate">
                    {q ? `${q.year} · 第 ${q.number} 题 · ${truncate(q.stem, 16)}` : id}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeDraft(id)}
                    title="移除"
                    aria-label="移除这道题"
                    className="shrink-0 cursor-pointer rounded-full p-0.5 transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
                  >
                    <Icon name="x" size={10} strokeWidth={2.4} />
                  </button>
                </span>
              )
            })}
          </div>
        )}

        {/* 筛选条 */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-2.5 dark:border-slate-700">
          <select
            value={String(year)}
            onChange={(e) => {
              const v = e.target.value
              setYear(v === 'all' ? 'all' : Number(v))
            }}
            aria-label="年份"
            className={SELECT_CLS}
          >
            <option value="all">全部年份</option>
            {EXAM_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value as ExamSection | 'all')}
            aria-label="科目"
            className={SELECT_CLS}
          >
            <option value="all">全部科目</option>
            {EXAM_SECTIONS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ExamQuestionType | 'all')}
            aria-label="题型"
            className={SELECT_CLS}
          >
            <option value="all">全部题型</option>
            {EXAM_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
          <div className="relative min-w-[150px] flex-1">
            <Icon
              name="search"
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
            />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索题干 / 标签"
              aria-label="搜索真题"
              className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 pl-7 pr-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:ring-indigo-500/40"
            />
          </div>
        </div>

        {/* 结果列表 */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-slate-700/40" />
              ))}
            </div>
          ) : loadFailed ? (
            <p className="py-10 text-center text-xs text-gray-400 dark:text-slate-500">
              {year === 'all' ? '题库暂未收录' : `${year} 年题库暂未收录`}
            </p>
          ) : results.length === 0 ? (
            <p className="py-10 text-center text-xs text-gray-400 dark:text-slate-500">没有匹配的题目</p>
          ) : (
            <>
              <p className="mb-2 text-[11px] text-gray-400 dark:text-slate-500">
                共 {results.length} 题
                {results.length > RESULT_LIMIT ? '，结果较多，用关键词缩小范围' : ''}
              </p>
              <div className="space-y-2">
                {shown.map((q) => {
                  const checked = draft.has(q.id)
                  return (
                    <label
                      key={q.id}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 transition-colors ${
                        checked
                          ? 'border-indigo-300 bg-indigo-50/60 dark:border-indigo-500/40 dark:bg-indigo-500/10'
                          : 'border-gray-200 bg-gray-50/60 hover:border-gray-300 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDraft(q.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-indigo-600"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-gray-700 dark:text-slate-200">
                            {q.year} · 第 {q.number} 题
                          </span>
                          <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                            {SECTION_LABELS[q.section]}
                          </span>
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-slate-700/60 dark:text-slate-300">
                            {TYPE_LABELS[q.type]}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-3 text-[12px] leading-relaxed text-gray-600 dark:text-slate-300">
                          {q.stem}
                        </p>
                        {q.type === 'single' && q.options.length > 0 && (
                          <div className="mt-1 grid grid-cols-1 gap-x-3 gap-y-0.5 sm:grid-cols-2">
                            {q.options.map((o) => (
                              <p
                                key={o.key}
                                title={`${o.key}. ${o.text}`}
                                className="line-clamp-1 text-[11px] leading-relaxed text-gray-500 dark:text-slate-400"
                              >
                                {o.key}. {o.text}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* 底部 */}
        <div className="flex shrink-0 items-center gap-2 border-t border-gray-100 px-4 py-3 dark:border-slate-700">
          <span className="text-[11px] text-gray-400 dark:text-slate-500">已选 {draft.size} 题</span>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={onCancel} className="btn-ghost h-9 px-3 py-0 text-xs">
              取消
            </button>
            <button
              type="button"
              onClick={() => onConfirm([...draft])}
              className="btn-primary h-9 px-4 py-0 text-xs"
            >
              确定（{draft.size}）
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ExamQuestionListProps {
  /** 关联的真题 id 列表（笔记里保存的那份，不要在组件内改写） */
  ids: string[]
}

/**
 * 知识点卡片里的关联真题：按年份 + 题号展示，默认折叠题目、隐藏答案。
 * 每道题各自维护展开状态，互不影响；题库按 id 只加载涉及的年份。
 */
export function ExamQuestionList({ ids }: ExamQuestionListProps) {
  const idsKey = ids.join(',')
  const [loading, setLoading] = useState(ids.length > 0)
  const [failed, setFailed] = useState(false)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  /** 已展开题干的题目 */
  const [openQuestionIds, setOpenQuestionIds] = useState<Set<string>>(() => new Set())
  /** 已展开答案的题目 */
  const [openAnswerIds, setOpenAnswerIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    const target = idsKey ? idsKey.split(',') : []
    if (target.length === 0) {
      setLoading(false)
      setFailed(false)
      setQuestions([])
      return
    }
    let cancelled = false
    setLoading(true)
    setFailed(false)
    getQuestionsByIds(target)
      .then((map) => {
        if (cancelled) return
        const list = target
          .map((id) => map.get(id))
          .filter((q): q is ExamQuestion => Boolean(q))
          .sort((a, b) => a.year - b.year || a.number - b.number)
        setQuestions(list)
      })
      .catch(() => {
        if (cancelled) return
        setFailed(true)
        setQuestions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [idsKey])

  const toggleQuestion = (id: string) => {
    const willOpen = !openQuestionIds.has(id)
    setOpenQuestionIds((prev) => {
      const next = new Set(prev)
      if (willOpen) next.add(id)
      else next.delete(id)
      return next
    })
    // 收起题目时一并收起答案，再次展开从题干重新开始
    if (!willOpen) {
      setOpenAnswerIds((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const toggleAnswer = (id: string) => {
    setOpenAnswerIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (ids.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-slate-400">
        <Icon name="cards" size={12} />
        关联真题
        {questions.length > 0 && ` · ${questions.length}`}
      </div>

      {loading && (
        <div className="space-y-1.5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
            <span className="block h-full w-1/3 animate-pulse rounded-full bg-indigo-400/70 dark:bg-indigo-400/50" />
          </div>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">真题加载中…</p>
        </div>
      )}

      {!loading && failed && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">真题加载失败，不影响笔记其它内容</p>
      )}

      {!loading && !failed && questions.length === 0 && (
        <p className="text-[11px] text-gray-400 dark:text-slate-500">关联真题暂未收录</p>
      )}

      {questions.map((q) => {
        const expanded = openQuestionIds.has(q.id)
        const answerOpen = openAnswerIds.has(q.id)
        return (
          <article
            key={q.id}
            className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40"
          >
            {/* 题头：默认折叠，点这一行才展开题干与选项 */}
            <button
              type="button"
              onClick={() => toggleQuestion(q.id)}
              aria-expanded={expanded}
              aria-controls={`exam-question-${q.id}`}
              aria-label={`${q.year} 年 408 第 ${q.number} 题，${SECTION_LABELS[q.section]}，${TYPE_LABELS[q.type]}，${expanded ? '收起题目' : '展开题目'}`}
              className="flex w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-md text-left transition-colors hover:text-indigo-600 dark:hover:text-indigo-300"
            >
              <span className="text-[11px] font-semibold text-gray-700 dark:text-slate-200">
                408 · {q.year} · 第 {q.number} 题
              </span>
              <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                {SECTION_LABELS[q.section]}
              </span>
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-slate-700/60 dark:text-slate-300">
                {TYPE_LABELS[q.type]}
              </span>
              <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-300">
                {expanded ? '收起' : '展开题目'}
                <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={11} strokeWidth={2} />
              </span>
            </button>

            {expanded && (
              <div id={`exam-question-${q.id}`} className="mt-1.5">
                <p className="whitespace-pre-wrap break-words text-[12.5px] leading-relaxed text-gray-700 dark:text-slate-200">
                  {q.stem}
                </p>

                {q.options.length > 0 && (
                  <div className="mt-1.5 grid grid-cols-1 gap-x-3 gap-y-0.5 sm:grid-cols-2">
                    {q.options.map((o) => (
                      <p
                        key={o.key}
                        title={`${o.key}. ${o.text}`}
                        className="line-clamp-1 text-[11.5px] leading-relaxed text-gray-500 dark:text-slate-400"
                      >
                        {o.key}. {o.text}
                      </p>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => toggleAnswer(q.id)}
                  aria-expanded={answerOpen}
                  className="mt-2 inline-flex cursor-pointer items-center gap-1 rounded-lg px-1.5 py-0.5 text-[11px] font-medium text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
                >
                  <Icon name={answerOpen ? 'chevronDown' : 'chevronRight'} size={11} strokeWidth={2} />
                  {answerOpen ? '收起答案' : '显示答案'}
                </button>

                {answerOpen && (
                  <div className="mt-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 p-2 dark:border-emerald-500/25 dark:bg-emerald-500/10">
                    {q.type === 'comprehensive' ? (
                      <>
                        <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                          参考答案要点
                        </p>
                        <p className="mt-1 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-gray-700 dark:text-slate-200">
                          {q.answer}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                          答案：{q.answer}
                        </p>
                        {q.analysis && (
                          <p className="mt-1 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-gray-600 dark:text-slate-300">
                            解析：{q.analysis}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
