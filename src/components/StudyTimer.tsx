import { useState, useEffect, useRef, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import {
  batchDeleteUserSubjects,
  createUserSubject,
  deleteUserSubject,
  fetchUserSubjects,
  getActivitiesForSubject,
  getAvailableSubjects,
  getCategoryLabel,
  getSubjectById,
  hydrateUserSubjects,
  loadUserSubjects,
  recoverDeletedSubjects,
  updateUserSubject,
  type Subject,
  type UserSubject,
} from '../lib/subjects'
import { fetchLogByDate, isDuplicateDateError, sortSubjectsByStartTime, todayStr, upsertLogSafely, type DailyLogSubject } from '../lib/dailyLogs'
import { formatDateCn, formatDuration, formatDurationShort, pad, timeRangeHours, toTimeStr } from '../lib/format'
import { getButtonColor } from '../lib/colors'
import { useAuth } from '../contexts/AuthContext'
import { useLogs } from '../contexts/LogsContext'
import { useToast } from '../lib/Toast'
import { loadSharedTimer, saveSharedTimer, loadPendingTimer, clearPendingTimer } from '../lib/timerSync'
import { TimerForeground } from '../plugins/timer-foreground'
import { connectBleTimer, disconnectBleTimer, pushSubjects } from '../lib/bleTimer'


/* ── 类型 ── */
interface TimerState {
  subjectId: string | null
  activity: string
  startTime: number // Date.now()
  paused?: boolean // 是否暂停中（硬件 OK 键）
  pausedMs?: number // 累计已暂停的毫秒数
  pausedAt?: number | null // 本次暂停的开始时间戳
}

/** 一次计时会话的时间段（HH:mm） */
interface TimeRange {
  start: string
  end: string
}

/** 每个科目今日累计：总秒数 + 各次会话时间段 */
interface AccumEntry {
  seconds: number
  ranges: TimeRange[]
}

type AccumMap = Record<string, AccumEntry>

/* ── localStorage 持久化（进行中计时与精简挂件共享，见 lib/timerSync.ts） ── */
const ACCUM_KEY = 'kaoyan_timer_accum'
const ACCUM_DATE_KEY = 'kaoyan_timer_accum_date'

function loadAccum(): AccumMap {
  // 跨午夜不清空：保留累计数据，保存时归入开始学习的那天（补交）
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(ACCUM_KEY) || '{}')
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
    const migrated: AccumMap = {}
    for (const [key, value] of Object.entries(raw)) {
      // 旧格式：直接是数字秒数 → 迁移为 { seconds, ranges: [] }
      if (typeof value === 'number') {
        migrated[key] = { seconds: value, ranges: [] }
      } else if (
        typeof value === 'object' &&
        value !== null &&
        typeof (value as AccumEntry).seconds === 'number'
      ) {
        // 已是新格式
        migrated[key] = value as AccumEntry
      }
      // 其他非法值跳过
    }
    return migrated
  } catch {
    return {}
  }
}

function saveAccum(accum: AccumMap) {
  localStorage.setItem(ACCUM_KEY, JSON.stringify(accum))
}

/** 读取累计归属日期（这批学习时长属于哪一天），无累计时为 null */
function loadAccumDate(): string | null {
  return localStorage.getItem(ACCUM_DATE_KEY)
}

function loadRunningTimer(): TimerState | null {
  return loadSharedTimer() as TimerState | null
}

function saveRunningTimer(state: TimerState | null) {
  saveSharedTimer(state)
}

/* ── 工具 ── */

/** 累计键：科目::学习内容 */
function accumKey(subjectId: string, activity: string): string {
  return `${subjectId}::${activity}`
}

/** 属于 408 综合卷、支持汇总/分开两种显示的科目 id */
const AGG_408_IDS = ['ds', 'co', 'os', 'cn']

/**
 * 科目分组选择器：无分组 / 408 折叠组 / 自定义分组。
 * 选「408」的科目会像之前的内置专业课一样在计时区折叠展示。
 */
function GroupPicker({
  sel,
  custom,
  onSelChange,
  onCustomChange,
}: {
  sel: string
  custom: string
  onSelChange: (v: string) => void
  onCustomChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">分组（可选）</label>
      <select
        value={sel}
        onChange={(e) => onSelChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-800 dark:text-slate-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
      >
        <option value="">无分组</option>
        <option value="408">408（计算机专业基础综合）</option>
        <option value="__custom__">自定义分组…</option>
      </select>
      {sel === '__custom__' && (
        <input
          value={custom}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder="输入分组名，如：公共课"
          className="mt-2 w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-800 dark:text-slate-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
        />
      )}
      <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">
        选「408」会像之前的专业课一样折叠展示；也可以填自定义分组名。
      </p>
    </div>
  )
}

/* ── 番茄钟（与正计时并存，通过模式切换） ── */
/** 番茄钟模式记忆键 */
const MODE_KEY = 'kaoyan_timer_mode'
const POMO_FOCUS_KEY = 'kaoyan_pomo_focus_min'
const POMO_REST_KEY = 'kaoyan_pomo_rest_min'
/** 番茄钟原生本地通知 id：避开打卡提醒 5000-5006 区间 */
const POMO_FOCUS_END_ID = 6101
const POMO_REST_END_ID = 6102

/** 读取番茄钟专注时长（分钟），默认 25，非法值回退默认 */
function loadPomoFocusMin(): number {
  const raw = Number(localStorage.getItem(POMO_FOCUS_KEY))
  return raw > 0 && raw <= 240 ? Math.round(raw) : 25
}
function loadPomoRestMin(): number {
  const raw = Number(localStorage.getItem(POMO_REST_KEY))
  return raw >= 0 && raw <= 120 ? Math.round(raw) : 5
}

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
 * - Web/Tauri：beep + 浏览器通知（未授权则仅 beep）
 */
async function pomodoroNotify(kind: 'focus' | 'rest'): Promise<void> {
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
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, tag: 'divedeep-pomodoro' })
    } catch {
      /* 忽略 */
    }
  }
}

