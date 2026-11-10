// 408 真题库：类型定义 + 按年份分片懒加载 + 检索
// 数据体在 src/data/exam408/<year>.json，每个年份独立异步 chunk，不进入首屏 bundle

export type ExamSection = 'ds' | 'co' | 'os' | 'cn'
export type ExamQuestionType = 'single' | 'comprehensive'

export interface ExamOption {
  key: string
  text: string
}

export interface ExamQuestion {
  /** 408-<year>-<2位题号>，如 408-2024-01 */
  id: string
  year: number
  /** 1-47 */
  number: number
  type: ExamQuestionType
  section: ExamSection
  stem: string
  /** 综合题为 [] */
  options: ExamOption[]
  /** 单选 A-D；综合题为参考答案要点 */
  answer: string
  analysis?: string
  tags: string[]
  status: 'ok' | 'missing'
}

export interface ExamPaper {
  year: number
  source: string
  questions: ExamQuestion[]
}

/** 2009–2026 考研，共 18 年 */
export const EXAM_YEARS: number[] = Array.from({ length: 18 }, (_, i) => 2009 + i)

export const EXAM_SECTIONS = [
  { key: 'ds', label: '数据结构' },
  { key: 'co', label: '计组' },
  { key: 'os', label: '操作系统' },
  { key: 'cn', label: '计算机网络' },
] as const satisfies readonly { key: ExamSection; label: string }[]

export const EXAM_TYPES = [
  { key: 'single', label: '单选' },
  { key: 'comprehensive', label: '综合' },
] as const satisfies readonly { key: ExamQuestionType; label: string }[]

// ---------- 按年份懒加载（模块级缓存 + 并发去重） ----------

type PaperModule = { default: ExamPaper }

const modules = import.meta.glob<PaperModule>('../data/exam408/*.json')

/** 年份 → 动态 import 函数（由文件名解析年份，不静态引入 JSON） */
const loaders = new Map<number, () => Promise<PaperModule>>()
for (const [path, loader] of Object.entries(modules)) {
  const matched = /(\d{4})\.json$/.exec(path)
  if (matched) loaders.set(Number(matched[1]), loader)
}

const paperCache = new Map<number, ExamPaper>()
const paperPending = new Map<number, Promise<ExamPaper>>()

export function loadPaper(year: number): Promise<ExamPaper> {
  const cached = paperCache.get(year)
  if (cached) return Promise.resolve(cached)
  const inflight = paperPending.get(year)
  if (inflight) return inflight

  const loader = loaders.get(year)
  if (!loader) return Promise.reject(new Error(`缺少 ${year} 年 408 真题数据`))

  const task = loader()
    .then((mod) => {
      const paper = normalizePaper(mod.default)
      paperCache.set(year, paper)
      paperPending.delete(year)
      return paper
    })
    .catch((e: unknown) => {
      paperPending.delete(year) // 失败后允许重试
      throw e
    })
  paperPending.set(year, task)
  return task
}

/**
 * 数据文件允许省略题内 year / tags / options（不同批次整理时字段未必写全），
 * 统一在加载时补齐，页面层拿到的永远是完整结构。
 */
function normalizePaper(raw: ExamPaper): ExamPaper {
  const year = raw.year
  return {
    year,
    source: raw.source ?? '',
    questions: (raw.questions ?? []).map((q) => ({
      ...q,
      year: typeof q.year === 'number' ? q.year : year,
      options: Array.isArray(q.options) ? q.options : [],
      tags: Array.isArray(q.tags) ? q.tags : [],
      status: q.status === 'missing' ? 'missing' : 'ok',
    })),
  }
}

let allCache: ExamPaper[] | null = null
let allPending: Promise<ExamPaper[]> | null = null

/** 加载全部年份；个别年份缺失或加载失败时跳过，不阻塞其余年份 */
export function loadAllPapers(): Promise<ExamPaper[]> {
  if (allCache) return Promise.resolve(allCache)
  if (!allPending) {
    allPending = Promise.all(EXAM_YEARS.map((year) => loadPaper(year).catch(() => null))).then(
      (list) => {
        allCache = list.filter((paper): paper is ExamPaper => paper !== null)
        allPending = null
        return allCache
      },
    )
  }
  return allPending
}

/**
 * 按 id 批量取题：id 形如 408-<year>-<2位题号>，只加载涉及到的年份。
 * 返回 Map<id, ExamQuestion>；格式不合法、找不到或加载失败的 id 一律忽略。
 */
export async function getQuestionsByIds(ids: string[]): Promise<Map<string, ExamQuestion>> {
  const idsByYear = new Map<number, string[]>()
  for (const id of ids) {
    const matched = /^408-(\d{4})-\d{2}$/.exec(id)
    if (!matched) continue
    const year = Number(matched[1])
    const list = idsByYear.get(year)
    if (list) list.push(id)
    else idsByYear.set(year, [id])
  }

  const result = new Map<string, ExamQuestion>()
  await Promise.all(
    [...idsByYear].map(async ([year, yearIds]) => {
      try {
        const paper = await loadPaper(year)
        const index = new Map(paper.questions.map((q) => [q.id, q]))
        for (const id of yearIds) {
          const question = index.get(id)
          if (question) result.set(id, question)
        }
      } catch {
        // 该年份数据缺失或加载失败：忽略
      }
    }),
  )
  return result
}

export interface ExamFilter {
  year?: number | 'all'
  section?: ExamSection | 'all'
  type?: ExamQuestionType | 'all'
  /** 匹配题干、选项文本、标签 */
  keyword?: string
}

/** 过滤题目：跳过 status !== 'ok' 的题（待补充题不进入选择器） */
export function filterQuestions(papers: ExamPaper[], filter: ExamFilter = {}): ExamQuestion[] {
  const { year = 'all', section = 'all', type = 'all' } = filter
  const keyword = filter.keyword?.trim().toLowerCase() ?? ''
  const out: ExamQuestion[] = []

  for (const paper of papers) {
    if (year !== 'all' && paper.year !== year) continue
    for (const question of paper.questions) {
      if (question.status !== 'ok') continue
      if (section !== 'all' && question.section !== section) continue
      if (type !== 'all' && question.type !== type) continue
      if (keyword) {
        const haystack = [question.stem, ...question.options.map((o) => o.text), ...question.tags]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(keyword)) continue
      }
      out.push(question)
    }
  }
  return out
}
