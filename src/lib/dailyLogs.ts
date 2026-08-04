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
  subjects: DailyLogSubject[]
  summary: string
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
  const today = new Date().toISOString().slice(0, 10)
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
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('daily_logs')
    .insert({
      user_id: userId,
      date: today,
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
