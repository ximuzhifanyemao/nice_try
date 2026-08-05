/** 通用格式化工具 */

/** 数字补零到两位数 */
export function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** 秒数格式化为 HH:MM:SS */
export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

/** 秒数格式化为简写（如 2h 30min / 45min） */
export function formatDurationShort(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}
