import type { DailyLogSubject } from './dailyLogs'

/**
 * 全功能模式计时器（StudyTimer）与精简挂件计时器（DesktopTimer）共享的
 * 「进行中」状态。两套 UI 读写同一个 key，保证在两种模式间切换时计时不中断：
 * - 全功能里开始计时 → 切到精简挂件仍显示计时，可直接结束/打卡
 * - 精简挂件里开始计时 → 进入全功能计时页同样恢复
 */

export interface SharedTimerState {
  subjectId: string | null
  activity: string
  startTime: number // Date.now()
  paused?: boolean // 是否暂停中（硬件 OK 键）
  pausedMs?: number // 累计已暂停的毫秒数
  pausedAt?: number | null // 本次暂停的开始时间戳
}

/** 统一的进行中计时 key */
export const TIMER_RUNNING_KEY = 'kaoyan_timer_running'
/** 旧版精简挂件专用 key（仅迁移用，之后统一用 TIMER_RUNNING_KEY） */
const LEGACY_WIDGET_KEY = 'kaoyan_widget_running'

function clearAllRunning() {
  localStorage.removeItem(TIMER_RUNNING_KEY)
  localStorage.removeItem(LEGACY_WIDGET_KEY)
}

/** 读取共享的进行中计时（兼容旧版挂件格式，自动迁移）；跨午夜丢弃 */
export function loadSharedTimer(): SharedTimerState | null {
  try {
    const raw = localStorage.getItem(TIMER_RUNNING_KEY) ?? localStorage.getItem(LEGACY_WIDGET_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SharedTimerState>
    if (!parsed.startTime) {
      clearAllRunning()
      return null
    }
    // 跨午夜修复：若计时开始于今天之前，丢弃（避免把昨天甚至更早的时长计入今日）
    if (new Date(parsed.startTime).toDateString() !== new Date().toDateString()) {
      clearAllRunning()
      return null
    }
    const state: SharedTimerState = {
      subjectId: parsed.subjectId ?? null,
      activity: parsed.activity ?? '',
      startTime: parsed.startTime,
      paused: parsed.paused ?? false,
      pausedMs: parsed.pausedMs ?? 0,
      pausedAt: parsed.pausedAt ?? null,
    }
    // 若命中旧版挂件 key，迁移到统一 key 并清理旧值
    if (!localStorage.getItem(TIMER_RUNNING_KEY)) {
      localStorage.setItem(TIMER_RUNNING_KEY, JSON.stringify(state))
    }
    localStorage.removeItem(LEGACY_WIDGET_KEY)
    return state
  } catch {
    return null
  }
}

export function saveSharedTimer(state: SharedTimerState | null): void {
  if (state) {
    localStorage.setItem(TIMER_RUNNING_KEY, JSON.stringify(state))
  } else {
    localStorage.removeItem(TIMER_RUNNING_KEY)
  }
}

/** 已流逝秒数（暂停期间不计时） */
export function computeTimerElapsed(state: SharedTimerState): number {
  const pausedMs = state.pausedMs ?? 0
  const now = state.paused ? (state.pausedAt ?? Date.now()) : Date.now()
  return Math.floor((now - state.startTime - pausedMs) / 1000)
}

/** 生成一条待入库的科目条目（含时间段） */
export function buildTimerEntry(state: SharedTimerState, endSeconds: number): DailyLogSubject | null {
  if (!state.subjectId) return null
  const hours = Math.round((endSeconds / 3600) * 100) / 100
  const endNow = state.paused ? (state.pausedAt ?? Date.now()) : Date.now()
  return {
    id: state.subjectId,
    hours,
    ...(state.activity ? { activity: state.activity } : {}),
    startTime: timeStr(new Date(state.startTime)),
    endTime: timeStr(new Date(endNow)),
  }
}

function timeStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}