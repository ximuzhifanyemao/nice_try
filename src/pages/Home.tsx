import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Countdown from '../components/Countdown'
import Calendar from '../components/Calendar'
import type { DailyLog } from '../lib/dailyLogs'
import { fetchMyLogs, todayStr } from '../lib/dailyLogs'
import { computeStreak } from '../lib/achievements'
import { fetchCommitments, getWeekStartStr, getWeekEndStr, sumHoursInRange } from '../lib/commitments'
import { fetchMyCheckins } from '../lib/englishCheckin'

export default function Home() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [weekTarget, setWeekTarget] = useState<number | null>(null)
  const [checkinCount, setCheckinCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setLogs([])
      setWeekTarget(null)
      setCheckinCount(0)
      setLoading(false)
      return
    }
    fetchMyLogs(user.id)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
    // 本周目标（承诺金）
    fetchCommitments(user.id)
      .then((list) => {
        const current = list.find((c) => c.week_start === getWeekStartStr())
        setWeekTarget(current && current.status === 'active' ? current.target_hours : null)
      })
      .catch(() => setWeekTarget(null))
    // 英语打卡进度
    fetchMyCheckins(user.id)
      .then((list) => setCheckinCount(list.length))
      .catch(() => setCheckinCount(0))
  }, [user])

  const streak = useMemo(() => computeStreak(logs.map((l) => l.date)), [logs])
  const weekStart = getWeekStartStr()
  const weekEnd = getWeekEndStr()
  const actualHours = useMemo(() => sumHoursInRange(logs, weekStart, weekEnd), [logs, weekStart, weekEnd])

  const hasCheckedToday = logs.some((l) => l.date === todayStr())
  const hasAnyLog = logs.length > 0
  const progress = weekTarget && weekTarget > 0 ? Math.min(100, (actualHours / weekTarget) * 100) : 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 space-y-4">
      {user && (
        <>
          {/* 打卡提醒（单行紧凑） */}
          {!hasCheckedToday && (
            <Link
              to="/my-records/new"
              className="block rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 transition-colors hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              {hasAnyLog && streak.current === 0 ? '🔥 连续打卡已断签，今天重新开始吧' : '✍️ 今天还没打卡，别忘了记录学习'}
            </Link>
          )}

          {/* 连续打卡 + 本周进度（移动端并排紧凑） */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/achievements"
              className="rounded-xl bg-white dark:bg-slate-800 p-3 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] text-gray-500 dark:text-slate-400">连续打卡</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500">最长{streak.longest}天</p>
              </div>
              <p className="text-lg font-bold text-orange-500 dark:text-orange-400 mt-0.5">🔥 {streak.current} 天</p>
            </Link>

            <Link
              to="/goal"
              className="rounded-xl bg-white dark:bg-slate-800 p-3 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] text-gray-500 dark:text-slate-400">本周进度</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500">
                  {weekTarget ? `${actualHours.toFixed(1)}/${weekTarget}h` : '未设定'}
                </p>
              </div>
              {weekTarget ? (
                <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-green-500 dark:bg-green-400' : 'bg-blue-500 dark:bg-blue-400'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              ) : (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5">去设定目标 →</p>
              )}
            </Link>
          </div>
        </>
      )}

      {/* 英语长难句打卡入口 */}
      {user && (
        <Link
          to="/english-checkin"
          className="block rounded-xl bg-white dark:bg-slate-800 p-3 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📖</span>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-slate-100">英语长难句打卡</p>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">柴荣老师 150 天 · 逐句翻译打分</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-slate-400">{checkinCount}/150 天</span>
              <span className="text-gray-400 dark:text-slate-500">→</span>
            </div>
          </div>
          {checkinCount > 0 && (
            <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden mt-2">
              <div
                className="h-full rounded-full bg-green-500 dark:bg-green-400 transition-all"
                style={{ width: `${(checkinCount / 150) * 100}%` }}
              />
            </div>
          )}
        </Link>
      )}

      {/* 手机 App 下载入口 */}
      <a
        href="/kaoyan-tracker.apk"
        download
        className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-3 border border-blue-200 dark:border-blue-800/50 transition-colors hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-950/60 dark:hover:to-indigo-950/60"
      >
        <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-base">
          📱
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">下载手机 App</p>
          <p className="text-[11px] text-blue-500/70 dark:text-blue-400/60">Android 原生体验 · 离线可用 · 消息提醒</p>
        </div>
        <span className="shrink-0 rounded-full bg-blue-600 text-white text-xs font-medium px-3 py-1">下载</span>
      </a>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">
        <div>
          <Countdown />
        </div>
        <div className="lg:self-start">
          <Calendar logs={logs} loading={loading} />
        </div>
      </div>
    </div>
  )
}
