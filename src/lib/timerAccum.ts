import type { DailyLogPause } from './dailyLogs'
import { todayStr } from './dailyLogs'
import { toTimeStr } from './format'

/**
 * 「今日累计」（未保存的计时时长）本地存储。
 *
 * 全功能计时页用它暂存正计时/番茄钟的时长，等用户点「保存到今日记录」再入库；
 * 简洁模式胶囊条在番茄钟专注段无法直接入库时（未登录/跨天/网络失败）也并入这里，
 * 保证时长不丢、稍后能在全功能计时页补交。
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
  startAt: number // 开始时间戳，跨天时按「开始那天」归属
  endAt: number // 结束时间戳
}

const ACCUM_KEY = 'kaoyan_timer_accum'
/** 累计归属日期 key（全功能计时页直接读写，跨天补交依据） */
export const ACCUM_DATE_KEY = 'kaoyan_timer_accum_date'

/** 累计键：科目::学习内容 */
export function accumKey(subjectId: string, activity: string): string {
  return `${subjectId}::${activity}`
}

export function loadAccum(): AccumMap {
  // 跨午夜不清空：保留累计数据，保存时归入开始学习的那天（补交）
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(ACCUM_KEY) || '{}')
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
    const migrated: AccumMap = {}
    for (const [key, value] of Object.entries(raw)) {
      // 旧格式：直接是数字秒数 → 迁移为 { seconds, ranges: [] }
      if (typeof value === 'number') {
        migrated[key] = { seconds: value, ranges: [] }
      } else if (
        typeof value === 'object' &&
        value !== null &&
        typeof (value as AccumEntry).seconds === 'number'
      ) {
        // 已是新格式
        migrated[key] = value as AccumEntry
      }
      // 其他非法值跳过
    }
    return migrated
  } catch {
    return {}
  }
}

export function saveAccum(accum: AccumMap): void {
  try {
    localStorage.setItem(ACCUM_KEY, JSON.stringify(accum))
  } catch {
    /* 忽略写入失败 */
  }
}

/** 读取累计归属日期（这批学习时长属于哪一天），无累计时为 null */
export function loadAccumDate(): string | null {
  return localStorage.getItem(ACCUM_DATE_KEY)
}

/** 记录累计归属日期（跨天补交依据） */
export function saveAccumDate(date: string): void {
  try {
    localStorage.setItem(ACCUM_DATE_KEY, date)
  } catch {
    /* 忽略写入失败 */
  }
}

export function clearAccumDate(): void {
  try {
    localStorage.removeItem(ACCUM_DATE_KEY)
  } catch {
    /* 忽略失败 */
  }
}

/** 时间戳 → yyyy-MM-dd（本地时区） */
function dateOf(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * 追加一段会话（秒数 + 时间段）到累计，返回新的累计对象（已写盘）。
 * 累计原本为空时，把归属日期设为该会话开始那天（跨午夜完成的会话归入开始当天）。
 */
export function appendAccumSession(accum: AccumMap, session: TimerSession): AccumMap {
  const key = accumKey(session.subjectId, session.activity)
  const prev = accum[key]
  const next: AccumMap = { ...accum }
  next[key] = {
    seconds: (prev?.seconds ?? 0) + session.seconds,
    ranges: [
      ...(prev?.ranges ?? []),
      { start: toTimeStr(new Date(session.startAt)), end: toTimeStr(new Date(session.endAt)) },
    ],
  }
  if (Object.keys(accum).length === 0) {
    // 无累计数据：归属日期取会话开始那天（今日/跨天都正确）
    saveAccumDate(dateOf(session.startAt) || todayStr())
  }
  saveAccum(next)
  return next
}