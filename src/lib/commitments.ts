import { endOfWeek, format, startOfWeek } from 'date-fns'
import { supabase } from './supabase'
import type { DailyLog } from './dailyLogs'

export interface Wallet {
  user_id: string
  balance: number
  updated_at: string
}

export type WalletTxType = 'recharge' | 'deposit' | 'refund' | 'forfeit'

export interface WalletTransaction {
  id: number
  user_id: string
  type: WalletTxType
  amount: number
  note: string | null
  created_at: string
}

export type CommitmentStatus = 'active' | 'won' | 'lost'

export interface WeeklyCommitment {
  id: string
  user_id: string
  week_start: string
  target_hours: number
  deposit_amount: number
  status: CommitmentStatus
  settled_at: string | null
  created_at: string
}

/** 周起点（周日），与统计页 getWeekRange 保持一致 */
export function getWeekStartStr(date: Date = new Date()): string {
  return format(startOfWeek(date, { weekStartsOn: 0 }), 'yyyy-MM-dd')
}

/** 周终点（周六） */
export function getWeekEndStr(date: Date = new Date()): string {
  return format(endOfWeek(date, { weekStartsOn: 0 }), 'yyyy-MM-dd')
}

export const TX_TYPE_META: Record<WalletTxType, { label: string; sign: '+' | '-' }> = {
  recharge: { label: '充值', sign: '+' },
  deposit: { label: '承诺押金', sign: '-' },
  refund: { label: '目标达成返还', sign: '+' },
  forfeit: { label: '目标未达成扣除', sign: '-' },
}

/** 获取钱包；首次访问自动创建 0 余额钱包 */
export async function fetchWallet(userId: string): Promise<Wallet> {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (data) return data as Wallet

  const { data: created, error: insertError } = await supabase
    .from('wallets')
    .insert({ user_id: userId, balance: 0 })
    .select()
    .single()
  if (insertError) throw new Error(insertError.message)
  return created as Wallet
}

/** 虚拟充值（金额 > 0），原子操作在数据库 RPC 中完成 */
export async function rechargeWallet(userId: string, amount: number, note = '虚拟充值'): Promise<void> {
  const { error } = await supabase.rpc('recharge_wallet', {
    p_user_id: userId,
    p_amount: amount,
    p_note: note,
  })
  if (error) throw new Error(error.message)
}

/** 创建/修改本周承诺（扣押金、校验余额均在数据库 RPC 中原子完成） */
export async function saveCommitment(
  userId: string,
  weekStart: string,
  targetHours: number,
  depositAmount: number
): Promise<void> {
  const { error } = await supabase.rpc('create_commitment', {
    p_user_id: userId,
    p_week_start: weekStart,
    p_target_hours: targetHours,
    p_deposit_amount: depositAmount,
  })
  if (error) throw new Error(error.message)
}

/** 结算已过期（上周及更早）的活跃承诺，在数据库 RPC 中按记录实际时长判定 */
export async function settleExpiredCommitments(userId: string): Promise<void> {
  const { error } = await supabase.rpc('settle_commitments', { p_user_id: userId })
  if (error) throw new Error(error.message)
}

/** 查询用户全部每周承诺（按周倒序） */
export async function fetchCommitments(userId: string): Promise<WeeklyCommitment[]> {
  const { data, error } = await supabase
    .from('weekly_commitments')
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
  if (error) throw new Error(error.message)
  return data as WeeklyCommitment[]
}

/** 查询资金流水（按时间倒序，最多 100 条） */
export async function fetchTransactions(userId: string): Promise<WalletTransaction[]> {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)
  return data as WalletTransaction[]
}

/** 计算某时间段内的实际学习时长（小时，保留 2 位小数） */
export function sumHoursInRange(logs: DailyLog[], startDate: string, endDate: string): number {
  let total = 0
  for (const log of logs) {
    if (log.date < startDate || log.date > endDate) continue
    for (const subj of log.subjects) {
      total += subj.hours
    }
  }
  return Math.round(total * 100) / 100
}

/** 金额显示：整数省略小数位 */
export function fmtMoney(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2)
}
