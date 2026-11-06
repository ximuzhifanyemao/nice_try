import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLogs } from '../contexts/LogsContext'
import {
  getWeekRange,
  filterLogsByRange,
  computeSummary,
  computeAvgDailyStats,
  computeSubjectComparison,
  computeSubjectDetailBreakdown,
  getPreviousRange,
  type SummaryRange,
  type SummaryResult,
  type SubjectBreakdown,
  type SubjectComparisonResult,
  type SubjectDetailBreakdown,
} from '../lib/summary'
import { differenceInCalendarDays, eachDayOfInterval, format, parseISO } from 'date-fns'
import RangePicker from '../components/RangePicker'
import WeeklyChart from '../components/WeeklyChart'
import { formatCategorySubjectName, getSubjectById } from '../lib/subjects'
import { getChipColor, getBarColor, getSubjectHex } from '../lib/colors'
import { formatDateShort } from '../lib/format'
import { todayStr } from '../lib/dailyLogs'
import WeeklyReport from '../components/WeeklyReport'
import { Icon } from '../components/Icon'
import { useWideLayout } from '../App'

/* ────────────── 手机端统计的四个轻量模块 ──────────────
   手机屏幕窄、滚动成本高，这里把原来「一张卡只放一个数字」的堆叠式布局
   收敛成「概览 → 趋势 → 科目分布 → 环比」四段，每段只回答一个问题。 */

/** 每日时长柱状图：周期内所有自然日都保留位置，长周期自动按桶聚合，最多 31 根柱 */
function DailyBars({ days }: { days: { date: string; hours: number }[] }) {
  const today = todayStr()
  const bucketSize = Math.max(1, Math.ceil(days.length / 31))
  const buckets: { label: string; hours: number; isToday: boolean; isFuture: boolean }[] = []
  for (let i = 0; i < days.length; i += bucketSize) {
    const chunk = days.slice(i, i + bucketSize)
    buckets.push({
      label: format(parseISO(chunk[0].date), 'M/d'),
      hours: chunk.reduce((sum, d) => sum + d.hours, 0),
      isToday: today >= chunk[0].date && today <= chunk[chunk.length - 1].date,
      isFuture: chunk[0].date > today,
    })
  }
  if (buckets.length === 0) return null
  const max = Math.max(1, ...buckets.map((b) => b.hours))
  const fixedBars = buckets.length <= 7
  const showAllLabels = buckets.length <= 10
  return (
    <div>
      <div
        className={`flex h-24 items-end ${
          fixedBars ? 'justify-center gap-2' : 'gap-[2px]'
        }`}
      >
        {buckets.map((b, i) => (
          <div
            key={`${b.label}-${i}`}
            className={`flex h-full flex-col items-center justify-end ${
              fixedBars ? 'w-9 shrink-0' : 'min-w-0 flex-1'
            }`}
            title={`${b.label} ${b.hours.toFixed(1)}h`}
          >
            {showAllLabels && b.hours > 0 && (
              <span className="mb-0.5 text-[9px] leading-none tabular-nums text-gray-400 dark:text-slate-500">
                {b.hours.toFixed(1)}
              </span>
            )}
            <span
              className={`w-full rounded-t-[3px] transition-[height] duration-500 ${
                b.hours > 0
                  ? b.isToday
                    ? 'bg-gradient-to-t from-indigo-500 to-violet-400'
                    : 'bg-indigo-300/80 dark:bg-indigo-500/40'
                  : b.isFuture
                    ? 'bg-gray-200/70 dark:bg-slate-700/40'
                    : 'bg-indigo-200/40 dark:bg-indigo-500/15'
              }`}
              style={{ height: b.hours > 0 ? `${Math.max(8, (b.hours / max) * 100)}%` : '3px' }}
            />
          </div>
        ))}
      </div>
      <div
        className={`mt-1.5 flex items-center text-[9px] leading-none text-gray-400 dark:text-slate-500 ${
          fixedBars ? 'justify-center gap-2' : showAllLabels ? 'gap-2' : 'justify-between'
        }`}
      >
        {showAllLabels ? (
          buckets.map((b, i) => (
            <span
              key={`${b.label}-${i}`}
              className={`${fixedBars ? 'w-9 text-center' : 'flex-1 text-center'} ${
                b.isToday ? 'font-semibold text-indigo-500 dark:text-indigo-400' : ''
              }`}
            >
              {b.isToday ? '今天' : b.label}
            </span>
          ))
        ) : (
          <>
            <span>{buckets[0].label}</span>
            <span>{buckets[Math.floor(buckets.length / 2)].label}</span>
            <span>{buckets[buckets.length - 1].label}</span>
          </>
        )}
      </div>
    </div>
  )
}

