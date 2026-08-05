import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchMyLogs, type DailyLog } from '../lib/dailyLogs'
import { getWeekRange, filterLogsByRange, computeSummary, type SummaryRange, type SummaryResult } from '../lib/summary'
import RangePicker from '../components/RangePicker'
import WeeklyChart from '../components/WeeklyChart'
import { getSubjectById } from '../lib/subjects'

const CATEGORY_COLORS: Record<string, string> = {
  math: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  english: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  '408': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  politics: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

const PROGRESS_BG: Record<string, string> = {
  math: 'bg-blue-500 dark:bg-blue-400',
  english: 'bg-green-500 dark:bg-green-400',
  '408': 'bg-purple-500 dark:bg-purple-400',
  politics: 'bg-red-500 dark:bg-red-400',
  fallback: 'bg-gray-400 dark:bg-slate-500',
}

const Summary: React.FC = () => {
  const { user } = useAuth()
  const [range, setRange] = useState<SummaryRange>({
    mode: 'week',
    ...getWeekRange(),
  })
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(() => {
    if (!user) return
    setLoading(true)
    setError(null)
    fetchMyLogs(user.id)
      .then(setLogs)
      .catch((err) => setError(err.message || '加载失败'))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRetry = () => {
    loadData()
  }

  const filteredLogs = useMemo(
    () => filterLogsByRange(logs, range.startDate, range.endDate),
    [logs, range.startDate, range.endDate]
  )

  const summary: SummaryResult = useMemo(
    () => computeSummary(filteredLogs),
    [filteredLogs]
  )

  const maxDailyHours = useMemo(() => {
    if (summary.dailyTrend.length === 0) return 1
    const max = Math.max(...summary.dailyTrend.map((d) => d.totalHours))
    return max > 0 ? max : 1
  }, [summary.dailyTrend])

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">学习总结</h1>

      <RangePicker value={range} onChange={setRange} />

      {loading && (
        <div className="flex justify-center py-12">
          <svg
            className="h-8 w-8 animate-spin text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}

      {error && !loading && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 text-center">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg mt-3 transition-colors cursor-pointer"
          >
            重试
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <WeeklyChart logs={logs} />

          {summary.totalHours === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 text-center">
              <p className="text-gray-500 dark:text-slate-400">本时间段暂无学习记录</p>
              <Link
                to="/my-records/new"
                className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg inline-block mt-4 transition-colors cursor-pointer"
              >
                新建学习记录
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">总学习时长</p>
                  <p className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-slate-100">
                    {summary.totalHours.toFixed(1)}
                    <span className="text-xl text-gray-500 dark:text-slate-400 ml-1">小时</span>
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">打卡天数</p>
                  <p className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-slate-100">
                    {summary.checkedDays}
                    <span className="text-xl text-gray-500 dark:text-slate-400 ml-1">天</span>
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">每门课统计</h2>
                <div className="space-y-4">
                  {summary.subjectBreakdown.map((subject) => {
                    const category = getSubjectById(subject.subjectId)?.category ?? ''
                    const categoryColor = CATEGORY_COLORS[category] ?? 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
                    const progressBg = PROGRESS_BG[category] ?? PROGRESS_BG.fallback
                    return (
                      <div key={subject.subjectId} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${categoryColor}`}
                          >
                            {subject.name}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-slate-200">
                            <span className="font-semibold">{subject.hours.toFixed(1)}h</span>
                            <span className="ml-2 text-gray-500 dark:text-slate-400">
                              {subject.percentage.toFixed(1)}%
                            </span>
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${progressBg}`}
                            style={{ width: `${Math.max(0, Math.min(100, subject.percentage))}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">每日学习趋势</h2>
                <div className="space-y-4">
                  {summary.dailyTrend.map((item) => (
                    <div key={item.date} className="space-y-1.5">
                      <div className="flex justify-between items-center text-sm gap-2">
                        <span className="font-mono text-gray-500 dark:text-slate-400 min-w-0 truncate">{item.date}</span>
                        <span className="text-gray-700 dark:text-slate-200 flex-shrink-0">{item.totalHours.toFixed(1)}h</span>
                      </div>
                      <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-all"
                          style={{ width: `${(item.totalHours / maxDailyHours) * 100}%` }}
                        />
                      </div>
                      {item.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.subjects.map((subj) => {
                            const subjInfo = getSubjectById(subj.id)
                            const subjCategory = subjInfo?.category ?? ''
                            const subjColor = CATEGORY_COLORS[subjCategory] ?? 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
                            return (
                              <span
                                key={subj.id}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium ${subjColor}`}
                              >
                                {subjInfo?.name ?? subj.id} {subj.hours.toFixed(1)}h
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default Summary
