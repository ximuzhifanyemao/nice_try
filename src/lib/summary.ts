import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  differenceInCalendarDays,
  addDays,
  addMonths,
} from 'date-fns'
import type { DailyLog, DailyLogSubject } from './dailyLogs'
import { getSubjectById } from './subjects'

export interface SummaryRange {
  mode: 'week' | 'month' | 'custom'
  startDate: string
  endDate: string
}

export interface SubjectBreakdown {
  subjectId: string
  name: string
  hours: number
  percentage: number
}

export interface DailyTrendItem {
  date: string
  totalHours: number
  subjects: DailyLogSubject[]
}

export interface SummaryResult {
  totalHours: number
  checkedDays: number
  subjectBreakdown: SubjectBreakdown[]
  dailyTrend: DailyTrendItem[]
}

export function getWeekRange(refDate: Date = new Date()): { startDate: string; endDate: string } {
  const start = startOfWeek(refDate, { weekStartsOn: 1 })
  const end = endOfWeek(refDate, { weekStartsOn: 1 })
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
  }
}

export function getMonthRange(refDate: Date = new Date()): { startDate: string; endDate: string } {
  const start = startOfMonth(refDate)
  const end = endOfMonth(refDate)
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
  }
}

export function validateCustomRange(
  start: string,
  end: string
): { valid: boolean; error?: string; startDate: string; endDate: string } {
  let startDate = start
  let endDate = end

  const startMatch = /^\d{4}-\d{2}-\d{2}$/.test(startDate)
  const endMatch = /^\d{4}-\d{2}-\d{2}$/.test(endDate)

  if (!startMatch || !endMatch) {
    return { valid: false, error: '日期格式必须为 yyyy-MM-dd', startDate, endDate }
  }

  let startParsed: Date
  let endParsed: Date

  try {
    startParsed = parseISO(startDate)
    endParsed = parseISO(endDate)
  } catch {
    return { valid: false, error: '日期解析失败', startDate, endDate }
  }

  if (isNaN(startParsed.getTime()) || isNaN(endParsed.getTime())) {
    return { valid: false, error: '无效的日期', startDate, endDate }
  }

  if (startParsed > endParsed) {
    ;[startDate, endDate] = [endDate, startDate]
    ;[startParsed, endParsed] = [endParsed, startParsed]
  }

  const diffDays = differenceInCalendarDays(endParsed, startParsed)
  if (diffDays > 365) {
    return { valid: false, error: '跨度不能超过 365 天', startDate, endDate }
  }

  return { valid: true, startDate, endDate }
}

export function filterLogsByRange(
  logs: DailyLog[],
  startDate: string,
  endDate: string
): DailyLog[] {
  return logs.filter((log) => log.date >= startDate && log.date <= endDate)
}

export function computeSummary(filteredLogs: DailyLog[]): SummaryResult {
  const subjectHoursMap = new Map<string, number>()
  const dateSet = new Set<string>()
  const dailyMap = new Map<string, { totalHours: number; subjects: Map<string, DailyLogSubject> }>()

  let totalHours = 0

  for (const log of filteredLogs) {
    dateSet.add(log.date)

    let dailyEntry = dailyMap.get(log.date)
    if (!dailyEntry) {
      dailyEntry = { totalHours: 0, subjects: new Map() }
      dailyMap.set(log.date, dailyEntry)
    }

    for (const subj of log.subjects) {
      totalHours += subj.hours
      dailyEntry.totalHours += subj.hours

      const existing = subjectHoursMap.get(subj.id) ?? 0
      subjectHoursMap.set(subj.id, existing + subj.hours)

      const dailySubj = dailyEntry.subjects.get(subj.id)
      if (dailySubj) {
        dailySubj.hours += subj.hours
        if (subj.summary) {
          dailySubj.summary = dailySubj.summary ? dailySubj.summary + '; ' + subj.summary : subj.summary
        }
      } else {
        dailyEntry.subjects.set(subj.id, { ...subj })
      }
    }
  }

  const subjectBreakdown: SubjectBreakdown[] = []
  for (const [subjectId, hours] of subjectHoursMap) {
    const subject = getSubjectById(subjectId)
    const name = subject?.name ?? subjectId
    const percentage = totalHours > 0 ? (hours / totalHours) * 100 : 0
    subjectBreakdown.push({ subjectId, name, hours, percentage })
  }

  subjectBreakdown.sort((a, b) => b.hours - a.hours)

  if (subjectBreakdown.length > 0 && totalHours > 0) {
    const roundedPercentages = subjectBreakdown.map((s) => Math.round(s.percentage * 100) / 100)
    const sumRounded = roundedPercentages.reduce((a, b) => a + b, 0)
    const diff = Math.round((100 - sumRounded) * 100) / 100

    if (diff !== 0) {
      let maxIdx = 0
      for (let i = 1; i < subjectBreakdown.length; i++) {
        if (subjectBreakdown[i].hours > subjectBreakdown[maxIdx].hours) {
          maxIdx = i
        }
      }
      roundedPercentages[maxIdx] = Math.round((roundedPercentages[maxIdx] + diff) * 100) / 100
    }

    for (let i = 0; i < subjectBreakdown.length; i++) {
      subjectBreakdown[i].percentage = roundedPercentages[i]
    }
  }

  const sortedDates = Array.from(dailyMap.keys()).sort()
  const dailyTrend: DailyTrendItem[] = sortedDates.map((date) => {
    const entry = dailyMap.get(date)!
    return {
      date,
      totalHours: entry.totalHours,
      subjects: Array.from(entry.subjects.values()),
    }
  })

  return {
    totalHours,
    checkedDays: dateSet.size,
    subjectBreakdown,
    dailyTrend,
  }
}

