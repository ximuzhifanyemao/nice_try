import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Capacitor } from '@capacitor/core'
import { useAuth } from '../contexts/AuthContext'
import { useLogs } from '../contexts/LogsContext'
import { useToast } from '../lib/Toast'
import { getCurrentTheme, setTheme as persistTheme, THEMES, type ThemeMode } from '../lib/theme'
import { getProgressStyle, setProgressStyle, PROGRESS_STYLES } from '../lib/progressStyle'
import {
  getWidgetOrientation,
  setWidgetOrientation,
  subscribeWidgetOrientation,
  type WidgetOrientation,
} from '../lib/widgetOrientation'
import TimerScale from '../components/TimerScale'
import { Icon } from '../components/Icon'
import { BlueIcons } from '../components/BlueCircleIcon'
import { fetchUserSettings, saveUserSettings } from '../lib/settings'
import {
  clearAiConfig,
  isAiConfigured,
  loadAiConfig,
  saveAiConfig,
  testAiConfig,
  type AiConfig,
} from '../lib/aiModel'
import {
  loadReminderConfig,
  saveReminderConfig,
  requestNotificationPermission,
  requestNativeNotificationPermission,
  getNotificationPermission,
  isDesktopApp,
  syncNativeReminderSchedule,
  cancelNativeReminderSchedule,
  notificationsSupported,
  REMINDER_PRESETS,
  type ReminderConfig,
} from '../lib/reminder'
import { useWideLayout } from '../App'

type SettingsCategory = 'appearance' | 'progress' | 'reminder' | 'countdown' | 'ai'

/**
 * 桌面端偏好窗口的左侧分类。
 * 桌面软件的设置是「左边一栏分类、右边只显示选中那一类」，
 * 而不是手机那种把四块卡片一路往下堆成一长条。
 */
const CATEGORIES: { key: SettingsCategory; label: string; icon: ReactNode }[] = [
  { key: 'appearance', label: '外观', icon: BlueIcons.sun },
  { key: 'progress', label: '进度条', icon: <Icon name="chart" size={16} /> },
  { key: 'reminder', label: '提醒', icon: <Icon name="bell" size={16} /> },
  { key: 'countdown', label: '倒计时', icon: <Icon name="clock" size={16} /> },
  { key: 'ai', label: 'AI 模型', icon: <Icon name="sparkles" size={16} /> },
]

/** 横向胶囊条缩略图（设置页「简洁模式方向」预览） */
function HorizontalCapsulePreview() {
  return (
    <span className="flex h-3.5 w-[88px] items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-1.5 dark:border-slate-600 dark:bg-slate-800">
      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
      <span className="h-1 w-7 rounded-full bg-slate-300 dark:bg-slate-600" />
      <span className="ml-auto h-2.5 w-2.5 rounded-full bg-indigo-500" />
    </span>
  )
}

/** 竖向窄条缩略图：细长竖条 + 底部按钮，示意「贴着任务栏那一列」 */
function VerticalCapsulePreview() {
  return (
    <span className="flex h-12 w-4 flex-col items-center gap-1 rounded-full border border-slate-300 bg-slate-50 py-1 dark:border-slate-600 dark:bg-slate-800">
      <span className="h-1 w-1 rounded-full bg-indigo-500" />
      <span className="w-[2px] flex-1 rounded-full bg-slate-300 dark:bg-slate-600" />
      <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
      <span className="h-2 w-2 rounded-full bg-indigo-500" />
    </span>
  )
}

