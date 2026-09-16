import { useEffect } from 'react'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { App } from '@capacitor/app'
import { useAuth } from '../contexts/AuthContext'
import { useLogs } from '../contexts/LogsContext'
import { todayStr } from '../lib/dailyLogs'
import {
  loadReminderConfig,
  notifyMissedCheckin,
  markNotifiedToday,
  wasNotifiedToday,
  syncNativeReminderSchedule,
  cancelNativeReminderSchedule,
} from '../lib/reminder'

/**
 * 打卡断签提醒触发器（全局挂载，随 App 常驻）。
 * - Web/Tauri：已登录 + 开启提醒 + 过了提醒时间 + 今天尚未打卡 + 今天还没提醒过 → 弹浏览器通知。
 * - Android 原生：登录态/开关/时间/打卡状态变化或回到前台时，重建系统级「每日提醒」调度
 *   （App 关闭/杀后台也能按点送达），见 syncNativeReminderSchedule。
 */

/** 从日志构造「已打卡日期」集合（排除回收站软删除记录；yyyy-MM-dd 本地时区） */
function checkedDatesFromLogs(
  logs: { date: string; deleted_at: string | null }[],
): Set<string> {
  const set = new Set<string>()
  for (const l of logs) {
    if (!l.deleted_at) set.add(l.date)
  }
  return set
}

export default function CheckinReminder() {
  const { user } = useAuth()
  const { logs, loading } = useLogs()
  const isNative = Capacitor.isNativePlatform()

  // ── 原生路径：重建系统每日提醒调度 ──
  // 依赖 user/logs/loading，覆盖登录、登出、开关变化、打卡状态变化后的自动重算；
  // 未登录时调用以清理残留调度的通知。
  useEffect(() => {
    if (!isNative) return
    if (!user) {
      cancelNativeReminderSchedule()
      return
    }
    if (loading) return
    syncNativeReminderSchedule(user.id, checkedDatesFromLogs(logs))
  }, [isNative, user, logs, loading])

  // ── 原生路径：回到前台时重建调度（日志可能刚被刷新，避免跨端打卡后误提醒） ──
  useEffect(() => {
    if (!isNative) return
    let disposed = false
    let handle: PluginListenerHandle | undefined
    // addListener 返回 Promise，异步 resolve 出句柄后在 cleanup 中统一移除，避免竞态
    void App.addListener('appStateChange', (state) => {
      if (disposed || loading || !user || !state.isActive) return
      syncNativeReminderSchedule(user.id, checkedDatesFromLogs(logs))
    }).then((h) => {
      if (disposed) h.remove()
      else handle = h
    })
    return () => {
      disposed = true
      handle?.remove()
    }
  }, [isNative, user, logs, loading])

  // ── Web/Tauri 路径：原有浏览器通知逻辑保持不变（原生用上面的系统提醒，无需再弹 Web 通知） ──
  useEffect(() => {
    if (isNative) return
    if (!user || loading) return
    const cfg = loadReminderConfig()
    if (!cfg.enabled) return

    const alreadyChecked = logs.some((l) => l.date === todayStr())
    if (alreadyChecked) {
      markNotifiedToday()
      return
    }
    if (wasNotifiedToday()) return

    const now = new Date()
    const currentMin = now.getHours() * 60 + now.getMinutes()
    const remindMin = cfg.hour * 60 + cfg.minute
    if (currentMin < remindMin) return

    markNotifiedToday()
    notifyMissedCheckin('今天的学习记录还空着')
  }, [isNative, user, logs, loading])

  return null
}