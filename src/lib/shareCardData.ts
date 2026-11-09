import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { todayStr, type DailyLog } from './dailyLogs'
import { formatActivityLabel, formatSubjectLabel, getSubjectById } from './subjects'
import {
  mergeShareSubjects,
  subjectCategoryColor,
  type ShareCalendarCardData,
  type ShareCalendarDay,
  type ShareCardData,
  type ShareCardSubject,
  type ShareMode,
  type ShareTimelineBlock,
  type ShareTimelineCardData,
} from './shareCard'

/**
 * 分享数据构建：把学习记录按「日 / 周 / 月」聚合，
 * 输出三种分享卡（总计 / 逐日日历 / 单日时间轴）所需的纯数据。
 * 所有函数无副作用，便于在弹窗里即时预览与生成。
 */

export interface ShareRangeInfo {
  mode: ShareMode
  startDate: string
  endDate: string
  dateLabel: string
  title: string
  totalLabel: string
  distributionLabel: string
  secondaryLabel: string
}

const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function weekdayCn(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  return WEEKDAY_CN[d.getDay()] ?? ''
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function isSameDay(a: string, b: string): boolean {
  return a === b
}

function currentWeekStart(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

function currentMonthKey(): string {
  return format(new Date(), 'yyyy-MM')
}

/** 解析当天范围内有效的学习记录（排除回收站） */
function activeLogsInRange(logs: DailyLog[], startDate: string, endDate: string): DailyLog[] {
  return logs.filter(
    (log) => !log.deleted_at && log.date >= startDate && log.date <= endDate,
  )
}

/** 科目聚合：按 id 累加，输出按时长降序的分享行 */
function aggregateSubjects(logs: DailyLog[]): ShareCardSubject[] {
  const totals = new Map<string, number>()
  for (const log of logs) {
    for (const s of log.subjects ?? []) {
      if (!(s.hours > 0)) continue
      totals.set(s.id, (totals.get(s.id) ?? 0) + s.hours)
    }
  }
  return [...totals.entries()]
    .map(([id, hours]) => {
      const subject = getSubjectById(id)
      return {
        name: formatSubjectLabel(subject),
        hours: round1(hours),
        color: subjectCategoryColor(subject?.category),
      }
    })
    .sort((a, b) => b.hours - a.hours)
}

/** 每天的学习时长（小时），只统计 > 0 的科目 */
function dailyHoursMap(logs: DailyLog[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const log of logs) {
    const hours = (log.subjects ?? []).reduce(
      (sum, s) => sum + (s.hours > 0 ? s.hours : 0),
      0,
    )
    if (hours > 0) map.set(log.date, (map.get(log.date) ?? 0) + hours)
  }
  return map
}

/** 日 / 周 / 月的范围、标题与指标文案 */
export function resolveShareRange(mode: ShareMode, anchorDate: string): ShareRangeInfo {
  const anchor = parseISO(anchorDate)

  if (mode === 'day') {
    const isToday = isSameDay(anchorDate, todayStr())
    return {
      mode,
      startDate: anchorDate,
      endDate: anchorDate,
      dateLabel: `${format(anchor, 'yyyy年M月d日')} ${weekdayCn(anchorDate)}`,
      title: isToday ? '今日学习记录' : '单日学习记录',
      totalLabel: '当日总时长（h）',
      distributionLabel: '今日投入分布',
      secondaryLabel: '学习科目（个）',
    }
  }

  if (mode === 'week') {
    const start = startOfWeek(anchor, { weekStartsOn: 1 })
    const end = addDays(start, 6)
    const startDate = format(start, 'yyyy-MM-dd')
    const endDate = format(end, 'yyyy-MM-dd')
    return {
      mode,
      startDate,
      endDate,
      dateLabel: `${format(start, 'M月d日')} ~ ${format(end, 'M月d日')}`,
      title: startDate === currentWeekStart() ? '本周学习总结' : '周学习总结',
      totalLabel: '本周总时长（h）',
      distributionLabel: '本周投入分布',
      secondaryLabel: '打卡天数（天）',
    }
  }

  const start = startOfMonth(anchor)
  const end = endOfMonth(anchor)
  const startDate = format(start, 'yyyy-MM-dd')
  const endDate = format(end, 'yyyy-MM-dd')
  return {
    mode,
    startDate,
    endDate,
    dateLabel: format(start, 'yyyy年M月'),
    title: format(start, 'yyyy-MM') === currentMonthKey() ? '本月学习总结' : '月度学习总结',
    totalLabel: '本月总时长（h）',
    distributionLabel: '本月投入分布',
    secondaryLabel: '打卡天数（天）',
  }
}

/** 总计分享卡：总时长 + 科目分布 */
export function buildSummaryPayload(
  logs: DailyLog[],
  mode: ShareMode,
  anchorDate: string,
): ShareCardData {
  const range = resolveShareRange(mode, anchorDate)
  const inRange = activeLogsInRange(logs, range.startDate, range.endDate)
  const subjects = aggregateSubjects(inRange)

  let totalHours = 0
  const checkedDates = new Set<string>()
  for (const log of inRange) {
    const dayHours = (log.subjects ?? []).reduce(
      (sum, s) => sum + (s.hours > 0 ? s.hours : 0),
      0,
    )
    if (dayHours > 0) checkedDates.add(log.date)
    totalHours += dayHours
  }

  return {
    title: range.title,
    dateLabel: range.dateLabel,
    totalHours: round1(totalHours),
    checkedDays: checkedDates.size,
    subjects: mergeShareSubjects(subjects),
    totalLabel: range.totalLabel,
    secondaryValue: mode === 'day' ? subjects.length : checkedDates.size,
    secondaryLabel: range.secondaryLabel,
    distributionLabel: range.distributionLabel,
  }
}

/** 逐日日历分享卡：周 / 月，只展示每天学了多久 */
export function buildCalendarPayload(
  logs: DailyLog[],
  mode: 'week' | 'month',
  anchorDate: string,
): ShareCalendarCardData {
  const range = resolveShareRange(mode, anchorDate)
  const inRange = activeLogsInRange(logs, range.startDate, range.endDate)
  const hoursByDate = dailyHoursMap(inRange)

  const anchor = parseISO(anchorDate)
  const gridStart =
    mode === 'week'
      ? startOfWeek(anchor, { weekStartsOn: 1 })
      : startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 })
  const gridEnd =
    mode === 'week'
      ? addDays(startOfWeek(anchor, { weekStartsOn: 1 }), 6)
      : endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 })

  const today = todayStr()
  const days: ShareCalendarDay[] = eachDayOfInterval({ start: gridStart, end: gridEnd }).map(
    (d) => {
      const date = format(d, 'yyyy-MM-dd')
      const hours = hoursByDate.get(date) ?? 0
      return {
        date,
        hours: round1(hours),
        isToday: date === today,
        isFuture: date > today,
        isOutside: date < range.startDate || date > range.endDate,
      }
    },
  )

  const checkedDays = days.filter((d) => !d.isOutside && d.hours > 0).length
  const totalHours = days
    .filter((d) => !d.isOutside)
    .reduce((sum, d) => sum + d.hours, 0)

  const isCurrentWeek = range.startDate === currentWeekStart()
  const isCurrentMonth = format(anchor, 'yyyy-MM') === currentMonthKey()
  const title =
    mode === 'week'
      ? isCurrentWeek
        ? '本周学习日历'
        : '周学习日历'
      : isCurrentMonth
        ? '本月学习日历'
        : '月度学习日历'

  return {
    kind: 'calendar',
    title,
    dateLabel: range.dateLabel,
    totalHours: round1(totalHours),
    checkedDays,
    days,
    rangeMode: mode,
  }
}

