import { addDays, endOfWeek, format, parseISO } from 'date-fns'
import { supabase } from './supabase'
import type { DailyLog } from './dailyLogs'
import { computeSummary } from './summary'
import { getSubjectById } from './subjects'

/** 每周总结反思 `weekly_reflections` 表的一条记录 */
export interface WeeklyReflection {
  id: string
  user_id: string
  /** 周起点（周一），yyyy-MM-dd，与 getWeekStartStr 口径一致 */
  week_start: string
  content: string
  created_at: string
  updated_at: string
}

/** 读取某周的反思笔记；无记录返回 null */
export async function fetchReflection(userId: string, weekStart: string): Promise<WeeklyReflection | null> {
  const { data, error } = await supabase
    .from('weekly_reflections')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as WeeklyReflection | null
}

/** 创建或更新某周的反思笔记（按 (user_id, week_start) 唯一，幂等 upsert） */
export async function upsertReflection(userId: string, weekStart: string, content: string): Promise<WeeklyReflection> {
  const { data, error } = await supabase
    .from('weekly_reflections')
    .upsert(
      { user_id: userId, week_start: weekStart, content, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,week_start' },
    )
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as WeeklyReflection
}

/** 有反思笔记的周起点列表（按周起点倒序），用于历史周次下拉 */
export async function fetchReflectionWeekStarts(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('weekly_reflections')
    .select('week_start')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
  if (error) throw new Error(error.message)
  return ((data ?? []) as { week_start: string }[]).map((r) => r.week_start)
}

export interface WeekStat {
  weekStart: string
  /** 总学习时长（小时） */
  totalHours: number
  /** 打卡天数（有学习记录的天数） */
  checkedDays: number
  /** 日均时长（totalHours / 7） */
  avgDaily: number
  /** 各科目时长：subjectId -> 小时 */
  subjectHours: Record<string, number>
  /** 每日时长：yyyy-MM-dd -> 小时（仅含有记录的天） */
  dailyHours: Record<string, number>
}

export interface SubjectDiff {
  subjectId: string
  name: string
  thisWeekHours: number
  lastWeekHours: number
  /** 本周 - 上周 */
  diff: number
  improved: boolean
}

/** 逐日对比：本周某天（星期对齐）与上周同一天的时长差异 */
export interface DayDiff {
  /** 0 = 周一 … 6 = 周日 */
  dayIndex: number
  thisDate: string
  lastDate: string
  thisHours: number
  lastHours: number
  /** 本周 - 上周 */
  diff: number
}

export interface WeeklyComparison {
  thisWeek: WeekStat
  lastWeek: WeekStat
  totalHoursDiff: number
  checkedDaysDiff: number
  avgDailyDiff: number
  /** 按本周时长降序 */
  subjectDiffs: SubjectDiff[]
  /** 周一~周日的逐日对比（长度 7） */
  dailyDiffs: DayDiff[]
}

/** 计算某一周（周一起点）的统计，跳过回收站记录 */
export function computeWeekStat(logs: DailyLog[], weekStart: string): WeekStat {
  const weekEnd = format(endOfWeek(parseISO(weekStart), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const active = logs.filter((l) => l.date >= weekStart && l.date <= weekEnd && !l.deleted_at)
  const summary = computeSummary(active)

  const subjectHours: Record<string, number> = {}
  for (const s of summary.subjectBreakdown) {
    subjectHours[s.subjectId] = s.hours
  }

  // 每日时长聚合（与 computeSummary 口径一致：累加各科目的有效时长）
  const dailyHours: Record<string, number> = {}
  for (const l of active) {
    let dayTotal = 0
    for (const subj of l.subjects ?? []) {
      const hours = subj.hours ?? 0
      if (hours > 0) dayTotal += hours
    }
    if (dayTotal > 0) dailyHours[l.date] = (dailyHours[l.date] ?? 0) + dayTotal
  }

  return {
    weekStart,
    totalHours: summary.totalHours,
    checkedDays: summary.checkedDays,
    avgDaily: summary.totalHours / 7,
    subjectHours,
    dailyHours,
  }
}

/** 本周 vs 上周（上周 = 本周起点往前推 7 天）的完整对比 */
export function computeWeeklyComparison(logs: DailyLog[], currentWeekStart: string): WeeklyComparison {
  const lastWeekStart = format(addDays(new Date(currentWeekStart + 'T00:00:00'), -7), 'yyyy-MM-dd')

  const thisWeek = computeWeekStat(logs, currentWeekStart)
  const lastWeek = computeWeekStat(logs, lastWeekStart)

  const allIds = new Set([...Object.keys(thisWeek.subjectHours), ...Object.keys(lastWeek.subjectHours)])
  const subjectDiffs: SubjectDiff[] = [...allIds]
    .map((id) => {
      const t = thisWeek.subjectHours[id] ?? 0
      const p = lastWeek.subjectHours[id] ?? 0
      const diff = Math.round((t - p) * 100) / 100
      return {
        subjectId: id,
        name: getSubjectById(id)?.name ?? '已删除科目',
        thisWeekHours: t,
        lastWeekHours: p,
        diff,
        improved: t >= p,
      }
    })
    .sort((a, b) => b.thisWeekHours - a.thisWeekHours)

  // 逐日对比：按星期对齐（周一对周一），日期各自从周起点偏移
  const base = new Date(currentWeekStart + 'T00:00:00')
  const lastBase = new Date(lastWeekStart + 'T00:00:00')
  const dailyDiffs: DayDiff[] = Array.from({ length: 7 }, (_, i) => {
    const thisDate = format(addDays(base, i), 'yyyy-MM-dd')
    const lastDate = format(addDays(lastBase, i), 'yyyy-MM-dd')
    const thisHours = thisWeek.dailyHours[thisDate] ?? 0
    const lastHours = lastWeek.dailyHours[lastDate] ?? 0
    return {
      dayIndex: i,
      thisDate,
      lastDate,
      thisHours,
      lastHours,
      diff: Math.round((thisHours - lastHours) * 100) / 100,
    }
  })

  return {
    thisWeek,
    lastWeek,
    totalHoursDiff: Math.round((thisWeek.totalHours - lastWeek.totalHours) * 100) / 100,
    checkedDaysDiff: thisWeek.checkedDays - lastWeek.checkedDays,
    avgDailyDiff: Math.round((thisWeek.avgDaily - lastWeek.avgDaily) * 100) / 100,
    subjectDiffs,
    dailyDiffs,
  }
}