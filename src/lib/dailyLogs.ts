import { supabase } from './supabase'

export interface DailyLogSubject {
  id: string
  hours: number
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

/** 判断是否为同一天已有记录导致的唯一约束冲突 */
export function isDuplicateDateError(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code
  return code === '23505' || (err instanceof Error && /duplicate key|already exists/i.test(err.message))
}

export async function fetchAllLogs(): Promise<DailyLog[]> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .order('date', { ascending: false })

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

export async function fetchTodayLog(userId: string): Promise<DailyLog | null> {
  const today = todayStr()
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as DailyLog | null
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
