import { useState, useEffect, useRef, useCallback } from 'react'
import { getAvailableSubjects, getSubjectById } from '../lib/subjects'
import { createLog, fetchTodayLog, updateLog, todayStr } from '../lib/dailyLogs'
import { useAuth } from '../contexts/AuthContext'


/* ── 类型 ── */
interface TimerState {
  subjectId: string | null
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
    return raw ? JSON.parse(raw) : null
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
function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

function formatDurationShort(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

/* ── 科目颜色 ── */
const SUBJECT_COLORS: Record<string, string> = {
  math: 'border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/40',
  english: 'border-green-400 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900/40',
  '408': 'border-purple-400 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700 dark:hover:bg-purple-900/40',
  politics: 'border-red-400 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-900/40',
}

function getSubjectColor(subjectId: string): string {
  const cat = getSubjectById(subjectId)?.category
  return cat ? SUBJECT_COLORS[cat] ?? SUBJECT_COLORS['408'] : SUBJECT_COLORS['408']
}

/* ── 组件 ── */
export default function StudyTimer() {
  const { user } = useAuth()
  const subjects = getAvailableSubjects()

  /* 当前运行中的计时器 */
  const [running, setRunning] = useState<TimerState | null>(loadRunningTimer)
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
  const handleStart = (subjectId: string) => {
    const state: TimerState = { subjectId, startTime: Date.now() }
    setRunning(state)
    saveRunningTimer(state)
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
    const newAccum = { ...accum }
    newAccum[running.subjectId!] = (newAccum[running.subjectId!] || 0) + seconds
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
      // 将秒数转为小时（保留 2 位小数）
      const subjectHours: Record<string, number> = {}
      for (const [id, sec] of Object.entries(accum)) {
        subjectHours[id] = Math.round((sec / 3600) * 100) / 100
      }

      const existingLog = await fetchTodayLog(user.id)

      if (existingLog) {
        // 合并已有记录：累计 + 已有
        const mergedSubjects = [...existingLog.subjects]
        for (const [id, hours] of Object.entries(subjectHours)) {
          const idx = mergedSubjects.findIndex((s) => s.id === id)
          if (idx >= 0) {
            mergedSubjects[idx] = { ...mergedSubjects[idx], hours: mergedSubjects[idx].hours + hours }
          } else {
            mergedSubjects.push({ id, hours })
          }
        }
        await updateLog(existingLog.id, {
          date: todayStr(),
          subjects: mergedSubjects,
          summary: existingLog.summary,
        })
      } else {
        const subjects = Object.entries(subjectHours).map(([id, hours]) => ({ id, hours }))
        await createLog(user.id, {
          date: todayStr(),
          subjects,
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
    ? getSubjectById(running.subjectId)?.name ?? running.subjectId
    : null

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
                    handleStart(subj.id)
                  }
                }}
                disabled={isDisabled}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer
                  ${isActive
                    ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900 scale-105 shadow-md ' + getSubjectColor(subj.id)
                    : isDisabled
                      ? 'opacity-40 cursor-not-allowed border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500'
                      : getSubjectColor(subj.id)
                  }`}
              >
                {subj.name}
                {(accum[subj.id] ?? 0) > 0 && (
                  <span className="ml-1.5 text-xs opacity-75">({formatDurationShort(accum[subj.id]!)})</span>
                )}
              </button>
            )
          })}
        </div>
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
              .map(([id, sec]) => {
                const subj = getSubjectById(id)
                return (
                  <div key={id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-slate-400">{subj?.name ?? id}</span>
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