/** 把 HH:mm 转成分钟数；非法返回 null */
function parseMinutes(t?: string): number | null {
  if (!t) return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(t)
  if (!m) return null
  const hour = Number(m[1])
  const minute = Number(m[2])
  if (hour > 23 || minute > 59) return null
  return hour * 60 + minute
}

/** 单日时间轴分享卡：按开始时间排序，无时间段的条目排在最后 */
export function buildTimelinePayload(
  logs: DailyLog[],
  date: string,
): ShareTimelineCardData {
  const inRange = activeLogsInRange(logs, date, date)
  const timed: { block: ShareTimelineBlock; minutes: number }[] = []
  const untimed: ShareTimelineBlock[] = []
  let totalHours = 0

  for (const log of inRange) {
    for (const s of log.subjects ?? []) {
      if (!(s.hours > 0)) continue
      totalHours += s.hours
      const subject = getSubjectById(s.id)
      const startMinutes = parseMinutes(s.startTime)
      const endMinutes = parseMinutes(s.endTime)
      const block: ShareTimelineBlock = {
        start: startMinutes !== null ? s.startTime : undefined,
        end: endMinutes !== null ? s.endTime : undefined,
        subjectName: formatSubjectLabel(subject),
        activity: formatActivityLabel(s.activity) || undefined,
        hours: round2(s.hours),
        color: subjectCategoryColor(subject?.category),
      }
      if (startMinutes !== null && endMinutes !== null) {
        timed.push({ block, minutes: startMinutes })
      } else {
        untimed.push(block)
      }
    }
  }

  timed.sort((a, b) => a.minutes - b.minutes)
  const range = resolveShareRange('day', date)

  return {
    kind: 'timeline',
    title: isSameDay(date, todayStr()) ? '今日学习时间轴' : '单日学习时间轴',
    dateLabel: range.dateLabel,
    totalHours: round1(totalHours),
    blocks: [...timed.map((t) => t.block), ...untimed],
  }
}
