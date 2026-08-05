import { useMemo, useState } from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { DailyLog } from '../lib/dailyLogs'
import { getSubjectById } from '../lib/subjects'

interface CategoryConfig {
  name: string
  bar: string
  chip: string
}

/** 科目类别的柱状颜色与标签配色（与现有 CATEGORY_COLORS 保持一致） */
const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  math: {
    name: '数学',
    bar: 'bg-blue-500 dark:bg-blue-400',
    chip: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  },
  english: {
    name: '英语',
    bar: 'bg-green-500 dark:bg-green-400',
    chip: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  },
  '408': {
    name: '408',
    bar: 'bg-purple-500 dark:bg-purple-400',
    chip: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  },
  politics: {
    name: '政治',
    bar: 'bg-red-500 dark:bg-red-400',
    chip: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  },
}

const FALLBACK_CONFIG: CategoryConfig = {
  name: '其他',
  bar: 'bg-gray-400 dark:bg-slate-500',
  chip: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300',
}

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

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六']

/** 本周学习时长可视化：按天堆叠柱状图，展示每天学了多少、学了什么 */
export default function WeeklyChart({ logs }: WeeklyChartProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date())

  // 本周（周日 ~ 周六）的 7 天
  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 0 })
    const end = endOfWeek(new Date(), { weekStartsOn: 0 })
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

  const usedCategories = useMemo(() => {
    const set = new Set<string>()
    for (const day of days) {
      for (const cat of day.categories) set.add(cat.category)
    }
    return Array.from(set)
  }, [days])

  const selectedDay = useMemo(() => {
    const key = format(selectedDate, 'yyyy-MM-dd')
    return days.find((d) => format(d.date, 'yyyy-MM-dd') === key) ?? days[0]
  }, [days, selectedDate])

  const gapClass = 'gap-1.5 sm:gap-2.5'

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

              {/* 堆叠柱 */}
              <div className={`absolute inset-0 flex ${gapClass} items-end`}>
                {days.map((day) => {
                  const pct = max > 0 ? (day.totalHours / max) * 100 : 0
                  const isSel = format(day.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                  return (
                    <button
                      key={format(day.date, 'yyyy-MM-dd')}
                      type="button"
                      onClick={() => setSelectedDate(day.date)}
                      className="relative h-full flex-1 flex items-end justify-center cursor-pointer"
                      aria-label={format(day.date, 'M月d日 EEEE', { locale: zhCN })}
                    >
                      {day.totalHours > 0 && (
                        <span
                          className="absolute left-0 right-0 text-center text-[10px] font-semibold text-gray-600 dark:text-slate-300 leading-none"
                          style={{ bottom: `calc(${pct}% + 4px)` }}
                        >
                          {day.totalHours.toFixed(1)}
                        </span>
                      )}
                      {day.totalHours > 0 ? (
                        <div
                          className={`w-full rounded-t overflow-hidden transition-all ${isSel ? 'ring-2 ring-blue-400/80' : ''}`}
                          style={{ height: `${pct}%` }}
                        >
                          {day.categories.map((cat) => {
                            const cfg = CATEGORY_CONFIG[cat.category] ?? FALLBACK_CONFIG
                            return (
                              <div
                                key={cat.category}
                                className={`w-full ${cfg.bar}`}
                                style={{ height: `${(cat.hours / day.totalHours) * 100}%` }}
                              />
                            )
                          })}
                        </div>
                      ) : (
                        <div
                          className={`w-full h-[3px] rounded-full bg-gray-200 dark:bg-slate-700 ${
                            isSel ? 'ring-1 ring-blue-400/80' : ''
                          }`}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 日期标签 */}
            <div className={`flex ${gapClass} mt-1.5`}>
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

        {/* 图例 */}
        {usedCategories.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {usedCategories.map((cat) => {
              const cfg = CATEGORY_CONFIG[cat] ?? FALLBACK_CONFIG
              return (
                <span key={cat} className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                  <span className={`w-2.5 h-2.5 rounded-sm ${cfg.bar}`} />
                  {cfg.name}
                </span>
              )
            })}
          </div>
        )}
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
                const cfg = CATEGORY_CONFIG[cat.category] ?? FALLBACK_CONFIG
                return (
                  <span
                    key={`${s.subjectId}-${s.activity ?? ''}`}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.chip}`}
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
