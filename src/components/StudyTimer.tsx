import { useState, useEffect, useRef, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import {
  createUserSubject,
  deleteUserSubject,
  fetchUserSubjects,
  getActivitiesForSubject,
  getAvailableSubjects,
  getSubjectById,
  loadUserSubjects,
  updateUserSubject,
  type Subject,
  type UserSubject,
} from '../lib/subjects'
import { createLog, fetchLogByDate, isDuplicateDateError, mergeSubjects, sortSubjectsByStartTime, updateLog, todayStr, type DailyLogSubject } from '../lib/dailyLogs'
import { formatDateCn, formatDuration, formatDurationShort, timeRangeHours, toTimeStr } from '../lib/format'
import { getButtonColor } from '../lib/colors'
import { useAuth } from '../contexts/AuthContext'
import { TimerForeground } from '../plugins/timer-foreground'
import { connectBleTimer, disconnectBleTimer } from '../lib/bleTimer'


/* ── 类型 ── */
interface TimerState {
  subjectId: string | null
  activity: string
  startTime: number // Date.now()
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

/* ── localStorage 持久化 ── */
const ACCUM_KEY = 'kaoyan_timer_accum'
const ACCUM_DATE_KEY = 'kaoyan_timer_accum_date'
const RUNNING_KEY = 'kaoyan_timer_running'

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
  try {
    const raw = localStorage.getItem(RUNNING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as TimerState
    if (!parsed.startTime) return null
    // 跨午夜修复：若计时开始于今天之前，丢弃（避免把昨天甚至更早的时长计入今日累计）
    if (new Date(parsed.startTime).toDateString() !== new Date().toDateString()) {
      localStorage.removeItem(RUNNING_KEY)
      return null
    }
    return { subjectId: parsed.subjectId ?? null, activity: parsed.activity ?? '', startTime: parsed.startTime }
  } catch {
    return null
  }
}

function saveRunningTimer(state: TimerState | null) {
  if (state) {
    localStorage.setItem(RUNNING_KEY, JSON.stringify(state))
  } else {
    localStorage.removeItem(RUNNING_KEY)
  }
}

/* ── 工具 ── */

/** 累计键：科目::学习内容 */
function accumKey(subjectId: string, activity: string): string {
  return `${subjectId}::${activity}`
}

/** 属于 408 综合卷、支持汇总/分开两种显示的科目 id */
const AGG_408_IDS = ['ds', 'co', 'os', 'cn']

/* ── 组件 ── */
export default function StudyTimer() {
  const { user } = useAuth()
  /* 可选择的科目（内置 + 自定义），随增删改实时刷新 */
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>(() => getAvailableSubjects())
  /* 自定义科目列表（管理用） */
  const [customSubjects, setCustomSubjects] = useState<UserSubject[]>([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  /* 新增科目表单 */
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newActivities, setNewActivities] = useState('')
  const [creating, setCreating] = useState(false)
  /* 正在编辑的科目 */
  const [editing, setEditing] = useState<UserSubject | null>(null)
  const [editActivities, setEditActivities] = useState('')

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

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* ── BLE 计时器连接状态 ── */
  const [bleConnected, setBleConnected] = useState(false)
  const [bleSearching, setBleSearching] = useState(true)
  /* 今日累计里 408 是否汇总显示 */
  const [agg408, setAgg408] = useState(true)
  /* 科目选择里 408 分组是否展开 */
  const [show408, setShow408] = useState(true)
  /* 始终指向最新的 handleStop，供 BLE/通知栏回调使用，避免闭包捕获过期状态 */
  const handleStopRef = useRef<() => void>(() => {})

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

  /* ── 连接 BLE 计时器（原生 App 上自动连接，收到"结束"即触发 handleStop） ── */
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let removed = false

    const connect = async () => {
      try {
        await connectBleTimer({
          onStop: () => { if (!removed) handleStopRef.current() },
          onDisconnect: () => { if (!removed) setBleConnected(false) },
        })
        if (!removed) setBleConnected(true)
      } catch {
        // 未连接/找不到设备不影响手机上直接计时，这里静默处理
      } finally {
        if (!removed) setBleSearching(false)
      }
    }
    connect()
    return () => {
      removed = true
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
      const e = Math.floor((Date.now() - running.startTime) / 1000)
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
  }, [running?.startTime, running?.subjectId, running?.activity])

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
    const seconds = Math.floor((Date.now() - running.startTime) / 1000)
    if (seconds < 1) {
      // 小于 1 秒不记录，直接取消
      setRunning(null)
      saveRunningTimer(null)
      return
    }
    const key = accumKey(running.subjectId!, running.activity ?? '')
    const range: TimeRange = {
      start: toTimeStr(new Date(running.startTime)),
      end: toTimeStr(new Date()),
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

      const existingLog = await fetchLogByDate(user.id, targetDate)

      if (existingLog) {
        // 补交到已有记录的日期时，先告知用户本次时长将合并计入该日
        if (targetDate !== todayStr()) {
          const ok = window.confirm(
            `${formatDateCn(targetDate)} 已有记录，本次学习时长将合并计入该日记录，是否继续？`
          )
          if (!ok) return
        }
        // 合并已有记录：按 (id, activity) 匹配相加（含两位小数取整，避免浮点误差）
        const mergedSubjects = mergeSubjects(existingLog.subjects, subjectEntries)
        await updateLog(existingLog.id, {
          date: targetDate,
          subjects: mergedSubjects,
          summary: existingLog.summary,
        })
      } else {
        await createLog(user.id, {
          date: targetDate,
          subjects: subjectEntries,
          summary: '',
        })
      }

      // 清空累计
      setAccum({})
      saveAccum({})
      localStorage.removeItem(ACCUM_DATE_KEY)
      setAccumDate(todayStr())
      setSaved(true)
    } catch (err) {
      if (isDuplicateDateError(err)) {
        alert('该日期已有记录，请刷新后重试')
      } else {
        alert('保存失败：' + (err instanceof Error ? err.message : '未知错误'))
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
    try {
      await connectBleTimer({
        onStop: () => handleStopRef.current(),
        onDisconnect: () => setBleConnected(false),
      })
      setBleConnected(true)
    } catch {
      // 未连接/找不到设备不影响手机上直接计时，这里静默处理
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
    setCreating(true)
    try {
      const activities = newActivities
        .split(/[，,、\n]/)
        .map((a) => a.trim())
        .filter(Boolean)
      await createUserSubject(user.id, { name: newName, activities })
      setNewName('')
      setNewActivities('')
      setShowAddModal(false)
      await loadCustomSubjects()
      await refreshSubjects()
    } catch (err) {
      alert('添加失败：' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateSubject = async () => {
    if (!editing) return
    try {
      const activities = editActivities
        .split(/[，,、\n]/)
        .map((a) => a.trim())
        .filter(Boolean)
      await updateUserSubject(editing.id, { name: editing.name, activities })
      setEditing(null)
      await loadCustomSubjects()
      await refreshSubjects()
    } catch (err) {
      alert('保存失败：' + (err instanceof Error ? err.message : '未知错误'))
    }
  }

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm('确定删除该科目？已记录的历史数据不受影响。')) return
    try {
      await deleteUserSubject(id)
      await loadCustomSubjects()
      await refreshSubjects()
    } catch (err) {
      alert('删除失败：' + (err instanceof Error ? err.message : '未知错误'))
    }
  }

  const totalSeconds = Object.values(accum).reduce((a, b) => a + b.seconds, 0)
  /** 是否补交：累计归属日期不是今天（跨午夜/隔天保存） */
  const isBackfill = accumDate !== todayStr()
  const currentSubject = running?.subjectId
    ? (getSubjectById(running.subjectId)?.name ?? running.subjectId) +
      (running.activity ? ` · ${running.activity}` : '')
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
  /** 408 各科目今天的累计秒数 */
  const agg408BySubject = (() => {
    const map: Record<string, number> = {}
    for (const [key, entry] of todayEntries) {
      const id = key.split('::')[0]
      if (AGG_408_IDS.includes(id)) map[id] = (map[id] ?? 0) + entry.seconds
    }
    return map
  })()
  /** 408 总秒数 */
  const agg408Total = Object.values(agg408BySubject).reduce((a, b) => a + b, 0)
  const has408 = agg408Total > 0
  /** 非 408 的累计条目 */
  const non408Entries = todayEntries.filter(([key]) => !AGG_408_IDS.includes(key.split('::')[0]))
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
  /** 单个科目按钮（含当前计时高亮、今日累计展示） */
  const renderSubjectButton = (subj: Subject) => {
    const isActive = running?.subjectId === subj.id
    const isDisabled = running !== null && !isActive
    return (
      <button
        key={subj.id}
        onClick={() => {
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
        }}
        disabled={isDisabled}
        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer
          ${isActive
            ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900 scale-105 shadow-md ' + getButtonColor(getSubjectById(subj.id)?.category)
            : isDisabled
              ? 'opacity-40 cursor-not-allowed border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500'
              : pendingSubject === subj.id
                ? 'ring-2 ring-offset-2 ring-blue-300 dark:ring-offset-slate-900 ' + getButtonColor(getSubjectById(subj.id)?.category)
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
              ? '硬件计时器已连接：在设备上按「结束」即可记入打卡'
              : bleSearching
                ? '正在查找硬件计时器…'
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
        <div className="space-y-3">
          {/* 政治 / 英语 / 数学 等非 408 科目一排 */}
          <div className="flex flex-wrap gap-2">
            {availableSubjects
              .filter((s) => s.category !== '408')
              .map(renderSubjectButton)}
          </div>
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

        {/* 选择学习内容 */}
        {pendingSubject && !running && (
          <div className="mt-3 rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700 dark:text-slate-300">
                {getSubjectById(pendingSubject)?.name} · 选择学习内容
              </span>
              <button
                type="button"
                onClick={() => setPendingSubject(null)}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 cursor-pointer"
              >
                取消
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {getActivitiesForSubject(pendingSubject).map((act) => (
                <button
                  key={act}
                  type="button"
                  onClick={() => handleStart(pendingSubject, act)}
                  className="px-3 py-1 text-sm rounded-full bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-600 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-300 transition-colors cursor-pointer"
                >
                  {act}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 计时器面板 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 text-center">
        {running ? (
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-1.5">
            正在学习：<span className="font-semibold text-gray-700 dark:text-slate-200">{currentSubject}</span>
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
          <button
            onClick={handleStop}
            className="px-8 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-base transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20 cursor-pointer"
          >
            ■ 结束学习
          </button>
        ) : (
          <p className="text-xs text-gray-400 dark:text-slate-500">点击科目开始</p>
        )}
      </div>

      {/* 今日累计 */}
      {Object.keys(accum).length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 space-y-3">
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
                    {AGG_408_IDS.filter((id) => agg408BySubject[id] > 0).map((id) => (
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
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1">计时科目管理</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
            添加自定义科目及学习内容，删除后立即从上方科目中移除（历史记录不受影响）。
          </p>

          {/* 新增科目 */}
          <button
            onClick={() => setShowAddModal(true)}
            disabled={creating}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-600 border border-dashed border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-slate-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            + 添加科目
          </button>

          {/* 自定义科目列表 */}
          {subjectsLoading ? (
            <p className="text-xs text-gray-400 dark:text-slate-500">加载中...</p>
          ) : customSubjects.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-slate-500">
              暂无自定义科目，内置科目（政治/英语/数学/408）始终可用。
            </p>
          ) : (
            <ul className="space-y-2">
              {customSubjects.map((s) => (
                <li key={s.id} className="rounded-lg border border-gray-100 dark:border-slate-700 p-3">
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
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-100">{s.name}</p>
                        {s.activities.length > 0 ? (
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            内容：{s.activities.join('、')}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">无学习内容</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditing(s)
                            setEditActivities(s.activities.join('、'))
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
                    </div>
                  )}
                </li>
              ))}
            </ul>
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