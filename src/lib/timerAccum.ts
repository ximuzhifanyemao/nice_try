import type { DailyLogPause } from './dailyLogs'
import type { OutboxItem } from './timerOutbox'

/**
 * 「今日累计」的数据形状与投影。
 *
 * 说明：累计不再单独落盘——它的唯一数据来源是 lib/timerOutbox 的待入库队列
 * （accumFromOutbox 把队列按 科目::学习内容 聚合出来）。这样：
 * - 队列里没被抹掉，累计就不会凭空消失；
 * - 补传成功后条目出队，累计自动跟着变小，不会出现两套状态对不上。
 */
export interface TimeRange {
  start: string
  end: string
  /** 该段计时内的暂停明细（无暂停时不写） */
  pauses?: DailyLogPause[]
}

/** 每个科目（含学习内容）今日累计：总秒数 + 各次会话时间段 */
export interface AccumEntry {
  seconds: number
  ranges: TimeRange[]
}

export type AccumMap = Record<string, AccumEntry>

/** 一段已完成、待入账的学习会话 */
export interface TimerSession {
  subjectId: string
  activity: string
  seconds: number
  startAt: number // 开始时间戳（跨零点时会按自然日拆成多段，各段各归各天）
  endAt: number // 结束时间戳
}

/** 累计键：科目::学习内容 */
export function accumKey(subjectId: string, activity: string): string {
  return `${subjectId}::${activity}`
}

/** 待入库队列 → 「今日累计」视图（按 科目::学习内容 聚合） */
export function accumFromOutbox(items: OutboxItem[]): AccumMap {
  const map: AccumMap = {}
  for (const item of items) {
    if (item.seconds <= 0) continue
    const key = accumKey(item.subjectId, item.activity)
    const prev = map[key]
    const ranges = prev?.ranges ?? []
    map[key] = {
      seconds: (prev?.seconds ?? 0) + item.seconds,
      ranges:
        item.start && item.end
          ? [...ranges, { start: item.start, end: item.end, ...(item.pauses ? { pauses: item.pauses } : {}) }]
          : ranges,
    }
  }
  return map
}

/**
 * 待入库队列的归属日期：取最早那段的日期（与旧版「第一段计时落盘时记下日期」的语义一致）。
 * 队列为空时返回 null（界面回落到今天）。
 */
export function accumDateFromOutbox(items: OutboxItem[]): string | null {
  let earliest: string | null = null
  for (const item of items) {
    if (!item.date) continue
    if (earliest === null || item.date < earliest) earliest = item.date
  }
  return earliest
}
