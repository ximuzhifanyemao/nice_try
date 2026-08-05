/**
 * 科目类别的统一配色方案
 * 按用途区分：chip（标签/徽章）、bar（进度条/图形）、card（表单卡片）、button（按钮）
 * 所有组件从本模块取色，避免重复定义不一致
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

export const BUTTON_COLORS: Record<string, string> = {
  math: 'border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/40',
  english: 'border-green-400 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900/40',
  '408': 'border-purple-400 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700 dark:hover:bg-purple-900/40',
  politics: 'border-red-400 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-900/40',
}

export const CHIP_FALLBACK = 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
export const BAR_FALLBACK = 'bg-gray-400 dark:bg-slate-500'
export const CARD_FALLBACK = 'bg-gray-50 border-gray-200 dark:bg-slate-700/30 dark:border-slate-600'

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

/** 科目按钮配色（StudyTimer） */
export function getButtonColor(category?: string): string {
  return (category && BUTTON_COLORS[category]) || BUTTON_COLORS['408']
}
