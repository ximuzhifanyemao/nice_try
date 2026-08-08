import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, differenceInCalendarDays } from 'date-fns'
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

