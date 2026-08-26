import { useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { HomeLayoutContext } from '../App'
import Countdown from '../components/Countdown'
import Calendar from '../components/Calendar'
import type { DailyLog } from '../lib/dailyLogs'
import { fetchMyLogs, todayStr } from '../lib/dailyLogs'
import { computeStreak } from '../lib/achievements'
import { fetchCommitments, getWeekStartStr, getWeekEndStr, sumHoursInRange } from '../lib/commitments'
import { fetchMyCheckins } from '../lib/englishCheckin'

export default function Home() {
  const { user } = useAuth()
  const { twoCol } = useContext(HomeLayoutContext)
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
    <div className="mx-auto max-w-5xl px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
      {user && (
        <>
          {/* 打卡提醒（单行紧凑） */}
          {!hasCheckedToday && (
            <Link
              to="/my-records/new"
              className="block rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-300/90 transition-colors hover:bg-amber-100 dark:hover:bg-amber-500/15"
            >
              {hasAnyLog && streak.current === 0 ? '🔥 连续打卡已断签，今天重新开始吧' : '✍️ 今天还没打卡，别忘了记录学习'}
            </Link>
          )}

          {/* 连续打卡 + 本周进度（移动端并排紧凑） */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/achievements"
              className="rounded-xl bg-white dark:bg-slate-900 p-3 border border-gray-100 dark:border-slate-800 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] text-gray-500 dark:text-slate-500">连续打卡</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-600">最长{streak.longest}天</p>
              </div>
              <p className="text-lg font-bold text-orange-500 dark:text-orange-400 mt-0.5">🔥 {streak.current} 天</p>
            </Link>

            <Link
              to="/goal"
              className="rounded-xl bg-white dark:bg-slate-900 p-3 border border-gray-100 dark:border-slate-800 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] text-gray-500 dark:text-slate-500">本周进度</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-600">
                  {weekTarget ? `${actualHours.toFixed(1)}/${weekTarget}h` : '未设定'}
                </p>
              </div>
              {weekTarget ? (
                <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-indigo-500 dark:bg-indigo-400'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              ) : (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1.5">去设定目标 →</p>
              )}
            </Link>
          </div>
        </>
      )}

      {/* 英语长难句打卡入口 */}
      {user && (
        <Link
          to="/english-checkin"
          className="block rounded-xl bg-white dark:bg-slate-900 p-3 border border-gray-100 dark:border-slate-800 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📖</span>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-slate-100">英语长难句打卡</p>
                <p className="text-[11px] text-gray-500 dark:text-slate-500">柴荣老师 150 天 · 逐句翻译打分</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-slate-400">{checkinCount}/150 天</span>
              <span className="text-gray-400 dark:text-slate-600">→</span>
            </div>
          </div>
          {checkinCount > 0 && (
            <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-2">
              <div
                className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400 transition-all"
                style={{ width: `${(checkinCount / 150) * 100}%` }}
              />
            </div>
          )}
        </Link>
      )}

      <div className={`grid gap-4 items-start ${twoCol ? 'grid-cols-[1fr_280px]' : 'grid-cols-1 lg:grid-cols-[1fr_280px]'}`}>
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
