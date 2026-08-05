import { useMemo, useState } from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { DailyLog } from '../lib/dailyLogs'
import { getSubjectById } from '../lib/subjects'
import { getChipColor } from '../lib/colors'

interface DaySubject {
  subjectId: string
  name: string
  hours: number
  activity?: string
}

interface DayCategory {
  category: string
  hours: number
  subjects: DaySubject[]
}

interface DayAgg {
  date: Date
  totalHours: number
  categories: DayCategory[]
}

interface WeeklyChartProps {
  logs: DailyLog[]
}

/** 按 getDay() 索引（0=周日）的星期名称 */
const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六']

/** 本周学习时长可视化：折线图（周一~周日），点击数据点查看当天学了什么 */
export default function WeeklyChart({ logs }: WeeklyChartProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date())

  // 本周（周一 ~ 周日）的 7 天
  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    const end = endOfWeek(new Date(), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [])

  // 按天聚合时长与科目
  const days: DayAgg[] = useMemo(() => {
    return weekDays.map((date) => {
      const dateKey = format(date, 'yyyy-MM-dd')
      const categoryMap = new Map<string, DayCategory>()
      let totalHours = 0

      for (const log of logs) {
        if (log.date !== dateKey) continue
        for (const subj of log.subjects ?? []) {
          const hours = subj.hours ?? 0
          if (hours <= 0) continue
          totalHours += hours

          const subject = getSubjectById(subj.id)
          const category = subject?.category ?? 'other'

          let entry = categoryMap.get(category)
          if (!entry) {
            entry = { category, hours: 0, subjects: [] }
            categoryMap.set(category, entry)
          }
          entry.hours += hours

          const existing = entry.subjects.find((s) => s.subjectId === subj.id)
          if (existing) {
            existing.hours += hours
          } else {
            entry.subjects.push({
              subjectId: subj.id,
              name: subject?.name ?? subj.id,
              hours,
              activity: subj.activity,
            })
          }
        }
      }

      return {
        date,
        totalHours,
        categories: Array.from(categoryMap.values()).sort((a, b) => b.hours - a.hours),
      }
    })
  }, [logs, weekDays])

  // 纵轴刻度：把最大值取整到合适的步长
  const { max, ticks } = useMemo(() => {
    const maxVal = Math.max(0, ...days.map((d) => d.totalHours))
    const m = Math.ceil(maxVal)
    const step = m <= 6 ? 1 : m <= 12 ? 2 : m <= 24 ? 4 : 6
    const niceMax = Math.max(1, Math.ceil(m / step) * step)
    const tickList: number[] = []
    for (let v = step; v <= niceMax; v += step) tickList.push(v)
    return { max: niceMax, ticks: tickList }
  }, [days])

  const weeklyTotal = days.reduce((sum, d) => sum + d.totalHours, 0)
  const checkedDays = days.filter((d) => d.totalHours > 0).length
  const bestDay = days.reduce<DayAgg | null>(
    (best, d) => (best === null || d.totalHours > best.totalHours ? d : best),
    null
  )

  const selectedDay = useMemo(() => {
    const key = format(selectedDate, 'yyyy-MM-dd')
    return days.find((d) => format(d.date, 'yyyy-MM-dd') === key) ?? days[0]
  }, [days, selectedDate])

  // 折线坐标（百分比坐标系）
  const linePoints = useMemo(() => {
    return days.map((day, i) => ({
      date: day.date,
      totalHours: day.totalHours,
      x: ((i + 0.5) / 7) * 100,
      y: max > 0 ? 100 - (day.totalHours / max) * 100 : 100,
    }))
  }, [days, max])

  const selectedKey = format(selectedDate, 'yyyy-MM-dd')

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 space-y-4">
      {/* 标题行 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">本周学习时长</h2>
        <span className="text-sm text-gray-500 dark:text-slate-400 font-mono">
          {format(weekDays[0], 'M月d日')} - {format(weekDays[6], 'M月d日')}
        </span>
      </div>

      {/* 本周概览 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-slate-400">本周累计</p>
          <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
            {weeklyTotal.toFixed(1)}
            <span className="text-xs font-normal text-gray-500 dark:text-slate-400 ml-0.5">h</span>
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-slate-400">打卡天数</p>
          <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
            {checkedDays}
            <span className="text-xs font-normal text-gray-500 dark:text-slate-400 ml-0.5">天</span>
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-slate-400">单日最高</p>
          <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
            {bestDay && bestDay.totalHours > 0 ? bestDay.totalHours.toFixed(1) : '-'}
            {bestDay && bestDay.totalHours > 0 && (
              <span className="text-xs font-normal text-gray-500 dark:text-slate-400 ml-0.5">h</span>
            )}
          </p>
        </div>
      </div>

      <div>
        <div className="flex gap-2">
          {/* Y 轴刻度 */}
          <div className="relative w-6 shrink-0" style={{ height: '10rem' }}>
            {ticks.map((tick) => (
              <span
                key={tick}
                className="absolute right-0 text-[10px] leading-none text-gray-400 dark:text-slate-500 -translate-y-1/2"
                style={{ bottom: `${(tick / max) * 100}%` }}
              >
                {tick}
              </span>
            ))}
          </div>

          {/* 绘图区 */}
          <div className="flex-1 min-w-0">
            <div className="relative" style={{ height: '10rem' }}>
              {/* 网格线 */}
              {ticks.map((tick) => (
                <div
                  key={tick}
                  className="absolute inset-x-0 border-t border-dashed border-gray-100 dark:border-slate-700/60"
                  style={{ bottom: `${(tick / max) * 100}%` }}
                />
              ))}
              <div className="absolute inset-x-0 bottom-0 border-t border-gray-200 dark:border-slate-600" />

              {/* 折线与面积填充 */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polygon
                  points={`0,100 ${linePoints.map((p) => `${p.x},${p.y}`).join(' ')} 100,100`}
                  className="fill-blue-500/10 dark:fill-blue-400/10"
                />
                <polyline
                  points={linePoints.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="stroke-blue-500 dark:stroke-blue-400"
                />
              </svg>

              {/* 数据点 */}
              {linePoints.map((p, i) => {
                const day = days[i]
                const dateKey = format(day.date, 'yyyy-MM-dd')
                const isSel = dateKey === selectedKey
                const today = isToday(day.date)
                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDate(day.date)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    aria-label={format(day.date, 'M月d日 EEEE', { locale: zhCN })}
                  >
                    {p.totalHours > 0 && (
                      <span className="absolute left-1/2 -translate-x-1/2 -top-4 text-[10px] font-semibold text-gray-600 dark:text-slate-300 leading-none whitespace-nowrap">
                        {p.totalHours.toFixed(1)}
                      </span>
                    )}
                    <span
                      className={`block w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 transition-all ${
                        isSel
                          ? 'bg-blue-600 dark:bg-blue-400 scale-125'
                          : 'bg-blue-500 dark:bg-blue-400'
                      } ${today ? 'ring-2 ring-blue-200 dark:ring-blue-900/60' : ''}`}
                    />
                  </button>
                )
              })}
            </div>

            {/* 日期标签 */}
            <div className="flex mt-1.5">
              {days.map((day) => {
                const today = isToday(day.date)
                return (
                  <div key={format(day.date, 'yyyy-MM-dd')} className="flex-1 text-center">
                    <div
                      className={`text-[11px] ${
                        today ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400'
                      }`}
                    >
                      周{WEEK_LABELS[day.date.getDay()]}
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">
                      {format(day.date, 'M/d')}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 选中日期的学习内容 */}
      <div className="border-t border-gray-100 dark:border-slate-700 pt-3 space-y-2">
        <div className="flex items-baseline gap-2">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
            {format(selectedDay.date, 'M月d日 EEEE', { locale: zhCN })}
          </p>
          {selectedDay.totalHours > 0 ? (
            <span className="text-xs text-gray-500 dark:text-slate-400">
              共 {selectedDay.totalHours.toFixed(1)} 小时
            </span>
          ) : (
            <span className="text-xs text-gray-400 dark:text-slate-500">暂无记录</span>
          )}
        </div>
        {selectedDay.totalHours > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedDay.categories.flatMap((cat) =>
              cat.subjects.map((s) => {
                return (
                  <span
                    key={`${s.subjectId}-${s.activity ?? ''}`}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getChipColor(cat.category)}`}
                  >
                    {s.name}
                    {s.activity ? `·${s.activity}` : ''}
                    <span className="opacity-65">{s.hours.toFixed(1)}h</span>
                  </span>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
