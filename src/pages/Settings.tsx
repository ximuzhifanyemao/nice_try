import { useCallback, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { useAuth } from '../contexts/AuthContext'
import { useLogs } from '../contexts/LogsContext'
import { useToast } from '../lib/Toast'
import { getCurrentTheme, setTheme as persistTheme, THEMES, type ThemeMode } from '../lib/theme'
import { fetchUserSettings, saveUserSettings } from '../lib/settings'
import {
  loadReminderConfig,
  saveReminderConfig,
  requestNotificationPermission,
  requestNativeNotificationPermission,
  syncNativeReminderSchedule,
  cancelNativeReminderSchedule,
  notificationsSupported,
  REMINDER_PRESETS,
  type ReminderConfig,
} from '../lib/reminder'
import { useWideLayout } from '../App'

export default function Settings() {
  const wide = useWideLayout()
  const { user } = useAuth()
  const { logs } = useLogs()
  const toast = useToast()
  const userId = user?.id
  const isNative = Capacitor.isNativePlatform()

  /* ── 倒计时设置 ── */
  const [title, setTitle] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  /* ── 主题状态 ── */
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getCurrentTheme())

  /* ── 打卡提醒设置 ── */
  const [reminder, setReminder] = useState<ReminderConfig>(() => loadReminderConfig())
  const [notifOk, setNotifOk] = useState<boolean | null>(null)

  const loadSettings = useCallback(async () => {
    if (!userId) return
    try {
      const s = await fetchUserSettings(userId)
      setTitle(s.countdown_title)
      setTargetDate(s.target_date ?? '')
    } catch {
      /* 忽略读取失败 */
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    loadSettings()
  }, [userId, loadSettings])

  useEffect(() => {
    if (!notificationsSupported()) return
    setNotifOk(Notification.permission === 'granted')
  }, [reminder.enabled])

  const handleSaveSettings = async () => {
    if (!userId) return
    setSettingsSaving(true)
    setSettingsSaved(false)
    try {
      await saveUserSettings(userId, { countdown_title: title, target_date: targetDate || null })
      setSettingsSaved(true)
    } catch (err) {
      toast.show('保存失败：' + (err instanceof Error ? err.message : '未知错误'), { icon: '❌' })
    } finally {
      setSettingsSaving(false)
    }
  }

  const handleToggleReminder = async (nextEnabled: boolean) => {
    // 开启提醒前先征得通知授权
    let granted = true
    if (nextEnabled && isNative) {
      // 原生端走系统通知权限
      granted = await requestNativeNotificationPermission()
    } else if (nextEnabled && notificationsSupported()) {
      if (Notification.permission === 'default') {
        granted = await requestNotificationPermission()
      } else if (Notification.permission === 'denied') {
        granted = false
      }
    }
    if (nextEnabled && !granted) {
      setNotifOk(false)
      toast.show(
        isNative ? '需要允许通知权限才能收到打卡提醒' : '通知权限被拒，无法提醒。请在浏览器设置中允许通知',
        { icon: '🔕' },
      )
      return
    }
    setNotifOk(isNative ? granted : notificationsSupported() && Notification.permission === 'granted')
    setReminder(saveReminderConfig({ ...reminder, enabled: nextEnabled }))
    // 原生端：开启/关闭后重建（或清理）系统每日提醒调度
    if (isNative && userId) {
      if (nextEnabled) rebuildNativeSchedule()
      else void cancelNativeReminderSchedule()
    }
    if (nextEnabled) toast.show('打卡提醒已开启', { icon: '🔔' })
  }

  /** 自定义提醒时间（预设之外的时间段，如 23:30 / 07:00） */
  const handleCustomTime = (value: string) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(value)
    if (!m) return
    const hour = Number(m[1])
    const minute = Number(m[2])
    if (hour > 23 || minute > 59) return
    setReminder(saveReminderConfig({ ...reminder, hour, minute }))
    rebuildNativeSchedule()
  }

  const handlePickPreset = (hour: number, minute: number) => {
    setReminder(saveReminderConfig({ ...reminder, hour, minute }))
    rebuildNativeSchedule()
    toast.show(`提醒时间设为 ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`, { icon: '⏰' })
  }

  /** 原生端重建系统每日提醒调度（内部会读取最新配置；仅原生 + 已登录时生效） */
  const rebuildNativeSchedule = useCallback(() => {
    if (!isNative || !userId) return
    const checkedDates = new Set(
      logs.filter((l) => !l.deleted_at).map((l) => l.date),
    )
    void syncNativeReminderSchedule(userId, checkedDates)
  }, [isNative, userId, logs])

  return (
    <div className={`mx-auto ${wide ? 'max-w-[1280px]' : 'max-w-2xl'} px-4 py-4 space-y-4`}>
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">设置</h1>
      </div>

      {/* 显示偏好 */}
      <div className="card p-4">
        <p className="text-sm font-medium text-gray-800 dark:text-slate-100">显示模式</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
          晨光 / 暮色 / 午夜繁星为背景风格，会同步调整卡片与按钮的基调色；强调色随浅色 / 深色主题
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.key}
              onClick={() => setThemeMode(persistTheme(t.key))}
              className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-colors cursor-pointer ${
                themeMode === t.key
                  ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-500/10'
                  : 'border-gray-200 hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-500/40'
              }`}
            >
              <span
                className="h-6 w-6 shrink-0 rounded-full border border-black/10 dark:border-white/20"
                style={{ background: t.swatch }}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-gray-800 dark:text-slate-100">{t.name}</span>
                <span className="block text-[11px] text-gray-400 dark:text-slate-500">{t.desc}</span>
              </span>
              {themeMode === t.key && (
                <span className="ml-auto mr-1 text-indigo-500 dark:text-indigo-300">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 打卡提醒 */}
      <div className="card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-slate-100">打卡提醒</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              当天还没打卡时，到点给你发系统通知
            </p>
          </div>
          {/* 开关 */}
          <button
            role="switch"
            aria-checked={reminder.enabled}
            onClick={() => handleToggleReminder(!reminder.enabled)}
            className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${
              reminder.enabled ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-gray-200 dark:bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                reminder.enabled ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {!notificationsSupported() && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 rounded-lg bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1.5">
            当前环境不支持系统通知，提醒功能不可用。
          </p>
        )}
        {reminder.enabled && notifOk === false && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 rounded-lg bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1.5">
            {isNative
              ? '通知权限未开启：请在系统设置中允许本应用发送通知。'
              : '通知权限未开启：请在浏览器地址栏左侧点击 🔔 图标，允许本站发送通知。'}
          </p>
        )}

        {reminder.enabled && (
          <div className="mt-3">
            <p className="mb-1.5 text-xs text-gray-500 dark:text-slate-400">提醒时间</p>
            <div className="flex flex-wrap gap-2">
              {REMINDER_PRESETS.map((p) => {
                const active = reminder.hour === p.hour && reminder.minute === p.minute
                return (
                  <button
                    key={p.label}
                    onClick={() => handlePickPreset(p.hour, p.minute)}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label htmlFor="reminder-time" className="text-xs text-gray-500 dark:text-slate-400">
                自定义时间
              </label>
              <input
                id="reminder-time"
                type="time"
                value={`${String(reminder.hour).padStart(2, '0')}:${String(reminder.minute).padStart(2, '0')}`}
                onChange={(e) => handleCustomTime(e.target.value)}
                className="input h-8 w-auto py-0 text-xs"
              />
            </div>
            <p className="mt-2 text-[11px] text-gray-400 dark:text-slate-500">
              {isNative
                ? '关闭 App 也能收到提醒（Android 8+ 可能有少量延迟）。打卡后当天不再提醒。'
                : '提醒只在打开 DiveDeep 时生效（如浏览器标签页开着）。打卡后当天不再提醒。'}
            </p>
          </div>
        )}
      </div>

      {/* 首页倒计时 */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100 mb-3">首页倒计时</h3>
        <label className="label text-xs">倒计时标题（显示在数字上方）</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="如：距离目标还有 / 距离考试还有"
          className="input mb-3"
        />
        <label className="label text-xs">目标日期</label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="input mb-3"
        />
        <button
          onClick={handleSaveSettings}
          disabled={settingsSaving}
          className="btn-primary px-5 py-2"
        >
          {settingsSaving ? '保存中...' : settingsSaved ? '✓ 已保存' : '保存设置'}
        </button>
      </div>
    </div>
  )
}