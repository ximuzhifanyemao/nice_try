import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLogs } from '../contexts/LogsContext'
import { todayStr } from '../lib/dailyLogs'
import {
  loadReminderConfig,
  notifyMissedCheckin,
  markNotifiedToday,
  wasNotifiedToday,
} from '../lib/reminder'

/**
 * 打卡断签提醒触发器（全局挂载，随 App 常驻）。
 * 已登录 + 开启提醒 + 过了提醒时间 + 今天尚未打卡 + 今天还没提醒过 → 弹系统通知。
 * 已打卡时顺带标记，避免重复逻辑。
 */
export default function CheckinReminder() {
  const { user } = useAuth()
  const { logs, loading } = useLogs()

  useEffect(() => {
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
  }, [user, logs, loading])

  return null
}