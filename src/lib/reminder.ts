import type { LocalNotificationSchema } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'
import { isTauri } from '@tauri-apps/api/core'

/**
 * 打卡提醒配置（设备本地，不随账号同步）。
 * 提醒时机：设置了提醒 && 已登录 && 当天尚未打卡 && 已过提醒时间 && 今天尚未提醒过。
 */

// ── 原生（Android）端本地通知调度 ──
// 说明：电脑程序（Tauri）走系统通知插件，浏览器走 Web Notification（见 notifyMissedCheckin）。
// Android 端改用 @capacitor/local-notifications 做系统级「每日提醒」，
// App 关闭/杀后台时也能按调度送达。这里用「固定 id 区间」调度，
// 登录态/开关/时间/打卡状态变化后整体 cancel+schedule 重建，天然幂等。

// 原生端「每日打卡提醒」通知 id 起点；配合固定数量使用固定 id 区间，便于批量取消/重建
export const NATIVE_REMINDER_ID_BASE = 5000
/** 未来 7 天，每天一条 → 固定占用 [BASE, BASE + 6] 区间 */
const NATIVE_REMINDER_ID_COUNT = 7
// 调度区间内全部 id，批量取消时用
const nativeReminderIds = () =>
  Array.from({ length: NATIVE_REMINDER_ID_COUNT }, (_, i) => ({ id: NATIVE_REMINDER_ID_BASE + i }))

/** 给定 Date 返回本地时区日期（yyyy-MM-dd），与 todayStr() 一致 */
function nativeLocalDateStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 请求原生通知权限（已授权=true；未授权或用户永拒=false；失败静默） */
export async function requestNativeNotificationPermission(): Promise<boolean> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const status = await LocalNotifications.checkPermissions()
    if (status.display === 'granted') return true
    if (status.display === 'denied') return false
    const req = await LocalNotifications.requestPermissions()
    return req.display === 'granted'
  } catch {
    return false
  }
}

/** 取消原生端「每日打卡提醒」区间内全部保留通知（仅原生平台生效，Web/Tauri 为 no-op） */
export async function cancelNativeReminderSchedule(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: nativeReminderIds() })
  } catch {
    /* 忽略 */
  }
}

/**
 * 同步原生「每日打卡提醒」调度（仅 Android/Capacitor 原生平台生效）：
 * - 未启用提醒 → 取消区间内全部保留通知后返回
 * - 已启用 → 权限 OK 后，对未来 7 天（含今天）未打卡的每一天
 *   在「本地时区当天 hour:minute」各排一条通知（today 提醒时间已过则从明天开始）；
 *   先清空区间旧 id 再统一写入，保证幂等。
 * @param userId 当前用户 id（仅用于语义上按账号重建，配置本身设备本地）
 * @param checkedDates 已打卡日期集合（yyyy-MM-dd，本地时区）
 */
export async function syncNativeReminderSchedule(
  userId: string,
  checkedDates: ReadonlySet<string>,
): Promise<void> {
  void userId // 配置按设备本地，userId 仅占位以明确为「当前账号」调度
  if (!Capacitor.isNativePlatform()) return
  const cfg = loadReminderConfig()

  // 动态导入避免在 Web/Tauri 侧加载原生插件，保证非原生行为完全不变
  const { LocalNotifications } = await import('@capacitor/local-notifications')

  // 先清旧，保证幂等；若未开启，清完即返回
  await LocalNotifications.cancel({ notifications: nativeReminderIds() })
  if (!cfg.enabled) return
  if (!(await requestNativeNotificationPermission())) return

  const notifications: LocalNotificationSchema[] = []
  const now = new Date()
  const currentMin = now.getHours() * 60 + now.getMinutes()
  const remindMin = cfg.hour * 60 + cfg.minute

  for (let i = 0; i < NATIVE_REMINDER_ID_COUNT; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
    const dateStr = nativeLocalDateStr(day)
    if (checkedDates.has(dateStr)) continue
    // 今天提醒时间已过 → 从明天开始排（避免排一个过去时刻立刻触发）
    if (i === 0 && currentMin >= remindMin) continue
    notifications.push({
      id: NATIVE_REMINDER_ID_BASE + i,
      title: 'DiveDeep · 今日还没打卡',
      body: '记得今天也得记录学习哦 📚',
      // 非精确闹钟：Android 8+ 可能在目标时刻后略有延迟，但无需额外闹钟权限
      isExactNotification: false,
      schedule: { at: new Date(day.getFullYear(), day.getMonth(), day.getDate(), cfg.hour, cfg.minute, 0), repeats: false },
      smallIcon: 'ic_stat_icon',
      iconColor: '#3b82f6',
    })
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications })
  }
}

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

