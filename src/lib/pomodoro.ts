import { Capacitor } from '@capacitor/core'
import { sendSystemNotification } from './reminder'
import type { TimerSession } from './timerAccum'

/**
 * 番茄钟共享状态（全功能计时页与简洁模式胶囊条共用）。
 *
 * 与共享「正计时」状态（lib/timerSync.ts）同一思路：两个界面读写同一份
 * localStorage 状态，因此：
 * - 简洁模式胶囊条里开始的番茄钟，切到全部功能计时页能看到同一个倒计时，可继续暂停/放弃；
 * - 反之亦然，切换模式不会中断或丢失正在进行的专注/休息阶段。
 *
 * 本模块只做状态机与阶段结束提醒，不参与入库：
 * 专注段结束时由调用方决定记入「今日累计」（全功能计时页）还是直接入库/暂存（简洁模式胶囊条）。
 */

/** 计时模式：正计时 / 番茄钟（两个界面共用同一偏好） */
export type TimerMode = 'stopwatch' | 'pomodoro'

/** 番茄钟阶段：专注 / 休息 */
export type PomoPhase = 'focus' | 'rest'

/** 进行中的番茄钟（null = 空闲） */
export interface PomoState {
  phase: PomoPhase
  subjectId: string
  activity: string
  /** 已完成的专注轮数（当前这轮完成前不计入） */
  round: number
  focusMin: number
  restMin: number
  /** 当前阶段开始时间戳（休息阶段 = 本轮专注的原定结束时刻） */
  phaseStartAt: number
  /** 当前阶段结束时间戳（暂停恢复后顺延） */
  endAt: number
  paused: boolean
  /** 本次暂停开始时间戳（未暂停为 null） */
  pauseAt: number | null
}

/** 专注段（PomoSession 与 TimerSession 同形，便于直接入账/累计） */
export type PomoSession = TimerSession

/** 阶段到期推进的结果 */
export interface PomoAdvance {
  /** 推进后的状态；null = 会话结束回到空闲 */
  next: PomoState | null
  /** 本次到期的专注段（专注完成，需要记入时长） */
  session: PomoSession | null
  /** 需要发出的阶段结束提醒 */
  notify: PomoPhase | null
}

/** 共享番茄钟进行中状态 key */
export const POMO_STATE_KEY = 'kaoyan_pomo_running'
/** 计时模式记忆键（与全功能计时页共用） */
const MODE_KEY = 'kaoyan_timer_mode'
const POMO_FOCUS_KEY = 'kaoyan_pomo_focus_min'
const POMO_REST_KEY = 'kaoyan_pomo_rest_min'

/* ── 状态读写 ── */

