import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLogs } from '../contexts/LogsContext'
import { getWeekRange, filterLogsByRange, computeSummary, type SummaryRange, type SummaryResult } from '../lib/summary'
import RangePicker from '../components/RangePicker'
import WeeklyChart from '../components/WeeklyChart'
import { getSubjectById } from '../lib/subjects'
import { getChipColor, getBarColor } from '../lib/colors'
import { formatDateShort } from '../lib/format'
import WeeklyReport from '../components/WeeklyReport'
import { useWideLayout } from '../App'

const Summary: React.FC = () => {
  const wide = useWideLayout()
  const { logs, loading, error, refetch } = useLogs()
  const [range, setRange] = useState<SummaryRange>({
    mode: 'week',
    ...getWeekRange(),
  })

  const handleRetry = () => {
    refetch()
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
    <div className={`mx-auto ${wide ? 'max-w-[1280px]' : 'max-w-4xl'} px-4 py-4 space-y-4`}>
      <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">统计</h1>

      {/* 本周学习报告：自动汇总本周表现 */}
      {!loading && !error && range.mode === 'week' && <WeeklyReport logs={logs} />}

      {/* 本周学习时长图：固定放在范围选择器上方；仅在本周模式下展示，避免干扰本月/自定义数据 */}
      {!loading && !error && range.mode === 'week' && <WeeklyChart logs={logs} />}

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
        <div className="card p-8 text-center">
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
          {summary.totalHours === 0 ? (
            <div className="card p-8 text-center">
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
                <div className="card p-5">
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">总学习时长</p>
                  <p className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-slate-100">
                    {summary.totalHours.toFixed(1)}
                    <span className="text-xl text-gray-500 dark:text-slate-400 ml-1">小时</span>
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">打卡天数</p>
                  <p className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-slate-100">
                    {summary.checkedDays}
                    <span className="text-xl text-gray-500 dark:text-slate-400 ml-1">天</span>
                  </p>
                </div>
              </div>

              <div className="card p-5 space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">每门课统计</h2>
                <div className="space-y-4">
                  {summary.subjectBreakdown.map((subject) => {
                    const category = getSubjectById(subject.subjectId)?.category ?? ''
                    const categoryColor = getChipColor(category)
                    const progressBg = getBarColor(category)
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

              <div className="card p-5 space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">每日学习趋势</h2>
                <div className="space-y-4">
                  {summary.dailyTrend.map((item) => (
                    <div key={item.date} className="space-y-1.5">
                      <div className="flex justify-between items-center text-sm gap-2">
                        <span className="text-gray-500 dark:text-slate-400 min-w-0 truncate">{formatDateShort(item.date)}</span>
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
                            const subjColor = getChipColor(subjCategory)
                            return (
                              <span
                                key={subj.id}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium ${subjColor}`}
                              >
                                {subjInfo?.name ?? '已删除科目'} {subj.hours.toFixed(1)}h
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
