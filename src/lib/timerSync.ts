import type { DailyLogPause } from './dailyLogs'
import { abandonPomo, clearPomoState, loadPomoState } from './pomodoro'
import { flushTimerOutbox, loadOutbox, stashTimerSession, type TimerStashInput } from './timerOutbox'

/**
 * 全功能模式计时器（StudyTimer）与精简挂件计时器（DesktopTimer）共享的
 * 「进行中」状态。两套 UI 读写同一个 key，保证在两种模式间切换时计时不中断：
 * - 全功能里开始计时 → 切到精简挂件仍显示计时，可直接结束/打卡
 * - 精简挂件里开始计时 → 进入全功能计时页同样恢复
 *
 * 计时结束时不再自己写云端记录，而是统一「先落 lib/timerOutbox 的待入库队列，再尝试补传」：
 * 任何一步失败都只是留在队列里，不会有时长凭空消失。
 */

/** 进行中的一次暂停：at=暂停开始时间戳，ms=暂停时长（0 表示仍在暂停中） */
export interface TimerPauseEvent {
  at: number
  ms: number
}

export interface SharedTimerState {
  subjectId: string | null
  activity: string
  startTime: number // Date.now()
  paused?: boolean // 是否暂停中（硬件 OK 键）
  pausedMs?: number // 累计已暂停的毫秒数
  pausedAt?: number | null // 本次暂停的开始时间戳
  pauses?: TimerPauseEvent[] // 每次暂停的明细（用于回顾当天学习节奏）
}

/** 统一的进行中计时 key */
export const TIMER_RUNNING_KEY = 'kaoyan_timer_running'
/** 旧版精简挂件专用 key（仅迁移用，之后统一用 TIMER_RUNNING_KEY） */
const LEGACY_WIDGET_KEY = 'kaoyan_widget_running'

function clearAllRunning() {
  localStorage.removeItem(TIMER_RUNNING_KEY)
  localStorage.removeItem(LEGACY_WIDGET_KEY)
}

/**
 * 读取共享的进行中计时（兼容旧版挂件格式，自动迁移）。
 * 跨午夜不中断：计时跨天后继续累计（熬夜学习场景），
 * 结束保存时按自然日拆分：零点前记入前一天，零点后记入当天。
 */
