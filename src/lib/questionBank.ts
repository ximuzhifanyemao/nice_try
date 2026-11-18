// 统一题库：408 真题（src/data/exam408）+ 变形题（src/data/variant）
// 真题数据已有答案/解析；变形题由 docs 下 PDF 自动整理，含原题截图裁剪信息。
import {
  loadAllPapers,
  type ExamPaper,
  type ExamQuestion,
  type ExamQuestionType,
  type ExamSection,
} from './exam408'

export type BankSource = 'exam' | 'variant'

/** 原题页面图上的裁剪区域（单位：页图像素） */
export interface PageCrop {
  /** 1-based 页码 */
  page: number
  x: number
  y: number
  w: number
  h: number
}

export interface PageImage {
  /** 如 /questions/2024/p1.jpg */
  src: string
  width: number
  height: number
}

export interface BankQuestion {
  /** 真题 408-2024-01；变形题 V-2024-01 */
  id: string
  year: number
  number: number
  type: ExamQuestionType
  stem: string
  options: { key: string; text: string }[]
  /** 仅真题有 */
  answer?: string
  analysis?: string
  /** 仅真题有 */
  section?: ExamSection
  tags?: string[]
  /** 变形题：原题截图区域（可能跨页） */
  crops?: PageCrop[]
  /** 变形题：题干含图形/表格/公式，默认展开原图 */
  needsOriginal?: boolean
  /** 变形题：文字来自 OCR，可能存在识别误差 */
  ocr?: boolean
}

export interface BankPaper {
  year: number
  source: BankSource
  /** 变形题原始 PDF 文件名 */
  sourceFile?: string
  /** 页码(1-based) → 页图；只包含被题目截图引用的页 */
  pages?: Record<string, PageImage>
  questions: BankQuestion[]
}

export const BANK_SOURCES = [
  { key: 'exam', label: '真题' },
  { key: 'variant', label: '变形题' },
] as const satisfies readonly { key: BankSource; label: string }[]

// ---------- 变形题：按年份懒加载（与 exam408 相同的缓存 + 并发去重） ----------

type VariantModule = { default: BankPaper }

const variantModules = import.meta.glob<VariantModule>('../data/variant/*.json')

const variantLoaders = new Map<number, () => Promise<VariantModule>>()
for (const [path, loader] of Object.entries(variantModules)) {
  const matched = /(\d{4})\.json$/.exec(path)
  if (matched) variantLoaders.set(Number(matched[1]), loader)
}

/** 有数据的变形题年份，倒序 */
export const VARIANT_YEARS: number[] = [...variantLoaders.keys()].sort((a, b) => b - a)

function loadVariantPaper(year: number): Promise<BankPaper> {
  const loader = variantLoaders.get(year)
  if (!loader) return Promise.reject(new Error(`缺少 ${year} 年变形题数据`))
  return loader().then((mod) => mod.default)
}

// ---------- 真题 → 统一结构 ----------

const examBankCache = new Map<number, BankPaper>()

function toBankPaper(paper: ExamPaper): BankPaper {
  const cached = examBankCache.get(paper.year)
  if (cached) return cached
  const mapped: BankPaper = {
    year: paper.year,
    source: 'exam',
    questions: paper.questions
      .filter((q: ExamQuestion) => q.status === 'ok')
      .map((q) => ({
        id: q.id,
        year: q.year,
        number: q.number,
        type: q.type,
        stem: q.stem,
        options: q.options,
        answer: q.answer,
        analysis: q.analysis,
        section: q.section,
        tags: q.tags,
      })),
  }
  examBankCache.set(paper.year, mapped)
  return mapped
}

// ---------- 对外加载入口 ----------

const bankCache = new Map<BankSource, BankPaper[]>()
const bankPending = new Map<BankSource, Promise<BankPaper[]>>()

/** 加载某个来源的全部年份（模块级缓存 + 并发去重），年份倒序 */
export function loadBankPapers(source: BankSource): Promise<BankPaper[]> {
  const cached = bankCache.get(source)
  if (cached) return Promise.resolve(cached)
  const inflight = bankPending.get(source)
  if (inflight) return inflight

  const task = (source === 'exam'
    ? loadAllPapers().then((papers) => papers.map(toBankPaper))
    : Promise.all(VARIANT_YEARS.map((year) => loadVariantPaper(year).catch(() => null))).then((list) =>
        list.filter((paper): paper is BankPaper => paper !== null),
      )
  )
    .then((papers) => {
      const sorted = [...papers].sort((a, b) => b.year - a.year)
      bankCache.set(source, sorted)
      bankPending.delete(source)
      return sorted
    })
    .catch((err: unknown) => {
      bankPending.delete(source)
      throw err
    })

  bankPending.set(source, task)
  return task
}

// ---------- 检索 ----------

export interface BankFilter {
  year?: number | 'all'
  type?: ExamQuestionType | 'all'
  /** 空格分隔多个关键词（AND），匹配题干、选项、标签、年份 */
  keyword?: string
}

/**
 * 过滤题目：年份 + 题型 + 关键词。
 * 返回值按年份倒序、题号升序排列，便于直接渲染。
 */
export function searchBankQuestions(papers: BankPaper[], filter: BankFilter = {}): BankQuestion[] {
  const { year = 'all', type = 'all' } = filter
  const tokens = (filter.keyword ?? '')
    .toLowerCase()
    .split(/[\s\u3000]+/)
    .filter(Boolean)

  const out: BankQuestion[] = []
  for (const paper of papers) {
    if (year !== 'all' && paper.year !== year) continue
    for (const question of paper.questions) {
      if (type !== 'all' && question.type !== type) continue
      if (tokens.length) {
        const haystack = [
          question.stem,
          ...question.options.map((o) => o.text),
          ...(question.tags ?? []),
          String(question.year),
          `第${question.number}题`,
        ]
          .join(' ')
          .toLowerCase()
        if (!tokens.every((token) => haystack.includes(token))) continue
      }
      out.push(question)
    }
  }

  return out.sort((a, b) => b.year - a.year || a.number - b.number)
}

/** 每年题数（用于年份筛选按钮上的计数） */
export function countByYear(papers: BankPaper[]): Map<number, number> {
  return new Map(papers.map((paper) => [paper.year, paper.questions.length]))
}
