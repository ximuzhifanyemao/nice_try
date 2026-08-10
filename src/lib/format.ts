/** 通用格式化工具 */

/** 数字补零到两位数 */
export function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** yyyy-MM-dd → 8月5日 */
export function formatDateCn(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${Number(m)}月${Number(d)}日`
}

/** yyyy-MM-dd → 2026.8.5 周二 */
export function formatDateShort(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const d = new Date(dateStr + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return dateStr
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  return `${Number(parts[0])}.${Number(parts[1])}.${Number(parts[2])} ${week}`
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

/** Date → HH:mm（本地时区） */
export function toTimeStr(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** HH:mm 时间段 → "14:00-16:00"；缺任一时段返回 null */
export function formatTimeRange(start?: string, end?: string): string | null {
  if (!start || !end) return null
  return `${start}-${end}`
}

/** HH:mm 时间段 → 学习小时数（保留 2 位小数；结束早于开始视为跨零点，按次日结束计算） */
export function timeRangeHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0
  let diffMinutes = eh * 60 + em - (sh * 60 + sm)
  if (diffMinutes <= 0) diffMinutes += 24 * 60
  return Math.round((diffMinutes / 60) * 100) / 100
}
