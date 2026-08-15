import { supabase } from './supabase'

/** 英语长难句打卡表 english_checkin 的一条记录 */
export interface EnglishCheckin {
  id: string
  user_id: string
  /** 打卡天数（1-150，顺序打卡） */
  day: number
  completed_at: string
  created_at: string
}

/** 查询某用户全部已完成打卡的天数集合 */
export async function fetchMyCheckins(userId: string): Promise<EnglishCheckin[]> {
  const { data, error } = await supabase
    .from('english_checkin')
    .select('*')
    .eq('user_id', userId)
    .order('day', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data as EnglishCheckin[]) ?? []
}

/** 完成某一天的打卡（顺序打卡：day = 当前未完成的最小天数） */
export async function createCheckin(userId: string, day: number): Promise<EnglishCheckin> {
  const { data, error } = await supabase
    .from('english_checkin')
    .insert({ user_id: userId, day })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as EnglishCheckin
}

/** 取消某一天的打卡（用于撤销最近一次打卡） */
export async function deleteCheckin(userId: string, day: number): Promise<void> {
  const { error } = await supabase.from('english_checkin').delete().eq('user_id', userId).eq('day', day)

  if (error) {
    throw new Error(error.message)
  }
}