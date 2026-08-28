import { useState, useMemo } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
  isSameDay,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { DailyLog } from '../lib/dailyLogs'
import { sortSubjectsByStartTime } from '../lib/dailyLogs'
import { getSubjectById } from '../lib/subjects'
import { getChipColor } from '../lib/colors'
import { formatDateShort } from '../lib/format'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

interface CalendarProps {
  logs: DailyLog[]
  loading: boolean
  /** 桌面「全部功能」模式下放大日历：填满可用高度，日期格子更大 */
  expanded?: boolean
}

export default function Calendar({ logs, loading, expanded = false }: CalendarProps) {
  const { user } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  const logsByDate = useMemo(() => {
    const map = new Map<string, DailyLog[]>()
    for (const log of logs) {
      const key = log.date
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(log)
    }
    return map
  }, [logs])

  const selectedLogs = useMemo(() => {
    if (!selectedDate) return []
    const key = format(selectedDate, 'yyyy-MM-dd')
    return logsByDate.get(key) ?? []
  }, [selectedDate, logsByDate])

  const weekDays = ['一', '二', '三', '四', '五', '六', '日']

  const monthLabel = format(currentMonth, 'yyyy年M月', { locale: zhCN })

  const handlePrevMonth = () => setCurrentMonth((m) => subMonths(m, 1))
  const handleNextMonth = () => setCurrentMonth((m) => addMonths(m, 1))
  const handleToday = () => setCurrentMonth(new Date())

  const handleDayClick = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd')
    if (isToday(day) || logsByDate.has(key)) {
      setSelectedDate((prev) =>
        prev && isSameDay(prev, day) ? null : day,
      )
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/70 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] dark:shadow-none p-4">
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 dark:border-slate-700 border-t-indigo-600 dark:border-t-indigo-500" />
        </div>
      </div>
    )
  }

  // expanded：4:3 宽扁比例（符合 7 列 × 6 行日历的天然比例 + 表头），不再被父容器拉成瘦高
  const bodyWrap = (content: React.ReactNode) =>
    expanded ? (
      <div className="w-full flex flex-col" style={{ aspectRatio: '4 / 3' }}>
        {content}
      </div>
    ) : (
      <>{content}</>
    )

  return (
    <div
      className={`relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/70 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] dark:shadow-none overflow-hidden ${
        expanded ? 'w-full' : ''
      }`}
    >
      {bodyWrap(
        <>
          {/* 顶部月份条 */}
          <div className="relative shrink-0 px-3 pt-2.5 pb-1.5">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-indigo-50/70 to-transparent dark:from-indigo-500/10 dark:to-transparent" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="上个月"
                  className="h-7 w-7 inline-flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="下个月"
                  className="h-7 w-7 inline-flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="flex items-baseline gap-2.5">
                <h3
                  className={`font-semibold tracking-tight text-gray-900 dark:text-slate-100 ${
                    expanded ? 'text-[14px]' : 'text-sm'
                  }`}
                >
                  {monthLabel}
                </h3>
                <button
                  type="button"
                  onClick={handleToday}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors cursor-pointer"
                >
                  今天
                </button>
              </div>
            </div>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 text-center px-2 shrink-0">
            {weekDays.map((d, i) => {
              const isWeekend = i >= 5
              return (
                <div
                  key={d}
                  className={`py-0.5 font-semibold tracking-wide ${
                    expanded ? 'text-[11px]' : 'text-[10px]'
                  } ${
                    isWeekend
                      ? 'text-rose-400/90 dark:text-rose-400/70'
                      : 'text-gray-400 dark:text-slate-500'
                  }`}
                >
                  {d}
                </div>
              )
            })}
          </div>

          {/* 日期网格：expanded 方形 cell；普通态 5:4 扁方 cell */}
          <div
            className={`grid grid-cols-7 text-center px-2 pb-1.5 ${
              expanded
                ? 'flex-1 grid-rows-[repeat(6,1fr)] shrink-1 min-h-0 gap-x-2 gap-y-1'
                : 'gap-x-1.5 gap-y-0.5'
            }`}
          >
            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const hasLogs = logsByDate.has(dateKey)
              const today = isToday(day)
              const inMonth = isSameMonth(day, currentMonth)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const isWeekend = day.getDay() === 0 || day.getDay() === 6
              const clickable = hasLogs || today

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  disabled={!clickable}
                  aria-label={`${format(day, 'yyyy年M月d日')}${hasLogs ? '，有学习记录' : ''}`}
                  aria-pressed={isSelected ?? false}
                  className={`group relative mx-auto flex items-center justify-center rounded-lg transition-all duration-150 ease-out cursor-pointer motion-reduce:transition-none
                    ${expanded ? 'w-full h-full' : 'w-full aspect-[5/4]'}
                    ${!inMonth ? 'opacity-40' : ''}
                    ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-[0_4px_12px_-4px_rgba(79,70,229,0.6)] dark:bg-indigo-500 dark:shadow-[0_4px_14px_-4px_rgba(99,102,241,0.55)]'
                        : today
                        ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_2px_10px_-2px_rgba(99,102,241,0.55)] dark:shadow-[0_2px_12px_-2px_rgba(139,92,246,0.45)]'
                        : hasLogs
                        ? isWeekend
                          ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                          : 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25'
                        : inMonth
                        ? `${
                            isWeekend
                              ? 'text-rose-500/50 dark:text-rose-400/50'
                              : 'text-gray-600 dark:text-slate-400'
                          } cursor-default`
                        : 'text-gray-300 dark:text-slate-600 cursor-default hover:bg-transparent'
                    }
                  `}
                >
                  <span
                    className={`${
                      today || isSelected ? 'font-bold' : 'font-medium'
                    } ${expanded ? 'text-sm' : 'text-[12px]'} leading-none tabular-nums`}
                  >
                    {format(day, 'd')}
                  </span>
                </button>
              )
            })}
          </div>

          {/* 详情区（expanded 下：overflow auto 避免把方形撑超；没选中就不占空间） */}
          {(selectedLogs.length > 0 || (selectedDate && selectedLogs.length === 0)) && (
            <div
              className={`border-t border-gray-100 dark:border-slate-800/80 px-3 py-2 bg-gradient-to-b from-gray-50/60 to-white dark:from-slate-900/40 dark:to-slate-900 ${
                expanded ? 'shrink-0 overflow-y-auto max-h-[28%]' : ''
              }`}
            >
              {selectedLogs.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold tracking-wide text-gray-700 dark:text-slate-300">
                      {formatDateShort(format(selectedDate!, 'yyyy-MM-dd'))} 的学习记录
                    </p>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500">
                      {selectedLogs.length} 条
                    </span>
                  </div>
                  {selectedLogs.map((log) => {
                    const totalHours =
                      log.subjects?.reduce((sum, s) => sum + (s.hours || 0), 0) ?? 0
                    return (
                      <div
                        key={log.id}
                        className="rounded-xl border border-gray-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-2 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">
                            {log.user_id.slice(0, 8)}
                          </span>
                          {totalHours > 0 && (
                            <span className="text-[10px] font-semibold inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {totalHours}h
                            </span>
                          )}
                        </div>
                        {log.subjects && log.subjects.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {sortSubjectsByStartTime(
                              log.subjects.filter((s) => s.hours > 0),
                            ).map((s, index) => {
                              const subject = getSubjectById(s.id)
                              const colorClass = subject
                                ? getChipColor(subject.category)
                                : getChipColor()
                              return (
                                <span
                                  key={`${s.id}-${s.activity ?? ''}-${index}`}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium ${colorClass}`}
                                >
                                  {subject?.name ?? s.id}
                                  {s.activity ? `·${s.activity}` : ''}
                                  <span className="opacity-70">{s.hours}h</span>
                                </span>
                              )
                            })}
                          </div>
                        )}
                        {log.summary && (
                          <p className="text-[11px] leading-relaxed text-gray-500 dark:text-slate-400 line-clamp-3">
                            {log.summary}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {selectedDate && selectedLogs.length === 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold tracking-wide text-gray-700 dark:text-slate-300">
                    {formatDateShort(format(selectedDate, 'yyyy-MM-dd'))} 的学习记录
                  </p>
                  {isToday(selectedDate) ? (
                    <div className="rounded-xl border border-amber-200/70 dark:border-amber-500/20 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-500/10 dark:to-orange-500/5 p-2.5 text-center space-y-2">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        今日未有所录，速往记之
                      </p>
                      <Link
                        to={user ? '/my-records/new' : '/login'}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 rounded-lg transition-colors shadow-sm"
                      >
                        {user ? '去提交' : '登录后提交'}
                      </Link>
                    </div>
                  ) : (
                    <p className="text-center text-[11px] text-gray-400 dark:text-slate-500 py-1.5">
                      当天暂无学习记录
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </>,
      )}
    </div>
  )
}
