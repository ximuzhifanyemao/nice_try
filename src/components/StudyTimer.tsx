import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import {
  batchDeleteUserSubjects,
  createUserSubject,
  deleteUserSubject,
  fetchUserSubjects,
  formatActivityLabel,
  getActivitiesForSubject,
  getActivityTreeForSubject,
  getAvailableSubjects,
  getCategoryLabel,
  getSubjectById,
  buildActivityPath,
  hydrateUserSubjects,
  loadUserSubjects,
  recoverDeletedSubjects,
  updateUserSubject,
  type Subject,
  type UserSubject,
} from '../lib/subjects'
import { fetchLogByDate, todayStr } from '../lib/dailyLogs'
import { formatDateCn, formatDuration, formatDurationShort, formatMmSs } from '../lib/format'
import {
  accumDateFromOutbox,
  accumFromOutbox,
  type AccumEntry,
  type TimerSession,
} from '../lib/timerAccum'
import {
  clearOutboxEntries,
  flushTimerOutbox,
  loadOutbox,
  stashTimerSession,
  subscribeOutbox,
  type OutboxItem,
  type TimerStashInput,
} from '../lib/timerOutbox'
import {
  abandonPomo,
  advancePomo,
  computePomoRemain,
  loadPomoFocusMin,
  loadPomoRestMin,
  loadPomoState,
  loadTimerMode,
  pausePomo,
  pomodoroNotify,
  resumePomo,
  savePomoFocusMin,
  savePomoRestMin,
  savePomoState,
  saveTimerMode,
  startPomo,
  type PomoPhase,
  type PomoState,
  type TimerMode,
} from '../lib/pomodoro'
import { getDotColor, getChipColor } from '../lib/colors'
import ActivityTreeEditor from './ActivityTreeEditor'
import { Icon } from './Icon'
import TimerScale from './TimerScale'
import { useTodayProgress } from '../hooks/useTodayProgress'
import {
  POMO_BAR_TONE,
  POMO_DIGIT_TONE,
  POMO_PILL_TONE,
  subjectRowTone,
  TIMER_DIGIT_TONE,
  TIMER_GHOST_BTN,
  TIMER_PRIMARY_BTN,
  TIMER_ROUND_BTN,
} from '../lib/timerTone'
import { useWideLayout } from '../App'
import { useAuth } from '../contexts/AuthContext'
import { useLogs } from '../contexts/LogsContext'
import { useToast } from '../lib/Toast'
import {
  loadSharedTimer,
  saveSharedTimer,
  pauseTimerState,
  resumeTimerState,
  toLogPauses,
  type SharedTimerState,
} from '../lib/timerSync'
import { TimerForeground } from '../plugins/timer-foreground'
import { connectBleTimer, disconnectBleTimer, pushSubjects } from '../lib/bleTimer'


/* ── 类型 ── */
/** 进行中计时：与共享计时状态同构（暂停明细等字段统一由 lib/timerSync 定义） */
type TimerState = SharedTimerState

/* ── localStorage 持久化（进行中计时与精简挂件共享，见 lib/timerSync.ts；
     今日累计见 lib/timerAccum.ts） ── */

function loadRunningTimer(): TimerState | null {
  return loadSharedTimer() as TimerState | null
}

function saveRunningTimer(state: TimerState | null) {
  saveSharedTimer(state)
}

/* ── 工具 ── */

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
      <label className="mb-1 block text-xs text-gray-500 dark:text-slate-400">分组（可选）</label>
      <select
        value={sel}
        onChange={(e) => onSelChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
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
          className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
      )}
      <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">
        选「408」会像之前的专业课一样折叠展示；也可以填自定义分组名。
      </p>
    </div>
  )
}

/* ── 番茄钟（与正计时并存，通过模式切换；状态机与提醒见 lib/pomodoro.ts） ── */

