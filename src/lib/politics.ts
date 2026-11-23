import rawData from '../data/politics.json'
import { loadSolutionProgress, sanitizeSolutionProgress, type SolutionProgress } from './solutionProgress'
import { readUserCache, writeUserCache } from './userScope'

/**
 * 考研政治「一页纸」的静态数据与纯函数工具。
 *
 * 内容（100 个考点 + 33 场会议）原样迁自原单文件版，数据放在
 * src/data/politics.json；这里只做类型收敛和检索/统计等无副作用计算。
 */

export interface PoliticsItem {
  no: number
  title: string
  category: string
  group: string
  html: string
  plain: string
  page: number
}

export interface PoliticsMeeting {
  name: string
  year: number
  html: string
  plain: string
}

export interface PoliticsCategory {
  name: string
  count: number
  groups: { name: string; count: number }[]
}

export interface PoliticsMeta {
  title: string
  subtitle: string
  author: string
  source: string
  usage: string
}

interface PoliticsRawData {
  meta: PoliticsMeta
  categories: PoliticsCategory[]
  items: PoliticsItem[]
  meetings: PoliticsMeeting[]
}

export const POLITICS_DATA = rawData as PoliticsRawData
export const POLITICS_ITEMS = POLITICS_DATA.items
export const POLITICS_CATEGORIES = POLITICS_DATA.categories
export const POLITICS_MEETINGS = POLITICS_DATA.meetings
export const POLITICS_META = POLITICS_DATA.meta
export const POLITICS_TOTAL = POLITICS_ITEMS.length
export const POLITICS_BY_NO = new Map(POLITICS_ITEMS.map((item) => [item.no, item]))

export const POLITICS_CAT_META: Record<string, { cls: string; seal: string; desc: string }> = {
  马原: { cls: 'ma', seal: '马', desc: '基本知识 · 资本主义 · 政经 · 国际' },
  史纲: { cls: 'shi', seal: '史', desc: '早期 · 大革命 · 抗战 · 会议' },
  其他: { cls: 'qi', seal: '时', desc: '高质量发展 · 新格局 · 依法治国' },
}

export interface PoliticsStage {
  id: string
  name: string
  short: string
  start: number
  end: number
  color: string
  items: number[]
}

export const POLITICS_STAGES: PoliticsStage[] = [
  { id: 'early', name: '对国出路的早期探索', short: '早期探索', start: 1840, end: 1919, color: 'ma', items: [38, 39, 40, 41, 42, 43, 44, 45] },
  { id: 'dgm', name: '大革命时期', short: '大革命', start: 1919, end: 1927, color: 'shi', items: [46, 47, 48, 49] },
  { id: 'land', name: '土地革命战争时期', short: '土地革命', start: 1927, end: 1937, color: 'ma', items: [50, 51, 52, 53, 54] },
  { id: 'war', name: '抗日战争时期', short: '抗日战争', start: 1937, end: 1945, color: 'shi', items: [55, 56, 57, 58, 59] },
  { id: 'lib', name: '解放战争时期', short: '解放战争', start: 1945, end: 1949, color: 'qi', items: [60, 61, 62] },
  { id: 'founding', name: '完成民主革命遗留任务', short: '建国初期', start: 1949, end: 1953, color: 'ma', items: [63, 64, 65, 66, 67] },
  { id: 'transform', name: '社会主义改造', short: '三大改造', start: 1953, end: 1956, color: 'shi', items: [68, 69, 70, 71] },
  { id: 'explore', name: '社会主义建设初步探索', short: '初步探索', start: 1956, end: 1978, color: 'qi', items: [72, 73, 74, 75, 76] },
  { id: 'reform', name: '改革开放', short: '改革开放', start: 1978, end: 2026, color: 'gold', items: [77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100] },
]

export const POLITICS_TL_ROWS = [
  {
    label: '革命',
    segs: [
      { name: '旧民主主义革命', start: 1840, end: 1919, color: 'shi' },
      { name: '新民主主义革命', start: 1919, end: 1949, color: 'ma' },
      { name: '社会主义革命', start: 1949, end: 1956, color: 'shi' },
      { name: '改革开放新的伟大革命', start: 1978, end: 2026, color: 'qi' },
    ],
  },
  {
    label: '国情',
    segs: [
      { name: '半殖民地半封建社会', start: 1840, end: 1949, color: 'shi' },
      { name: '新民主主义社会', start: 1949, end: 1956, color: 'ma' },
      { name: '社会主义初级阶段', start: 1956, end: 2026, color: 'qi' },
    ],
  },
  {
    label: '历史时期',
    segs: [
      { name: '近代', start: 1840, end: 1949, color: 'ma' },
      { name: '现代', start: 1949, end: 2026, color: 'shi' },
    ],
  },
]

export type PoliticsPageKey = 'library' | 'solution' | 'wrong' | 'history'
export type PoliticsFontSize = 'sm' | 'md' | 'lg'

export const POLITICS_NAV: { page: PoliticsPageKey; label: string; icon: 'book' | 'history' | 'bulb' | 'alert' }[] = [
  { page: 'library', label: '知识库', icon: 'book' },
  { page: 'solution', label: '解题', icon: 'bulb' },
  { page: 'wrong', label: '错题', icon: 'alert' },
  { page: 'history', label: '史纲', icon: 'history' },
]

