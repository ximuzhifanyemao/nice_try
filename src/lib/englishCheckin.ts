import { supabase } from './supabase'

/**
 * 英语长难句打卡总天数。
 *
 * 与 `src/data/englishDaily.json` 的条目数保持一致（当前 150 天）。
 * 语料扩充时**只需改这一处**——此前 150 这个数字散落在首页文案、进度条分母、
 * 打卡页等多处，改漏就会出现分母不对或进度条超过 100% 的问题。
 */
export const ENGLISH_TOTAL_DAYS = 150

/** 英语长难句打卡表 english_checkin 的一条记录 */
export interface EnglishCheckin {
  id: string
  user_id: string
  /** 打卡天数（1 - ENGLISH_TOTAL_DAYS，顺序打卡） */
  day: number
  completed_at: string
  created_at: string
}

const COLUMNS = 'id, user_id, day, completed_at, created_at'

/** 查询某用户全部已完成打卡的天数集合 */
export async function fetchMyCheckins(userId: string): Promise<EnglishCheckin[]> {
  const { data, error } = await supabase
    .from('english_checkin')
    .select(COLUMNS)
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
    .select(COLUMNS)
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