/* ── 通知渠道分发（浏览器 / 电脑程序 / Android 三端一套入口） ──
   - 电脑程序（Tauri）：tauri-plugin-notification 的 Windows 原生 Toast
   - 浏览器：Web Notification（需用户授权，只在页面打开时生效）
   - Android：走上方的 local-notifications 每日调度
   Tauri 分支按需加载插件；若拿不到插件（例如安装包仍是未接入插件的旧版本），
   自动回退到浏览器方案，保证任何环境下都不会因缺插件而报错。 */

type TauriNotifApi = typeof import('@tauri-apps/plugin-notification')

let tauriNotifPromise: Promise<TauriNotifApi | null> | null = null

/** 按需加载 Tauri 系统通知插件；非电脑程序或插件不可用时返回 null */
function loadTauriNotif(): Promise<TauriNotifApi | null> {
  if (!isTauri()) return Promise.resolve(null)
  if (!tauriNotifPromise) {
    tauriNotifPromise = import('@tauri-apps/plugin-notification').catch(() => null)
  }
  return tauriNotifPromise
}

/**
 * 确认电脑程序的通知可用（并让插件把授权状态翻正）。
 *
 * Windows 没有系统级通知授权概念：插件的桌面实现恒返回 granted，但它的 JS 侧
 * 在本次会话首次 `requestPermission()` 之前会把 `Notification.permission` 误报为
 * denied（导致 `isPermissionGranted()` 返回 false）。桌面端 requestPermission 不会
 * 弹任何系统对话框，所以这里统一「先问一次再发」。
 */
async function ensureTauriPermission(api: TauriNotifApi): Promise<boolean> {
  try {
    if (await api.isPermissionGranted()) return true
    return (await api.requestPermission()) === 'granted'
  } catch {
    return false
  }
}

/** 是否运行在电脑程序（Tauri）里：用于把「浏览器设置」这类文案换成系统通知的说法 */
export function isDesktopApp(): boolean {
  return isTauri()
}

/** 通知授权状态：unsupported = 当前环境没有可用通道 */
export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

/** 浏览器通知可用性（电脑程序由系统通知插件提供，恒为可用） */
export function notificationsSupported(): boolean {
  if (isTauri()) return true
  return typeof window !== 'undefined' && 'Notification' in window
}

/** 读取当前通知授权状态（不触发任何请求） */
export async function getNotificationPermission(): Promise<NotificationPermissionState> {
  const tauri = await loadTauriNotif()
  // 电脑程序：桌面实现恒为已授权（Windows 没有系统级授权开关），直接按可用处理
  if (tauri) return 'granted'
  if (!notificationsSupported()) return 'unsupported'
  return Notification.permission as NotificationPermissionState
}

/** 请求通知权限（返回是否已授权；环境不支持或用户拒绝时返回 false） */
export async function requestNotificationPermission(): Promise<boolean> {
  const tauri = await loadTauriNotif()
  if (tauri) return ensureTauriPermission(tauri)
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

/** 发送一条系统通知：电脑程序走原生 Toast，浏览器走 Web Notification（失败时静默） */
export async function sendSystemNotification(title: string, body: string, tag?: string): Promise<void> {
  const tauri = await loadTauriNotif()
  if (tauri) {
    try {
      if (await ensureTauriPermission(tauri)) tauri.sendNotification({ title, body })
    } catch {
      /* 忽略发送失败 */
    }
    return
  }
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, tag })
  } catch {
    /* 部分环境不支持构造 Notification，忽略 */
  }
}

/** 发送一条打卡提醒（失败时静默，不影响使用） */
export function notifyMissedCheckin(extra?: string): void {
  const title = 'DiveDeep · 今日还没打卡'
  const body = `${extra ? extra + '；' : ''}记得今天也得记录学习哦 📚`
  void (async () => {
    const tauri = await loadTauriNotif()
    if (tauri) {
      try {
        if (await ensureTauriPermission(tauri)) tauri.sendNotification({ title, body })
      } catch {
        /* 忽略 */
      }
      return
    }
    if (!notificationsSupported() || Notification.permission !== 'granted') return
    try {
      const n = new Notification(title, { body, tag: 'divedeep-checkin-reminder' })
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
  })()
}