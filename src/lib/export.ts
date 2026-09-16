import { supabase } from './supabase'

/**
 * 一键导出全部个人数据（学习记录 / 健康 / 生词本 / 待办 / 科目 / 设置 …）。
 * 输出 JSON（含时间戳与 schema 版本），每个表单独容错：个别表失败不影响整体导出。
 *
 * ⚠️ 维护约定：**新增任何持久化表时，必须同步加进下面的 TABLES 清单**，
 * 否则用户导出的备份会静默缺失这部分数据（历史上生词本、待办、自定义科目都漏过）。
 */

/** 当前导出结构版本，供未来导入功能做兼容判断 */
export const EXPORT_SCHEMA_VERSION = 2

interface ExportTable {
  /** 导出 JSON 里的字段名 */
  key: string
  /** 数据库表名 */
  table: string
  /** 列清单，默认 * */
  select?: string
  /** 排序列（便于人读） */
  orderBy?: string
}

const TABLES: ExportTable[] = [
  // ── 学习 ──
  { key: 'daily_logs', table: 'daily_logs', orderBy: 'date' },
  { key: 'english_checkin', table: 'english_checkin', orderBy: 'day' },
  { key: 'user_vocab', table: 'user_vocab', orderBy: 'day' },
  { key: 'todos', table: 'todos', orderBy: 'created_at' },
  { key: 'calendar_events', table: 'calendar_events' },
  { key: 'weekly_reflections', table: 'weekly_reflections', orderBy: 'week_start' },
  { key: 'weekly_commitments', table: 'weekly_commitments', orderBy: 'week_start' },
  { key: 'wallets', table: 'wallets' },
  { key: 'wallet_transactions', table: 'wallet_transactions', orderBy: 'created_at' },
  // ── 科目配置 ──
  { key: 'user_subjects', table: 'user_subjects' },
  { key: 'removed_subjects', table: 'removed_subjects' },
  // ── 健康 ──
  { key: 'body_metrics', table: 'body_metrics', orderBy: 'date' },
  { key: 'health_profiles', table: 'health_profiles' },
  { key: 'water_intake', table: 'water_intake', orderBy: 'date' },
  { key: 'meal_logs', table: 'meal_logs', select: '*, meal_items(*)', orderBy: 'date' },
  { key: 'favorites', table: 'favorites' },
  { key: 'custom_presets', table: 'custom_presets' },
  // ── 设置 ──
  { key: 'user_settings', table: 'user_settings' },
]

/** 按表名抓取某个用户在该表的全部行（自动添加 user_id 过滤） */
async function fetchAllFrom(userId: string, table: string, select: string, orderBy?: string) {
  let query = supabase.from(table).select(select).eq('user_id', userId)
  if (orderBy) query = query.order(orderBy, { ascending: true })
  const { data, error } = await query
  if (error) throw new Error(`${table}: ${error.message}`)
  return data ?? []
}

export interface ExportPayload {
  schema_version: number
  exported_at: string
  app: string
  data: Record<string, unknown>
}

/** 导出全部数据（返回可用于下载的 JSON 文本） */
export async function exportAllData(userId: string): Promise<string> {
  const data: Record<string, unknown> = {}
  const errors: string[] = []

  // 串行而非并发：一次性打十几个请求容易触发移动端的连接数限制，
  // 导出本来就是低频操作，稳定优先于速度。
  for (const t of TABLES) {
    try {
      data[t.key] = await fetchAllFrom(userId, t.table, t.select ?? '*', t.orderBy)
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err))
    }
  }

  const payload: ExportPayload = {
    schema_version: EXPORT_SCHEMA_VERSION,
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
