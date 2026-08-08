import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Countdown from '../components/Countdown'
import Calendar from '../components/Calendar'
import type { DailyLog } from '../lib/dailyLogs'
import { fetchMyLogs, todayStr } from '../lib/dailyLogs'
import { computeStreak } from '../lib/achievements'
import { fetchCommitments, getWeekStartStr, getWeekEndStr, sumHoursInRange } from '../lib/commitments'
import { formatDateShort } from '../lib/format'

export default function Home() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [weekTarget, setWeekTarget] = useState<number | null>(null)

  useEffect(() => {
    if (!user) {
      setLogs([])
      setWeekTarget(null)
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
          {/* 打卡提醒 */}
          {!hasCheckedToday && (
            <Link
              to="/my-records/new"
              className="block rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 px-4 py-3 text-sm text-amber-700 dark:text-amber-300 transition-colors hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              {hasAnyLog && streak.current === 0 ? '🔥 连续打卡已断签，今天重新开始吧' : '✍️ 今天还没打卡，别忘了记录学习'}
            </Link>
          )}

          {/* 连续打卡 + 本周进度 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/achievements"
              className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              <div className="flex items-baseline justify-between">
                <p className="text-xs text-gray-500 dark:text-slate-400">连续打卡</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">最长 {streak.longest} 天</p>
              </div>
              <p className="text-2xl font-bold text-orange-500 dark:text-orange-400 mt-1">
                🔥 {streak.current} 天
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">去查看成就 →</p>
            </Link>

            <Link
              to="/goal"
              className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              <div className="flex items-baseline justify-between">
                <p className="text-xs text-gray-500 dark:text-slate-400">本周进度</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">{formatDateShort(weekStart)}</p>
              </div>
              {weekTarget ? (
                <>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {actualHours.toFixed(1)}h <span className="text-sm font-normal text-gray-400">/ {weekTarget}h</span>
                  </p>
                  <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-green-500 dark:bg-green-400' : 'bg-blue-500 dark:bg-blue-400'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">未设定</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">去设定本周目标 →</p>
                </>
              )}
            </Link>
          </div>
        </>
      )}

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