/** 科目分布：一条堆叠占比条 + 科目行；学习内容明细默认折叠，避免首屏被长列表淹没 */
function SubjectShareCard({
  breakdown,
  details,
  totalHours,
}: {
  breakdown: SubjectBreakdown[]
  details: SubjectDetailBreakdown[]
  totalHours: number
}) {
  const [open, setOpen] = useState(false)
  if (breakdown.length === 0) return null
  const detailRows = details.filter((d) => d.groups.length > 0 || d.leaves.length > 0)
  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100">科目分布</h2>
        <span className="text-[11px] text-gray-400 dark:text-slate-500">
          {breakdown.length} 个科目
        </span>
      </div>

      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700/60">
        {breakdown.map((s) => (
          <span
            key={s.subjectId}
            className="h-full"
            style={{
              width: `${totalHours > 0 ? (s.hours / totalHours) * 100 : 0}%`,
              backgroundColor: getSubjectHex(s.subjectId, getSubjectById(s.subjectId)?.category),
            }}
            title={`${s.name} ${s.hours.toFixed(1)}h`}
          />
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {breakdown.map((s) => {
          const category = getSubjectById(s.subjectId)?.category
          return (
            <div key={s.subjectId} className="flex items-center gap-2 text-xs">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: getSubjectHex(s.subjectId, category) }}
              />
              <span className="min-w-0 flex-1 truncate font-medium text-gray-700 dark:text-slate-200">
                {formatCategorySubjectName(s.name, category)}
              </span>
              <span className="shrink-0 tabular-nums text-gray-600 dark:text-slate-300">
                {s.hours.toFixed(1)}h
              </span>
              <span className="w-9 shrink-0 text-right tabular-nums text-gray-400 dark:text-slate-500">
                {Math.round(s.percentage)}%
              </span>
            </div>
          )
        })}
      </div>

      {detailRows.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-3 flex w-full cursor-pointer items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <span className="inline-flex items-center gap-1.5">
              <Icon name="list" size={13} />
              学习内容明细
            </span>
            <Icon
              name="chevronDown"
              size={14}
              className={`transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>
          {open && (
            <div className="mt-3 space-y-3 border-t border-gray-100 pt-3 dark:border-slate-800">
              {detailRows.map((subject) => (
                <div key={subject.subjectId} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2 text-[11px]">
                    <span className="font-semibold text-gray-700 dark:text-slate-200">
                      {formatCategorySubjectName(
                        subject.name,
                        getSubjectById(subject.subjectId)?.category,
                      )}
                    </span>
                    <span className="shrink-0 tabular-nums text-gray-400 dark:text-slate-500">
                      {subject.hours.toFixed(1)}h · 占 {subject.percentageOfTotal.toFixed(0)}%
                    </span>
                  </div>
                  {subject.groups.map((group) => (
                    <div
                      key={group.name}
                      className="space-y-1 border-l border-gray-100 pl-2.5 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-medium text-gray-600 dark:text-slate-300">
                          {group.name}
                        </span>
                        <span className="shrink-0 tabular-nums text-gray-400 dark:text-slate-500">
                          {group.hours.toFixed(1)}h · 占科目 {group.percentageOfSubject.toFixed(0)}%
                        </span>
                      </div>
                      {group.activities.map((activity) => (
                        <div
                          key={activity.name}
                          className="flex items-center justify-between gap-2 pl-2 text-[10px] text-gray-400 dark:text-slate-500"
                        >
                          <span className="min-w-0 truncate">{activity.name}</span>
                          <span className="shrink-0 tabular-nums">
                            {activity.hours.toFixed(1)}h · {activity.percentageOfParent.toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                  {subject.leaves.map((leaf) => (
                    <div
                      key={leaf.name}
                      className="flex items-center justify-between gap-2 pl-2.5 text-[11px] text-gray-500 dark:text-slate-400"
                    >
                      <span className="min-w-0 truncate">{leaf.name}</span>
                      <span className="shrink-0 tabular-nums">
                        {leaf.hours.toFixed(1)}h · 占科目 {leaf.percentageOfParent.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/** 科目环比：默认只列前 5，避免长尾科目把页面拉长 */
function ComparisonCard({
  comparison,
  previousLabel,
}: {
  comparison: SubjectComparisonResult
  previousLabel: string
}) {
  const [expanded, setExpanded] = useState(false)
  if (!comparison.hasPrevData || comparison.items.length === 0) return null
  const visible = expanded ? comparison.items : comparison.items.slice(0, 5)
  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100">科目环比</h2>
        <span className="text-[11px] text-gray-400 dark:text-slate-500">对比 {previousLabel}</span>
      </div>
      <div className="mt-3 space-y-2.5">
        {visible.map((item) => {
          const category = getSubjectById(item.subjectId)?.category
          const isUp = item.diff > 0
          const isDown = item.diff < 0
          const tone = isUp
            ? 'text-emerald-600 dark:text-emerald-400'
            : isDown
              ? 'text-rose-500 dark:text-rose-400'
              : 'text-gray-400 dark:text-slate-500'
          return (
            <div key={item.subjectId} className="flex items-center gap-2 text-xs">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: getSubjectHex(item.subjectId, category) }}
              />
              <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-slate-200">
                {formatCategorySubjectName(item.name, category)}
              </span>
              <span className="shrink-0 tabular-nums text-gray-600 dark:text-slate-300">
                {item.currentHours.toFixed(1)}h
              </span>
              <span className={`w-[70px] shrink-0 text-right font-medium tabular-nums ${tone}`}>
                {isUp ? '↑' : isDown ? '↓' : '—'}
                {item.diff !== 0 ? ` ${Math.abs(item.diff).toFixed(1)}h` : ''}
              </span>
            </div>
          )
        })}
      </div>
      {comparison.items.length > 5 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2.5 w-full cursor-pointer pt-1 text-center text-[11px] font-medium text-indigo-500 dark:text-indigo-400"
        >
          {expanded ? '收起' : `展开其余 ${comparison.items.length - 5} 个科目`}
        </button>
      )}
    </div>
  )
}

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

  // 周期天数 = 首尾日差 + 1（含未打卡日），作为日均口径的分母
  const periodDays = useMemo(
    () => differenceInCalendarDays(parseISO(range.endDate), parseISO(range.startDate)) + 1,
    [range]
  )

  // 平均每日时长：默认分母为周期天数（含未打卡日），文案注明口径
  const avgDailyStats = useMemo(
    () => computeAvgDailyStats(filteredLogs, { denominatorDays: periodDays }),
    [filteredLogs, periodDays]
  )

  // 科目环比：取相邻上周期日志做对比
  const previousRange = useMemo(() => getPreviousRange(range), [range])
  const previousLogs = useMemo(
    () => filterLogsByRange(logs, previousRange.startDate, previousRange.endDate),
    [logs, previousRange]
  )
  const subjectComparison = useMemo(
    () => computeSubjectComparison(filteredLogs, previousLogs),
    [filteredLogs, previousLogs]
  )

  const subjectDetails = useMemo(
    () => computeSubjectDetailBreakdown(filteredLogs),
    [filteredLogs]
  )

  const maxDailyHours = useMemo(() => {
    if (summary.dailyTrend.length === 0) return 1
    const max = Math.max(...summary.dailyTrend.map((d) => d.totalHours))
    return max > 0 ? max : 1
  }, [summary.dailyTrend])

  /* ── 手机端派生数据 ── */

  /** 上一周期总时长：用于「较上期」涨跌，避免只给科目环比却不给整体变化 */
  const previousTotalHours = useMemo(
    () =>
      previousLogs.reduce(
        (sum, log) => sum + (log.subjects ?? []).reduce((s, sub) => s + (sub.hours ?? 0), 0),
        0,
      ),
    [previousLogs],
  )

  /** 本周期单日最高（含具体日期，给概览卡一个可感知的锚点） */
  const bestDay = useMemo(
    () =>
      summary.dailyTrend.reduce<{ date: string; hours: number } | null>(
        (best, d) => (!best || d.totalHours > best.hours ? { date: d.date, hours: d.totalHours } : best),
        null,
      ),
    [summary.dailyTrend],
  )

  const rangeText = `${format(parseISO(range.startDate), 'M月d日')} – ${format(
    parseISO(range.endDate),
    'M月d日',
  )}`

  /** 环比标题里的上期日期，让「较上期」有明确参照 */
  const previousLabel = `${format(parseISO(previousRange.startDate), 'M.d')} – ${format(
    parseISO(previousRange.endDate),
    'M.d',
  )}`

  /** 手机端每日趋势：补齐周期内所有自然日，未来日期保留空柱，避免「本月才过两天」时两根柱子撑满整张卡 */
  const chartDays = useMemo(() => {
    const hoursMap = new Map(summary.dailyTrend.map((d) => [d.date, d.totalHours]))
    return eachDayOfInterval({
      start: parseISO(range.startDate),
      end: parseISO(range.endDate),
    }).map((d) => {
      const date = format(d, 'yyyy-MM-dd')
      return { date, hours: hoursMap.get(date) ?? 0 }
    })
  }, [range.startDate, range.endDate, summary.dailyTrend])

  /** 日均只看已经过去的日子：本月才过两天时，用 30 天做分母会把日均压得毫无参考价值 */
  const elapsedDays = useMemo(() => {
    const today = todayStr()
    const end = range.endDate > today ? today : range.endDate
    return Math.max(1, differenceInCalendarDays(parseISO(end), parseISO(range.startDate)) + 1)
  }, [range.startDate, range.endDate])
  const mobileAvgDaily = summary.totalHours / elapsedDays

  /** 整体较上期的涨跌幅；上期没有记录时不显示，避免「+100%」误导 */
  const deltaPct =
    previousTotalHours > 0 ? ((summary.totalHours - previousTotalHours) / previousTotalHours) * 100 : null
  const deltaPeriodLabel =
    range.mode === 'week' ? '上周' : range.mode === 'month' ? '上月' : '上期'

  /* ── 桌面「全部功能」模式：保留原有左右两栏（周视角 + 分项明细） ── */
  if (wide) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-4 space-y-4">
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">统计</h1>

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-start gap-4">
          {/* 左列：本周视角（总结入口 + 本周报告 + 本周时长图 + 范围选择） */}
        <div className={wide ? 'min-w-0 space-y-4' : 'space-y-4'}>
          {/* 每周总结入口：本周 vs 上周对比 + 反思笔记 */}
          {!loading && !error && (
            <Link
              to="/weekly-summary"
              className="group flex items-center justify-between rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-500 to-violet-500 p-4 text-white shadow-[0_8px_28px_-10px_rgba(79,70,229,0.5)] dark:shadow-none transition-transform hover:scale-[1.01]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <Icon name="target" size={20} />
                </span>
                <div>
                  <p className="font-semibold leading-none">每周总结</p>
                  <p className="mt-1 text-[11px] text-white/75">本周 vs 上周 · 反思笔记</p>
                </div>
              </div>
              <Icon name="chevronRight" size={20} className="text-white/70 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}

          {/* 本周学习报告：自动汇总本周表现 */}
          {!loading && !error && range.mode === 'week' && <WeeklyReport logs={logs} />}

          {/* 本周学习时长图：固定放在范围选择器上方；仅在本周模式下展示，避免干扰本月/自定义数据 */}
          {!loading && !error && range.mode === 'week' && <WeeklyChart logs={logs} />}

          <RangePicker value={range} onChange={setRange} />
        </div>

        {/* 右列：分项明细（总览小卡 + 每门课统计 + 科目环比 + 每日趋势） */}
        <div className={wide ? 'min-w-0 space-y-4' : 'space-y-4'}>
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
                  <div className={wide ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
                    <div className="card p-5">
                      <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">总学习时长</p>
                      <p className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-slate-100">
                        {summary.totalHours.toFixed(1)}
                        <span className="text-xl text-gray-500 dark:text-slate-400 ml-1">小时</span>
                      </p>
                      <p
                        className="mt-2 text-sm text-gray-500 dark:text-slate-400 tabular-nums"
                        title="日均=总时长÷周期天数（含未打卡日）"
                      >
                        日均 {avgDailyStats.avgDaily.toFixed(1)}h · 中位{' '}
                        {avgDailyStats.medianDaily.toFixed(1)}h
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
                                {formatCategorySubjectName(subject.name, category)}
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
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">分科占比明细</h2>
                      <span className="text-[11px] text-gray-400 dark:text-slate-500">
                        科目 → 中层级 → 学习内容（占比均相对上一级）
                      </span>
                    </div>
                    {subjectDetails.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-slate-400">本周期暂无科目记录</p>
                    ) : (
                      <div className="space-y-5">
                        {subjectDetails.map((subject) => {
                          const category = getSubjectById(subject.subjectId)?.category ?? ''
                          const categoryColor = getChipColor(category)
                          const progressBg = getBarColor(category)
                          const hasDetail = subject.groups.length > 0 || subject.leaves.length > 0
                          return (
                            <div key={subject.subjectId} className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${categoryColor}`}
                                >
                                  {formatCategorySubjectName(subject.name, category)}
                                </span>
                                <span className="text-sm text-gray-700 dark:text-slate-200">
                                  <span className="font-semibold">{subject.hours.toFixed(1)}h</span>
                                  <span className="ml-2 text-gray-500 dark:text-slate-400">
                                    占总 {subject.percentageOfTotal.toFixed(1)}%
                                  </span>
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${progressBg}`}
                                  style={{ width: `${Math.max(0, Math.min(100, subject.percentageOfTotal))}%` }}
                                />
                              </div>

                              {!hasDetail ? (
                                <p className="text-xs text-gray-400 dark:text-slate-500">暂无学习内容细分</p>
                              ) : (
                                <div className="space-y-3 border-l border-gray-100 pl-3 dark:border-slate-700">
                                  {subject.groups.map((group) => (
                                    <div key={group.name} className="space-y-1.5">
                                      <div className="flex items-center justify-between gap-2 text-xs">
                                        <span className="font-medium text-gray-700 dark:text-slate-200">{group.name}</span>
                                        <span className="text-gray-500 dark:text-slate-400">
                                          {group.hours.toFixed(1)}h · 占科目 {group.percentageOfSubject.toFixed(1)}%
                                        </span>
                                      </div>
                                      <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all ${progressBg}`}
                                          style={{ width: `${Math.max(0, Math.min(100, group.percentageOfSubject))}%` }}
                                        />
                                      </div>
                                      {group.activities.length > 0 && (
                                        <div className="space-y-1 pl-3">
                                          {group.activities.map((activity) => (
                                            <div
                                              key={activity.name}
                                              className="flex items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-slate-400"
                                            >
                                              <span className="min-w-0 truncate">{activity.name}</span>
                                              <span className="shrink-0 tabular-nums">
                                                {activity.hours.toFixed(1)}h · 占{group.name} {activity.percentageOfParent.toFixed(1)}%
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {subject.leaves.map((leaf) => (
                                    <div
                                      key={leaf.name}
                                      className="flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-slate-400"
                                    >
                                      <span className="min-w-0 truncate">{leaf.name}</span>
                                      <span className="shrink-0 tabular-nums">
                                        {leaf.hours.toFixed(1)}h · 占科目 {leaf.percentageOfParent.toFixed(1)}%
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="card p-5 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">科目环比</h2>
                    {!subjectComparison.hasPrevData ? (
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        暂无上周期数据，切换周期后即可对比上一周期各科时长
                      </p>
                    ) : subjectComparison.items.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-slate-400">本周期暂无科目记录</p>
                    ) : (
                      <div className="space-y-3">
                        {subjectComparison.items.map((item) => {
                          const isUp = item.diff > 0
                          const isDown = item.diff < 0
                          const diffColor = isUp
                            ? 'text-green-600 dark:text-green-400'
                            : isDown
                              ? 'text-red-500 dark:text-red-400'
                              : 'text-gray-400 dark:text-slate-500'
                          const arrow = isUp ? '↑' : isDown ? '↓' : '—'
                          return (
                            <div key={item.subjectId} className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-slate-200 min-w-0 truncate">
                                {item.name}
                              </span>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-sm text-gray-700 dark:text-slate-200 tabular-nums">
                                  {item.currentHours.toFixed(1)}h
                                </span>
                                <span className={`text-sm font-semibold tabular-nums ${diffColor}`}>
                                  {arrow} {isUp ? '+' : ''}
                                  {item.diff.toFixed(1)}h
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
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
        </div>
      </div>
    )
  }

  /* ── 手机端：范围切换在页头，随后按「概览 → 趋势 → 科目分布 → 环比」组织 ──
     旧版把「每周总结入口 + 本周报告 + 本周图表 + 两个大数字卡 + 每门课统计 +
     分科明细 + 每日趋势」依次堆叠，首屏要滚过三四张重复的周汇总才能切「本月」。
     这里先去重、再收拢：每段只回答一个问题，长列表改为折叠。 */
  return (
    <div className="mx-auto max-w-3xl px-4 py-4 space-y-4">
      <header className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">统计</h1>
            <p className="mt-0.5 text-[11px] text-gray-400 dark:text-slate-500">
              {rangeText} · {periodDays} 天
            </p>
          </div>
          <Link
            to="/weekly-summary"
            title="本周 vs 上周 · 反思笔记"
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50/80 px-2.5 py-1.5 text-[11px] font-medium text-indigo-600 transition-colors hover:bg-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
          >
            <Icon name="target" size={13} />
            周总结
            <Icon name="chevronRight" size={12} />
          </Link>
        </div>
        <RangePicker compact value={range} onChange={setRange} />
      </header>

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
            className="mt-3 cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            重试
          </button>
        </div>
      )}

      {!loading && !error && summary.totalHours === 0 && (
        <div className="card flex flex-col items-center px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
            <Icon name="chart" size={22} />
          </span>
          <p className="mt-3 text-sm font-medium text-gray-700 dark:text-slate-200">
            这段时间还没有学习记录
          </p>
          <p className="mt-1 text-xs leading-relaxed text-gray-400 dark:text-slate-500">
            去记下今天的学习，时长、科目分布和趋势会自动汇总到这里
          </p>
          <Link to="/my-records/new" className="btn-primary mt-4 h-9 px-4 py-0 text-xs">
            + 新建学习记录
          </Link>
        </div>
      )}

      {!loading && !error && summary.totalHours > 0 && (
        <>
          {range.mode === 'week' ? (
            <>
              <WeeklyReport logs={logs} compact />
              <WeeklyChart logs={logs} compact />
            </>
          ) : (
            <>
              {/* 概览：总时长 + 较上期 + 三个关键数字，替代原来两张占满屏的大卡 */}
              <div className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500">总学习时长</p>
                    <p className="mt-1 text-[34px] font-bold leading-none tabular-nums text-gray-900 dark:text-slate-100">
                      {summary.totalHours.toFixed(1)}
                      <span className="ml-1 text-sm font-medium text-gray-400 dark:text-slate-500">
                        小时
                      </span>
                    </p>
                  </div>
                  {deltaPct !== null && (
                    <span
                      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-semibold tabular-nums ${
                        deltaPct >= 0
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400'
                      }`}
                    >
                      {deltaPct >= 0 ? '↑' : '↓'} {Math.abs(deltaPct).toFixed(0)}%
                      <span className="font-normal opacity-70">较{deltaPeriodLabel}</span>
                    </span>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: '打卡天数', value: summary.checkedDays, unit: '天' },
                    { label: '日均', value: mobileAvgDaily.toFixed(1), unit: 'h' },
                    { label: '单日最高', value: bestDay ? bestDay.hours.toFixed(1) : '0', unit: 'h' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl bg-gray-50 px-2 py-2.5 text-center dark:bg-slate-800/50"
                    >
                      <p className="text-[10px] text-gray-400 dark:text-slate-500">{item.label}</p>
                      <p className="mt-1 text-base font-semibold leading-none tabular-nums text-gray-800 dark:text-slate-100">
                        {item.value}
                        <span className="ml-0.5 text-[10px] font-normal text-gray-400 dark:text-slate-500">
                          {item.unit}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
                {range.endDate > todayStr() && (
                  <p className="mt-2 text-[10px] text-gray-400 dark:text-slate-500">
                    日均按已过的 {elapsedDays} 天计算，不含未来日期
                  </p>
                )}
              </div>

              {/* 每日趋势：一根柱代表一天（长周期自动按桶聚合），比逐日长列表省一半以上高度 */}
              <div className="card space-y-3 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100">
                    每日学习
                  </h2>
                  <span className="text-[11px] text-gray-400 dark:text-slate-500">
                    {summary.checkedDays} 天有记录 · 日均 {mobileAvgDaily.toFixed(1)}h
                  </span>
                </div>
                <DailyBars days={chartDays} />
                {bestDay && (
                  <p className="text-[11px] text-gray-400 dark:text-slate-500">
                    最高 {bestDay.hours.toFixed(1)}h · {format(parseISO(bestDay.date), 'M月d日')}
                  </p>
                )}
              </div>
            </>
          )}

          <SubjectShareCard
            breakdown={summary.subjectBreakdown}
            details={subjectDetails}
            totalHours={summary.totalHours}
          />
          <ComparisonCard comparison={subjectComparison} previousLabel={previousLabel} />
        </>
      )}
    </div>
  )
}

export default Summary
