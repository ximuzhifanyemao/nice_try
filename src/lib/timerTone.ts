/**
 * 计时状态的统一配色。
 *
 * 全功能模式计时页与简洁模式胶囊条共用同一套语义，避免两边各写一套颜色
 * （历史上全功能页是红/橙/蓝混用 + emoji，胶囊条是 indigo 渐变 + 线性图标）：
 * - 计时中 running：品牌渐变（indigo → violet），数字/进度/主按钮
 * - 暂停   paused ：琥珀，数字/继续按钮/今日目标线
 * - 空闲   idle   ：石板灰
 * - 结束   stop   ：玫瑰（破坏性动作，圆形次要按钮）
 * - 达标   success：祖母绿
 *
 * 本模块只提供颜色与形状，尺寸（h-8/h-9、字号）由调用方按各自密度补齐。
 */

/** 计时三态 */
export type TimerPhase = 'idle' | 'running' | 'paused'

/** 计时数字：字号/字距由调用方决定（胶囊条 17px、全功能 42px），这里只管颜色 */
export const TIMER_DIGIT_TONE: Record<TimerPhase, string> = {
  idle: 'text-slate-300 dark:text-slate-600',
  running:
    'bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-600 bg-clip-text text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-indigo-300',
  paused: 'text-amber-600 dark:text-amber-400',
}

/** 当前科目标签（胶囊条左侧胶囊 / 全功能 Hero 副标题） */
export const SUBJECT_PILL_TONE: Record<TimerPhase, string> = {
  idle: 'bg-slate-100 text-slate-600 ring-slate-200/80 dark:bg-slate-800/90 dark:text-slate-300 dark:ring-slate-700/70',
  running:
    'bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25',
  paused:
    'bg-amber-50 text-amber-700 ring-amber-200/70 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25',
}

/** 圆形控制按钮：开始 / 暂停 / 继续 / 结束 / 跳过休息（尺寸由调用方给 h-8 h-9 等） */
export const TIMER_ROUND_BTN = {
  start:
    'flex items-center justify-center rounded-full bg-indigo-600 text-white shadow-[0_3px_12px_-4px_rgba(79,70,229,0.75)] transition-all hover:bg-indigo-500 active:scale-[0.96] cursor-pointer',
  pause:
    'flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 active:scale-[0.96] cursor-pointer dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
  resume:
    'flex items-center justify-center rounded-full bg-amber-500 text-white shadow-sm transition-colors hover:bg-amber-400 active:scale-[0.96] cursor-pointer',
  stop: 'flex items-center justify-center rounded-full bg-rose-500 text-white shadow-sm transition-colors hover:bg-rose-600 active:scale-[0.96] cursor-pointer',
  skipRest:
    'flex items-center justify-center rounded-full bg-amber-500 text-white shadow-sm transition-colors hover:bg-amber-400 active:scale-[0.96] cursor-pointer',
} as const

/**
 * 番茄钟阶段语义色：专注=品牌靛、休息=祖母绿、暂停=琥珀。
 * 全功能计时页的阶段徽标与简洁模式胶囊条的阶段胶囊/状态点/进度条共用，
 * 保证两个界面对「正在专注 / 正在休息」的配色一致。
 */
export const POMO_PILL_TONE = {
  focus:
    'bg-indigo-50 text-indigo-700 ring-indigo-200/70 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/25',
  rest: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25',
  paused:
    'bg-amber-50 text-amber-700 ring-amber-200/70 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25',
} as const

/** 番茄钟阶段状态点（专注 / 休息 / 暂停） */
export const POMO_DOT_TONE = {
  focus: 'bg-indigo-500 dark:bg-indigo-400',
  rest: 'bg-emerald-500 dark:bg-emerald-400',
  paused: 'bg-amber-500 dark:bg-amber-400',
} as const

/** 番茄钟阶段进度条填充色 */
export const POMO_BAR_TONE = {
  focus: 'bg-indigo-500 dark:bg-indigo-400',
  rest: 'bg-emerald-500 dark:bg-emerald-400',
} as const

/** 番茄钟倒计时数字色（专注跟随计时中渐变，休息为绿色） */
export const POMO_DIGIT_TONE = {
  focus: TIMER_DIGIT_TONE.running,
  rest: 'text-emerald-600 dark:text-emerald-400',
} as const

/** 主行动按钮（开始专注 / 保存到今日记录） */
export const TIMER_PRIMARY_BTN =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_3px_12px_-4px_rgba(79,70,229,0.75)] transition-all hover:bg-indigo-500 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45'

/** 次要/幽灵按钮（放弃、跳过休息等） */
export const TIMER_GHOST_BTN =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-800'

/**
 * 科目行（中性行 + 类别色点）的状态样式。
 * 紧凑下拉与全功能左栏共用：padding/字号按各自密度在调用方补，这里只保证
 * 边框、底色与文字色一致，两个界面看起来是同一份列表。
 */
export function subjectRowTone(state: 'normal' | 'active' | 'disabled'): string {
  if (state === 'active') {
    return 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500/60 dark:bg-indigo-500/15 dark:text-indigo-200'
  }
  if (state === 'disabled') {
    return 'border-slate-200/80 bg-white text-slate-400 opacity-50 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-500'
  }
  return 'border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800'
}