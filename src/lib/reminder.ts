/**
 * 打卡提醒配置（设备本地，不随账号同步）。
 * 提醒时机：设置了提醒 && 已登录 && 当天尚未打卡 && 已过提醒时间 && 今天尚未提醒过。
 */

export interface ReminderConfig {
  enabled: boolean
  /** 24 小时制小时 */
  hour: number
  minute: number
}

const REMINDER_KEY = 'kaoyan_checkin_reminder'
const NOTIFIED_KEY = 'kaoyan_checkin_notified_date'
export const REMINDER_PRESETS: { label: string; hour: number; minute: number }[] = [
  { label: '20:00', hour: 20, minute: 0 },
  { label: '21:00', hour: 21, minute: 0 },
  { label: '22:00', hour: 22, minute: 0 },
]

export function loadReminderConfig(): ReminderConfig {
  try {
    const raw = localStorage.getItem(REMINDER_KEY)
    if (!raw) return { enabled: false, hour: 21, minute: 0 }
    const parsed = JSON.parse(raw) as ReminderConfig
    return {
      enabled: Boolean(parsed.enabled),
      hour: typeof parsed.hour === 'number' ? parsed.hour : 21,
      minute: typeof parsed.minute === 'number' ? parsed.minute : 0,
    }
  } catch {
    return { enabled: false, hour: 21, minute: 0 }
  }
}

export function saveReminderConfig(cfg: ReminderConfig): ReminderConfig {
  const next = { enabled: cfg.enabled, hour: cfg.hour, minute: cfg.minute }
  try {
    localStorage.setItem(REMINDER_KEY, JSON.stringify(next))
  } catch {
    /* 忽略存储失败 */
  }
  return next
}

function todayKey(): string {
  // 用本地时区日期，避免 UTC 时区偏差（东八区 00:00-08:00 时段 toISOString 会落到前一天）
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 今天是否已经提醒过了（避免每开一次页面都弹） */
export function wasNotifiedToday(): boolean {
  try {
    return localStorage.getItem(NOTIFIED_KEY) === todayKey()
  } catch {
    return false
  }
}

export function markNotifiedToday(): void {
  try {
    localStorage.setItem(NOTIFIED_KEY, todayKey())
  } catch {
    /* 忽略 */
  }
}

/** 浏览器通知可用性 */
export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/** 请求通知权限（返回是否已授权） */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    const perm = await Notification.requestPermission()
    return perm === 'granted'
  } catch {
    return false
  }
}

/** 发送一条打卡提醒（失败时静默，不影响使用） */
export function notifyMissedCheckin(extra?: string): void {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  try {
    const n = new Notification('DiveDeep · 今日还没打卡', {
      body: `${extra ? extra + '；' : ''}记得今天也得记录学习哦 📚`,
      tag: 'divedeep-checkin-reminder',
    })
    n.onclick = () => {
      window.focus()
      try {
        window.location.hash = '#/my-records/new'
      } catch {
        /* 忽略 */
      }
    }
  } catch {
    /* 部分环境不支持构造 Notification，忽略 */
  }
}