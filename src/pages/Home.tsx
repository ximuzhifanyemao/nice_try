import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Countdown from '../components/Countdown'
import Calendar from '../components/Calendar'
import type { DailyLog } from '../lib/dailyLogs'
import { fetchTodayLog, fetchMyLogs } from '../lib/dailyLogs'
import { getSubjectById } from '../lib/subjects'
import { getChipColor } from '../lib/colors'

export default function Home() {
  const { user } = useAuth()

  // 今日记录（概览卡片）
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
  const [todayLoading, setTodayLoading] = useState(true)

  // 用户所有记录（日历标记）
  const [userLogs, setUserLogs] = useState<DailyLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setTodayLog(null)
      setTodayLoading(false)
      setUserLogs([])
      setLogsLoading(false)
      return
    }

    setTodayLoading(true)
    setLogsLoading(true)

    fetchTodayLog(user.id)
      .then(setTodayLog)
      .catch(() => setTodayLog(null))
      .finally(() => setTodayLoading(false))

    fetchMyLogs(user.id)
      .then(setUserLogs)
      .catch(() => setUserLogs([]))
      .finally(() => setLogsLoading(false))
  }, [user])

  const todayTotal = todayLog?.subjects?.reduce((sum, s) => sum + (s.hours || 0), 0) ?? 0
  const hasTodaySummary = !!(todayLog?.summary ?? '').trim()

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* 今日概览卡片 */}
      <section className="max-w-3xl mx-auto w-full">
        {!user ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 text-center">
            <p className="text-gray-500 dark:text-slate-400 mb-3 text-sm">登录后可记录每日学习</p>
            <Link
              to="/login"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              去登录
            </Link>
          </div>
        ) : todayLoading ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-blue-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500" />
          </div>
        ) : !todayLog ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">今日</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">尚未记录</p>
              </div>
              <Link
                to="/my-records/new"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                去记录
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">今日学习</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {todayTotal.toFixed(2)}<span className="text-base font-normal text-gray-400"> 小时</span>
                </p>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  hasTodaySummary
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                }`}
              >
                {hasTodaySummary ? '今日打卡 ✓' : '总结未写'}
              </span>
            </div>

            {todayLog.subjects && todayLog.subjects.filter((s) => s.hours > 0).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {todayLog.subjects
                  .filter((s) => s.hours > 0)
                  .map((s, index) => {
                    const subject = getSubjectById(s.id)
                    const colorClass = subject
                      ? getChipColor(subject.category)
                      : getChipColor()
                    return (
                      <span
                        key={`${s.id}-${s.activity ?? ''}-${index}`}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${colorClass}`}
                      >
                        {subject?.name ?? s.id}
                        {s.activity ? `·${s.activity}` : ''}
                        <span className="opacity-65 text-xs">{s.hours.toFixed(2)}h</span>
                      </span>
                    )
                  })}
              </div>
            )}

            <div className="flex justify-end">
              <Link
                to="/my-records"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                查看全部记录 →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 顶部：倒计时 | 日历 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        <div>
          <Countdown />
        </div>
        <div className="lg:self-start">
          <Calendar logs={userLogs} loading={logsLoading} />
        </div>
      </div>
    </div>
  )
}