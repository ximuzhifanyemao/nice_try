import { supabase } from './supabase'

/**
 * 一键导出全部个人数据（学习记录 / 健康 / 生词本 / 设置 / 打卡）。
 * 输出 JSON（含时间戳），每个表单独容错：个别表失败不影响整体导出。
 */

/** 按表名抓取某个用户在该表的全部行（自动添加 user_id 过滤） */
async function fetchAllFrom(userId: string, table: string, select: string, orderBy?: string) {
  let query = supabase.from(table).select(select).eq('user_id', userId)
  if (orderBy) query = query.order(orderBy, { ascending: true })
  const { data, error } = await query
  if (error) throw new Error(`${table}: ${error.message}`)
  return data ?? []
}

export interface ExportPayload {
  exported_at: string
  app: string
  data: Record<string, unknown>
}

/** 导出全部数据（返回可用于下载的 JSON 文本） */
export async function exportAllData(userId: string): Promise<string> {
  const tables: { key: string; table: string; select?: string; orderBy?: string }[] = [
    { key: 'daily_logs', table: 'daily_logs', orderBy: 'date' },
    { key: 'english_checkin', table: 'english_checkin', orderBy: 'day' },
    { key: 'weekly_commitments', table: 'weekly_commitments', orderBy: 'week_start' },
    { key: 'wallet_transactions', table: 'wallet_transactions', orderBy: 'created_at' },
    { key: 'body_metrics', table: 'body_metrics', orderBy: 'date' },
    { key: 'health_profiles', table: 'health_profiles' },
    { key: 'water_intake', table: 'water_intake', orderBy: 'date' },
    { key: 'meal_logs', table: 'meal_logs', select: '*, meal_items(*)', orderBy: 'date' },
    { key: 'favorites', table: 'favorites' },
    { key: 'custom_presets', table: 'custom_presets' },
    { key: 'user_settings', table: 'user_settings' },
    { key: 'qr_login_sessions', table: 'qr_login_sessions', orderBy: 'created_at' },
  ]

  const data: Record<string, unknown> = {}
  const errors: string[] = []
  await Promise.all(
    tables.map(async (t) => {
      try {
        data[t.key] = await fetchAllFrom(userId, t.table, t.select ?? '*', t.orderBy)
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err))
      }
    }),
  )

  const payload: ExportPayload = {
    exported_at: new Date().toISOString(),
    app: 'DiveDeep',
    data,
  }
  if (errors.length > 0) payload.data.errors = errors

  return JSON.stringify(payload, null, 2)
}

/** 触发浏览器下载一个文本文件 */
export function downloadTextFile(filename: string, content: string, mime = 'application/json') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}