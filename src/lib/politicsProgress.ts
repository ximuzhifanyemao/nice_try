import { supabase } from './supabase'

/** 政治一页纸的学习进度（与 iframe 内 onepaper.state.v1 的进度字段一一对应） */
export interface PoliticsProgress {
  /** 已掌握考点编号 */
  mastered: number[]
  /** 收藏考点编号 */
  saved: number[]
  /** 待复习考点编号 */
  review: number[]
  /** 访问日期 yyyy-MM-dd */
  visits: string[]
  /** 最近打开的考点编号 */
  last: number | null
}

/** 访问天数上限，与一页纸本机存储保持一致 */
const VISITS_LIMIT = 180

export const EMPTY_POLITICS_PROGRESS: PoliticsProgress = {
  mastered: [],
  saved: [],
  review: [],
  visits: [],
  last: null,
}

function toNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<number>()
  for (const item of value) {
    if (typeof item !== 'number' || !Number.isFinite(item) || item <= 0) continue
    seen.add(item)
  }
  return Array.from(seen).sort((a, b) => a - b)
}

function toVisitArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  for (const item of value) {
    if (typeof item !== 'string' || !item.trim()) continue
    seen.add(item.trim())
  }
  return Array.from(seen).sort().slice(-VISITS_LIMIT)
}

/** 把任意来源（本机消息 / 数据库 JSON）的进度收敛成合法形状 */
export function sanitizePoliticsProgress(value: unknown): PoliticsProgress {
  const v = (value ?? {}) as Partial<PoliticsProgress>
  return {
    mastered: toNumberArray(v.mastered),
    saved: toNumberArray(v.saved),
    review: toNumberArray(v.review),
    visits: toVisitArray(v.visits),
    last: typeof v.last === 'number' && Number.isFinite(v.last) ? v.last : null,
  }
}

/**
 * 合并两端进度：考点 / 收藏 / 复习取并集（多设备各自勾选的都保留），
 * 访问日期取并集后保留最近 180 天；最近打开的考点优先用本机值。
 */
export function mergePoliticsProgress(
  remote: PoliticsProgress | null,
  local: PoliticsProgress,
): PoliticsProgress {
  if (!remote) return local
  const unionNumbers = (a: number[], b: number[]) => Array.from(new Set([...a, ...b])).sort((x, y) => x - y)
  return {
    mastered: unionNumbers(remote.mastered, local.mastered),
    saved: unionNumbers(remote.saved, local.saved),
    review: unionNumbers(remote.review, local.review),
    visits: toVisitArray([...remote.visits, ...local.visits]),
    last: local.last ?? remote.last,
  }
}

/** 读取云端进度；表未创建 / 网络异常时返回 null，政治页继续用本机数据 */
export async function fetchPoliticsProgress(userId: string): Promise<PoliticsProgress | null> {
  try {
    const { data, error } = await supabase
      .from('politics_progress')
      .select('state')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return null
    return sanitizePoliticsProgress((data as { state?: unknown }).state)
  } catch (err) {
    console.warn('[PoliticsProgress] 读取失败，继续使用本机进度：', err instanceof Error ? err.message : err)
    return null
  }
}

/** 写入云端进度（失败静默，不影响政治页使用） */
export async function savePoliticsProgress(userId: string, progress: PoliticsProgress): Promise<void> {
  try {
    const { error } = await supabase.from('politics_progress').upsert(
      {
        user_id: userId,
        state: sanitizePoliticsProgress(progress),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    if (error) throw new Error(error.message)
  } catch (err) {
    console.warn('[PoliticsProgress] 保存失败，稍后重试：', err instanceof Error ? err.message : err)
  }
}