export const POLITICS_PAGE_NAME: Record<PoliticsPageKey, string> = {
  library: '知识库',
  solution: '解题',
  wrong: '错题',
  history: '史纲',
}

/** 本机存储键：沿用原单文件版的键名，老用户的进度不会丢 */
export const POLITICS_STATE_KEY = 'onepaper.state.v1'

export interface PoliticsLocalState {
  mastered: number[]
  saved: number[]
  visits: string[]
  last: number | null
  font: PoliticsFontSize
  /** 解题手册的作答记录：与考点进度保存在同一份状态里，登录后一起同步云端 */
  answers: SolutionProgress
}

function toNoArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<number>()
  for (const item of value) {
    if (typeof item === 'number' && POLITICS_BY_NO.has(item)) seen.add(item)
  }
  return Array.from(seen).sort((a, b) => a - b)
}

function toVisits(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return Array.from(
    new Set(value.filter((v): v is string => typeof v === 'string' && v.length > 0)),
  ).slice(-180)
}

export function loadPoliticsState(userId?: string | null): PoliticsLocalState {
  try {
    const raw = readUserCache(POLITICS_STATE_KEY, userId)
    const obj = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
    const font = obj.font === 'sm' || obj.font === 'lg' ? obj.font : 'md'
    /* 老版本的解题记录单独存在 kaoyan_solution_progress_v1，首次读取时迁移过来 */
    const answers =
      obj.answers && typeof obj.answers === 'object'
        ? sanitizeSolutionProgress(obj.answers)
        : loadSolutionProgress(userId)
    return {
      mastered: toNoArray(obj.mastered),
      saved: toNoArray(obj.saved),
      visits: toVisits(obj.visits),
      last: typeof obj.last === 'number' && POLITICS_BY_NO.has(obj.last) ? obj.last : null,
      font,
      answers,
    }
  } catch {
    return {
      mastered: [],
      saved: [],
      visits: [],
      last: null,
      font: 'md',
      answers: loadSolutionProgress(userId),
    }
  }
}

export function savePoliticsState(state: PoliticsLocalState, userId?: string | null): void {
  try {
    writeUserCache(POLITICS_STATE_KEY, JSON.stringify(state), userId)
  } catch {
    /* 隐私模式 / 配额不足时保持内存态 */
  }
}

export function dateKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function padNo(no: number): string {
  return String(no).padStart(3, '0')
}

export function catLabel(item: PoliticsItem): string {
  return item.category + (item.group && item.group !== '总览' ? ' · ' + item.group : '')
}

export function catCls(category: string): string {
  return POLITICS_CAT_META[category]?.cls ?? 'ma'
}

export function categoryMastered(category: string, mastered: number[]): number {
  const set = new Set(mastered)
  return POLITICS_ITEMS.filter((item) => item.category === category && set.has(item.no)).length
}

/** 卡片预览：取正文前三段（与旧版一致，第三段由 CSS 在窄屏隐藏） */
export function previewHtml(item: PoliticsItem): string {
  if (item.no === 37) {
    return '<p class="kp-line">一张时间轴，串起 1840–1978 的史纲脉络。</p><p class="kp-line c-gray">从旧民主主义革命到改革开放，把阶段、国情、历史时期连起来看。</p>'
  }
  const ps = item.html.match(/<p class="kp-line[^"]*">[\s\S]*?<\/p>/g) || []
  if (!ps.length) return '<p class="kp-line c-gray">这条考点以时间轴呈现，点开查看。</p>'
  return ps.slice(0, 3).join('')
}

export interface PoliticsFilters {
  cat: string
  group: string
  status: 'all' | 'unmastered' | 'mastered' | 'saved'
  q: string
}

export const DEFAULT_FILTERS: PoliticsFilters = { cat: '全部', group: '全部', status: 'all', q: '' }

export function filterItems(filters: PoliticsFilters, state: PoliticsLocalState): PoliticsItem[] {
  const mastered = new Set(state.mastered)
  const saved = new Set(state.saved)
  return POLITICS_ITEMS.filter((item) => {
    if (filters.cat !== '全部' && item.category !== filters.cat) return false
    if (filters.group !== '全部' && item.group !== filters.group) return false
    if (filters.status === 'unmastered' && mastered.has(item.no)) return false
    if (filters.status === 'mastered' && !mastered.has(item.no)) return false
    if (filters.status === 'saved' && !saved.has(item.no)) return false
    if (filters.q) {
      const q = filters.q.toLowerCase()
      if (!(item.title.toLowerCase().includes(q) || item.plain.toLowerCase().includes(q))) return false
    }
    return true
  })
}

export function snippetFor(item: PoliticsItem, q: string): string {
  const plain = item.plain
  if (!q) return plain.slice(0, 76) + (plain.length > 76 ? '…' : '')
  const idx = plain.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) return plain.slice(0, 76) + (plain.length > 76 ? '…' : '')
  const start = Math.max(0, idx - 22)
  const end = Math.min(plain.length, idx + q.length + 46)
  return (start > 0 ? '…' : '') + plain.slice(start, end) + (end < plain.length ? '…' : '')
}
