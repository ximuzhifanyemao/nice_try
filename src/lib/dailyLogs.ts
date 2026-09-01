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

/**
 * 单行查询 .single() 匹配到 0 行的服务端错误（PGRST116）。
 * 常见于登录态缺失/过期时：SELECT 策略是公开的仍能读到记录，
 * 但 UPDATE/INSERT 的 RLS（auth.uid() = user_id）会过滤掉该行 → 0 行 → 投递失败。
 * 此处把晦涩的英文报错转成可行动的提示，避免用户误以为数据丢失。
 */
const ACTION_EMPTY_MSG =
  '保存未生效：登录状态已失效或记录已被删除，请重新登录后再试（本次学习时长已保留，不会丢失）'

export function isActionEmptyRowError(err: unknown): boolean {
  const e = (err ?? {}) as { code?: string; message?: string }
  return (
    e?.code === 'PGRST116' ||
    (err instanceof Error && /cannot coerce the result to a single json object/i.test(err.message))
  )
}

/** 写入操作的错误归一：PGRST116（0 行）转成友好提示，其余原样抛出 */
function throwActionError(err: unknown): never {
  if (isActionEmptyRowError(err)) {
    throw new Error(ACTION_EMPTY_MSG)
  }
  const message = ((err ?? {}) as { message?: string }).message
  throw new Error(message ?? '未知错误')
}

/** 合并科目时长：仅当 (科目, 学习内容, 时间段) 完全一致时合并相加，避免把多次独立学习会话压成「最早~最晚」 */
export function mergeSubjects(base: DailyLogSubject[], incoming: DailyLogSubject[]): DailyLogSubject[] {
  const merged = [...base]
  for (const entry of incoming) {
    const idx = merged.findIndex(
      (s) =>
        s.id === entry.id &&
        (s.activity ?? '') === (entry.activity ?? '') &&
        (s.startTime ?? '') === (entry.startTime ?? '') &&
        (s.endTime ?? '') === (entry.endTime ?? '')
    )
    if (idx >= 0) {
      const existing = merged[idx]
      merged[idx] = {
        ...existing,
        hours: Math.round((existing.hours + entry.hours) * 100) / 100,
      }
    } else {
      merged.push(entry)
    }
  }
  return merged
}

/** 记录/动态展示排序：按开始时间升序（无时间段的条目排最后，稳定排序） */
export function sortSubjectsByStartTime(subjects: DailyLogSubject[]): DailyLogSubject[] {
  return [...subjects].sort((a, b) => {
    const aTime = a.startTime ?? ''
    const bTime = b.startTime ?? ''
    if (aTime && bTime) return aTime < bTime ? -1 : aTime > bTime ? 1 : 0
    if (aTime) return -1
    if (bTime) return 1
    return 0
  })
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

export interface PaginatedResult {
  data: DailyLog[]
  total: number
}

/** 分页查询用户的学习记录，附带总数（用于记录页的「加载更多」） */
export async function fetchMyLogsPaginated(
  userId: string,
  page: number,
  pageSize: number = 20,
): Promise<PaginatedResult> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('daily_logs')
    .select('*', { count: 'exact', head: false })
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('date', { ascending: false })
    .range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return { data: data as DailyLog[], total: count ?? 0 }
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
    throwActionError(error)
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
    throwActionError(error)
  }

  return data as DailyLog
}

/* ── 并发安全的「读→合并→写」写入 ──
   计时器（精简挂件/全功能计时页）会把本次会话合并进某日的整条记录后整体写回，
   若此刻其他端也修改了同一日记录，直接写会把对方的改动覆盖。这里借助
   daily_logs.updated_at 触发器做版本校验：写入前发现版本已变，自动重读重合并重试一次，
   最大程度避免并发互相覆盖（不改变原有合并语义，无冲突时与旧行为完全一致）。 */

/** 版本冲突哨兵：目标记录在「读取 → 写入」之间被其他端修改 */
class LogVersionConflictError extends Error {
  constructor(message = '记录已被其他端修改') {
    super(message)
    this.name = 'LogVersionConflictError'
  }
}

function isLogVersionConflict(err: unknown): boolean {
  return err instanceof LogVersionConflictError
}

/** 带版本校验的更新：仅当 updated_at 与读取时一致才写入；不一致（0 行命中）抛版本冲突 */
async function updateLogVersioned(
  logId: string,
  logData: DailyLogInput,
  expectedUpdatedAt: string | null,
): Promise<DailyLog> {
  let query = supabase.from('daily_logs').update({
    date: logData.date,
    subjects: logData.subjects,
    summary: logData.summary,
  })
  if (expectedUpdatedAt) {
    // 只有历史非常旧、没有 updated_at 值的行才跳过版本校验
    query = query.eq('updated_at', expectedUpdatedAt)
  }
  const { data, error } = await query.eq('id', logId).select().single()

  if (error) {
    // PGRST116（匹配 0 行）：行版本已变或记录已被删除 → 交给调用方按冲突重试
    if (isActionEmptyRowError(error)) {
      throw new LogVersionConflictError()
    }
    throwActionError(error)
  }
  return data as DailyLog
}

/**
 * 安全合并写入某日记录（计时器「今日累计→云端」共用）：
 * - 已有记录：合并保存已有 summary，带版本校验写入；冲突时自动重读重合并重试一次
 * - 无记录：直接创建；期间被别端抢先创建（日期唯一冲突）时自动转合并重试一次
 */
export async function upsertLogSafely(input: {
  userId: string
  date: string
  subjects: DailyLogSubject[]
  summary: string
}): Promise<DailyLog> {
  const { userId, date, subjects, summary } = input
  for (let attempt = 0; attempt < 2; attempt++) {
    const existing = await fetchLogByDate(userId, date)
    if (existing) {
      try {
        return await updateLogVersioned(
          existing.id,
          { date, subjects: mergeSubjects(existing.subjects, subjects), summary: existing.summary },
          existing.updated_at,
        )
      } catch (err) {
        // 并发冲突：重读最新行后再合并一次（仅重试一次，仍失败则抛给用户明确报错）
        if (isLogVersionConflict(err) && attempt === 0) continue
        throw err
      }
    } else {
      try {
        return await createLog(userId, { date, subjects, summary })
      } catch (err) {
        // 期间被别端抢先建行：转下一次循环按「已有记录」合并
        if (isDuplicateDateError(err) && attempt === 0) continue
        throw err
      }
    }
  }
  throw new Error('数据同步冲突，请重试')
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