export default function Settings() {
  const wide = useWideLayout()
  const { user } = useAuth()
  const { logs } = useLogs()
  const toast = useToast()
  const userId = user?.id
  const isNative = Capacitor.isNativePlatform()
  /** 电脑程序（Tauri）：通知走系统 Toast，文案里不能再说「浏览器设置」 */
  const isDesktop = isDesktopApp()

  /** 桌面端当前选中的设置分类（手机端不使用） */
  const [cat, setCat] = useState<SettingsCategory>('appearance')

  /* ── 倒计时设置 ── */
  const [title, setTitle] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  /* ── AI 模型设置（仅保存在本机） ── */
  const [aiConfig, setAiConfig] = useState<AiConfig>(() => loadAiConfig())
  const [aiTesting, setAiTesting] = useState(false)
  const [aiTestError, setAiTestError] = useState<string | null>(null)
  const [aiTestReply, setAiTestReply] = useState<string | null>(null)
  const [aiSaved, setAiSaved] = useState(false)

  /* ── 主题状态 ── */
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getCurrentTheme())

  /* ── 进度条样式 ── */
  const [progressStyle, setProgressStyleState] = useState(() => getProgressStyle())

  /* ── 简洁模式方向（横向胶囊 / 竖向窄条） ── */
  const [orientation, setOrientationState] = useState<WidgetOrientation>(() => getWidgetOrientation())

  useEffect(() => subscribeWidgetOrientation(setOrientationState), [])

  /* ── 打卡提醒设置 ── */
  const [reminder, setReminder] = useState<ReminderConfig>(() => loadReminderConfig())
  const [notifOk, setNotifOk] = useState<boolean | null>(null)
  /** 当前环境是否有可用的通知通道（电脑程序由系统通知插件提供，恒为可用） */
  const [notifSupported, setNotifSupported] = useState(() => notificationsSupported())

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

  // 授权状态异步读取（电脑程序读系统通知权限，浏览器读 Notification.permission）
  useEffect(() => {
    let cancelled = false
    void getNotificationPermission().then((state) => {
      if (cancelled) return
      setNotifSupported(state !== 'unsupported')
      setNotifOk(state === 'granted')
    })
    return () => {
      cancelled = true
    }
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

  const handleSaveAi = () => {
    const saved = saveAiConfig(aiConfig)
    setAiConfig(saved)
    setAiSaved(true)
    setAiTestError(null)
    toast.show('AI 模型设置已保存', { icon: '✅' })
    setTimeout(() => setAiSaved(false), 1800)
  }

  const handleTestAi = async () => {
    setAiTesting(true)
    setAiTestError(null)
    setAiTestReply(null)
    try {
      const reply = await testAiConfig(aiConfig)
      setAiTestReply(reply.trim().slice(0, 80))
    } catch (err) {
      setAiTestError(err instanceof Error ? err.message : '连接失败')
    } finally {
      setAiTesting(false)
    }
  }

  const handleClearAi = () => {
    clearAiConfig()
    setAiConfig({ baseUrl: '', apiKey: '', model: '' })
    setAiTestError(null)
    setAiTestReply(null)
    setAiSaved(false)
    toast.show('已清除本机 AI 模型设置', { icon: '🧹' })
  }

  const handleToggleReminder = async (nextEnabled: boolean) => {
    if (!nextEnabled) {
      setReminder(saveReminderConfig({ ...reminder, enabled: false }))
      // 原生端：关闭后清理系统每日提醒调度
      if (isNative && userId) void cancelNativeReminderSchedule()
      return
    }
    // 开启提醒前先征得通知授权：
    // Android 走系统通知权限；电脑程序（系统 Toast）与浏览器（Web Notification）走同一入口
    const granted = isNative
      ? await requestNativeNotificationPermission()
      : await requestNotificationPermission()
    if (!granted) {
      setNotifOk(false)
      toast.show(
        isNative
          ? '需要允许通知权限才能收到打卡提醒'
          : isDesktop
            ? '通知权限被拒，请在 Windows「设置 → 系统 → 通知」中允许 DiveDeep 发送通知'
            : '通知权限被拒，无法提醒。请在浏览器设置中允许通知',
        { icon: '🔕' },
      )
      return
    }
    setNotifOk(true)
    setReminder(saveReminderConfig({ ...reminder, enabled: true }))
    // 原生端：开启后重建系统每日提醒调度
    if (isNative && userId) rebuildNativeSchedule()
    toast.show('打卡提醒已开启', { icon: '🔔' })
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
    <div className={`mx-auto ${wide ? 'max-w-[1280px]' : 'max-w-2xl'} px-4 py-4`}>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">设置</h1>
        {wide && (
          <p className="text-xs text-gray-400 dark:text-slate-500">外观 · 进度条 · 提醒 · 倒计时 · AI 模型</p>
        )}
      </div>

      <div className={wide ? 'grid grid-cols-[190px_minmax(0,1fr)] items-start gap-5' : 'space-y-4'}>
        {/* 桌面端：左侧分类导航（偏好窗口形态）；手机端不渲染，四块卡片顺次铺开 */}
        {wide && (
          <nav className="sticky top-1 space-y-0.5" aria-label="设置分类">
            {CATEGORIES.map((c) => {
              const active = cat === c.key
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCat(c.key)}
                  aria-current={active ? 'true' : undefined}
                  className={`relative flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                    active
                      ? 'bg-indigo-50 font-medium text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-slate-100'
                  }`}
                >
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-500 dark:bg-indigo-400"
                      aria-hidden="true"
                    />
                  )}
                  <span className="shrink-0">{c.icon}</span>
                  <span className="truncate">{c.label}</span>
                </button>
              )
            })}
          </nav>
        )}

        {/* 内容区：桌面端只显示选中的那一类，手机端保持四块全显示 */}
        <div className={wide ? 'min-w-0 max-w-[900px] space-y-4' : 'space-y-4'}>
          {/* 显示偏好 */}
          {(!wide || cat === 'appearance') && (
          <>
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

          {/* 简洁模式方向：横向胶囊条 / 竖向窄条（宽度自动匹配左侧任务栏） */}
          <div className="card p-4">
            <p className="text-sm font-medium text-gray-800 dark:text-slate-100">简洁模式方向</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              横向是细长胶囊条；竖向是贴在屏幕左侧的窄条，宽度自动取任务栏厚度
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(
                [
                  { key: 'horizontal', name: '横向胶囊', desc: '细长条，适合放在屏幕上方 / 下方' },
                  { key: 'vertical', name: '竖向窄条', desc: '宽度与左侧任务栏一致，竖着贴边' },
                ] as const
              ).map((o) => {
                const active = orientation === o.key
                return (
                  <button
                    key={o.key}
                    onClick={() => setOrientationState(setWidgetOrientation(o.key))}
                    aria-pressed={active}
                    className={`flex cursor-pointer flex-col rounded-xl border p-2.5 text-left transition-colors ${
                      active
                        ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-500/10'
                        : 'border-gray-200 hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-500/40'
                    }`}
                  >
                    <span className="flex h-14 items-center justify-center rounded-lg bg-white/60 dark:bg-slate-900/40">
                      {o.key === 'horizontal' ? <HorizontalCapsulePreview /> : <VerticalCapsulePreview />}
                    </span>
                    <span className="mt-2 flex items-center gap-1.5">
                      <span className="text-sm font-medium text-gray-800 dark:text-slate-100">{o.name}</span>
                      {active && <span className="text-xs text-indigo-500 dark:text-indigo-300">✓</span>}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-gray-400 dark:text-slate-500">{o.desc}</span>
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-[11px] text-gray-400 dark:text-slate-500">
              切换后回到简洁模式即按新方向显示；竖向宽度会按当前显示器左侧任务栏的厚度自动取值。
            </p>
          </div>
          </>
          )}

          {/* 今日进度条样式 */}
          {(!wide || cat === 'progress') && (
          <div className="card p-4">
            <p className="text-sm font-medium text-gray-800 dark:text-slate-100">今日进度条样式</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              简洁模式胶囊条与全部功能计时页共用同一种样式，目标线为琥珀色（预览按今日 7.2h / 目标 6h 绘制）
            </p>
            <div className="mt-3 space-y-2">
              {PROGRESS_STYLES.map((s) => {
                const active = progressStyle === s.key
                return (
                  <button
                    key={s.key}
                    onClick={() => setProgressStyleState(setProgressStyle(s.key))}
                    aria-pressed={active}
                    className={`flex w-full cursor-pointer flex-col gap-2 rounded-xl border p-3 text-left transition-colors sm:flex-row sm:items-center sm:gap-4 ${
                      active
                        ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-500/10'
                        : 'border-gray-200 hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-500/40'
                    }`}
                  >
                    <span className="flex shrink-0 justify-center sm:w-[180px]">
                      <TimerScale variant={s.key} hours={7.2} linePct={60} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-800 dark:text-slate-100">{s.name}</span>
                        {active && <span className="text-xs text-indigo-500 dark:text-indigo-300">✓</span>}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-gray-400 dark:text-slate-500">{s.desc}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          )}

          {/* 打卡提醒 */}
          {(!wide || cat === 'reminder') && (
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

            {!notifSupported && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 rounded-lg bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1.5">
                当前环境不支持系统通知，提醒功能不可用。
              </p>
            )}
            {reminder.enabled && notifOk === false && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 rounded-lg bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1.5">
                {isNative
                  ? '通知权限未开启：请在系统设置中允许本应用发送通知。'
                  : isDesktop
                    ? '通知权限未开启：请在 Windows「设置 → 系统 → 通知」中允许 DiveDeep 发送通知。'
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
                    : isDesktop
                      ? '提醒在 DiveDeep 运行期间生效，到点弹系统通知。打卡后当天不再提醒。'
                      : '提醒只在打开 DiveDeep 时生效（如浏览器标签页开着）。打卡后当天不再提醒。'}
                </p>
              </div>
            )}
          </div>
          )}

          {/* 首页倒计时 */}
          {(!wide || cat === 'countdown') && (
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100 mb-3">首页倒计时</h3>
            <div className={wide ? 'grid grid-cols-2 gap-3 mb-3' : ''}>
              <div>
                <label className="label text-xs">倒计时标题（显示在数字上方）</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="如：距离目标还有 / 距离考试还有"
                  className={`input ${wide ? '' : 'mb-3'}`}
                />
              </div>
              <div>
                <label className="label text-xs">目标日期</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className={`input ${wide ? '' : 'mb-3'}`}
                />
              </div>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={settingsSaving}
              className="btn-primary px-5 py-2"
            >
              {settingsSaving ? '保存中...' : settingsSaved ? '✓ 已保存' : '保存设置'}
            </button>
          </div>
          )}

          {/* AI 模型（查词 / 翻译批改） */}
          {(!wide || cat === 'ai') && (
          <div className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100">AI 模型（查词 / 翻译批改）</h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                  兼容 OpenAI Chat Completions 接口；密钥只保存在本机，不会上传云端
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  isAiConfigured(aiConfig)
                    ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300'
                    : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'
                }`}
              >
                {isAiConfigured(aiConfig) ? '已配置' : '未配置'}
              </span>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <label className="label text-xs">接口地址（Base URL 或完整 URL）</label>
                <input
                  value={aiConfig.baseUrl}
                  onChange={(e) => setAiConfig((prev) => ({ ...prev, baseUrl: e.target.value }))}
                  placeholder="https://api.deepseek.com"
                  className="input"
                />
              </div>
              <div className={wide ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
                <div>
                  <label className="label text-xs">API Key（仅存本机，可留空）</label>
                  <input
                    type="password"
                    value={aiConfig.apiKey}
                    onChange={(e) => setAiConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="sk-..."
                    className="input"
                  />
                </div>
                <div>
                  <label className="label text-xs">模型名称</label>
                  <input
                    value={aiConfig.model}
                    onChange={(e) => setAiConfig((prev) => ({ ...prev, model: e.target.value }))}
                    placeholder="deepseek-chat"
                    className="input"
                  />
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-gray-400 dark:text-slate-500">
                填 DeepSeek 可写 https://api.deepseek.com，模型 deepseek-chat；Ollama 可写
                http://localhost:11434/v1，Key 留空。Web 端可能受目标服务 CORS 限制，桌面端 / 安卓端走原生网络更稳。
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button onClick={handleSaveAi} className="btn-primary px-4 py-2">
                  {aiSaved ? '✓ 已保存' : '保存设置'}
                </button>
                <button
                  onClick={handleTestAi}
                  disabled={aiTesting || !isAiConfigured(aiConfig)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {aiTesting ? '连接中…' : '测试连接'}
                </button>
                <button
                  onClick={handleClearAi}
                  className="px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:text-red-600 dark:text-red-400"
                >
                  清除本机配置
                </button>
              </div>

              {aiTestError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-600 dark:bg-red-500/10 dark:text-red-300">
                  连接失败：{aiTestError}
                </p>
              )}
              {aiTestReply && (
                <p className="rounded-lg bg-green-50 px-3 py-2 text-xs leading-relaxed text-green-700 dark:bg-green-500/10 dark:text-green-300">
                  连接成功，模型回复：{aiTestReply}
                </p>
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}