/* ── 平均每日时长 ──
   纯计算：按所选周期统计「日均时长」与「每日时长的中位数」。
   默认口径：总时长 ÷ 周期天数（含未打卡日）；可通过 denominatorDays 覆盖（如改按有打卡天数）。 */

export interface AvgDailyStats {
  /** 平均每日时长（小时） */
  avgDaily: number
  /** 每日时长中位数（小时） */
  medianDaily: number
  /** 实际使用的分母天数 */
  denominatorDays: number
  /** 有打卡记录的天数 */
  checkedDays: number
}

export interface AvgDailyOptions {
  /** 分母天数；不传则退化为「有打卡记录的天数」 */
  denominatorDays?: number
}

export function computeAvgDailyStats(
  filteredLogs: DailyLog[],
  options: AvgDailyOptions = {}
): AvgDailyStats {
  const { denominatorDays } = options

  // 按天汇总总时长
  const dailyHours = new Map<string, number>()
  for (const log of filteredLogs) {
    const dayTotal = log.subjects.reduce((sum, subj) => sum + subj.hours, 0)
    dailyHours.set(log.date, (dailyHours.get(log.date) ?? 0) + dayTotal)
  }
  const checkedDays = dailyHours.size
  const values = Array.from(dailyHours.values())

  const totalHours = values.reduce((sum, h) => sum + h, 0)
  const denominator = denominatorDays != null && denominatorDays > 0 ? denominatorDays : checkedDays
  const avgDaily = denominator > 0 ? totalHours / denominator : 0

  // 中位数（偶数个取中间两数均值）
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const medianDaily =
    sorted.length === 0
      ? 0
      : sorted.length % 2 === 1
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2

  return { avgDaily, medianDaily, denominatorDays: denominator, checkedDays }
}

/* ── 上周期切割 ──
   给定当前周期，向前推导出相邻的上一周期范围（week=上一整周，month=上一自然月，
   custom=相邻等长窗口）。纯计算、无副作用，便于单测。 */

export function getPreviousRange(range: SummaryRange): { startDate: string; endDate: string } {
  const { mode, startDate, endDate } = range
  if (mode === 'week') {
    const start = parseISO(startDate)
    const prevStart = addDays(start, -7)
    const prevEnd = addDays(start, -1)
    return { startDate: format(prevStart, 'yyyy-MM-dd'), endDate: format(prevEnd, 'yyyy-MM-dd') }
  }
  if (mode === 'month') {
    const start = parseISO(startDate)
    const prevStart = startOfMonth(addMonths(start, -1))
    const prevEnd = endOfMonth(prevStart)
    return { startDate: format(prevStart, 'yyyy-MM-dd'), endDate: format(prevEnd, 'yyyy-MM-dd') }
  }
  // custom：以当前周期为基准，向前取「等长」的相邻窗口（startDate-1 再往前推 duration-1 天）
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  const duration = differenceInCalendarDays(end, start) + 1
  const prevEnd = addDays(start, -1)
  const prevStart = addDays(prevEnd, -(duration - 1))
  return { startDate: format(prevStart, 'yyyy-MM-dd'), endDate: format(prevEnd, 'yyyy-MM-dd') }
}

/* ── 科目环比 ──
   上一周期 vs 当前周期的各科目时长对比。纯计算、无副作用。 */

export interface SubjectComparisonItem {
  subjectId: string
  name: string
  /** 本周期时长（小时） */
  currentHours: number
  /** 上周期时长（小时） */
  prevHours: number
  /** 差值（本周期 - 上周期，小时） */
  diff: number
  /** 涨跌幅（相对上周期，%） */
  diffPercent: number
}

export interface SubjectComparisonResult {
  items: SubjectComparisonItem[]
  /** 是否存在上周期数据（否则应展示空态说明） */
  hasPrevData: boolean
}

function collectSubjectHours(logs: DailyLog[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const log of logs) {
    for (const subj of log.subjects) {
      map.set(subj.id, (map.get(subj.id) ?? 0) + subj.hours)
    }
  }
  return map
}

export function computeSubjectComparison(
  currentLogs: DailyLog[],
  prevLogs: DailyLog[]
): SubjectComparisonResult {
  const currentMap = collectSubjectHours(currentLogs)
  const prevMap = collectSubjectHours(prevLogs)

  const allIds = new Set<string>([...currentMap.keys(), ...prevMap.keys()])
  const items: SubjectComparisonItem[] = []
  for (const subjectId of allIds) {
    const currentHours = currentMap.get(subjectId) ?? 0
    const prevHours = prevMap.get(subjectId) ?? 0
    const diff = Math.round((currentHours - prevHours) * 100) / 100
    const subject = getSubjectById(subjectId)
    const name = subject?.name ?? subjectId
    const diffPercent =
      prevHours > 0 ? ((currentHours - prevHours) / prevHours) * 100 : currentHours > 0 ? 100 : 0
    items.push({ subjectId, name, currentHours, prevHours, diff, diffPercent })
  }

  // 按本周期时长降序排列
  items.sort((a, b) => b.currentHours - a.currentHours)

  return { items, hasPrevData: prevLogs.length > 0 }
}