export function loadSharedTimer(): SharedTimerState | null {
  try {
    const raw = localStorage.getItem(TIMER_RUNNING_KEY) ?? localStorage.getItem(LEGACY_WIDGET_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SharedTimerState>
    if (!parsed.startTime) {
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
      pauses: Array.isArray(parsed.pauses) ? parsed.pauses : [],
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
  saveSharedTimer(pauseTimerState(running))
}

/** 恢复共享计时：把本次暂停的时长累计进 pausedMs。未暂停时忽略。 */
export function resumeSharedTimer(): void {
  const running = loadSharedTimer()
  if (!running || !running.paused) return
  saveSharedTimer(resumeTimerState(running))
}

/**
 * 进入暂停（纯函数，全功能计时页与共享计时共用同一份逻辑）：
 * 同时在 pauses 里追加一条明细，事后可回顾「几点暂停了多久」。
 */
export function pauseTimerState(state: SharedTimerState, now = Date.now()): SharedTimerState {
  if (state.paused) return state
  return {
    ...state,
    paused: true,
    pausedAt: now,
    pauses: [...(state.pauses ?? []), { at: now, ms: 0 }],
  }
}

/** 恢复计时（纯函数）：把本次暂停时长累计进 pausedMs，并补全最后一条暂停明细 */
export function resumeTimerState(state: SharedTimerState, now = Date.now()): SharedTimerState {
  if (!state.paused) return state
  const add = now - (state.pausedAt ?? now)
  const pauses = [...(state.pauses ?? [])]
  const last = pauses[pauses.length - 1]
  if (last) pauses[pauses.length - 1] = { ...last, ms: last.ms + add }
  return {
    ...state,
    paused: false,
    pausedAt: null,
    pausedMs: (state.pausedMs ?? 0) + add,
    pauses,
  }
}

/**
 * 暂停明细 → 入库格式（HH:mm + 时长）。
 * 仍在暂停中的一条按参考时刻补全时长；不足 1 秒的忽略。
 */
export function toLogPauses(
  pauses: TimerPauseEvent[] | undefined,
  now: number,
): DailyLogPause[] | undefined {
  if (!pauses?.length) return undefined
  const list = pauses
    .map((p) => ({ at: timeHm(p.at), ms: p.ms > 0 ? p.ms : Math.max(0, now - p.at) }))
    .filter((p) => p.ms >= 1000)
  return list.length > 0 ? list : undefined
}

/* ── 本地计时态清理 ──
   注意：只清「进行中的计时」这类会串号状态，**不动待入库队列**：
   队列里是已经产生的学习时长，登出/换号时也应保留（条目自带归属用户，
   换号后不会被误写进别人的记录，同号重新登录后会自动补传）。 */

export function clearTimerLocalState(): void {
  try {
    clearAllRunning()
    clearPomoState()
  } catch {
    /* ignore */
  }
}

/**
 * 把正在进行中的计时封存进待入库队列（登出/换号前调用）：
 * 正计时按已流逝时长、番茄钟专注段按实际已专注时长各落一段，避免「登出就把在计时长清掉」。
 */
export function bankRunningTimers(userId: string | null): void {
  const running = loadSharedTimer()
  if (running?.subjectId) {
    const seconds = computeTimerElapsed(running)
    const endAt = running.paused ? (running.pausedAt ?? Date.now()) : Date.now()
    if (seconds >= 1) {
      stashTimerSession(userId, {
        subjectId: running.subjectId,
        activity: running.activity ?? '',
        seconds,
        startAt: running.startTime,
        endAt,
        pauses: toLogPauses(running.pauses, endAt),
      })
    }
  }
  try {
    const pomo = loadPomoState()
    if (pomo) {
      const session = abandonPomo(pomo, Date.now())
      if (session) stashTimerSession(userId, session)
    }
  } catch {
    /* 番茄钟状态损坏时忽略 */
  }
  clearTimerLocalState()
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

/* ── 结束共享计时并打卡 ──
   胶囊条与精简面板共用的结束逻辑：先停表并落盘到待入库队列，再尝试补传入账。 */

export type FinishTimerResult =
  | { status: 'saved'; seconds: number }
  | { status: 'stopped'; message: string }

/**
 * 结束共享计时并尝试为用户记录打卡。返回：
 * - saved：已成功写入今日记录（seconds 为实际秒数）
 * - stopped：已停表但未入库，message 是需要 UI 展示的提示（待自动补传/跨天补交/未登录）
 */
export async function finishSharedTimer(user: { id: string } | null): Promise<FinishTimerResult> {
  const running = loadSharedTimer()
  if (!running) return { status: 'stopped', message: '' }
  const seconds = computeTimerElapsed(running)
  // 无论是否入库成功，计时都先停止（清掉共享计时，避免两个界面重复操作）
  saveSharedTimer(null)
  if (!running.subjectId || seconds < 1) return { status: 'stopped', message: '' }

  const endAt = running.paused ? (running.pausedAt ?? Date.now()) : Date.now()
  // 先落盘：本次时长进待入库队列（跨零点会按自然日拆成多段），后续任何失败都不会丢
  const items = stashTimerSession(user?.id ?? null, {
    subjectId: running.subjectId,
    activity: running.activity ?? '',
    seconds,
    startAt: running.startTime,
    endAt,
    pauses: toLogPauses(running.pauses, endAt),
  })

  if (!user) {
    return { status: 'stopped', message: '已暂存本地，登录后在计时页保存或等自动补传' }
  }
  await flushTimerOutbox(user, { onlyRecent: true })
  const saved = items.every((i) => !loadOutbox().some((x) => x.id === i.id))
  return saved
    ? { status: 'saved', seconds }
    : { status: 'stopped', message: '已暂存本地，将自动补传（也可到计时页手动保存）' }
}

/* ── 已完成会话的入库 / 暂存 ──
   番茄钟专注段结束时（简洁模式胶囊条、全功能计时页）共用。 */

export type SessionPersistResult = 'saved' | 'stashed'

/**
 * 保存一段已完成的学习会话（如番茄钟一轮专注）：
 * - 已登录：落盘后立即尝试补传（跨零点的段会按自然日拆开，分别入账）→ saved
 * - 未登录 / 网络失败：留在待入库队列（可累积多段，不会互相覆盖）
 *   → stashed，计时页「今日累计」可见，联网后自动补传
 */
export async function saveOrStashSession(
  user: { id: string } | null,
  session: TimerStashInput,
): Promise<SessionPersistResult> {
  const items = stashTimerSession(user?.id ?? null, session)
  if (!user || items.length === 0) return 'stashed'
  await flushTimerOutbox(user, { onlyRecent: true })
  return items.some((i) => loadOutbox().some((x) => x.id === i.id)) ? 'stashed' : 'saved'
}
