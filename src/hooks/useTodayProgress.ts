import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { fetchLogsInRange } from '../lib/dailyLogs'
import { sumHoursInRange } from '../lib/commitments'
import { useWeekGoal } from './useWeekGoal'

/** 今日进度尺的容量：10 段 = 10 小时，每段 1 小时 */
export const HOUR_MARKS = 10

/** 今日目标线：目标位置 = 今天开始时还欠的份额（按剩余天数均摊） */
export interface TodayTargetLine {
  /** 今天的目标份额（小时） */
  target: number
  /** 今天还差多少小时（已达成时按 0 计） */
  need: number
  /** 目标线在进度尺上的位置（0-100） */
  pct: number
}

export interface TodayProgress {
  /** 今日已打卡学习时长（小时，来自云端记录，不含尚未保存的累计） */
  hours: number
  /** 今日目标线；无周目标 / 已达标 / 本周已过完时为 null */
  line: TodayTargetLine | null
  /** 重新拉取今日时长与周目标（结束计时打卡、保存到今日记录后调用） */
  refresh: () => void
}

/**
 * 今日学习进度：已打卡时长 + 今日目标线。
 *
 * 全功能计时页 Hero 与简洁模式胶囊条共用：
 * - 已打卡时长只认云端记录（与胶囊条原有口径一致），未保存的计时在「今日累计」里体现
 * - 目标线 = 「今天开始时还欠的份额」÷ 剩余天数，一天之内是固定值：
 *   学习过程中不会随着已学时长往右滑（旧实现把今日已学叠加进目标位置，
 *   每保存一笔时长线就往后挪一次），只有跨天/周累计刷新时才会按进度微调
 */
export function useTodayProgress(userId?: string): TodayProgress {
  const [hours, setHours] = useState(0)
  const { goal, refresh: refreshWeekGoal } = useWeekGoal(userId)
  const [line, setLine] = useState<{ target: number; need: number } | null>(null)

  const load = useCallback(async () => {
    if (!userId) {
      setHours(0)
      return
    }
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const logs = await fetchLogsInRange(userId, today, today)
      setHours(sumHoursInRange(logs, today, today))
    } catch {
      /* 拉取失败保持原值 */
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!goal || goal.target <= 0) {
      setLine(null)
      return
    }
    // 本周已达标：今天不需要再追进度，隐藏目标线（与本功能原有行为一致）
    if (goal.actual >= goal.target) {
      setLine(null)
      return
    }
    // 剩余天数（含今天）：周日为 1，周一为 7
    const daysLeft = 8 - Number(format(new Date(), 'i'))
    if (daysLeft <= 0) {
      setLine(null)
      return
    }
    // 「今天开始时还欠的份额」= 周目标 − 本周已达成（扣掉今天已打卡的部分，
    // 否则会与 hours 重复计算，目标线会随每笔今日保存向右漂移）。
    // 上限夹在周目标内，避免「今日时长已刷新、周累计还没刷新」的瞬时高估。
    const owedAtStart = Math.min(goal.target, goal.target - goal.actual + hours)
    // 目标线的位置就是今天该学到的总量，一天之内不随已学滑动
    const target = owedAtStart / daysLeft
    if (target <= 0) {
      setLine(null)
      return
    }
    setLine({ target, need: Math.max(0, target - hours) })
  }, [goal, hours])

  const refresh = useCallback(() => {
    void load()
    refreshWeekGoal()
  }, [load, refreshWeekGoal])

  /* 后台自动补传成功后重新拉一次：静默入账的时长也要立刻体现在进度尺与目标线上 */
  useEffect(() => {
    window.addEventListener('kaoyan-timer-flushed', refresh)
    return () => window.removeEventListener('kaoyan-timer-flushed', refresh)
  }, [refresh])

  return {
    hours,
    line: line ? { ...line, pct: Math.min(line.target / HOUR_MARKS, 1) * 100 } : null,
    refresh,
  }
}