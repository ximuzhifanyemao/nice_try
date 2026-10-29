/**
 * 科目类别的统一配色方案
 * 按用途区分：chip（标签/徽章）、bar（进度条/图形）、card（表单卡片）、dot（中性列表里的类别色点）
 * 所有组件从本模块取色，避免重复定义不一致。
 * 计时界面的科目行/按钮配色见 lib/timerTone.ts（按计时状态而非类别取色）。
 */

export const CHIP_COLORS: Record<string, string> = {
  math: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  english: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  '408': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  politics: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

export const BAR_COLORS: Record<string, string> = {
  math: 'bg-blue-500 dark:bg-blue-400',
  english: 'bg-green-500 dark:bg-green-400',
  '408': 'bg-purple-500 dark:bg-purple-400',
  politics: 'bg-red-500 dark:bg-red-400',
}

export const CARD_COLORS: Record<string, string> = {
  math: 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700/50',
  english: 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700/50',
  '408': 'bg-purple-50 border-purple-300 dark:bg-purple-900/20 dark:border-purple-700/50',
  politics: 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700/50',
}

export const CHIP_FALLBACK = 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
export const BAR_FALLBACK = 'bg-gray-400 dark:bg-slate-500'
export const CARD_FALLBACK = 'bg-gray-50 border-gray-200 dark:bg-slate-700/30 dark:border-slate-600'

/**
 * 类别色点：用于「中性列表 + 一点色相」的轻量表达
 * （如桌面精简下拉里的科目列表：不整块染色，只在名称前点一个小圆点）。
 */
export const DOT_COLORS: Record<string, string> = {
  math: 'bg-blue-500 dark:bg-blue-400',
  english: 'bg-emerald-500 dark:bg-emerald-400',
  '408': 'bg-violet-500 dark:bg-violet-400',
  politics: 'bg-rose-500 dark:bg-rose-400',
}

export const DOT_FALLBACK = 'bg-slate-400 dark:bg-slate-500'

/** 科目标签/徽章配色（LogCard、Calendar、Summary 等） */
export function getChipColor(category?: string): string {
  return (category && CHIP_COLORS[category]) || CHIP_FALLBACK
}

/** 进度条/图形配色（Summary 进度条、WeeklyChart 折线） */
export function getBarColor(category?: string): string {
  return (category && BAR_COLORS[category]) || BAR_FALLBACK
}

/** 表单卡片边框配色（LogForm） */
export function getCardColor(category?: string): string {
  return (category && CARD_COLORS[category]) || CARD_FALLBACK
}

/** 类别色点配色：中性列表里的轻量色相标记 */
export function getDotColor(category?: string): string {
  return (category && DOT_COLORS[category]) || DOT_FALLBACK
}

/* ── 科目主色（hex） ──
   用于需要纯色值的可视化（如「科目占比」堆叠条、图例圆点、分享卡）。
   有类别的科目沿用该类别色；**自定义科目没有类别**，按科目 id 稳定散列到调色板，
   保证同一科目在任何页面/任何一天都是同一个颜色，不会因为缺类别而一律变灰。 */

const CATEGORY_HEX: Record<string, string> = {
  math: '#3b82f6',
  english: '#22c55e',
  '408': '#a855f7',
  politics: '#ef4444',
}

/** 无类别科目的取色调色板（色相拉开，避免相邻科目撞色） */
const SUBJECT_PALETTE = [
  '#6366f1',
  '#0ea5e9',
  '#14b8a6',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#84cc16',
  '#f97316',
]

const SUBJECT_HEX_FALLBACK = '#94a3b8'

/** 科目主色：优先类别色，无类别时按 id 稳定取色 */
export function getSubjectHex(id: string, category?: string): string {
  if (category && CATEGORY_HEX[category]) return CATEGORY_HEX[category]
  if (!id) return SUBJECT_HEX_FALLBACK
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return SUBJECT_PALETTE[hash % SUBJECT_PALETTE.length]
}
