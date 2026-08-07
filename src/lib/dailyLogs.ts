import { supabase } from './supabase'

export interface DailyLogSubject {
  id: string
  hours: number
  activity?: string
  summary?: string
  // 学习时间段（HH:mm，零填充如 "14:05"），仅由计时器记录
  startTime?: string
  endTime?: string
}

export interface DailyLog {
  id: string
  user_id: string
  date: string
  subjects: DailyLogSubject[]
  summary: string
  created_at: string
  updated_at: string
  /** 软删除标记：NULL=正常记录，非 NULL=在回收站 */
  deleted_at: string | null
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
      const existing = merged[idx]
      const mergedEntry: DailyLogSubject = {
        ...existing,
        hours: Math.round((existing.hours + entry.hours) * 100) / 100,
      }
      // 合并学习时间段：双方都有时取更早的开始时间、更晚的结束时间；仅一方有时保留该值；都没有时不包含时间字段
      if (existing.startTime || entry.startTime) {
        mergedEntry.startTime =
          existing.startTime && entry.startTime
            ? (existing.startTime <= entry.startTime ? existing.startTime : entry.startTime)
            : (existing.startTime ?? entry.startTime)
      }
      if (existing.endTime || entry.endTime) {
        mergedEntry.endTime =
          existing.endTime && entry.endTime
            ? (existing.endTime >= entry.endTime ? existing.endTime : entry.endTime)
            : (existing.endTime ?? entry.endTime)
      }
      merged[idx] = mergedEntry
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
    .is('deleted_at', null)
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
    .is('deleted_at', null)
    .order('date', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data as DailyLog[]
}

/** 按 id 查询单条记录（用于编辑页，避免拉取全部日志；回收站中的记录视为不存在） */
export async function fetchLogById(logId: string): Promise<DailyLog | null> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('id', logId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as DailyLog | null
}

/** 按日期查询某用户的记录（用于计时器按归属日期保存/补交；回收站中的记录视为不存在） */
export async function fetchLogByDate(userId: string, date: string): Promise<DailyLog | null> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .is('deleted_at', null)
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
    .is('deleted_at', null)
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

/** 软删除（移入回收站）：设置 deleted_at 标记，不真正删除数据 */
export async function deleteLog(logId: string): Promise<void> {
  const { error } = await supabase
    .from('daily_logs')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', logId)

  if (error) {
    throw new Error(error.message)
  }
}

/** 回收站：查询某用户已删除（软删除）的记录，按删除时间倒序 */
export async function fetchTrashedLogs(userId: string): Promise<DailyLog[]> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data as DailyLog[]
}

/** 从回收站恢复：清除 deleted_at 标记（若该日期已有记录，会触发唯一索引冲突） */
export async function restoreLog(logId: string): Promise<void> {
  const { error } = await supabase
    .from('daily_logs')
    .update({ deleted_at: null })
    .eq('id', logId)

  if (error) {
    throw new Error(error.message)
  }
}

/** 彻底删除（不可恢复）：物理删除数据 */
export async function purgeLog(logId: string): Promise<void> {
  const { error } = await supabase
    .from('daily_logs')
    .delete()
    .eq('id', logId)

  if (error) {
    throw new Error(error.message)
  }
}