/* ── 组件 ── */
export default function StudyTimer() {
  const { user } = useAuth()
  const { refetch } = useLogs()
  const toast = useToast()
  /** 桌面「全部功能」窗口：左侧科目、右侧计时器并排，避免整页纵向堆叠成手机版观感 */
  const wide = useWideLayout()
  /* 今日进度：已打卡时长 + 今日目标线（与简洁模式胶囊条同一份实现与口径） */
  const { hours: todayHours, line: todayLine, refresh: refreshTodayProgress } = useTodayProgress(user?.id)
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
  /** 学习内容路径列表（'高数/听课' 表示「高数 → 听课」两层，见 ActivityTreeEditor） */
  const [newActivities, setNewActivities] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  /* 新增科目的分组（category）选择：''=无分组、'408'=408 折叠组、'__custom__'=自定义输入 */
  const [newCatSel, setNewCatSel] = useState('')
  const [newCatCustom, setNewCatCustom] = useState('')
  /* 正在编辑的科目 */
  const [editing, setEditing] = useState<UserSubject | null>(null)
  const [editActivities, setEditActivities] = useState<string[]>([])
  /* 编辑中的分组选择（逻辑同上） */
  const [editCatSel, setEditCatSel] = useState('')
  const [editCatCustom, setEditCatCustom] = useState('')
  /* 批量删除：是否多选模式 + 勾选的科目 id（Set 更新时新建实例） */
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchDeleting, setBatchDeleting] = useState(false)
  /**
   * 「计时科目管理」是否展开。
   * 默认收起：科目数会随使用不断增长，常驻展开会让计时页越滑越长；
   * 计时页的主体是上方计时器与今日累计，科目管理属于低频维护入口。
   */
  const [subjectAdminOpen, setSubjectAdminOpen] = useState(false)

  /* 当前运行中的计时器 */
  const [running, setRunning] = useState<TimerState | null>(loadRunningTimer)
  /* 待选学习内容的科目 */
  const [pendingSubject, setPendingSubject] = useState<string | null>(null)
  /** 已展开的学习内容分支（如「高数」）；null = 还停在首层的分支列表 */
  const [pendingGroup, setPendingGroup] = useState<string | null>(null)
  /* 待入库队列（未入库时长的唯一落盘处，也是下面「今日累计」的数据来源） */
  const [outboxItems, setOutboxItems] = useState<OutboxItem[]>(() => loadOutbox())
  /* 本用户可见的待入库条目（自己的 + 未登录时暂存的；别人的条目不会显示，避免串号） */
  const pendingItems = useMemo(
    () => outboxItems.filter((i) => i.userId === user?.id || i.userId === null),
    [outboxItems, user?.id],
  )
  /* 今日累计 = 待入库队列的投影（不再单独落盘，因此不会被整份覆盖或静默清掉） */
  const accum = useMemo(() => accumFromOutbox(pendingItems), [pendingItems])
  /* 累计归属日期（队列里最早那天；跨零点拆分后队列可能同时含昨天与今天），队列为空时为今天 */
  const accumDate = useMemo(() => accumDateFromOutbox(pendingItems) ?? todayStr(), [pendingItems])
  /* 待入库条目涉及的日期（跨零点拆分后为多天） */
  const pendingDates = useMemo(
    () => Array.from(new Set(pendingItems.map((i) => i.date))).sort(),
    [pendingItems],
  )
  /* 当前计时器已流逝的秒数（用于实时显示） */
  const [elapsed, setElapsed] = useState(0)
  /* 保存状态 */
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  /* ── 番茄钟模式（与正计时并存，通过模式切换） ──
     计时状态存在 lib/pomodoro 的共享存储里（与简洁模式胶囊条同一份）：
     胶囊条里开始的专注，切到本页能看到同一个倒计时，反之亦然。 */
  const [mode, setMode] = useState<TimerMode>(() => (loadPomoState() ? 'pomodoro' : loadTimerMode()))
  /* 专注/休息时长（分钟），记住选择 */
  const [pomoFocusMin, setPomoFocusMin] = useState<number>(loadPomoFocusMin)
  const [pomoRestMin, setPomoRestMin] = useState<number>(loadPomoRestMin)
  const [pomoCustomFocus, setPomoCustomFocus] = useState<number>(loadPomoFocusMin)
  /* 进行中的番茄钟（null = 空闲） */
  const [pomo, setPomo] = useState<PomoState | null>(loadPomoState)
  /* 当前阶段剩余毫秒（展示用，由下方倒计时定时器刷新） */
  const [pomoRemainMs, setPomoRemainMs] = useState(() => {
    const p = loadPomoState()
    return p ? computePomoRemain(p, Date.now()) : 0
  })
  /* 空闲态选中的目标科目/学习内容（开始后以共享状态为准） */
  const [pomoTargetId, setPomoTargetId] = useState<string | null>(null)
  const [pomoTargetActivity, setPomoTargetActivity] = useState('')
  const [pomoPendingSubject, setPomoPendingSubject] = useState<string | null>(null) // 待选学习内容的科目（番茄钟）
  /* 供倒计时中断回调引用的最新函数（避免闭包捕获过期状态） */
  const pomoFinishRef = useRef<() => void>(() => {})

  /* 番茄钟派生展示值：运行中一律以共享状态为准，空闲时回落到本页选中的目标 */
  const pomoPhase: 'idle' | PomoPhase = pomo?.phase ?? 'idle'
  const pomoRunning = pomo ? !pomo.paused : false
  const pomoRound = pomo?.round ?? 0
  const pomoSubjectId = pomo?.subjectId ?? pomoTargetId
  const pomoActivity = pomo?.activity ?? pomoTargetActivity

  /** 落盘共享番茄钟状态：先写存储（另一个界面/定时器以存储为准），再刷新本页 UI */
  const applyPomo = useCallback((next: PomoState | null) => {
    savePomoState(next)
    setPomo(next)
    setPomoRemainMs(next ? computePomoRemain(next, Date.now()) : 0)
  }, [])

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
            (running.activity ? ` · ${formatActivityLabel(running.activity)}` : '')
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
    setPendingSubject(null)
    setSaved(false)
    // 原生端启动前台服务
    if (Capacitor.isNativePlatform()) {
      const subjectName = (getSubjectById(subjectId)?.name ?? subjectId) +
        (activity ? ` · ${formatActivityLabel(activity)}` : '')
      TimerForeground.startTimer({ subject: subjectName, startTimeMs: state.startTime })
    }
  }

  /* ── 待入库队列订阅：队列一变就刷新「今日累计」与待入库角标 ── */
  useEffect(() => subscribeOutbox(setOutboxItems), [])

  /* 换科目 / 收起面板 / 开始计时后，学习内容面板回到首层的分支列表 */
  useEffect(() => {
    setPendingGroup(null)
  }, [pendingSubject, pomoPendingSubject])

  /**
   * 结束一段计时的统一出口：先落进待入库队列（「今日累计」就是这条队列的投影），
   * 再尝试立即补传入账。跨零点时队列里会按自然日拆成多段，昨天/今天各记各的；
   * 补传失败不做补救——条目留在队列里，
   * 由联网/回前台/每 60 秒的自动补传接手，时长不会再丢。
   */
  const persistSession = useCallback(
    (label: string, input: TimerStashInput) => {
      const items = stashTimerSession(user?.id ?? null, input)
      if (!user) {
        toast.show(`${label} ${formatDurationShort(input.seconds)} 已暂存本地，登录后可保存`, { icon: '⏱️' })
        return
      }
      void (async () => {
        await flushTimerOutbox({ id: user.id }, { onlyRecent: true })
        const pending = items.filter((i) => loadOutbox().some((x) => x.id === i.id))
        if (pending.length === 0) {
          refetch()
          refreshTodayProgress()
          const scope = items.length > 1 ? '已按日期拆分记入各天记录' : '已记入今日记录'
          toast.show(`${label} ${formatDurationShort(input.seconds)} ${scope}`, { icon: '✅' })
        } else {
          toast.show(`${label} ${formatDurationShort(input.seconds)} 已暂存本地，将自动补传`, { icon: '⏱️' })
        }
      })()
    },
    [user, toast, refetch, refreshTodayProgress],
  )

  /* ── 结束计时 ── */
  const handleStop = useCallback(() => {
    if (!running) return
    // 暂停期间不计时：时长 = 开始到当前 - 累计暂停
    const pausedMs = running.pausedMs ?? 0
    const endNow = running.paused ? (running.pausedAt ?? Date.now()) : Date.now()
    const seconds = Math.floor((endNow - running.startTime - pausedMs) / 1000)
    setRunning(null)
    saveRunningTimer(null)
    setSaved(false)
    // 原生端停止前台服务
    if (Capacitor.isNativePlatform()) {
      TimerForeground.stopTimer()
    }
    if (seconds < 1 || !running.subjectId) return
    persistSession('结束计时', {
      subjectId: running.subjectId,
      activity: running.activity ?? '',
      seconds,
      startAt: running.startTime,
      endAt: endNow,
      pauses: toLogPauses(running.pauses, endNow),
    })
  }, [running, persistSession])

  /* 每次渲染都把最新 handleStop 写入 ref，供 BLE/通知栏回调使用 */
  handleStopRef.current = handleStop

  /* ── 番茄钟：一段专注结束时同样走「先落队列再补传」 ── */
  const stashPomoSession = useCallback(
    (label: string, session: TimerSession) => persistSession(label, session),
    [persistSession],
  )

  /** 启动一轮专注（选择科目后调用） */
  const startPomodoro = useCallback((subjectId: string, activity: string) => {
    setPomoTargetId(subjectId)
    setPomoTargetActivity(activity)
    setPomoPendingSubject(null)
    applyPomo(startPomo(subjectId, activity, pomoFocusMin, Date.now()))
  }, [pomoFocusMin, applyPomo])

  /** 空闲态点「开始专注」：用已选科目启动 */
  const startPomodoroFocus = useCallback(() => {
    if (!pomoSubjectId || pomo) return
    startPomodoro(pomoSubjectId, pomoActivity)
  }, [pomoSubjectId, pomoActivity, pomo, startPomodoro])

  /** 暂停/恢复 */
  const togglePomodoroPause = useCallback(() => {
    if (!pomo) return
    const now = Date.now()
    applyPomo(pomo.paused ? resumePomo(pomo, now) : pausePomo(pomo, now))
  }, [pomo, applyPomo])

  /** 跳过休息：直接回到空闲，开始下一轮（不记录休息） */
  const skipRest = useCallback(() => {
    if (!pomo || pomo.phase !== 'rest') return
    applyPomo(null)
  }, [pomo, applyPomo])

  /** 放弃：专注中按实际流逝时长入账后回空闲；休息中直接回空闲 */
  const abandonPomodoro = useCallback(() => {
    if (!pomo) return
    const session = abandonPomo(pomo, Date.now())
    if (session) stashPomoSession('结束专注', session)
    applyPomo(null)
  }, [pomo, stashPomoSession, applyPomo])

  /** 阶段结束：专注完成→记录+通知→进休息；休息结束→通知→回空闲 */
  const finishPomoPhase = useCallback(() => {
    if (!pomo) return
    const t = advancePomo(pomo, Date.now())
    // 先落盘：简洁模式胶囊条与本页的定时器不会对同一阶段重复结算
    applyPomo(t.next)
    if (t.session) stashPomoSession('专注完成', t.session)
    if (t.notify) void pomodoroNotify(t.notify)
  }, [pomo, stashPomoSession, applyPomo])

  /* 每次渲染把最新 finishPomoPhase 写入 ref，倒计时中断回调始终拿到最新 */
  pomoFinishRef.current = finishPomoPhase

  /* ── 番茄钟倒计时：专注/休息阶段到点自动切换（状态在共享存储，跨界面一致） ── */
  useEffect(() => {
    if (!pomo || pomo.paused) return
    const tick = () => {
      const p = loadPomoState()
      if (!p) {
        setPomo(null)
        setPomoRemainMs(0)
        return
      }
      const remain = computePomoRemain(p, Date.now())
      setPomoRemainMs(remain)
      if (remain <= 0) pomoFinishRef.current()
    }
    tick()
    const iv = setInterval(tick, 500)
    return () => clearInterval(iv)
  }, [pomo])

  /** 切换计时模式（记忆到共享偏好，简洁模式下拉同样读到） */
  const switchMode = useCallback((m: TimerMode) => {
    setMode(m)
    saveTimerMode(m)
  }, [])

  /* ── 硬件事件处理（暂停/继续/硬件开始） ── */
  /** 暂停：冻结计时（时长不累计，恢复后继续走），并记下这次暂停的时间点 */
  const handlePause = () => {
    if (!running || running.paused) return
    const next = pauseTimerState(running)
    setRunning(next)
    saveRunningTimer(next)
  }
  /** 继续：把本次暂停时长累计进 pausedMs，并补全暂停明细 */
  const handleResume = () => {
    if (!running || !running.paused) return
    const next = resumeTimerState(running)
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

  /* ── 保存到数据库：把待入库队列（＝今日累计）里的条目合并写进云端 ── */
  const handleSaveToDB = async () => {
    if (!user || pendingItems.length === 0) return
    setSaving(true)
    try {
      // 归属日期：计时开始那天（跨午夜/补交），否则今天；跨天补交到已有记录前先确认
      if (accumDate !== todayStr()) {
        const targetLog = await fetchLogByDate(user.id, accumDate)
        if (targetLog) {
          const ok = window.confirm(
            `${formatDateCn(accumDate)} 已有记录，本次学习时长将合并计入该日记录，是否继续？`,
          )
          if (!ok) return
        }
      }
      // 按归属日期分组补传（云端已有的条目直接出队，避免重复入账）；
      // adoptOrphans：未登录时暂存的条目此时归入当前用户
      const res = await flushTimerOutbox({ id: user.id }, { adoptOrphans: true })
      if (res.flushed > 0) {
        refetch()
        // 今日进度尺与目标线跟着已打卡时长走
        refreshTodayProgress()
        setSaved(true)
      }
      if (res.failed > 0) {
        toast.show(`${res.failed} 段计时未能入库，已留在本地等自动补传`, { icon: '⚠️' })
      }
    } finally {
      setSaving(false)
    }
  }

  /* ── 清空待入库条目（丢弃这批未入账时长） ── */
  const handleClearAccum = () => {
    clearOutboxEntries(user?.id ?? null)
    setSaved(false)
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
      await createUserSubject(user.id, {
        name: newName,
        activities: newActivities,
        category: newCatSel === '__custom__' ? newCatCustom : newCatSel,
      })
      setNewName('')
      setNewActivities([])
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
      await updateUserSubject(editing.id, {
        name: editing.name,
        activities: editActivities,
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
  /** 累计归属日期距今的天数（跨午夜补交为 1 天） */
  const accumAgeDays = (() => {
    const from = new Date(accumDate + 'T00:00:00').getTime()
    const to = new Date(todayStr() + 'T00:00:00').getTime()
    if (Number.isNaN(from) || Number.isNaN(to)) return 0
    return Math.max(0, Math.round((to - from) / 86400000))
  })()
  /**
   * 累计放置过久：归属日期已是 2 天前（跨午夜只是 1 天）。
   * 说明上一次计时结束后一直没保存也没清空，需要醒目提示，避免用户误以为日期算错。
   */
  const isStaleAccum = isBackfill && accumAgeDays >= 2
  const currentSubject = running?.subjectId
    ? (getSubjectById(running.subjectId)?.name ?? running.subjectId) +
      (running.activity ? ` · ${formatActivityLabel(running.activity)}` : '')
    : null
  /** 番茄钟已选目标科目展示名 */
  const pomoSubjectLabel = pomoSubjectId
    ? (getSubjectById(pomoSubjectId)?.name ?? pomoSubjectId) + (pomoActivity ? ` · ${formatActivityLabel(pomoActivity)}` : '')
    : null
  /** 本轮阶段进度（0-1）：专注 / 休息各自的倒计时完成度 */
  const pomoPhaseProgress = (() => {
    if (!pomo) return 0
    const total = (pomo.phase === 'focus' ? pomo.focusMin : pomo.restMin) * 60000
    if (total <= 0) return 0
    return Math.max(0, Math.min(1, (total - pomoRemainMs) / total))
  })()
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
    const label = (subj?.name ?? id) + (activity ? `·${formatActivityLabel(activity)}` : '')
    return (
      <div key={key} className="flex items-center justify-between gap-2 text-[13px]">
        <span className="flex min-w-0 items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${getDotColor(subj?.category)}`} aria-hidden="true" />
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0 font-medium tabular-nums text-slate-700 dark:text-slate-200">
          {formatDurationShort(entry.seconds)}
        </span>
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
          setPomoTargetId(subj.id)
          setPomoTargetActivity('')
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
    /** 正在计时的这一行在科目名后补上学习内容（从 Hero 副标题下沉到行内，列表更自解释） */
    const activeActivity = isActive ? (mode === 'pomodoro' ? pomoActivity : (running?.activity ?? '')) : ''
    return (
      <button
        key={subj.id}
        onClick={handleSubjectClick}
        disabled={isDisabled}
        className={`relative flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors ${
          isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
        } ${subjectRowTone(isDisabled ? 'disabled' : isSelected ? 'active' : 'normal')}`}
      >
        {isSelected && !isDisabled && (
          <span
            className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-500 dark:bg-indigo-400"
            aria-hidden="true"
          />
        )}
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${getDotColor(getSubjectById(subj.id)?.category)}`} aria-hidden="true" />
        <span className="truncate text-[13px] font-medium">{subj.name}</span>
        {isActive && activeActivity && <span className="shrink-0 text-[11px] opacity-75">· {formatActivityLabel(activeActivity)}</span>}
        {subjectTotal(subj.id) > 0 && (
          <span className="ml-auto shrink-0 text-[11px] font-medium tabular-nums opacity-70">
            {formatDurationShort(subjectTotal(subj.id))}
          </span>
        )}
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
    <div
      className={
        wide
          ? 'grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start gap-4'
          : 'space-y-4'
      }
    >
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
      {/* 科目选择（宽屏时为左列，与右侧计时器并排） */}
      <div className={wide ? 'min-w-0 space-y-4' : ''}>
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
                    <p className="mb-1.5 flex items-center gap-2 text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-500">
                      <span className="truncate">{label}</span>
                      <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800/80" aria-hidden="true" />
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">{subs.map(renderSubjectButton)}</div>
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
                  aria-expanded={show408}
                  className="group flex w-full cursor-pointer items-center gap-2 py-1"
                >
                  <Icon
                    name="chevronRight"
                    size={11}
                    className={`shrink-0 text-slate-300 transition-transform duration-150 dark:text-slate-600 ${show408 ? 'rotate-90' : ''}`}
                  />
                  <span className="shrink-0 text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-500">408 组</span>
                  <span className="truncate text-[10px] font-normal text-slate-400 dark:text-slate-500">计算机专业基础综合</span>
                  <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800/80" aria-hidden="true" />
                  {agg408Total > 0 && (
                    <span className="shrink-0 text-[11px] font-medium tabular-nums text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200">
                      {formatDurationShort(agg408Total)}
                    </span>
                  )}
                </button>
                {show408 && (
                  <div className="mt-1 grid grid-cols-2 gap-1.5 border-l-2 border-gray-100 pl-3 sm:gap-2 dark:border-slate-700">
                    {subs.map(renderSubjectButton)}
                  </div>
                )}
              </div>
            ))}
        </div>
        )}

      {/* 选择学习内容（正计时/番茄钟 共用）：逐级展开 科目 → 分支 → 内容 */}
        {(() => {
          const actSubjectId = mode === 'pomodoro' ? pomoPendingSubject : pendingSubject
          const showPanel = mode === 'pomodoro'
            ? !!actSubjectId && pomoPhase === 'idle'
            : !!actSubjectId && !running
          if (!showPanel) return null
          const actTree = getActivityTreeForSubject(actSubjectId!)
          const actSubject = getSubjectById(actSubjectId!)
          /** 已展开的分支；分支被删掉时自动落回首层 */
          const openGroup = actTree.groups.find((g) => g.name === pendingGroup) ?? null
          const startActivity = (path: string) =>
            mode === 'pomodoro' ? startPomodoro(actSubjectId!, path) : handleStart(actSubjectId!, path)
          const actChip = (path: string, label: string) => (
            <button
              key={path}
              type="button"
              onClick={() => startActivity(path)}
              className="cursor-pointer rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-600 transition-colors hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-300"
            >
              {label}
            </button>
          )
          return (
            <div className="mt-3 rounded-xl border border-indigo-200/70 bg-indigo-50/70 px-3 py-2.5 dark:border-indigo-500/25 dark:bg-indigo-500/10">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-[12px] font-medium text-indigo-700 dark:text-indigo-200">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${getDotColor(actSubject?.category)}`} aria-hidden="true" />
                  <span className="truncate font-semibold">{actSubject?.name}</span>
                  {openGroup && (
                    <>
                      <span className="shrink-0 opacity-50">·</span>
                      <span className="truncate font-semibold">{openGroup.name}</span>
                    </>
                  )}
                  <span className="shrink-0 opacity-80">· 选择学习内容</span>
                </span>
                {openGroup ? (
                  <button
                    type="button"
                    onClick={() => setPendingGroup(null)}
                    className="shrink-0 cursor-pointer rounded-md px-1.5 py-0.5 text-[11px] text-slate-500 transition-colors hover:bg-white/70 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    返回
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => (mode === 'pomodoro' ? setPomoPendingSubject(null) : setPendingSubject(null))}
                    className="shrink-0 cursor-pointer rounded-md px-1.5 py-0.5 text-[11px] text-slate-400 transition-colors hover:bg-white/70 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  >
                    取消
                  </button>
                )}
              </div>
              {/* 第二层：只显示该分支的学习内容 */}
              {openGroup ? (
                <div className="flex flex-wrap gap-1.5">
                  {openGroup.activities.map((a) => actChip(buildActivityPath(openGroup.name, a), a))}
                </div>
              ) : actTree.groups.length === 0 ? (
                /* 没有分支的科目（如英语）：沿用平铺内容，点击即开始 */
                <div className="flex flex-wrap gap-1.5">{actTree.leaves.map((a) => actChip(a, a))}</div>
              ) : (
                /* 第一层：只看分支名 + 未分层的顶层内容，点分支才展开它的内容 */
                <div className="grid grid-cols-2 gap-1.5">
                  {actTree.groups.map((g) => (
                    <button
                      key={g.name}
                      type="button"
                      onClick={() => setPendingGroup(g.name)}
                      className="group flex w-full cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1.5 text-left text-[12px] font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:border-indigo-500/50"
                    >
                      <span className="truncate">{g.name}</span>
                      <span className="ml-auto shrink-0 text-[10px] font-normal tabular-nums opacity-50">
                        {g.activities.length} 项
                      </span>
                      <Icon
                        name="chevronRight"
                        size={11}
                        className="shrink-0 text-slate-300 transition-colors group-hover:text-indigo-400 dark:text-slate-600 dark:group-hover:text-indigo-400"
                      />
                    </button>
                  ))}
                  {actTree.leaves.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => startActivity(a)}
                      title="不分层的学习内容：点击直接开始计时"
                      className="flex w-full cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-slate-200 bg-white/60 px-2.5 py-1.5 text-left text-[12px] font-medium text-slate-600 transition-colors hover:border-indigo-300 hover:bg-white hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800/20 dark:text-slate-300 dark:hover:border-indigo-500/50 dark:hover:text-indigo-300"
                    >
                      <span className="truncate">{a}</span>
                      <span className="ml-auto shrink-0 text-[10px] font-normal opacity-50">直接开始</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })()}
      </div>

      </div>

      {/* 右列（宽屏）：计时器面板 + 今日累计 + 科目管理 */}
      <div className={wide ? 'min-w-0 space-y-4' : 'space-y-4'}>

      {/* 计时器面板（Hero）：模式切换 + 计时读数 + 今日进度尺 + 圆形控制钮 */}
      <div className="card px-5 pb-5 pt-4 text-center">
        {/* 模式切换：正计时 / 番茄钟（分段控件，选中态用品牌浅底） */}
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800/60">
          {(['stopwatch', 'pomodoro'] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              aria-pressed={mode === m}
              className={`cursor-pointer rounded-md px-3.5 py-1.5 text-[13px] transition-colors ${
                mode === m
                  ? 'bg-indigo-50 font-semibold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300'
                  : 'font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {m === 'stopwatch' ? '正计时' : '番茄钟'}
            </button>
          ))}
        </div>

        {mode === 'stopwatch' ? (
          <>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              {running ? (
                <>
                  正在学习：
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{currentSubject}</span>
                  {running.paused && (
                    <span className="ml-1 font-medium text-amber-600 dark:text-amber-400">（已暂停）</span>
                  )}
                </>
              ) : Object.keys(accum).length > 0 ? (
                '选择科目继续计时'
              ) : (
                '点击左侧科目开始学习'
              )}
            </p>

            <div
              className={`my-3 text-[42px] font-semibold leading-none tracking-[-0.02em] tabular-nums sm:text-[48px] ${
                TIMER_DIGIT_TONE[running ? (running.paused ? 'paused' : 'running') : 'idle']
              }`}
            >
              {running ? formatDuration(elapsed) : '00:00:00'}
            </div>

            {/* 今日进度尺 + 目标线：与简洁模式胶囊条同一份实现 */}
            <TimerScale
              size="md"
              hours={todayHours}
              linePct={todayLine?.pct ?? null}
              className="mx-auto"
              title={
                todayLine
                  ? `今日已打卡 ${todayHours.toFixed(1)}h，今天还差约 ${todayLine.need.toFixed(1)}h 达成周目标日均`
                  : `今日已打卡 ${todayHours.toFixed(1)}h`
              }
            />
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              今日已打卡
              <span className="ml-1 font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                {todayHours.toFixed(1)}h
              </span>
              {todayLine && (
                <>
                  <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>
                  今日目标
                  <span className="ml-1 font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                    {todayLine.target.toFixed(1)}h
                  </span>
                  <span className="ml-1">（还差 {todayLine.need.toFixed(1)}h）</span>
                </>
              )}
            </p>

            {running && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => (running.paused ? handleResume() : handlePause())}
                  title={running.paused ? '继续' : '暂停'}
                  aria-label={running.paused ? '继续' : '暂停'}
                  className={`h-9 w-9 ${running.paused ? TIMER_ROUND_BTN.resume : TIMER_ROUND_BTN.pause}`}
                >
                  <Icon
                    name={running.paused ? 'play' : 'pause'}
                    size={12}
                    fill="currentColor"
                    stroke="none"
                    className={running.paused ? 'ml-[1px]' : ''}
                  />
                </button>
                <button
                  onClick={handleStop}
                  title="结束学习"
                  aria-label="结束学习"
                  className={`h-9 w-9 ${TIMER_ROUND_BTN.stop}`}
                >
                  <Icon name="stop" size={12} fill="currentColor" stroke="none" />
                </button>
              </div>
            )}
          </>
        ) : (
          /* ── 番茄钟面板 ── */
          <>
            {!pomo ? (
              <>
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  {pomoSubjectLabel ? (
                    <>
                      目标：
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{pomoSubjectLabel}</span>
                      <span className="ml-1">（点左侧科目可更换）</span>
                    </>
                  ) : (
                    '请先在左侧选择目标科目'
                  )}
                </p>

                <div
                  className={`my-3 text-[42px] font-semibold leading-none tracking-[-0.02em] tabular-nums sm:text-[48px] ${TIMER_DIGIT_TONE.idle}`}
                >
                  {formatMmSs(pomoFocusMin * 60000)}
                </div>

                {/* 专注时长：预设 chip + 自定义输入，一行排开 */}
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {[25, 45].map((m) => (
                    <button
                      key={m}
                      onClick={() => { setPomoFocusMin(m); setPomoCustomFocus(m); savePomoFocusMin(m) }}
                      className={`cursor-pointer rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
                        pomoFocusMin === m
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-600 dark:border-indigo-500/60 dark:bg-indigo-500/15 dark:text-indigo-300'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {m} 分钟
                    </button>
                  ))}
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 dark:border-slate-700 dark:bg-slate-800/40">
                    <input
                      type="number"
                      min={1}
                      max={240}
                      value={pomoCustomFocus}
                      aria-label="自定义专注时长（分钟）"
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        if (Number.isFinite(v) && v > 0) {
                          const m = Math.round(Math.min(240, Math.max(1, v)))
                          setPomoCustomFocus(m)
                          setPomoFocusMin(m)
                          savePomoFocusMin(m)
                        }
                      }}
                      className="w-9 bg-transparent text-center text-[12px] font-medium tabular-nums text-slate-700 outline-none dark:text-slate-200"
                    />
                    <span className="text-[12px] text-slate-400 dark:text-slate-500">分钟</span>
                  </span>
                </div>

                {/* 休息时长：可自定义 / 跳过 */}
                <div className="mt-2.5 flex items-center justify-center gap-2 text-[12px] text-slate-500 dark:text-slate-400">
                  休息
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={pomoRestMin}
                    aria-label="休息时长（分钟）"
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      if (Number.isFinite(v) && v >= 0) {
                        const m = Math.round(Math.min(120, Math.max(0, v)))
                        setPomoRestMin(m)
                        savePomoRestMin(m)
                      }
                    }}
                    className="w-10 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-center text-[12px] font-medium tabular-nums text-slate-700 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200"
                  />
                  分钟
                  <button
                    onClick={() => { setPomoRestMin(0); savePomoRestMin(0) }}
                    className="cursor-pointer rounded-md px-2 py-0.5 text-[12px] text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  >
                    跳过休息
                  </button>
                </div>

                <button
                  onClick={startPomodoroFocus}
                  disabled={!pomoSubjectId}
                  className={`mt-4 ${TIMER_PRIMARY_BTN}`}
                >
                  开始专注（{pomoFocusMin} 分钟）
                </button>
              </>
            ) : (
              <>
                <p className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${POMO_PILL_TONE[pomo.phase]}`}>
                    {pomo.phase === 'focus' ? '专注中' : '休息中'}
                  </span>
                  <span>第 {pomoRound + (pomo.phase === 'focus' ? 1 : 0)} 轮</span>
                  {pomoSubjectLabel && <span className="max-w-[220px] truncate">· {pomoSubjectLabel}</span>}
                  {!pomoRunning && (
                    <span className="font-medium text-amber-600 dark:text-amber-400">（已暂停）</span>
                  )}
                </p>

                <div
                  className={`my-3 text-[42px] font-semibold leading-none tracking-[-0.02em] tabular-nums sm:text-[48px] ${
                    !pomoRunning ? TIMER_DIGIT_TONE.paused : POMO_DIGIT_TONE[pomo.phase]
                  }`}
                >
                  {formatMmSs(pomoRemainMs)}
                </div>

                {/* 本轮阶段进度：专注 / 休息各自一段 */}
                <div className="mx-auto h-1 w-full max-w-[260px] overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/70">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ease-out ${POMO_BAR_TONE[pomo.phase]}`}
                    style={{ width: `${pomoPhaseProgress * 100}%` }}
                  />
                </div>

                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={togglePomodoroPause}
                    title={pomoRunning ? '暂停' : '继续'}
                    aria-label={pomoRunning ? '暂停' : '继续'}
                    className={`h-9 w-9 ${pomoRunning ? TIMER_ROUND_BTN.pause : TIMER_ROUND_BTN.resume}`}
                  >
                    <Icon
                      name={pomoRunning ? 'pause' : 'play'}
                      size={12}
                      fill="currentColor"
                      stroke="none"
                      className={pomoRunning ? '' : 'ml-[1px]'}
                    />
                  </button>
                  {pomo.phase === 'rest' ? (
                    <button
                      onClick={skipRest}
                      className="inline-flex cursor-pointer items-center justify-center rounded-full bg-amber-500 px-4 py-1.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-amber-400"
                    >
                      跳过休息
                    </button>
                  ) : (
                    <button onClick={abandonPomodoro} className={TIMER_GHOST_BTN}>
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
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                {isBackfill
                  ? pendingDates.length > 1
                    ? '跨天累计（补交）'
                    : `${formatDateCn(accumDate)}（补交）`
                  : '今日累计'}
              </h3>
              {isBackfill && !isStaleAccum && (
                <p className="mt-0.5 text-[11px] text-amber-600 dark:text-amber-400">
                  {pendingDates.length > 1
                    ? `跨过了零点，这批时长将按日期分别计入：${pendingDates.map(formatDateCn).join('、')}`
                    : `跨过了零点，本次时长将归入 ${formatDateCn(accumDate)}（计时开始的那天）`}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {has408 && (
                <button
                  onClick={() => setAgg408(!agg408)}
                  className="cursor-pointer rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  {agg408 ? '408 拆开' : '408 汇总'}
                </button>
              )}
              <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {formatDuration(totalSeconds)}
              </span>
            </div>
          </div>
          {/* 待入库角标：这批时长尚未进当天记录，联网会自动补传，也可手动保存。
              与说明文字同处一个可换行的行内，窄屏不会把卡片标题挤掉 */}
          {pendingItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-indigo-200/70 bg-indigo-50 px-2 py-0.5 font-medium text-indigo-600 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300"
                title={user ? '联网时自动补传，也可点「保存到今日记录」立即入库' : '登录后可保存或等自动补传'}
              >
                <Icon name="cloud" size={11} className="shrink-0" />
                {pendingItems.length} 段待入库
              </span>
              <span>
                {user
                  ? '联网、回到页面或每 60 秒会自动补传；也可点「保存到今日记录」立即入库。'
                  : '登录后点「保存到今日记录」归入当天记录（登录后也会自动补传）。'}
              </span>
            </div>
          )}
          {isStaleAccum && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200/70 bg-amber-50 px-3 py-2 dark:border-amber-500/25 dark:bg-amber-500/10">
              <Icon name="alert" size={13} className="mt-0.5 shrink-0 text-amber-500 dark:text-amber-400" />
              <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                这是 {formatDateCn(accumDate)} 遗留的未保存计时，已放置 {accumAgeDays} 天。
                确认后点「保存到{formatDateCn(accumDate)}」入账，或点「清空」丢弃这批时长。
              </p>
            </div>
          )}
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
                    className="group flex w-full cursor-pointer items-center justify-between py-0.5 text-[13px]"
                  >
                    <span className="font-medium text-slate-600 group-hover:text-indigo-600 dark:text-slate-300 dark:group-hover:text-indigo-300">
                      408 · 数据结构/组成/操作系统/计网
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                      {formatDurationShort(agg408Total)}
                    </span>
                  </button>
                  <div className="mt-1 space-y-1 border-l-2 border-slate-100 pl-4 dark:border-slate-800">
                    {Object.keys(agg408BySubject).map((id) => (
                      <div key={id} className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{getSubjectById(id)?.name}</span>
                        <span className="tabular-nums">{formatDurationShort(agg408BySubject[id])}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-slate-700">
            <button
              onClick={handleClearAccum}
              className="cursor-pointer rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            >
              清空
            </button>
            <div className="flex-1" />
            <button onClick={handleSaveToDB} disabled={saving || !user} className={TIMER_PRIMARY_BTN}>
              {saving
                ? '保存中...'
                : saved
                  ? '✓ 已保存'
                  : isBackfill
                    ? pendingDates.length > 1
                      ? '保存到各日记录'
                      : `保存到${formatDateCn(accumDate)}`
                    : '保存到今日记录'}
            </button>
          </div>
        </div>
      )}

      {/* 科目管理：默认收起（展开状态见 subjectAdminOpen），避免科目变多后把计时页撑长 */}
      {user && (
        <div className="card p-4">
          <button
            type="button"
            onClick={() => setSubjectAdminOpen((v) => !v)}
            aria-expanded={subjectAdminOpen}
            className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
          >
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                计时科目管理
              </span>
              <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
                {subjectsLoading
                  ? '加载中…'
                  : customSubjects.length === 0
                    ? '还没有科目，展开后可添加'
                    : `共 ${customSubjects.length} 个科目，展开可增删改`}
              </span>
            </span>
            <Icon
              name="chevronDown"
              size={16}
              className={`shrink-0 text-gray-400 transition-transform dark:text-slate-500 ${subjectAdminOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {subjectAdminOpen && (
            <>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 mt-3">
            科目保存在云端，可随时编辑改名或删除；历史记录不受影响，改名后历史记录会显示新名称。
          </p>

          {/* 新增科目 */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowAddModal(true)}
              disabled={creating}
              className="flex-1 rounded-lg border border-dashed border-indigo-300 bg-white px-4 py-2.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-500/50 dark:bg-slate-800/40 dark:text-indigo-300 dark:hover:bg-indigo-500/10 cursor-pointer"
            >
              + 添加科目
            </button>
            <button
              onClick={handleRecoverSubjects}
              disabled={recovering}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              title="从打卡记录 + 本机缓存找回被误删的科目"
            >
              {recovering ? '恢复中…' : '恢复被删科目'}
            </button>
            <button
              onClick={toggleSelectionMode}
              className={`shrink-0 rounded-lg border px-3 py-2.5 text-xs transition-colors cursor-pointer ${
                selectionMode
                  ? 'border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-500/50 dark:bg-rose-500/10 dark:text-rose-300'
                  : 'border-slate-300 text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
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
              <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200/70 bg-amber-50 px-3 py-2 text-[11px] text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
                <Icon name="alert" size={13} className="mt-0.5 shrink-0 text-amber-500 dark:text-amber-400" />
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
                        ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-400 dark:bg-indigo-500/10'
                        : 'border-gray-100 hover:border-indigo-300 dark:border-slate-700 dark:hover:border-slate-500 cursor-pointer'
                      : 'border-gray-100 dark:border-slate-700'
                  }`}
                >
                  {editing?.id === s.id ? (
                    <div className="space-y-2">
                      <input
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                      />
                      <ActivityTreeEditor value={editActivities} onChange={setEditActivities} />
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
                          className="cursor-pointer rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="cursor-pointer rounded-lg px-3 py-1 text-xs text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-slate-300"
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
                            className="h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        )}
                        <div>
                          <p className="flex items-center gap-1.5 text-sm font-medium text-gray-800 dark:text-slate-100">
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${getDotColor(s.category)}`} aria-hidden="true" />
                            {s.name}
                            {(() => {
                              const label = getCategoryLabel(s.category)
                              if (!label) return null
                              return (
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${getChipColor(s.category)}`}>
                                  {label}
                                </span>
                              )
                            })()}
                          </p>
                          {s.activities.length > 0 ? (
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                              内容：{s.activities.map(formatActivityLabel).join('、')}
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
                              setEditActivities(s.activities.map((a) => a.trim()).filter(Boolean))
                              // 编辑时把现有分组带回选择器：custom=无分组；408=内置选项；其他归入自定义输入
                              const cat = s.category && s.category !== 'custom' ? s.category : ''
                              setEditCatSel(cat === '408' ? '408' : cat ? '__custom__' : '')
                              setEditCatCustom(cat === '408' ? '' : cat)
                            }}
                            className="cursor-pointer rounded-lg border border-indigo-200 px-3 py-1 text-xs text-indigo-600 transition-colors hover:bg-indigo-50 dark:border-indigo-500/40 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(s.id)}
                            className="cursor-pointer rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10"
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
            <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-slate-700">
              <span className="text-xs text-gray-500 dark:text-slate-400">已选 {selectedIds.size} 个</span>
              <div className="flex-1" />
              <button
                onClick={handleBatchDelete}
                disabled={selectedIds.size === 0 || batchDeleting}
                className="cursor-pointer rounded-lg border border-rose-200 px-3 py-2 text-xs text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10"
              >
                {batchDeleting ? '删除中...' : `删除所选 (${selectedIds.size})`}
              </button>
            </div>
          )}
            </>
          )}
        </div>
      )}

      {!user && (
        <p className="text-center text-sm text-gray-400 dark:text-slate-500">
          请先登录后使用计时器
        </p>
      )}

      </div>

      {/* 添加科目弹窗 */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 p-5 space-y-4"
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
              placeholder="科目名称，如：数学、工作、健身"
              autoFocus
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
            {/* 学习内容：可建中层级（如 数学 → 高数/线代 → 听课/练习） */}
            <ActivityTreeEditor value={newActivities} onChange={setNewActivities} />
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
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
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