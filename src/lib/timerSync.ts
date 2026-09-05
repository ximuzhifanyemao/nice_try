import type { DailyLogSubject } from './dailyLogs'
import { sortSubjectsByStartTime, todayStr, upsertLogSafely } from './dailyLogs'

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

/** 暂停共享计时：冻结时长（恢复后继续累计）。未在计时或已暂停时忽略。 */
export function pauseSharedTimer(): void {
  const running = loadSharedTimer()
  if (!running || running.paused) return
  saveSharedTimer({ ...running, paused: true, pausedAt: Date.now() })
}

/** 恢复共享计时：把本次暂停的时长累计进 pausedMs。未暂停时忽略。 */
export function resumeSharedTimer(): void {
  const running = loadSharedTimer()
  if (!running || !running.paused) return
  const add = Date.now() - (running.pausedAt ?? Date.now())
  saveSharedTimer({
    ...running,
    paused: false,
    pausedAt: null,
    pausedMs: (running.pausedMs ?? 0) + add,
  })
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

/* ── 本地待补记备份 ──
   精简挂件结束计时时先把本次会话落一份到 localStorage，云端保存成功后才清除。
   登录/网络/会话异常导致保存失败时，时长不会丢：全功能「计时」页挂载时自动恢复为今日累计，
   再由用户手动保存（或补交）。 */
export interface PendingTimerEntry {
  subjectId: string
  activity: string
  seconds: number
  start: string // HH:mm
  end: string // HH:mm
  date: string // yyyy-MM-dd（计时开始那天，跨天补交依据）
}

const PENDING_KEY = 'kaoyan_pending_timer'

/**
 * 清空本机所有计时相关本地状态（共享进行中计时、今日累计、待补记备份）。
 * 供登出时调用，避免「用户A → 用户B」切换时把上一用户的计时/累计数据带过去，
 * 被下一个登录用户误保存进自己的云端记录。
 */
export function clearTimerLocalState(): void {
  try {
    localStorage.removeItem(TIMER_RUNNING_KEY)
    localStorage.removeItem(LEGACY_WIDGET_KEY)
    localStorage.removeItem(PENDING_KEY)
    localStorage.removeItem('kaoyan_timer_accum')
    localStorage.removeItem('kaoyan_timer_accum_date')
  } catch {
    /* ignore */
  }
}

export function savePendingTimer(entry: PendingTimerEntry): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(entry))
  } catch {
    /* ignore */
  }
}

export function loadPendingTimer(): PendingTimerEntry | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Partial<PendingTimerEntry>
    if (typeof p.subjectId !== 'string' || typeof p.seconds !== 'number' || typeof p.date !== 'string') return null
    return {
      subjectId: p.subjectId,
      activity: p.activity ?? '',
      seconds: p.seconds,
      start: p.start ?? '',
      end: p.end ?? '',
      date: p.date,
    }
  } catch {
    return null
  }
}

export function clearPendingTimer(): void {
  try {
    localStorage.removeItem(PENDING_KEY)
  } catch {
    /* ignore */
  }
}

/** 时间戳 → HH:mm（本地时区） */
export function timeHm(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 时间戳 → yyyy-MM-dd（本地时区） */
export function dateOf(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function timeStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/* ── 结束共享计时并打卡 ──
   胶囊条与精简面板共用的结束逻辑：先停表并本地备份本次会话，
   再按登录状态与是否跨天决定直接入库或提示补交。 */

export type FinishTimerResult =
  | { status: 'saved'; seconds: number }
  | { status: 'stopped'; message: string }

/**
 * 结束共享计时并尝试为用户记录打卡。返回：
 * - saved：已成功写入今日记录（seconds 为实际秒数）
 * - stopped：已停表但未入库，message 是需要 UI 展示的提示（本地暂存/跨天补交/未登录/保存失败）
 */
export async function finishSharedTimer(user: { id: string } | null): Promise<FinishTimerResult> {
  const running = loadSharedTimer()
  if (!running) return { status: 'stopped', message: '' }
  const seconds = computeTimerElapsed(running)
  const entry = buildTimerEntry(running, seconds)
  // 无论是否入库成功，计时都先停止（清掉共享计时，避免两个界面重复操作）
  saveSharedTimer(null)
  if (!entry || seconds < 1) return { status: 'stopped', message: '' }

  // 云端保存前先落一份本地备份：登录/网络/会话异常导致保存失败时本次时长不丢，
  // 之后在全功能「计时」页挂载时自动恢复为「今日累计」并可再次保存/补交
  savePendingTimer({
    subjectId: running.subjectId ?? '',
    activity: running.activity ?? '',
    seconds,
    start: timeHm(running.startTime),
    end: timeHm(running.paused ? (running.pausedAt ?? Date.now()) : Date.now()),
    date: dateOf(running.startTime),
  })

  if (!user) {
    return { status: 'stopped', message: '已暂存本地，登录后在全功能「计时」页保存即可' }
  }
  const targetDate = dateOf(running.startTime)
  if (targetDate !== todayStr()) {
    // 跨天补交：交给全功能计时页的补交流程（带确认），这里只保全不写错日期
    return { status: 'stopped', message: '已暂存本地（跨天补交），请到全功能「计时」页保存' }
  }
  try {
    const entries: DailyLogSubject[] = [entry]
    sortSubjectsByStartTime(entries)
    // 安全合并写入云端：内部自动读最新→合并→带版本校验写入，并发冲突自动重试一次
    await upsertLogSafely({ userId: user.id, date: targetDate, subjects: entries, summary: '' })
    clearPendingTimer() // 云端写入成功才清理本地备份
    return { status: 'saved', seconds }
  } catch (err) {
    return {
      status: 'stopped',
      message:
        '保存失败，时长已暂存本地，可到全功能「计时」页重试：' +
        (err instanceof Error ? err.message : '未知错误'),
    }
  }
}