import type { User } from '@supabase/supabase-js'

/**
 * 政治「一页纸 / 解题手册」的访问白名单。
 *
 * 当前阶段只对作者本人开放：即使登录了，其他账号也看不到入口、直接访问路由也会被拦回首页。
 * 后续要开放给更多人时，只需在这里追加邮箱。
 */
export const POLITICS_ALLOWED_EMAILS = ['hs21by@gmail.com']

export function canAccessPolitics(user: User | null | undefined): boolean {
  const email = user?.email?.trim().toLowerCase()
  if (!email) return false
  return POLITICS_ALLOWED_EMAILS.includes(email)
}
