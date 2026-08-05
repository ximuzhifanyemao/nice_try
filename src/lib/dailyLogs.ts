import { supabase } from './supabase'

export interface DailyLogSubject {
  id: string
  hours: number
  activity?: string
  summary?: string
}

export interface DailyLog {
  id: string
  user_id: string
  date: string
  subjects: DailyLogSubject[]
  summary: string
  created_at: string
  updated_at: string
}

export interface DailyLogInput {
  date: string
  subjects: DailyLogSubject[]
  summary: string
}

/** 获取本地时区的今日日期（yyyy-MM-dd），避免 toISOString 的 UTC 偏差 */
export function todayStr(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 获取本地时区的昨日日期（yyyy-MM-dd） */
export function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 判断是否为同一天已有记录导致的唯一约束冲突 */
export function isDuplicateDateError(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code
  return code === '23505' || (err instanceof Error && /duplicate key|already exists/i.test(err.message))
}

/** 合并科目时长：按 (id, activity) 匹配相加，保留 2 位小数避免浮点误差 */
export function mergeSubjects(base: DailyLogSubject[], incoming: DailyLogSubject[]): DailyLogSubject[] {
  const merged = [...base]
  for (const entry of incoming) {
    const idx = merged.findIndex(
      (s) => s.id === entry.id && (s.activity ?? '') === (entry.activity ?? '')
    )
    if (idx >= 0) {
      merged[idx] = {
        ...merged[idx],
        hours: Math.round((merged[idx].hours + entry.hours) * 100) / 100,
      }
    } else {
      merged.push(entry)
    }
  }
  return merged
}

/** 公开时间线：最近 N 条记录（防止全表拉取导致首屏膨胀） */
const PUBLIC_TIMELINE_LIMIT = 50

export async function fetchAllLogs(): Promise<DailyLog[]> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .order('date', { ascending: false })
    .limit(PUBLIC_TIMELINE_LIMIT)

  if (error) {
    throw new Error(error.message)
  }

  return data as DailyLog[]
}

export async function fetchMyLogs(userId: string): Promise<DailyLog[]> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data as DailyLog[]
}

/** 按 id 查询单条记录（用于编辑页，避免拉取全部日志） */
export async function fetchLogById(logId: string): Promise<DailyLog | null> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('id', logId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as DailyLog | null
}

/** 按日期查询某用户的记录（用于计时器按归属日期保存/补交） */
export async function fetchLogByDate(userId: string, date: string): Promise<DailyLog | null> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as DailyLog | null
}

export async function fetchTodayLog(userId: string): Promise<DailyLog | null> {
  return fetchLogByDate(userId, todayStr())
}

/** 查询指定日期之前最近的一条记录（用于打卡门槛：前一天总结未写则拦截） */
export async function fetchLogBeforeDate(userId: string, date: string): Promise<DailyLog | null> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .lt('date', date)
    .order('date', { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(error.message)
  }

  return (data?.[0] as DailyLog | undefined) ?? null
}

export async function createLog(userId: string, logData: DailyLogInput): Promise<DailyLog> {
  const { data, error } = await supabase
    .from('daily_logs')
    .insert({
      user_id: userId,
      date: logData.date,
      subjects: logData.subjects,
      summary: logData.summary,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as DailyLog
}

export async function updateLog(logId: string, logData: DailyLogInput): Promise<DailyLog> {
  const { data, error } = await supabase
    .from('daily_logs')
    .update({
      date: logData.date,
      subjects: logData.subjects,
      summary: logData.summary,
    })
    .eq('id', logId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as DailyLog
}

export async function deleteLog(logId: string): Promise<void> {
  const { error } = await supabase
    .from('daily_logs')
    .delete()
    .eq('id', logId)

  if (error) {
    throw new Error(error.message)
  }
}
