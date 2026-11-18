import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { EXAM_SECTIONS, EXAM_TYPES, type ExamQuestionType, type ExamSection } from '../lib/exam408'
import {
  BANK_SOURCES,
  countByYear,
  loadBankPapers,
  searchBankQuestions,
  type BankPaper,
  type BankQuestion,
  type BankSource,
  type PageCrop,
} from '../lib/questionBank'

/** 每次渲染的题量，避免一次挂几百个卡片 */
const PAGE_SIZE = 40

const SECTION_LABELS = Object.fromEntries(EXAM_SECTIONS.map((s) => [s.key, s.label])) as Record<ExamSection, string>
const TYPE_LABELS = Object.fromEntries(EXAM_TYPES.map((t) => [t.key, t.label])) as Record<ExamQuestionType, string>

const SOURCE_HINTS: Record<BankSource, string> = {
  exam: '2009–2026 年 408 真题，含答案与解析',
  variant: 'docs 中 14 份「真题变形题」PDF 整理，含原题截图',
}

const CHIP_BASE =
  'shrink-0 cursor-pointer rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors'
const CHIP_ACTIVE = 'border-indigo-300 bg-indigo-50 text-indigo-600 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-300'
const CHIP_IDLE =
  'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/60'

/**
 * 原题截图：页图只存一份，靠 CSS 把 img 放大后平移到裁剪位置。
 * 容器按裁剪区宽高比撑开，translate 百分比相对图片自身尺寸，换算见下方注释。
 */
function CropImage({
  paper,
  crop,
  onOpen,
  alt,
}: {
  paper: BankPaper
  crop: PageCrop
  onOpen?: () => void
  alt: string
}) {
  const page = paper.pages?.[String(crop.page)]
  if (!page) return null
  // 图片宽度 = 容器宽 × (页宽 / 裁剪宽)；位移百分比 = 裁剪起点 / 页尺寸
  const widthPercent = (page.width / crop.w) * 100
  const translateX = -(crop.x / page.width) * 100
  const translateY = -(crop.y / page.height) * 100
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={onOpen ? `${alt}（点击放大）` : alt}
      className={`block w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 ${onOpen ? 'cursor-zoom-in' : 'cursor-default'}`}
    >
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: `${crop.w} / ${crop.h}` }}>
        <img
          src={page.src}
          alt={alt}
          loading="lazy"
          className="absolute left-0 top-0 max-w-none select-none"
          style={{ width: `${widthPercent}%`, transform: `translate(${translateX}%, ${translateY}%)` }}
        />
      </div>
    </button>
  )
}

