import { useCallback, useEffect, useState } from 'react'
import { fetchCommitments, getWeekStartStr, getWeekEndStr, sumHoursInRange } from '../lib/commitments'
import { fetchLogsInRange } from '../lib/dailyLogs'

/** 本周目标进度：已达时长 / 目标时长（未设置或已结算本周末时为空） */
export interface WeekGoal {
  target: number
  actual: number
}

/* ── 本周目标本地缓存 ──
   胶囊条 / 科目下拉每次展示都可能拉取 Supabase 计算「已达成时长」，网络慢时进度迟迟不出现。
   缓存按周粒度的最新值，先秒出显示再后台刷新，保证打开即见、数值不过期。 */
const WEEK_GOAL_CACHE_KEY = 'kaoyan_week_goal_cache'

function loadWeekGoalCache(weekStart: string): WeekGoal | null {
  try {
    const raw = localStorage.getItem(WEEK_GOAL_CACHE_KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as Partial<{ weekStart: string; target: number; actual: number }>
    if (c.weekStart !== weekStart || typeof c.target !== 'number' || typeof c.actual !== 'number') return null
    return { target: c.target, actual: c.actual }
  } catch {
    return null
  }
}

function saveWeekGoalCache(weekStart: string, goal: WeekGoal): void {
  try {
    localStorage.setItem(WEEK_GOAL_CACHE_KEY, JSON.stringify({ weekStart, target: goal.target, actual: goal.actual }))
  } catch {
    /* ignore */
  }
}

function clearWeekGoalCache(): void {
  try {
    localStorage.removeItem(WEEK_GOAL_CACHE_KEY)
  } catch {
    /* ignore */
  }
}

/** 订阅本周目标进度：缓存先秒出，再后台拉取本周承诺 + 打卡记录刷新 */
export function useWeekGoal(userId?: string) {
  const [goal, setGoal] = useState<WeekGoal | null>(() => loadWeekGoalCache(getWeekStartStr()))
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    const weekStart = getWeekStartStr()
    const weekEnd = getWeekEndStr()
    // 缓存命中时立即显示（不等待网络），避免进度条「跳出来」的延迟感
    const cached = loadWeekGoalCache(weekStart)
    if (cached) setGoal(cached)
    ;(async () => {
      if (!userId) return
      try {
        const [commitments, logs] = await Promise.all([
          fetchCommitments(userId),
          fetchLogsInRange(userId, weekStart, weekEnd),
        ])
        if (cancelled) return
        const cur = commitments.find((c) => c.week_start === weekStart && c.status === 'active')
        if (!cur || cur.target_hours <= 0) {
          // 本周未设目标：清掉旧缓存并隐藏进度（避免跨周残留）
          clearWeekGoalCache()
          setGoal(null)
          return
        }
        const g = { target: cur.target_hours, actual: sumHoursInRange(logs, weekStart, weekEnd) }
        setGoal(g)
        saveWeekGoalCache(weekStart, g)
      } catch {
        /* 静默失败，保留缓存里的目标 */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, version])

  // 外部数据变化（如结束计时打卡后）手动刷新，仍先展示缓存再后台更新
  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  return { goal, refresh }
}