/** 毫秒 → MM:SS（番茄钟倒计时显示） */
function formatMmSs(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${pad(m)}:${pad(s)}`
}

/* ── 组件 ── */
export default function StudyTimer() {
  const { user } = useAuth()
  const { refetch } = useLogs()
  const toast = useToast()
  /* 可选择的科目（内置 + 自定义），随增删改实时刷新 */
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>(() => {
    hydrateUserSubjects(user?.id)
    return getAvailableSubjects()
  })
  /* 自定义科目列表（管理用） */
  const [customSubjects, setCustomSubjects] = useState<UserSubject[]>([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  /* 新增科目表单 */
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newActivities, setNewActivities] = useState('')
  const [creating, setCreating] = useState(false)
  /* 新增科目的分组（category）选择：''=无分组、'408'=408 折叠组、'__custom__'=自定义输入 */
  const [newCatSel, setNewCatSel] = useState('')
  const [newCatCustom, setNewCatCustom] = useState('')
  /* 正在编辑的科目 */
  const [editing, setEditing] = useState<UserSubject | null>(null)
  const [editActivities, setEditActivities] = useState('')
  /* 编辑中的分组选择（逻辑同上） */
  const [editCatSel, setEditCatSel] = useState('')
  const [editCatCustom, setEditCatCustom] = useState('')
  /* 批量删除：是否多选模式 + 勾选的科目 id（Set 更新时新建实例） */
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchDeleting, setBatchDeleting] = useState(false)

  /* 当前运行中的计时器 */
  const [running, setRunning] = useState<TimerState | null>(loadRunningTimer)
  /* 待选学习内容的科目 */
  const [pendingSubject, setPendingSubject] = useState<string | null>(null)
  /* 今日累计 */
  const [accum, setAccum] = useState<AccumMap>(loadAccum)
  /* 当前计时器已流逝的秒数（用于实时显示） */
  const [elapsed, setElapsed] = useState(0)
  /* 保存状态 */
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  /* 累计归属日期（补交：计时开始那天），无累计时为今天 */
  const [accumDate, setAccumDate] = useState<string>(() => loadAccumDate() ?? todayStr())

  /* ── 番茄钟模式（与正计时并存，通过模式切换） ── */
  const [mode, setMode] = useState<'stopwatch' | 'pomodoro'>(
    () => (localStorage.getItem(MODE_KEY) === 'pomodoro' ? 'pomodoro' : 'stopwatch'),
  )
  /* 专注/休息时长（分钟），记住选择 */
  const [pomoFocusMin, setPomoFocusMin] = useState<number>(loadPomoFocusMin)
  const [pomoRestMin, setPomoRestMin] = useState<number>(loadPomoRestMin)
  const [pomoCustomFocus, setPomoCustomFocus] = useState<number>(loadPomoFocusMin)
  /* 番茄钟运行状态机：idle 空闲 / focus 专注中 / rest 休息中 */
  const [pomoPhase, setPomoPhase] = useState<'idle' | 'focus' | 'rest'>('idle')
  const [pomoRunning, setPomoRunning] = useState(false) // false=已暂停
  const [pomoEndAt, setPomoEndAt] = useState<number | null>(null) // 当前阶段结束时间戳
  const [pomoStartAt, setPomoStartAt] = useState<number | null>(null) // 本次专注开始时间戳（用于记录时间段）
  const [pomoRemainMs, setPomoRemainMs] = useState(0) // 当前阶段剩余毫秒
  const [pomoPauseAt, setPomoPauseAt] = useState<number | null>(null) // 暂停开始时间戳
  const [pomoRound, setPomoRound] = useState(0) // 已完成的专注轮数
  const [pomoSubjectId, setPomoSubjectId] = useState<string | null>(null) // 番茄钟目标科目
  const [pomoActivity, setPomoActivity] = useState('') // 番茄钟目标学习内容
  const [pomoPendingSubject, setPomoPendingSubject] = useState<string | null>(null) // 待选学习内容的科目（番茄钟）
  /* 供倒计时中断回调引用的最新函数（避免闭包捕获过期状态） */
  const pomoFinishRef = useRef<() => void>(() => {})

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* ── BLE 计时器连接状态 ── */
  const [bleConnected, setBleConnected] = useState(false)
  /* 不自动搜索：仅点击「重新连接」时才发起蓝牙扫描 */
  const [bleSearching, setBleSearching] = useState(false)
  /* 最近一次连接/扫描失败的具体原因（用于定位问题） */
  const [bleError, setBleError] = useState<string | null>(null)
  /* 硬件上通过 OLED 菜单选中的科目（固件 SEL 事件） */
  const [bleSelectedSubject, setBleSelectedSubject] = useState<string | null>(null)
  /* 今日累计里 408 是否汇总显示 */
  const [agg408, setAgg408] = useState(true)
  /* 科目选择里 408 分组是否展开 */
  const [show408, setShow408] = useState(true)
  /* 始终指向最新的 handleStop，供 BLE/通知栏回调使用，避免闭包捕获过期状态 */
  const handleStopRef = useRef<() => void>(() => {})
  /* 硬件 BLE 事件的最新处理函数集合（每渲染更新，回调固定引用 ref 拿到最新） */
  const hardwareCbRef = useRef<{
    onStart: () => void
    onStop: () => void
    onPause: () => void
    onResume: () => void
    onSubjectSelected: (name: string) => void
    onDisconnect: () => void
  }>({
    onStart: () => {},
    onStop: () => {},
    onPause: () => {},
    onResume: () => {},
    onSubjectSelected: () => {},
    onDisconnect: () => {},
  })

  /* ── 监听通知栏"停止"按钮 ── */
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let removed = false
    const setup = async () => {
      const handle = await TimerForeground.addListener('timerStopped', () => {
        if (!removed && running) {
          handleStop()
        }
      })
      return handle
    }
    let handle: { remove: () => Promise<void> } | null = null
    setup().then((h) => { if (!removed) handle = h })
    return () => {
      removed = true
      if (handle) handle.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  /* ── BLE 计时器（原生 App）──
     不自动连接/扫描（避免一进页面就搜蓝牙打扰用户），
     只有在用户点击「重新连接」时才由 handleReconnectBle 发起扫描。 */
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    return () => {
      disconnectBleTimer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  /* ── 实时更新 elapsed ── */
  useEffect(() => {
    if (!running?.startTime) {
      setElapsed(0)
      return
    }
    const tick = () => {
      // 暂停期间时间不走：扣除已暂停时长；暂停中取暂停时刻
      const pausedMs = running.pausedMs ?? 0
      const now = running.paused ? (running.pausedAt ?? Date.now()) : Date.now()
      const e = Math.floor((now - running.startTime - pausedMs) / 1000)
      setElapsed(e)
      // 原生端同步更新通知栏显示
      if (Capacitor.isNativePlatform()) {
        const subjectName = running.subjectId
          ? (getSubjectById(running.subjectId)?.name ?? running.subjectId) +
            (running.activity ? ` · ${running.activity}` : '')
          : '学习中'
        TimerForeground.updateTimer({ subject: subjectName, elapsedSec: e })
      }
    }
    tick()
    intervalRef.current = setInterval(tick, 1000)
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current)
    }
  }, [running?.startTime, running?.subjectId, running?.activity, running?.paused, running?.pausedAt, running?.pausedMs])

  /* ── 开始计时 ── */
  const handleStart = (subjectId: string, activity: string) => {
    const state: TimerState = { subjectId, activity, startTime: Date.now() }
    setRunning(state)
    saveRunningTimer(state)
    // 若当前没有累计数据，将归属日期设为今天
    if (Object.keys(accum).length === 0) {
      localStorage.setItem(ACCUM_DATE_KEY, todayStr())
      setAccumDate(todayStr())
    }
    setPendingSubject(null)
    setSaved(false)
    // 原生端启动前台服务
    if (Capacitor.isNativePlatform()) {
      const subjectName = (getSubjectById(subjectId)?.name ?? subjectId) +
        (activity ? ` · ${activity}` : '')
      TimerForeground.startTimer({ subject: subjectName, startTimeMs: state.startTime })
    }
  }

  /* ── 结束计时 ── */
  const handleStop = useCallback(() => {
    if (!running) return
    // 暂停期间不计时：时长 = 开始到当前 - 累计暂停
    const pausedMs = running.pausedMs ?? 0
    const endNow = running.paused ? (running.pausedAt ?? Date.now()) : Date.now()
    const seconds = Math.floor((endNow - running.startTime - pausedMs) / 1000)
    if (seconds < 1) {
      // 小于 1 秒不记录，直接取消
      setRunning(null)
      saveRunningTimer(null)
      return
    }
    const key = accumKey(running.subjectId!, running.activity ?? '')
    const range: TimeRange = {
      start: toTimeStr(new Date(running.startTime)),
      end: toTimeStr(new Date(endNow)),
    }
    const prev = accum[key]
    const newAccum = { ...accum }
    newAccum[key] = {
      seconds: (prev?.seconds ?? 0) + seconds,
      ranges: [...(prev?.ranges ?? []), range],
    }
    setAccum(newAccum)
    saveAccum(newAccum)
    setRunning(null)
    saveRunningTimer(null)
    setSaved(false)
    // 原生端停止前台服务
    if (Capacitor.isNativePlatform()) {
      TimerForeground.stopTimer()
    }
  }, [running, accum])

  /* 每次渲染都把最新 handleStop 写入 ref，供 BLE/通知栏回调使用 */
  handleStopRef.current = handleStop

  /* ── 番茄钟：把一段专注时长计入「今日累计」 ──
     与正计时共用同一份 accum(/保存到今日记录)，复用现有持久化路径，不新开第二套。 */
  const addSessionToAccum = useCallback((subjectId: string, activity: string, seconds: number, startAt: number, endAt: number) => {
    const key = accumKey(subjectId, activity ?? '')
    const range: TimeRange = { start: toTimeStr(new Date(startAt)), end: toTimeStr(new Date(endAt)) }
    const prev = accum[key]
    const newAccum: AccumMap = { ...accum }
    newAccum[key] = {
      seconds: (prev?.seconds ?? 0) + seconds,
      ranges: [...(prev?.ranges ?? []), range],
    }
    // 累计原本为空：把归属日期设为今天
    if (Object.keys(accum).length === 0) {
      localStorage.setItem(ACCUM_DATE_KEY, todayStr())
      setAccumDate(todayStr())
    }
    setAccum(newAccum)
    saveAccum(newAccum)
  }, [accum])

  /** 回到空闲态（保留科目/轮数，便于开始下一轮） */
  const pomoToIdle = useCallback(() => {
    setPomoRunning(false)
    setPomoPhase('idle')
    setPomoEndAt(null)
    setPomoStartAt(null)
    setPomoRemainMs(0)
    setPomoPauseAt(null)
  }, [])

  /** 启动一轮专注（选择科目后调用） */
  const startPomodoro = useCallback((subjectId: string, activity: string) => {
    setPomoSubjectId(subjectId)
    setPomoActivity(activity)
    setPomoPendingSubject(null)
    const ms = pomoFocusMin * 60000
    setPomoPhase('focus')
    setPomoRunning(true)
    setPomoStartAt(Date.now())
    setPomoEndAt(Date.now() + ms)
    setPomoRemainMs(ms)
    setPomoPauseAt(null)
  }, [pomoFocusMin])

  /** 空闲态点「开始专注」：用已选科目启动 */
  const startPomodoroFocus = useCallback(() => {
    if (!pomoSubjectId || pomoPhase !== 'idle') return
    startPomodoro(pomoSubjectId, pomoActivity)
  }, [pomoSubjectId, pomoActivity, pomoPhase, startPomodoro])

  /** 暂停/恢复 */
  const togglePomodoroPause = useCallback(() => {
    if (pomoRunning) {
      setPomoPauseAt(Date.now())
      setPomoRunning(false)
    } else {
      // 恢复：把暂停时长顺延到结束时间戳，保证累计倒计时不因暂停而失真
      if (pomoPauseAt != null && pomoEndAt != null) {
        setPomoEndAt(pomoEndAt + (Date.now() - pomoPauseAt))
      }
      setPomoRunning(true)
      setPomoPauseAt(null)
    }
  }, [pomoRunning, pomoPauseAt, pomoEndAt])

  /** 跳过休息：直接回到空闲，开始下一轮（不记录休息） */
  const skipRest = useCallback(() => {
    if (pomoPhase !== 'rest') return
    pomoToIdle()
  }, [pomoPhase, pomoToIdle])

  /** 放弃：专注中按实际流逝时长入账后回空闲；休息中直接回空闲 */
  const abandonPomodoro = useCallback(() => {
    if (pomoPhase === 'focus' && pomoSubjectId && pomoStartAt != null) {
      const totalMs = pomoFocusMin * 60000
      const securedMs = totalMs - Math.max(0, pomoRemainMs)
      if (securedMs >= 1000) {
        const endNow = Math.min(Date.now(), (pomoEndAt ?? Date.now()))
        addSessionToAccum(pomoSubjectId, pomoActivity, Math.round(securedMs / 1000), pomoStartAt, endNow)
      }
    }
    pomoToIdle()
  }, [pomoPhase, pomoSubjectId, pomoActivity, pomoStartAt, pomoFocusMin, pomoRemainMs, pomoEndAt, addSessionToAccum, pomoToIdle])

  /** 阶段结束：专注完成→记录+通知→进休息；休息结束→通知→回空闲 */
  const finishPomoPhase = useCallback(() => {
    if (pomoPhase === 'focus') {
      // 本轮专注时长计入当日累计（复用同 accum → 「保存到今日记录」落库）
      if (pomoSubjectId && pomoStartAt != null) {
        const totalMs = pomoFocusMin * 60000
        const focusedSec = Math.max(1, Math.round((totalMs - Math.max(0, pomoRemainMs)) / 1000))
        const endNow = Date.now()
        addSessionToAccum(pomoSubjectId, pomoActivity, focusedSec, pomoStartAt, endNow)
      }
      setPomoRound((r) => r + 1)
      void pomodoroNotify('focus')
      if (pomoRestMin > 0) {
        // 自动进入休息倒计时
        const restMs = pomoRestMin * 60000
        setPomoPhase('rest')
        setPomoRunning(true)
        setPomoStartAt(null)
        setPomoEndAt(Date.now() + restMs)
        setPomoRemainMs(restMs)
        setPomoPauseAt(null)
      } else {
        pomoToIdle()
      }
    } else if (pomoPhase === 'rest') {
      void pomodoroNotify('rest')
      pomoToIdle()
    }
  }, [pomoPhase, pomoSubjectId, pomoActivity, pomoStartAt, pomoFocusMin, pomoRemainMs, pomoRestMin, addSessionToAccum, pomoToIdle])

  /* 每次渲染把最新 finishPomoPhase 写入 ref，倒计时中断回调始终拿到最新 */
  pomoFinishRef.current = finishPomoPhase

  /* ── 番茄钟倒计时：专注/休息阶段到点自动切换 ── */
  useEffect(() => {
    if (!pomoRunning || pomoEndAt == null) return
    const tick = () => {
      const remain = Math.max(0, pomoEndAt - Date.now())
      setPomoRemainMs(remain)
      if (remain <= 0) pomoFinishRef.current()
    }
    tick()
    const iv = setInterval(tick, 500)
    return () => clearInterval(iv)
  }, [pomoRunning, pomoEndAt])

  /** 切换计时模式（记忆到 localStorage） */
  const switchMode = useCallback((m: 'stopwatch' | 'pomodoro') => {
    setMode(m)
    try {
      localStorage.setItem(MODE_KEY, m)
    } catch {
      /* 忽略 */
    }
  }, [])

  /* ── 硬件事件处理（暂停/继续/硬件开始） ── */
  /** 暂停：冻结计时（时长不累计，恢复后继续走） */
  const handlePause = () => {
    if (!running || running.paused) return
    const next: TimerState = { ...running, paused: true, pausedAt: Date.now() }
    setRunning(next)
    saveRunningTimer(next)
  }
  /** 继续：把本次暂停时长累计进 pausedMs */
  const handleResume = () => {
    if (!running || !running.paused) return
    const add = Date.now() - (running.pausedAt ?? Date.now())
    const next: TimerState = {
      ...running,
      paused: false,
      pausedAt: null,
      pausedMs: (running.pausedMs ?? 0) + add,
    }
    setRunning(next)
    saveRunningTimer(next)
  }
  /** 硬件开始键：用硬件上选中的科目开始计时 */
  const handleHardwareStart = () => {
    const name = bleSelectedSubject
    if (!name) return
    const subj = getAvailableSubjects().find((s) => s.name === name)
    if (subj) {
      handleStart(subj.id, '')
    } else {
      toast.show(`硬件选择了科目「${name}」，但 App 中未找到，请重新连接或在手机上选择科目`, { icon: '⚠️' })
    }
  }
  /* 每渲染把最新处理函数写入 ref，供 BLE 回调拿到最新闭包 */
  hardwareCbRef.current = {
    onStart: handleHardwareStart,
    onStop: () => handleStopRef.current(),
    onPause: handlePause,
    onResume: handleResume,
    onSubjectSelected: (name) => setBleSelectedSubject(name),
    onDisconnect: () => setBleConnected(false),
  }

  /* ── 保存到数据库 ── */
  const handleSaveToDB = async () => {
    if (!user || Object.keys(accum).length === 0) return
    setSaving(true)
    try {
      // 归入日期：优先使用计时开始那天（跨午夜/补交），否则今天
      const targetDate = loadAccumDate() || todayStr()

      // 将秒数转为小时（保留 2 位小数）
      // 过滤掉未知科目 id（localStorage 可被篡改，防止注入脏数据）
      const subjectEntries: DailyLogSubject[] = []
      for (const [key, entry] of Object.entries(accum)) {
        if (entry.seconds <= 0) continue
        const [id, activity] = key.split('::')
        if (!getSubjectById(id)) continue
        if (entry.ranges.length > 0) {
          // 每次计时会话单独生成一条记录（保留各自时间段），
          // 避免把 1-2 听课、5-6 听课合并成 1-6 听课
          for (const range of entry.ranges) {
            const hours = timeRangeHours(range.start, range.end)
            if (hours <= 0) continue
            const sessionEntry: DailyLogSubject = {
              id,
              hours,
              ...(activity ? { activity } : {}),
              startTime: range.start,
              endTime: range.end,
            }
            subjectEntries.push(sessionEntry)
          }
        } else {
          const hours = Math.round((entry.seconds / 3600) * 100) / 100
          subjectEntries.push(activity ? { id, hours, activity } : { id, hours })
        }
      }
      // 动态按开始时间排序（无时间段的条目排后面）
      sortSubjectsByStartTime(subjectEntries)
      if (subjectEntries.length === 0) {
        setAccum({})
        saveAccum({})
        localStorage.removeItem(ACCUM_DATE_KEY)
        setAccumDate(todayStr())
        setSaved(true)
        return
      }

      // 跨天补交到已有记录时，先提示用户时长将合并计入该日（确认后再写入）
      if (targetDate !== todayStr()) {
        const targetLog = await fetchLogByDate(user.id, targetDate)
        if (targetLog) {
          const ok = window.confirm(
            `${formatDateCn(targetDate)} 已有记录，本次学习时长将合并计入该日记录，是否继续？`
          )
          if (!ok) return
        }
      }
      // 安全合并写入云端：内部自动读最新→合并→带版本校验写入，并发冲突自动重试一次
      await upsertLogSafely({
        userId: user.id,
        date: targetDate,
        subjects: subjectEntries,
        summary: '',
      })

      refetch()

      // 清空累计
      setAccum({})
      saveAccum({})
      localStorage.removeItem(ACCUM_DATE_KEY)
      setAccumDate(todayStr())
      setSaved(true)
    } catch (err) {
      if (isDuplicateDateError(err)) {
        toast.show('该日期已有记录，请刷新后重试', { icon: '⚠️' })
      } else {
        toast.show('保存失败：' + (err instanceof Error ? err.message : '未知错误'), { icon: '❌' })
      }
    } finally {
      setSaving(false)
    }
  }

  /* ── 清空累计 ── */
  const handleClearAccum = () => {
    setAccum({})
    saveAccum({})
    localStorage.removeItem(ACCUM_DATE_KEY)
    setAccumDate(todayStr())
  }

  /* 重新扫描/连接硬件计时器（硬件到位后手动重试） */
  const handleReconnectBle = async () => {
    setBleSearching(true)
    setBleError(null)
    try {
      await connectBleTimer({
        onStart: () => hardwareCbRef.current.onStart(),
        onStop: () => hardwareCbRef.current.onStop(),
        onPause: () => hardwareCbRef.current.onPause(),
        onResume: () => hardwareCbRef.current.onResume(),
        onSubjectSelected: (name) => hardwareCbRef.current.onSubjectSelected(name),
        onDisconnect: () => hardwareCbRef.current.onDisconnect(),
      })
      setBleConnected(true)
      // 重连后重新推送科目列表，保证硬件 OLED 菜单与 App 一致
      pushSubjects(getAvailableSubjects().map((s) => s.name))
    } catch (err) {
      // 未连接/找不到设备不影响手机上直接计时，这里静默处理
      setBleError(err instanceof Error ? err.message : '连接失败')
    } finally {
      setBleSearching(false)
    }
  }

  /* ── 科目管理（增删改后刷新科目列表） ── */
  /** 重新从云端加载并更新科目缓存（内置 + 自定义） */
  const refreshSubjects = useCallback(async () => {
    if (user) await loadUserSubjects(user.id, true)
    setAvailableSubjects(getAvailableSubjects())
  }, [user])

  /** 加载自定义科目列表（管理用） */
  const loadCustomSubjects = useCallback(async () => {
    if (!user) return
    setSubjectsLoading(true)
    try {
      setCustomSubjects(await fetchUserSubjects(user.id))
    } catch {
      /* 忽略读取失败 */
    } finally {
      setSubjectsLoading(false)
    }
  }, [user])

  /* 挂载/登录切换时加载本地自定义科目 */
  useEffect(() => {
    refreshSubjects()
    loadCustomSubjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  /* ── 恢复精简挂件来不及保存的计时 ──
     精简挂件结束计时时会把本次会话先落一份 localStorage 备份（云端冲突/未登录/跨天时不直接写库），
     这里在进入计时页且已登录时合并进「今日累计」：先查云端确认未写入该条（避免重复入账），
     再并入本地累计，用户可在下方「保存到今日记录」/补交落库。 */
  useEffect(() => {
    if (!user?.id) return
    const pending = loadPendingTimer()
    if (!pending) return
    ;(async () => {
      try {
        const log = await fetchLogByDate(user.id, pending.date)
        const alreadyInDb = log?.subjects?.some(
          (s) =>
            s.id === pending.subjectId &&
            (s.activity ?? '') === pending.activity &&
            s.startTime === pending.start &&
            s.endTime === pending.end,
        )
        if (alreadyInDb) {
          // 云端已有同一条（上次保存成功但备份没清掉）：只清备份，不重复入账
          clearPendingTimer()
          return
        }
        const cur = loadAccum()
        const key = `${pending.subjectId}::${pending.activity}`
        const existsInAccum = cur[key]?.ranges?.some(
          (r) => r.start === pending.start && r.end === pending.end,
        )
        if (!existsInAccum) {
          const next = { ...cur }
          next[key] = {
            seconds: (cur[key]?.seconds ?? 0) + pending.seconds,
            ranges: [...(cur[key]?.ranges ?? []), { start: pending.start, end: pending.end }],
          }
          saveAccum(next)
          setAccum(next)
          if (!loadAccumDate()) {
            // 累计原本为空：把归属日期设为计时开始那天（跨天按补交处理）
            localStorage.setItem(ACCUM_DATE_KEY, pending.date)
            setAccumDate(pending.date)
          }
          toast.show(`已恢复精简挂件未保存的计时（${formatDurationShort(pending.seconds)}）`, { icon: '⏱️' })
        }
        clearPendingTimer()
      } catch {
        // 云端查询失败时保守处理：不并入也不清备份，下次进入再试
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const handleCreateSubject = async () => {
    if (!user || !newName.trim()) return
    // 客户端重名预检（即时提示，无需等云端 round-trip）
    const target = newName.trim()
    const conflict = customSubjects.find((s) => s.name.trim() === target)
    if (conflict) {
      toast.show(`已存在同名科目「${target}」，请修改名称`, { icon: '⚠️' })
      return
    }
    setCreating(true)
    try {
      const activities = newActivities
        .split(/[，,、\n]/)
        .map((a) => a.trim())
        .filter(Boolean)
      await createUserSubject(user.id, {
        name: newName,
        activities,
        category: newCatSel === '__custom__' ? newCatCustom : newCatSel,
      })
      setNewName('')
      setNewActivities('')
      setNewCatSel('')
      setNewCatCustom('')
      setShowAddModal(false)
      await loadCustomSubjects()
      await refreshSubjects()
    } catch (err) {
      toast.show('添加失败：' + (err instanceof Error ? err.message : '未知错误'), { icon: '❌' })
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateSubject = async () => {
    if (!editing) return
    // 客户端重名预检：改后的名称不能与除自身外的其他科目同名
    const target = editing.name.trim()
    if (!target) {
      toast.show('科目名称不能为空', { icon: '⚠️' })
      return
    }
    const conflict = customSubjects.find((s) => s.id !== editing.id && s.name.trim() === target)
    if (conflict) {
      toast.show(`已存在同名科目「${target}」，请修改名称`, { icon: '⚠️' })
      return
    }
    try {
      const activities = editActivities
        .split(/[，,、\n]/)
        .map((a) => a.trim())
        .filter(Boolean)
      await updateUserSubject(editing.id, {
        name: editing.name,
        activities,
        category: editCatSel === '__custom__' ? editCatCustom : editCatSel,
      })
      setEditing(null)
      await loadCustomSubjects()
      await refreshSubjects()
    } catch (err) {
      toast.show('保存失败：' + (err instanceof Error ? err.message : '未知错误'), { icon: '❌' })
    }
  }

  const handleDeleteSubject = async (id: string) => {
    if (!user) return
    if (!window.confirm('确定删除该科目？已记录的历史数据不受影响，历史记录中仍会显示该科目名称。')) return
    try {
      await deleteUserSubject(user.id, id)
      await loadCustomSubjects()
      await refreshSubjects()
    } catch (err) {
      toast.show('删除失败：' + (err instanceof Error ? err.message : '未知错误'), { icon: '❌' })
    }
  }

  /* ── 批量删除 ── */
  /** 进入/退出多选模式；退出时清空勾选（取消不触发任何删除，状态复位） */
  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectionMode(false)
      setSelectedIds(new Set())
    } else {
      // 进入多选时收起正在编辑的表单，避免与勾选操作混淆
      setEditing(null)
      setSelectionMode(true)
    }
  }

  /** 勾选/取消勾选某个科目（Set 更新时新建实例） */
  const toggleSubjectSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  /** 删除所选科目：确认 → 批量删除 → 刷新 → toast 汇总结果 → 退出多选模式 */
  const handleBatchDelete = async () => {
    if (!user || batchDeleting) return
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    const names = ids
      .map((id) => customSubjects.find((s) => s.id === id)?.name)
      .filter((n): n is string => !!n)
    if (!window.confirm(`确定删除这 ${ids.length} 个科目：${names.join('、')}？历史记录仍会显示科目名称。`)) return
    setBatchDeleting(true)
    try {
      const res = await batchDeleteUserSubjects(user.id, ids)
      await loadCustomSubjects()
      await refreshSubjects()
      if (res.failed.length > 0) {
        const failNames = res.failed.map((f) => customSubjects.find((s) => s.id === f.id)?.name ?? f.id)
        toast.show(`已删除 ${res.deleted.length} 个，${res.failed.length} 个失败：${failNames.join('、')}`, { icon: '⚠️', duration: 6000 })
      } else {
        toast.show(`已删除 ${res.deleted.length} 个科目`, { icon: '✅' })
      }
    } catch (err) {
      toast.show('批量删除失败：' + (err instanceof Error ? err.message : '未知错误'), { icon: '❌' })
    } finally {
      setBatchDeleting(false)
      setSelectionMode(false)
      setSelectedIds(new Set())
    }
  }

  const [recovering, setRecovering] = useState(false)
  /** 恢复被误删的科目：内置科目按默认名重建成；自定义科目（UUID）尽力从本机缓存还原原名 */
  const handleRecoverSubjects = async () => {
    if (!user || recovering) return
    setRecovering(true)
    try {
      const res = await recoverDeletedSubjects(user.id)
      await loadCustomSubjects()
      await refreshSubjects()
      if (res.recovered.length > 0) {
        toast.show(`已恢复 ${res.recovered.length} 个科目：${res.recovered.join('、')}`, { icon: '♻️' })
      }
      if (res.unknownIds.length > 0) {
        toast.show(
          `还有 ${res.unknownIds.length} 个历史科目的名称已无法还原，请在下方重新手动添加（时长数据不受影响）`,
          { icon: '⚠️', duration: 6000 },
        )
      }
      if (res.recovered.length === 0 && res.unknownIds.length === 0) {
        toast.show('没有检测到可恢复的被删科目', { icon: '✅' })
      }
    } catch (err) {
      toast.show('恢复失败：' + (err instanceof Error ? err.message : '未知错误'), { icon: '❌' })
    } finally {
      setRecovering(false)
    }
  }

  const totalSeconds = Object.values(accum).reduce((a, b) => a + b.seconds, 0)
  /** 是否补交：累计归属日期不是今天（跨午夜/隔天保存） */
  const isBackfill = accumDate !== todayStr()
  const currentSubject = running?.subjectId
    ? (getSubjectById(running.subjectId)?.name ?? running.subjectId) +
      (running.activity ? ` · ${running.activity}` : '')
    : null
  /** 番茄钟已选目标科目展示名 */
  const pomoSubjectLabel = pomoSubjectId
    ? (getSubjectById(pomoSubjectId)?.name ?? pomoSubjectId) + (pomoActivity ? ` · ${pomoActivity}` : '')
    : null
  /** 某科目今日累计秒数（含各学习内容） */
  const subjectTotal = (id: string): number =>
    Object.entries(accum)
      .filter(([key]) => key.startsWith(id + '::'))
      .reduce((a, [, entry]) => a + entry.seconds, 0)

  /** 今日累计条目（过滤 >0，按秒数降序） */
  const todayEntries = Object.entries(accum)
    .filter(([, entry]) => entry.seconds > 0)
    .sort(([, a], [, b]) => b.seconds - a.seconds)
  /** 是否为 408 综合科目（兼容旧内置 id 与迁移后的新 id） */
  const is408Subject = (id: string): boolean => AGG_408_IDS.includes(id) || getSubjectById(id)?.category === '408'
  /** 408 各科目今天的累计秒数 */
  const agg408BySubject = (() => {
    const map: Record<string, number> = {}
    for (const [key, entry] of todayEntries) {
      const id = key.split('::')[0]
      if (is408Subject(id)) map[id] = (map[id] ?? 0) + entry.seconds
    }
    return map
  })()
  /** 408 总秒数 */
  const agg408Total = Object.values(agg408BySubject).reduce((a, b) => a + b, 0)
  const has408 = agg408Total > 0
  /** 非 408 的累计条目 */
  const non408Entries = todayEntries.filter(([key]) => !is408Subject(key.split('::')[0]))
  /** 单条累计的渲染（供非 408 与"分开"模式复用） */
  const renderEntry = ([key, entry]: [string, AccumEntry]) => {
    const [id, activity] = key.split('::')
    const subj = getSubjectById(id)
    const label = (subj?.name ?? id) + (activity ? `·${activity}` : '')
    return (
      <div key={key} className="flex justify-between items-center text-sm">
        <span className="text-gray-600 dark:text-slate-400">{label}</span>
        <span className="font-mono text-gray-800 dark:text-slate-200">{formatDurationShort(entry.seconds)}</span>
      </div>
    )
  }
  /** 单个科目按钮（含当前计时高亮、今日累计展示；按模式分支） */
  const renderSubjectButton = (subj: Subject) => {
    // 番茄钟：运行中只可操作当前目标科目，空闲时点击即选择目标科目
    const isActive = mode === 'pomodoro'
      ? pomoSubjectId === subj.id && pomoPhase !== 'idle'
      : running?.subjectId === subj.id
    const isDisabled = mode === 'pomodoro'
      ? pomoPhase !== 'idle'
      : running !== null && !isActive
    const isSelected = mode === 'pomodoro'
      ? pomoSubjectId === subj.id || pomoPendingSubject === subj.id
      : running?.subjectId === subj.id || pendingSubject === subj.id
    const handleSubjectClick = () => {
      if (mode === 'pomodoro') {
        // 仅空闲态可切换目标科目
        if (pomoPhase !== 'idle') return
        const activities = getActivitiesForSubject(subj.id)
        if (activities.length > 0) {
          setPomoPendingSubject(pomoPendingSubject === subj.id ? null : subj.id)
        } else {
          setPomoSubjectId(subj.id)
          setPomoActivity('')
        }
        return
      }
      // 正计时原逻辑
      if (isActive) {
        handleStop()
      } else if (!running) {
        const activities = getActivitiesForSubject(subj.id)
        if (activities.length > 0) {
          setPendingSubject(pendingSubject === subj.id ? null : subj.id)
        } else {
          handleStart(subj.id, '')
        }
      }
    }
    return (
      <button
        key={subj.id}
        onClick={handleSubjectClick}
        disabled={isDisabled}
        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer
          ${isActive
            ? 'ring-2 ring-offset-2 ring-red-500 dark:ring-offset-slate-900 scale-105 shadow-md ' + getButtonColor(getSubjectById(subj.id)?.category)
            : isDisabled
              ? 'opacity-40 cursor-not-allowed border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500'
              : isSelected
                ? 'ring-2 ring-offset-2 ring-red-300 dark:ring-offset-slate-900 ' + getButtonColor(getSubjectById(subj.id)?.category)
                : getButtonColor(getSubjectById(subj.id)?.category)
          }`}
      >
        <span className="flex flex-col items-center gap-0.5 leading-tight">
          <span>{subj.name}</span>
          {subjectTotal(subj.id) > 0 && (
            <span className="text-xs opacity-75">({formatDurationShort(subjectTotal(subj.id))})</span>
          )}
        </span>
      </button>
    )
  }
  /** 按类别分组科目（408 单独一组，其余按各自类别） */
  const subjectSections = (() => {
    const map = new Map<string, Subject[]>()
    for (const s of availableSubjects) {
      const list = map.get(s.category) ?? []
      list.push(s)
      map.set(s.category, list)
    }
    return Array.from(map.entries())
  })()

  return (
    <div className="space-y-4">
      {/* 蓝牙计时器状态（仅原生 App） */}
      {Capacitor.isNativePlatform() && (
        <div className={`px-3 py-2 rounded-lg text-xs border flex items-center gap-2 justify-between ${
          bleConnected
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
            : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400'
        }`}>
          <span>
            {bleConnected
              ? bleSelectedSubject
                ? `硬件已选「${bleSelectedSubject}」，按硬件「开始」键计时`
                : '硬件计时器已连接：在硬件 OLED 上选科目，按「开始」键计时'
              : bleSearching
                ? '正在查找硬件计时器…'
                : bleError
                  ? `未连接：${bleError}`
                  : '硬件计时器未连接（可选），可在手机上直接计时'}
          </span>
          {!bleConnected && (
            <button
              onClick={handleReconnectBle}
              disabled={bleSearching}
              className="shrink-0 px-2 py-1 rounded-md border border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bleSearching ? '查找中…' : '重新连接'}
            </button>
          )}
        </div>
      )}
      {/* 科目选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
          选择科目
        </label>
        {availableSubjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-slate-600 p-5 text-center">
            <p className="text-sm text-gray-500 dark:text-slate-400">还没有科目</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
              添加你正在学的东西，例如「高数」「工作」「健身」
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              + 添加第一个科目
            </button>
          </div>
        ) : (
        <div className="space-y-3">
          {/* 非 408 科目：无分组的平铺展示，有自定义分组的带小标题分组展示 */}
          {subjectSections
            .filter(([cat]) => cat !== '408')
            .map(([cat, subs]) => {
              const label = getCategoryLabel(cat)
              return (
                <div key={cat}>
                  {label && (
                    <p className="mb-1 text-xs font-semibold text-gray-400 dark:text-slate-500">{label}</p>
                  )}
                  <div className="flex flex-wrap gap-2">{subs.map(renderSubjectButton)}</div>
                </div>
              )
            })}
          {/* 408 折叠分组 */}
          {subjectSections
            .filter(([cat]) => cat === '408')
            .map(([cat, subs]) => (
              <div key={cat}>
                <button
                  onClick={() => setShow408((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 py-1 cursor-pointer group"
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-slate-500">
                    <span
                      className={`inline-block transition-transform ${show408 ? 'rotate-90' : ''} text-gray-300 dark:text-slate-600`}
                    >▶</span>
                    408
                    <span className="font-normal text-gray-400 dark:text-slate-500">计算机专业基础综合（听课 / 练习）</span>
                  </span>
                  {agg408Total > 0 && (
                    <span className="text-xs font-mono text-gray-500 dark:text-slate-400 group-hover:text-gray-700 dark:group-hover:text-slate-200">
                      {formatDurationShort(agg408Total)}
                    </span>
                  )}
                </button>
                {show408 && (
                  <div className="mt-1 pl-3 border-l-2 border-gray-100 dark:border-slate-700 flex flex-wrap gap-2">
                    {subs.map(renderSubjectButton)}
                  </div>
                )}
              </div>
            ))}
        </div>
        )}

      {/* 选择学习内容（正计时/番茄钟 共用） */}
        {(() => {
          const actSubjectId = mode === 'pomodoro' ? pomoPendingSubject : pendingSubject
          const showPanel = mode === 'pomodoro'
            ? !!actSubjectId && pomoPhase === 'idle'
            : !!actSubjectId && !running
          if (!showPanel) return null
          return (
            <div className="mt-3 rounded-lg border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-900/20 px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700 dark:text-slate-300">
                  {getSubjectById(actSubjectId!)?.name} · 选择学习内容
                </span>
                <button
                  type="button"
                  onClick={() => (mode === 'pomodoro' ? setPomoPendingSubject(null) : setPendingSubject(null))}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  取消
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {getActivitiesForSubject(actSubjectId!).map((act) => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => (mode === 'pomodoro' ? startPomodoro(actSubjectId!, act) : handleStart(actSubjectId!, act))}
                    className="px-3 py-1 text-sm rounded-full bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-600 hover:border-red-400 hover:text-red-600 dark:hover:border-red-500 dark:hover:text-red-300 transition-colors cursor-pointer"
                  >
                    {act}
                  </button>
                ))}
              </div>
            </div>
          )
        })()}
      </div>

      {/* 计时器面板 */}
      <div className="card p-5 text-center">
        {/* 模式切换：正计时 / 番茄钟 */}
        <div className="mb-4 inline-flex rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 p-1">
          {(['stopwatch', 'pomodoro'] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                mode === m
                  ? 'bg-white dark:bg-slate-600 shadow text-gray-900 dark:text-slate-100'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
            >
              {m === 'stopwatch' ? '⏱ 正计时' : '🍅 番茄钟'}
            </button>
          ))}
        </div>

        {mode === 'stopwatch' ? (
          <>
            {running ? (
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1.5">
                正在学习：<span className="font-semibold text-gray-700 dark:text-slate-200">{currentSubject}</span>
                {running.paused && (
                  <span className="ml-1 text-amber-600 dark:text-amber-400 font-medium">（已暂停）</span>
                )}
              </p>
            ) : (
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-1.5">
                {Object.keys(accum).length > 0 ? '选择科目继续计时' : '点击上方科目开始学习'}
              </p>
            )}

            <div className="text-5xl sm:text-6xl font-mono font-bold tabular-nums text-gray-900 dark:text-slate-100 my-3 tracking-wider">
              {running ? formatDuration(elapsed) : '00:00:00'}
            </div>

            {running ? (
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => (running.paused ? handleResume() : handlePause())}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-base transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {running.paused ? '▶ 继续' : '⏸ 暂停'}
                </button>
                <button
                  onClick={handleStop}
                  className="px-8 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-base transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20 cursor-pointer"
                >
                  ■ 结束学习
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 dark:text-slate-500">点击科目开始</p>
            )}
          </>
        ) : (
          /* ── 番茄钟面板 ── */
          <>
            {pomoPhase === 'idle' ? (
              <>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">
                  {pomoSubjectLabel
                    ? `目标：${pomoSubjectLabel}（点上方科目可更换）`
                    : '请先在上方选择目标科目'}
                </p>

                {/* 专注时长：预设 25/45 + 自定义 */}
                <div className="mb-2">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {[25, 45].map((m) => (
                      <button
                        key={m}
                        onClick={() => { setPomoFocusMin(m); setPomoCustomFocus(m); try { localStorage.setItem(POMO_FOCUS_KEY, String(m)) } catch { /* 忽略 */ } }}
                        className={`px-4 py-1.5 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                          pomoFocusMin === m
                            ? 'border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-red-300'
                        }`}
                      >
                        {m} 分钟
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <label className="text-xs text-gray-500 dark:text-slate-400">自定义</label>
                    <input
                      type="number"
                      min={1}
                      max={240}
                      value={pomoCustomFocus}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        if (Number.isFinite(v) && v > 0) {
                          const m = Math.round(Math.min(240, Math.max(1, v)))
                          setPomoCustomFocus(m)
                          setPomoFocusMin(m)
                          try { localStorage.setItem(POMO_FOCUS_KEY, String(m)) } catch { /* 忽略 */ }
                        }
                      }}
                      className="w-16 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-sm text-center text-gray-800 dark:text-slate-100 outline-none focus:border-red-400"
                    />
                    <span className="text-xs text-gray-400 dark:text-slate-500">分钟</span>
                  </div>
                </div>

                {/* 休息时长：可自定义 / 跳过 */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <label className="text-xs text-gray-500 dark:text-slate-400">休息</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={pomoRestMin}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      if (Number.isFinite(v) && v >= 0) {
                        const m = Math.round(Math.min(120, Math.max(0, v)))
                        setPomoRestMin(m)
                        try { localStorage.setItem(POMO_REST_KEY, String(m)) } catch { /* 忽略 */ }
                      }
                    }}
                    className="w-14 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-sm text-center text-gray-800 dark:text-slate-100 outline-none focus:border-red-400"
                  />
                  <span className="text-xs text-gray-400 dark:text-slate-500">分钟</span>
                  <button
                    onClick={() => { setPomoRestMin(0); try { localStorage.setItem(POMO_REST_KEY, '0') } catch { /* 忽略 */ } }}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors cursor-pointer"
                  >
                    跳过休息
                  </button>
                </div>

                <button
                  onClick={startPomodoroFocus}
                  disabled={!pomoSubjectId}
                  className="px-8 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-slate-600 text-white rounded-xl font-semibold text-base transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20 cursor-pointer disabled:cursor-not-allowed"
                >
                  🍅 开始专注（{pomoFocusMin} 分钟）
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-1.5">
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    第 {pomoRound + (pomoPhase === 'focus' ? 1 : 0)} 轮
                  </span>
                  <span className="ml-2">
                    {pomoPhase === 'focus' ? '专注中' : '休息中'}
                    {pomoSubjectLabel ? ` · ${pomoSubjectLabel}` : ''}
                  </span>
                  {!pomoRunning && (
                    <span className="ml-1 text-amber-600 dark:text-amber-400 font-medium">（已暂停）</span>
                  )}
                </p>

                <div className="text-5xl sm:text-6xl font-mono font-bold tabular-nums text-red-600 dark:text-red-400 my-3 tracking-wider">
                  {formatMmSs(pomoRemainMs)}
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={togglePomodoroPause}
                    className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-base transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20 cursor-pointer"
                  >
                    {pomoRunning ? '⏸ 暂停' : '▶ 继续'}
                  </button>
                  {pomoPhase === 'rest' ? (
                    <button
                      onClick={skipRest}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-base transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      跳过休息
                    </button>
                  ) : (
                    <button
                      onClick={abandonPomodoro}
                      className="px-8 py-2.5 bg-slate-500 hover:bg-slate-600 text-white rounded-xl font-semibold text-base transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-500/20 cursor-pointer"
                    >
                      放弃
                    </button>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* 今日累计 */}
      {Object.keys(accum).length > 0 && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                {isBackfill ? `${formatDateCn(accumDate)}（补交）` : '今日累计'}
              </h3>
              {isBackfill && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  跨过了零点，本次时长将归入 {formatDateCn(accumDate)}（计时开始的那天）
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {has408 && (
                <button
                  onClick={() => setAgg408(!agg408)}
                  className="px-2 py-1 text-xs rounded-md border border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  {agg408 ? '408 拆开' : '408 汇总'}
                </button>
              )}
              <span className="text-lg font-bold text-gray-900 dark:text-slate-100">
                {formatDuration(totalSeconds)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {!agg408 || !has408 ? (
              todayEntries.map(renderEntry)
            ) : (
              <>
                {non408Entries.map(renderEntry)}
                {/* 408 汇总，可点标题切回分开 */}
                <div>
                  <button
                    onClick={() => setAgg408(false)}
                    className="w-full flex justify-between items-center text-sm py-0.5 cursor-pointer group"
                  >
                    <span className="font-medium text-blue-600 dark:text-blue-300 group-hover:underline">
                      408 · 数据结构/组成/操作系统/计网
                    </span>
                    <span className="font-mono font-semibold text-gray-800 dark:text-slate-200">
                      {formatDurationShort(agg408Total)}
                    </span>
                  </button>
                  <div className="mt-1 pl-4 border-l-2 border-blue-200 dark:border-blue-700 space-y-1">
                    {Object.keys(agg408BySubject).map((id) => (
                      <div key={id} className="flex justify-between items-center text-xs text-gray-500 dark:text-slate-400">
                        <span>{getSubjectById(id)?.name}</span>
                        <span className="font-mono">{formatDurationShort(agg408BySubject[id])}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <button
              onClick={handleClearAccum}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
            >
              清空
            </button>
            <div className="flex-1" />
            <button
              onClick={handleSaveToDB}
              disabled={saving || !user}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white rounded-lg text-sm font-medium transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : saved ? '✓ 已保存' : isBackfill ? `保存到${formatDateCn(accumDate)}` : '保存到今日记录'}
            </button>
          </div>
        </div>
      )}

      {/* 科目管理 */}
      {user && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1">计时科目管理</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
            科目保存在云端，可随时编辑改名或删除；历史记录不受影响，改名后历史记录会显示新名称。
          </p>

          {/* 新增科目 */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowAddModal(true)}
              disabled={creating}
              className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-600 border border-dashed border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-slate-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + 添加科目
            </button>
            <button
              onClick={handleRecoverSubjects}
              disabled={recovering}
              className="px-3 py-2.5 text-xs border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              title="从打卡记录 + 本机缓存找回被误删的科目"
            >
              {recovering ? '恢复中…' : '♻️ 恢复被删科目'}
            </button>
            <button
              onClick={toggleSelectionMode}
              className={`px-3 py-2.5 text-xs border rounded-lg transition-colors cursor-pointer shrink-0 ${
                selectionMode
                  ? 'border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
              title={selectionMode ? '退出多选模式' : '勾选多个科目批量删除'}
            >
              {selectionMode ? '完成' : '批量删除'}
            </button>
          </div>

          {/* 重复科目提醒（历史 bug 留下的脏数据，提示手动清理） */}
          {(() => {
            const seen = new Map<string, number>()
            customSubjects.forEach((s) => {
              const k = s.name.trim()
              seen.set(k, (seen.get(k) ?? 0) + 1)
            })
            const dupNames: string[] = []
            seen.forEach((count, name) => { if (count > 1) dupNames.push(`${name}×${count}`) })
            if (dupNames.length === 0) return null
            return (
              <div className="mb-3 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
                <span>⚠️</span>
                <div className="flex-1 leading-relaxed">
                  检测到重复科目：<span className="font-semibold">{dupNames.join('、')}</span>。
                  计时区已自动只显示一个，请在下方列表保留一个（建议保留打卡记录关联最多的那个），其余点「删除」即可（删除仅移除科目，不影响历史时长记录）。
                </div>
              </div>
            )
          })()}

          {/* 自定义科目列表 */}
          {subjectsLoading ? (
            <p className="text-xs text-gray-400 dark:text-slate-500">加载中...</p>
          ) : customSubjects.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-slate-500">
              还没有科目，点击上方「+ 添加科目」创建第一个。
            </p>
          ) : (
            <ul className="space-y-2">
              {customSubjects.map((s) => (
                <li
                  key={s.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    selectionMode
                      ? selectedIds.has(s.id)
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-400'
                        : 'border-gray-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500 cursor-pointer'
                      : 'border-gray-100 dark:border-slate-700'
                  }`}
                >
                  {editing?.id === s.id ? (
                    <div className="space-y-2">
                      <input
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-800 dark:text-slate-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                      />
                      <input
                        value={editActivities}
                        onChange={(e) => setEditActivities(e.target.value)}
                        placeholder="学习内容（逗号分隔）"
                        className="w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-800 dark:text-slate-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                      />
                      {/* 编辑分组 */}
                      <GroupPicker
                        sel={editCatSel}
                        custom={editCatCustom}
                        onSelChange={setEditCatSel}
                        onCustomChange={setEditCatCustom}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateSubject}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-slate-300 cursor-pointer"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex items-center justify-between gap-2"
                      onClick={selectionMode ? () => toggleSubjectSelected(s.id) : undefined}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* 多选模式：左侧复选框，点行或勾选均可切换 */}
                        {selectionMode && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(s.id)}
                            onChange={() => toggleSubjectSelected(s.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-slate-100">
                            {s.name}
                            {(() => {
                              const label = getCategoryLabel(s.category)
                              if (!label) return null
                              return (
                                <span className="ml-1.5 align-middle text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-600 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300">
                                  {label}
                                </span>
                              )
                            })()}
                          </p>
                          {s.activities.length > 0 ? (
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                              内容：{s.activities.join('、')}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">无学习内容</p>
                          )}
                        </div>
                      </div>
                      {selectionMode ? null : (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setEditing(s)
                              setEditActivities(s.activities.join('、'))
                              // 编辑时把现有分组带回选择器：custom=无分组；408=内置选项；其他归入自定义输入
                              const cat = s.category && s.category !== 'custom' ? s.category : ''
                              setEditCatSel(cat === '408' ? '408' : cat ? '__custom__' : '')
                              setEditCatCustom(cat === '408' ? '' : cat)
                            }}
                            className="px-3 py-1 text-xs text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(s.id)}
                            className="px-3 py-1 text-xs text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* 多选操作栏：显示已选数量 + 删除所选（未勾选时禁用） */}
          {selectionMode && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-slate-400">已选 {selectedIds.size} 个</span>
              <div className="flex-1" />
              <button
                onClick={handleBatchDelete}
                disabled={selectedIds.size === 0 || batchDeleting}
                className="px-3 py-2 text-xs text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {batchDeleting ? '删除中...' : `删除所选 (${selectedIds.size})`}
              </button>
            </div>
          )}
        </div>
      )}

      {!user && (
        <p className="text-center text-sm text-gray-400 dark:text-slate-500">
          请先登录后使用计时器
        </p>
      )}

      {/* 添加科目弹窗 */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800 dark:text-slate-100">添加科目</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-xl leading-none cursor-pointer"
                aria-label="关闭"
              >
                ×
              </button>
            </div>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="科目名称，如：专业课、工作、健身"
              autoFocus
              className="w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-800 dark:text-slate-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
            />
            <input
              value={newActivities}
              onChange={(e) => setNewActivities(e.target.value)}
              placeholder="学习内容（用逗号分隔），如：阅读，练习，复盘"
              className="w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-800 dark:text-slate-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
            />
            {/* 分组选择 */}
            <GroupPicker
              sel={newCatSel}
              custom={newCatCustom}
              onSelChange={setNewCatSel}
              onCustomChange={setNewCatCustom}
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 text-sm text-gray-600 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleCreateSubject}
                disabled={creating || !newName.trim()}
                className="flex-1 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {creating ? '添加中...' : '确认添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}