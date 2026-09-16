/**
 * 倒计时目标日期的统一解析入口。
 *
 * 历史上 `DEFAULT_TARGET = new Date('2026-12-20')` 在 Home.tsx 与 Countdown.tsx 里各写了一份，
 * 改一处漏一处就会出现「首页显示的日期和倒计时组件不一致」这类难查的问题。
 * 这里收敛为单一来源，所有需要解析目标日期的地方都从这里取。
 */

/** 未设置目标时使用的兜底日期（仅用于未登录访客的展示，登录用户未设置时会显示引导） */
export const FALLBACK_TARGET_DATE = '2026-12-20'

/** 设置里的 target_date 是否是合法的 yyyy-MM-dd */
export function hasTargetDate(dateStr: string | null | undefined): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr ?? '')
}

/**
 * 把 yyyy-MM-dd 解析为「本地时区」零点。
 * 不能直接用 new Date('2026-12-20')——那会被当作 UTC 零点，东八区会显示成前一天。
 */
export function parseLocalDate(dateStr: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  if (!m) return parseLocalDate(FALLBACK_TARGET_DATE)
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

/** 解析用户设置的目标日期；为空或非法时回落到兜底日期 */
export function resolveTargetDate(dateStr: string | null | undefined): Date {
  return parseLocalDate(hasTargetDate(dateStr) ? (dateStr as string) : FALLBACK_TARGET_DATE)
}

/** 距目标的天数（不足一天按 0 计，已过期为负数） */
export function daysUntil(target: Date, from: Date = new Date()): number {
  return Math.ceil((target.getTime() - from.getTime()) / 86400000)
}
