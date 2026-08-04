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
  const start = startOfWeek(refDate, { weekStartsOn: 0 })
  const end = endOfWeek(refDate, { weekStartsOn: 0 })
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

// #region TEST
declare const globalThis: { process?: { argv: string[] } }
const _process = (globalThis as { process?: { argv?: string[] } }).process
if (_process && _process.argv && _process.argv[1]?.includes('summary')) {
  const mockLogs: DailyLog[] = [
    {
      id: '1',
      user_id: 'u1',
      date: '2026-08-03',
      subjects: [
        { id: 'math', hours: 3, summary: '高数复习' },
        { id: 'english', hours: 2, summary: '阅读' },
      ],
      summary: '周一学习',
      created_at: '2026-08-03T00:00:00Z',
      updated_at: '2026-08-03T00:00:00Z',
    },
    {
      id: '2',
      user_id: 'u1',
      date: '2026-08-04',
      subjects: [
        { id: 'math', hours: 4, summary: '线代' },
        { id: 'ds', hours: 2, summary: '链表' },
      ],
      summary: '周二学习',
      created_at: '2026-08-04T00:00:00Z',
      updated_at: '2026-08-04T00:00:00Z',
    },
    {
      id: '3',
      user_id: 'u1',
      date: '2026-08-05',
      subjects: [
        { id: 'english', hours: 2.5, summary: '单词' },
        { id: 'ds', hours: 3, summary: '树' },
        { id: 'math', hours: 1.5 },
      ],
      summary: '周三学习',
      created_at: '2026-08-05T00:00:00Z',
      updated_at: '2026-08-05T00:00:00Z',
    },
    {
      id: '4',
      user_id: 'u1',
      date: '2026-08-05',
      subjects: [
        { id: 'os', hours: 2, summary: '进程' },
      ],
      summary: '周三晚加餐',
      created_at: '2026-08-05T12:00:00Z',
      updated_at: '2026-08-05T12:00:00Z',
    },
  ]

  const result = computeSummary(mockLogs)
  console.log('=== Summary Test ===')
  console.log('totalHours:', result.totalHours, '(期望: 20)')
  console.log('checkedDays:', result.checkedDays, '(期望: 3)')
  console.log('subjectBreakdown:')
  for (const s of result.subjectBreakdown) {
    console.log(`  ${s.name}: hours=${s.hours}, percentage=${s.percentage}%`)
  }
  const sumPct = result.subjectBreakdown.reduce((a, b) => a + b.percentage, 0)
  console.log('  percentage sum:', sumPct, '(期望: 100)')
  console.log('dailyTrend:')
  for (const d of result.dailyTrend) {
    console.log(`  ${d.date}: total=${d.totalHours}h, subjects=${d.subjects.map((s) => s.id + ':' + s.hours).join(', ')}`)
  }
  console.log('dailyTrend count:', result.dailyTrend.length, '(期望: 3)')

  const weekRange = getWeekRange(new Date('2026-08-05'))
  console.log('\n=== getWeekRange(2026-08-05) ===')
  console.log('startDate:', weekRange.startDate, '(期望: 2026-08-02 周日)')
  console.log('endDate:', weekRange.endDate, '(期望: 2026-08-08 周六)')

  const monthRange = getMonthRange(new Date('2026-08-05'))
  console.log('\n=== getMonthRange(2026-08-05) ===')
  console.log('startDate:', monthRange.startDate, '(期望: 2026-08-01)')
  console.log('endDate:', monthRange.endDate, '(期望: 2026-08-31)')

  const validRange = validateCustomRange('2026-08-05', '2026-08-01')
  console.log('\n=== validateCustomRange(倒置) ===')
  console.log('valid:', validRange.valid, '(期望: true)')
  console.log('startDate:', validRange.startDate, '(期望: 2026-08-01)')
  console.log('endDate:', validRange.endDate, '(期望: 2026-08-05)')

  const invalidRange = validateCustomRange('2026-01-01', '2027-12-31')
  console.log('\n=== validateCustomRange(超365天) ===')
  console.log('valid:', invalidRange.valid, '(期望: false)')
  console.log('error:', invalidRange.error, '(期望: 跨度不能超过 365 天)')

  const filtered = filterLogsByRange(mockLogs, '2026-08-03', '2026-08-04')
  console.log('\n=== filterLogsByRange(08-03 ~ 08-04) ===')
  console.log('filtered count:', filtered.length, '(期望: 2)')
}
// #endregion