/** 读取进行中的番茄钟；数据非法/损坏时丢弃，避免坏状态卡死计时 */
export function loadPomoState(): PomoState | null {
  try {
    const raw = localStorage.getItem(POMO_STATE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Partial<PomoState>
    if (
      (p.phase !== 'focus' && p.phase !== 'rest') ||
      typeof p.subjectId !== 'string' ||
      !p.subjectId ||
      typeof p.phaseStartAt !== 'number' ||
      typeof p.endAt !== 'number'
    ) {
      localStorage.removeItem(POMO_STATE_KEY)
      return null
    }
    return {
      phase: p.phase,
      subjectId: p.subjectId,
      activity: p.activity ?? '',
      round: typeof p.round === 'number' && p.round >= 0 ? Math.floor(p.round) : 0,
      focusMin: typeof p.focusMin === 'number' && p.focusMin > 0 ? p.focusMin : 25,
      restMin: typeof p.restMin === 'number' && p.restMin >= 0 ? p.restMin : 0,
      phaseStartAt: p.phaseStartAt,
      endAt: p.endAt,
      paused: p.paused ?? false,
      pauseAt: p.pauseAt ?? null,
    }
  } catch {
    return null
  }
}

export function savePomoState(state: PomoState | null): void {
  try {
    if (state) localStorage.setItem(POMO_STATE_KEY, JSON.stringify(state))
    else localStorage.removeItem(POMO_STATE_KEY)
  } catch {
    /* 忽略写入失败 */
  }
}

export function clearPomoState(): void {
  savePomoState(null)
}

/* ── 偏好：计时模式 / 专注 / 休息时长 ── */

export function loadTimerMode(): TimerMode {
  return localStorage.getItem(MODE_KEY) === 'pomodoro' ? 'pomodoro' : 'stopwatch'
}

export function saveTimerMode(mode: TimerMode): void {
  try {
    localStorage.setItem(MODE_KEY, mode)
  } catch {
    /* 忽略 */
  }
}

/** 专注时长（分钟），默认 25，非法值回退默认 */
export function loadPomoFocusMin(): number {
  const raw = localStorage.getItem(POMO_FOCUS_KEY)
  if (raw === null) return 25
  const n = Number(raw)
  return n > 0 && n <= 240 ? Math.round(n) : 25
}

export function savePomoFocusMin(min: number): void {
  try {
    localStorage.setItem(POMO_FOCUS_KEY, String(Math.round(Math.min(240, Math.max(1, min)))))
  } catch {
    /* 忽略 */
  }
}

/** 休息时长（分钟），默认 5，0 = 专注结束即回空闲 */
export function loadPomoRestMin(): number {
  const raw = localStorage.getItem(POMO_REST_KEY)
  if (raw === null) return 5
  const n = Number(raw)
  return n >= 0 && n <= 120 ? Math.round(n) : 5
}

export function savePomoRestMin(min: number): void {
  try {
    localStorage.setItem(POMO_REST_KEY, String(Math.round(Math.min(120, Math.max(0, min)))))
  } catch {
    /* 忽略 */
  }
}

/* ── 状态机 ── */

/** 启动一轮专注（休息时长取当前偏好） */
export function startPomo(subjectId: string, activity: string, focusMin: number, now: number): PomoState {
  return {
    phase: 'focus',
    subjectId,
    activity,
    round: 0,
    focusMin,
    restMin: loadPomoRestMin(),
    phaseStartAt: now,
    endAt: now + focusMin * 60000,
    paused: false,
    pauseAt: null,
  }
}

export function pausePomo(state: PomoState, now: number): PomoState {
  if (state.paused) return state
  return { ...state, paused: true, pauseAt: now }
}

export function resumePomo(state: PomoState, now: number): PomoState {
  if (!state.paused) return state
  // 恢复：把暂停时长顺延到结束时间戳，保证倒计时不因暂停而失真
  return { ...state, paused: false, pauseAt: null, endAt: state.endAt + (now - (state.pauseAt ?? now)) }
}

/** 当前阶段剩余毫秒（暂停时冻结在暂停时刻） */
export function computePomoRemain(state: PomoState, now: number): number {
  const ref = state.paused ? (state.pauseAt ?? now) : now
  return Math.max(0, state.endAt - ref)
}

/**
 * 推进已到期的阶段（调用方需保证 state 未暂停且 endAt <= now）：
 * - 专注完成：本段记入 session；还有休息则自动进入休息，否则回空闲
 * - 休息结束：回空闲
 * 长时间离开（如切到全功能页后忘记回来）时休息可能也已过期，此时直接回空闲，只提示专注完成。
 */
export function advancePomo(state: PomoState, now: number): PomoAdvance {
  if (state.phase === 'focus') {
    const session: PomoSession = {
      subjectId: state.subjectId,
      activity: state.activity,
      seconds: state.focusMin * 60,
      startAt: state.phaseStartAt,
      endAt: state.endAt,
    }
    if (state.restMin > 0) {
      const restEnd = state.endAt + state.restMin * 60000
      if (restEnd > now) {
        return {
          next: {
            ...state,
            phase: 'rest',
            round: state.round + 1,
            phaseStartAt: state.endAt,
            endAt: restEnd,
            paused: false,
            pauseAt: null,
          },
          session,
          notify: 'focus',
        }
      }
    }
    return { next: null, session, notify: 'focus' }
  }
  // 休息结束
  return { next: null, session: null, notify: 'rest' }
}

/** 放弃当前专注：返回已专注的时长（不足 1 秒不记录），休息阶段返回 null */
export function abandonPomo(state: PomoState, now: number): PomoSession | null {
  if (state.phase !== 'focus') return null
  const securedMs = state.focusMin * 60000 - computePomoRemain(state, now)
  if (securedMs < 1000) return null
  const endRef = state.paused ? (state.pauseAt ?? now) : now
  return {
    subjectId: state.subjectId,
    activity: state.activity,
    seconds: Math.round(securedMs / 1000),
    startAt: state.phaseStartAt,
    endAt: Math.min(endRef, state.endAt),
  }
}

/* ── 阶段结束提醒 ── */

/** 番茄钟原生本地通知 id：避开打卡提醒 5000-5006 区间 */
const POMO_FOCUS_END_ID = 6101
const POMO_REST_END_ID = 6102

/** Web/Tauri 端短蜂鸣（AudioContext 单音，失败静默） */
function webBeep(): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
    osc.onended = () => ctx.close().catch(() => {/*** 忽略关闭失败 */})
  } catch {
    /* 忽略 beep 失败 */
  }
}

/**
 * 番茄钟阶段结束的本地提醒：
 * - 原生：立即 schedule 一条系统通知（focus=6101 / rest=6102）
 * - Web / 电脑程序（Tauri）：beep + 系统通知（电脑程序为 Toast，浏览器为 Web Notification；
 *   未授权则仅 beep），通道分发见 lib/reminder
 */
export async function pomodoroNotify(kind: PomoPhase): Promise<void> {
  const title = kind === 'focus' ? 'DiveDeep · 专注完成' : 'DiveDeep · 休息结束'
  const body = kind === 'focus' ? '专注完成，休息 5 分钟吧 🍅' : '休息结束，开始下一轮专注'
  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const status = await LocalNotifications.checkPermissions()
      if (status.display !== 'granted') await LocalNotifications.requestPermissions()
      await LocalNotifications.schedule({
        notifications: [{
          id: kind === 'focus' ? POMO_FOCUS_END_ID : POMO_REST_END_ID,
          title,
          body,
          smallIcon: 'ic_stat_icon',
          iconColor: '#ef4444',
          schedule: { at: new Date(), allowWhileIdle: true },
        }],
      })
    } catch {
      /* 忽略通知失败 */
    }
    return
  }
  webBeep()
  void sendSystemNotification(title, body, 'divedeep-pomodoro')
}