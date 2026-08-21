import { supabase } from './supabase'

export interface UserSettings {
  user_id: string
  /** 倒计时标题（显示在倒计时数字上方） */
  countdown_title: string
  /** 目标日期（yyyy-mm-dd），为空则不显示倒计时目标日期 */
  target_date: string | null
  updated_at?: string
}

/** 默认倒计时标题 */
export const DEFAULT_COUNTDOWN_TITLE = '距离目标还有'

/** 读取用户设置（不存在时返回默认值） */
export async function fetchUserSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (data) {
    return data as UserSettings
  }
  return {
    user_id: userId,
    countdown_title: DEFAULT_COUNTDOWN_TITLE,
    target_date: null,
  }
}

/** 保存用户设置（upsert，每用户一条） */
export async function saveUserSettings(
  userId: string,
  input: Pick<UserSettings, 'countdown_title' | 'target_date'>,
): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: userId,
        countdown_title: input.countdown_title.trim() || DEFAULT_COUNTDOWN_TITLE,
        target_date: input.target_date || null,
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as UserSettings
}