function QuestionCard({
  question,
  paper,
  onPreview,
}: {
  question: BankQuestion
  paper: BankPaper
  onPreview: (paper: BankPaper, crop: PageCrop, alt: string) => void
}) {
  const [showAnswer, setShowAnswer] = useState(false)
  const [showOriginal, setShowOriginal] = useState(!!question.needsOriginal)
  const crops = question.crops ?? []
  const alt = `${question.year} 年第 ${question.number} 题原题截图`

  return (
    <article className="card p-3.5 sm:p-4">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px]">
        <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 font-semibold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
          {question.year} 年
        </span>
        <span className="font-medium text-gray-600 dark:text-slate-300">第 {question.number} 题</span>
        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600 dark:bg-slate-800 dark:text-slate-300">
          {TYPE_LABELS[question.type]}
        </span>
        {question.section && (
          <span className="rounded-md bg-sky-50 px-1.5 py-0.5 font-medium text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
            {SECTION_LABELS[question.section]}
          </span>
        )}
        {question.ocr && (
          <span
            className="rounded-md bg-amber-50 px-1.5 py-0.5 font-medium text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
            title="该题文字由 OCR 识别，可能存在识别误差，以原题截图为准"
          >
            OCR
          </span>
        )}
        {crops.length > 0 && (
          <button
            type="button"
            onClick={() => setShowOriginal((v) => !v)}
            aria-expanded={showOriginal}
            className="ml-auto flex cursor-pointer items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
          >
            {showOriginal ? '收起原题' : '原题截图'}
            <Icon name="chevronDown" size={12} className={`transition-transform ${showOriginal ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-gray-800 dark:text-slate-200">{question.stem}</p>

      {question.options.length > 0 && (
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {question.options.map((option) => (
            <li
              key={option.key}
              className="flex gap-1.5 rounded-lg border border-gray-100 bg-gray-50/60 px-2 py-1.5 text-[12px] leading-relaxed text-gray-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300"
            >
              <span className="shrink-0 font-semibold text-indigo-600 dark:text-indigo-300">{option.key}</span>
              <span className="min-w-0">{option.text}</span>
            </li>
          ))}
        </ul>
      )}

      {showOriginal && crops.length > 0 && (
        <div className="mt-2 space-y-2">
          {crops.map((crop) => (
            <CropImage
              key={`${crop.page}-${crop.y}`}
              paper={paper}
              crop={crop}
              alt={alt}
              onOpen={() => onPreview(paper, crop, alt)}
            />
          ))}
          <p className="text-[10px] leading-relaxed text-gray-400 dark:text-slate-500">
            原题截图来自 docs 中的 PDF，点击可放大；公式、表格、图形以截图为准。
          </p>
        </div>
      )}

      {question.answer && (
        <>
          <button
            type="button"
            onClick={() => setShowAnswer((v) => !v)}
            aria-expanded={showAnswer}
            className="mt-2 flex cursor-pointer items-center gap-0.5 text-[11px] font-medium text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
          >
            答案与解析
            <Icon name="chevronDown" size={12} className={`transition-transform ${showAnswer ? 'rotate-180' : ''}`} />
          </button>
          {showAnswer && (
            <div className="mt-1.5 space-y-1 rounded-lg bg-gray-50 px-2.5 py-2 text-[12px] leading-relaxed text-gray-600 dark:bg-slate-800/60 dark:text-slate-300">
              <p>
                <span className="font-semibold text-gray-800 dark:text-slate-100">答案：</span>
                {question.answer}
              </p>
              {question.analysis && (
                <p>
                  <span className="font-semibold text-gray-800 dark:text-slate-100">解析：</span>
                  {question.analysis}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </article>
  )
}

/** 「题目」页：真题 / 变形题两个分区，年份 + 关键词 + 题型筛选 */
export default function QuestionBank() {
  const [params, setParams] = useSearchParams()
  const source: BankSource = params.get('source') === 'variant' ? 'variant' : 'exam'
  const yearParam = Number(params.get('year'))
  const year: number | 'all' = Number.isInteger(yearParam) && yearParam >= 2000 ? yearParam : 'all'
  const typeParam = params.get('type')
  const type: ExamQuestionType | 'all' =
    typeParam === 'single' || typeParam === 'comprehensive' ? typeParam : 'all'

  const [keyword, setKeyword] = useState(() => params.get('q') ?? '')
  const [papers, setPapers] = useState<BankPaper[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [preview, setPreview] = useState<{ paper: BankPaper; crop: PageCrop; alt: string } | null>(null)

  /** URL 参数合并写回：筛选状态可分享、可后退 */
  const patchParams = (patch: Record<string, string | null>) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(patch)) {
          if (value === null || value === '') next.delete(key)
          else next.set(key, value)
        }
        return next
      },
      { replace: true },
    )
  }

  // 输入防抖后再写 URL，避免每个按键都改地址栏
  useEffect(() => {
    const timer = setTimeout(() => {
      setParams(
        (prev) => {
          const value = keyword.trim()
          if ((prev.get('q') ?? '') === value) return prev
          const next = new URLSearchParams(prev)
          if (value) next.set('q', value)
          else next.delete('q')
          return next
        },
        { replace: true },
      )
    }, 250)
    return () => clearTimeout(timer)
  }, [keyword, setParams])

  // 切换来源：年份回到「全部」，关键词保留
  const changeSource = (next: BankSource) => {
    if (next === source) return
    setParams(
      (prev) => {
        const search = new URLSearchParams(prev)
        search.set('source', next)
        search.delete('year')
        return search
      },
      { replace: true },
    )
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFailed(false)
    loadBankPapers(source)
      .then((list) => {
        if (!cancelled) setPapers(list)
      })
      .catch(() => {
        if (cancelled) return
        setPapers([])
        setFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [source])

  const counts = useMemo(() => countByYear(papers), [papers])
  const paperByYear = useMemo(() => new Map(papers.map((paper) => [paper.year, paper])), [papers])
  const results = useMemo(() => searchBankQuestions(papers, { year, type, keyword }), [papers, year, type, keyword])

  // 筛选条件变化后回到第一页
  useEffect(() => {
    setLimit(PAGE_SIZE)
  }, [source, year, type, keyword])

  // 原图预览：Esc 关闭
  useEffect(() => {
    if (!preview) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreview(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [preview])

  const visible = results.slice(0, limit)

  return (
    <div className="mx-auto max-w-5xl space-y-3 px-4 py-3 sm:py-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="flex items-center gap-1.5 text-lg font-semibold text-gray-900 dark:text-slate-100">
            <Icon name="questions" size={18} className="text-indigo-500 dark:text-indigo-400" />
            题目
          </h1>
          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-slate-500">{SOURCE_HINTS[source]}</p>
        </div>
        <div className="flex rounded-xl bg-gray-100 p-0.5 dark:bg-slate-800">
          {BANK_SOURCES.map((item) => {
            const active = source === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => changeSource(item.key)}
                aria-pressed={active}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </header>

      <div className="card space-y-2.5 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Icon
              name="search"
              size={14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
            />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索题干、选项、标签…（空格分隔多个关键词）"
              aria-label="搜索题目"
              className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-8 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:ring-indigo-500/40"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword('')}
                aria-label="清空搜索"
                className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              >
                <Icon name="x" size={12} />
              </button>
            )}
          </div>
          <select
            value={type}
            onChange={(e) => patchParams({ type: e.target.value === 'all' ? null : e.target.value })}
            aria-label="题型筛选"
            className="h-9 shrink-0 cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-2.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-indigo-500/40"
          >
            <option value="all">全部题型</option>
            {EXAM_TYPES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => patchParams({ year: null })}
            aria-pressed={year === 'all'}
            className={`${CHIP_BASE} ${year === 'all' ? CHIP_ACTIVE : CHIP_IDLE}`}
          >
            全部年份
          </button>
          {papers.map((paper) => {
            const active = year === paper.year
            return (
              <button
                key={paper.year}
                type="button"
                onClick={() => patchParams({ year: String(paper.year) })}
                aria-pressed={active}
                className={`${CHIP_BASE} ${active ? CHIP_ACTIVE : CHIP_IDLE}`}
              >
                {paper.year}
                <span className="ml-1 text-[10px] opacity-60">{counts.get(paper.year)}</span>
              </button>
            )
          })}
        </div>
      </div>

      {source === 'variant' && (
        <p className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-[11px] leading-relaxed text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
          变形题由 docs 目录下的 PDF 自动整理：文字用于搜索，图形、表格、公式请点开「原题截图」查看。
        </p>
      )}

      <div className="flex items-center justify-between px-1 text-[11px] text-gray-500 dark:text-slate-500">
        <span>
          {loading ? '加载中…' : `共 ${results.length} 题`}
          {keyword.trim() && !loading ? ` · 关键词「${keyword.trim()}」` : ''}
        </span>
        {!loading && results.length > 0 && <span>按年份倒序 · 题号升序</span>}
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-14">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
        </div>
      ) : failed ? (
        <EmptyState icon="alert" title="题库加载失败" desc="请刷新页面重试；若仍失败，检查是否已运行 npm run import:variant。" />
      ) : results.length === 0 ? (
        <EmptyState
          icon="questions"
          title="没有匹配的题目"
          desc={
            keyword.trim()
              ? '换个关键词，或把年份切到「全部年份」再试。'
              : '当前筛选条件下没有题目，试试切换年份或题型。'
          }
        />
      ) : (
        <div className="space-y-2.5">
          {visible.map((question) => {
            const paper = paperByYear.get(question.year)
            if (!paper) return null
            return (
              <QuestionCard
                key={question.id}
                question={question}
                paper={paper}
                onPreview={(p, crop, alt) => setPreview({ paper: p, crop, alt })}
              />
            )
          })}
          {results.length > visible.length && (
            <button
              type="button"
              onClick={() => setLimit((v) => v + PAGE_SIZE)}
              className="btn-ghost w-full"
            >
              加载更多（还有 {results.length - visible.length} 题）
            </button>
          )}
        </div>
      )}

      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="原题截图预览"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-3"
          onClick={() => setPreview(null)}
        >
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <CropImage paper={preview.paper} crop={preview.crop} alt={preview.alt} />
            <p className="mt-2 text-center text-[11px] text-white/70">点击遮罩或按 Esc 关闭</p>
          </div>
        </div>
      )}
    </div>
  )
}
