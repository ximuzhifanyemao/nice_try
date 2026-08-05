import { useState, useEffect, useRef, useCallback } from 'react'
import { getAvailableSubjects, getSubjectById, getActivitiesForSubject } from '../lib/subjects'
import { createLog, fetchTodayLog, updateLog, todayStr, type DailyLogSubject } from '../lib/dailyLogs'
import { formatDuration, formatDurationShort } from '../lib/format'
import { getButtonColor } from '../lib/colors'
import { useAuth } from '../contexts/AuthContext'


/* ── 类型 ── */
interface TimerState {
  subjectId: string | null
  activity: string
  startTime: number // Date.now()
}

/** 每个科目今日累计秒数 */
type AccumMap = Record<string, number>

/* ── localStorage 持久化 ── */
const ACCUM_KEY = 'kaoyan_timer_accum'
const ACCUM_DATE_KEY = 'kaoyan_timer_accum_date'
const RUNNING_KEY = 'kaoyan_timer_running'

function loadAccum(): AccumMap {
  const date = localStorage.getItem(ACCUM_DATE_KEY)
  if (date !== todayStr()) return {}
  try {
    return JSON.parse(localStorage.getItem(ACCUM_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveAccum(accum: AccumMap) {
  localStorage.setItem(ACCUM_DATE_KEY, todayStr())
  localStorage.setItem(ACCUM_KEY, JSON.stringify(accum))
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

/* ── 组件 ── */
export default function StudyTimer() {
  const { user } = useAuth()
  const subjects = getAvailableSubjects()

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

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* ── 实时更新 elapsed ── */
  useEffect(() => {
    if (!running?.startTime) {
      setElapsed(0)
      return
    }
    const tick = () => setElapsed(Math.floor((Date.now() - running.startTime) / 1000))
    tick()
    intervalRef.current = setInterval(tick, 1000)
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current)
    }
  }, [running?.startTime, running?.subjectId])

  /* ── 开始计时 ── */
  const handleStart = (subjectId: string, activity: string) => {
    const state: TimerState = { subjectId, activity, startTime: Date.now() }
    setRunning(state)
    saveRunningTimer(state)
    setPendingSubject(null)
    setSaved(false)
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
    const newAccum = { ...accum }
    newAccum[key] = (newAccum[key] || 0) + seconds
    setAccum(newAccum)
    saveAccum(newAccum)
    setRunning(null)
    saveRunningTimer(null)
    setSaved(false)
  }, [running, accum])

  /* ── 保存到数据库 ── */
  const handleSaveToDB = async () => {
    if (!user || Object.keys(accum).length === 0) return
    setSaving(true)
    try {
      // 将秒数转为小时（保留 2 位小数），按 科目::学习内容 分组
      // 过滤掉未知科目 id（localStorage 可被篡改，防止注入脏数据）
      const subjectEntries: DailyLogSubject[] = []
      for (const [key, sec] of Object.entries(accum)) {
        if (sec <= 0) continue
        const [id, activity] = key.split('::')
        if (!getSubjectById(id)) continue
        const hours = Math.round((sec / 3600) * 100) / 100
        subjectEntries.push(
          activity
            ? { id, hours, activity }
            : { id, hours }
        )
      }
      if (subjectEntries.length === 0) {
        setAccum({})
        saveAccum({})
        setSaved(true)
        return
      }

      const existingLog = await fetchTodayLog(user.id)

      if (existingLog) {
        // 合并已有记录：按 (id, activity) 匹配
        const mergedSubjects = [...existingLog.subjects]
        for (const entry of subjectEntries) {
          const idx = mergedSubjects.findIndex(
            (s) => s.id === entry.id && (s.activity ?? '') === (entry.activity ?? '')
          )
          if (idx >= 0) {
            mergedSubjects[idx] = { ...mergedSubjects[idx], hours: mergedSubjects[idx].hours + entry.hours }
          } else {
            mergedSubjects.push(entry)
          }
        }
        await updateLog(existingLog.id, {
          date: todayStr(),
          subjects: mergedSubjects,
          summary: existingLog.summary,
        })
      } else {
        await createLog(user.id, {
          date: todayStr(),
          subjects: subjectEntries,
          summary: '',
        })
      }

      // 清空累计
      setAccum({})
      saveAccum({})
      setSaved(true)
    } catch (err) {
      alert('保存失败：' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setSaving(false)
    }
  }

  /* ── 清空累计 ── */
  const handleClearAccum = () => {
    setAccum({})
    saveAccum({})
  }

  const totalSeconds = Object.values(accum).reduce((a, b) => a + b, 0)
  const currentSubject = running?.subjectId
    ? (getSubjectById(running.subjectId)?.name ?? running.subjectId) +
      (running.activity ? ` · ${running.activity}` : '')
    : null
  /** 某科目今日累计秒数（含各学习内容） */
  const subjectTotal = (id: string): number =>
    Object.entries(accum)
      .filter(([key]) => key.startsWith(id + '::'))
      .reduce((a, [, sec]) => a + sec, 0)

  return (
    <div className="space-y-6">
      {/* 科目选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
          选择科目
        </label>
        <div className="flex flex-wrap gap-2">
          {subjects.map((subj) => {
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
                {subj.name}
                {subjectTotal(subj.id) > 0 && (
                  <span className="ml-1.5 text-xs opacity-75">({formatDurationShort(subjectTotal(subj.id))})</span>
                )}
              </button>
            )
          })}
        </div>

        {/* 选择学习内容 */}
        {pendingSubject && !running && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 px-3 py-2">
            <span className="text-sm text-gray-700 dark:text-slate-300">
              {getSubjectById(pendingSubject)?.name} · 选择学习内容
            </span>
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
            <button
              type="button"
              onClick={() => setPendingSubject(null)}
              className="ml-auto text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 cursor-pointer"
            >
              取消
            </button>
          </div>
        )}
      </div>

      {/* 计时器面板 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 text-center">
        {running ? (
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">
            正在学习：<span className="font-semibold text-gray-700 dark:text-slate-200">{currentSubject}</span>
          </p>
        ) : (
          <p className="text-sm text-gray-400 dark:text-slate-500 mb-2">
            {Object.keys(accum).length > 0 ? '选择科目继续计时' : '点击上方科目开始学习'}
          </p>
        )}

        <div className="text-5xl sm:text-7xl font-mono font-bold tabular-nums text-gray-900 dark:text-slate-100 my-6 tracking-wider">
          {running ? formatDuration(elapsed) : '00:00:00'}
        </div>

        {running ? (
          <button
            onClick={handleStop}
            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20 cursor-pointer"
          >
            ■ 结束学习
          </button>
        ) : (
          <p className="text-sm text-gray-400 dark:text-slate-500">点击科目开始</p>
        )}
      </div>

      {/* 今日累计 */}
      {Object.keys(accum).length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">今日累计</h3>
            <span className="text-lg font-bold text-gray-900 dark:text-slate-100">
              {formatDuration(totalSeconds)}
            </span>
          </div>
          <div className="space-y-2">
            {Object.entries(accum)
              .filter(([, sec]) => sec > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([key, sec]) => {
                const [id, activity] = key.split('::')
                const subj = getSubjectById(id)
                const label = (subj?.name ?? id) + (activity ? `·${activity}` : '')
                return (
                  <div key={key} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-slate-400">{label}</span>
                    <span className="font-mono text-gray-800 dark:text-slate-200">{formatDurationShort(sec)}</span>
                  </div>
                )
              })}
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
              {saving ? '保存中...' : saved ? '✓ 已保存' : '保存到今日记录'}
            </button>
          </div>
        </div>
      )}

      {!user && (
        <p className="text-center text-sm text-gray-400 dark:text-slate-500">
          请先登录后使用计时器
        </p>
      )}
    </div>
  )
}