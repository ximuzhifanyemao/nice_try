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
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-3">
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-3 border-blue-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500" />
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-3 space-y-2 ${expanded ? 'h-full flex flex-col' : ''}`}>
      {/* 月份导航 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className={`font-semibold text-gray-800 dark:text-slate-200 ${expanded ? 'text-base' : 'text-sm'}`}>{monthLabel}</h3>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 星期标题 */}
      <div className={`grid grid-cols-7 text-center ${expanded ? 'pb-1' : ''}`}>
        {weekDays.map((d) => (
          <div key={d} className={`font-medium text-gray-400 dark:text-slate-500 py-1 ${expanded ? 'text-xs' : 'text-[11px]'}`}>
            {d}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className={`grid grid-cols-7 text-center gap-y-0.5 ${expanded ? 'flex-1 grid-rows-[repeat(6,1fr)] gap-1.5' : ''}`}>
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const hasLogs = logsByDate.has(dateKey)
          const today = isToday(day)
          const inMonth = isSameMonth(day, currentMonth)
          const isSelected = selectedDate && isSameDay(day, selectedDate)

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => handleDayClick(day)}
              disabled={!hasLogs && !isToday(day)}
              aria-label={`${format(day, 'yyyy年M月d日')}${hasLogs ? '，有学习记录' : ''}`}
              aria-pressed={isSelected ?? false}
              className={`relative flex flex-col items-center justify-center rounded-lg transition-colors cursor-pointer
                ${expanded ? 'h-full text-sm' : 'h-8 text-xs'}
                ${!inMonth ? 'text-gray-300 dark:text-slate-600' : 'text-gray-700 dark:text-slate-300'}
                ${today ? 'font-bold text-blue-600 dark:text-blue-400' : ''}
                ${isSelected ? 'bg-blue-100 ring-1 ring-blue-300 dark:bg-blue-900/40 dark:ring-blue-700' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'}
                ${!hasLogs ? 'cursor-default hover:bg-transparent dark:hover:bg-transparent' : ''}
              `}
            >
              {today ? (
                <span className={`flex items-center justify-center rounded-full bg-blue-600 dark:bg-blue-500 text-white font-bold ${expanded ? 'w-8 h-8 text-sm' : 'w-6 h-6 text-[11px]'}`}>
                  {format(day, 'd')}
                </span>
              ) : (
                <span className={expanded ? 'text-sm' : ''}>{format(day, 'd')}</span>
              )}
              {hasLogs && (
                <span className={`absolute rounded-full ${expanded ? 'bottom-1 w-1.5 h-1.5' : 'bottom-0.5 w-1 h-1'} ${today ? 'bg-blue-400' : 'bg-blue-500 dark:bg-blue-400'}`} />
              )}
            </button>
          )
        })}
      </div>

      {/* 选中日期的记录列表 */}
      {selectedDate && selectedLogs.length > 0 && (
        <div className="border-t border-gray-100 dark:border-slate-700 pt-2 space-y-2">
          <p className="text-[11px] font-medium text-gray-700 dark:text-slate-300">
            {formatDateShort(format(selectedDate, 'yyyy-MM-dd'))} 的学习记录
          </p>
          {selectedLogs.map((log) => {
            const totalHours = log.subjects?.reduce((sum, s) => sum + (s.hours || 0), 0) ?? 0

            return (
              <div key={log.id} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400 dark:text-slate-400 font-mono">
                    {log.user_id.slice(0, 8)}
                  </span>
                  {totalHours > 0 && (
                    <span className="text-[11px] bg-gray-200 text-gray-600 dark:bg-slate-600 dark:text-slate-200 px-2 py-0.5 rounded-full">
                      {totalHours}h
                    </span>
                  )}
                </div>
                {log.subjects && log.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {sortSubjectsByStartTime(log.subjects.filter((s) => s.hours > 0))
                      .map((s, index) => {
                        const subject = getSubjectById(s.id)
                        const colorClass = subject
                          ? getChipColor(subject.category)
                          : getChipColor()
                        return (
                          <span
                            key={`${s.id}-${s.activity ?? ''}-${index}`}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium ${colorClass}`}
                          >
                            {(subject?.name ?? s.id)}
                            {s.activity ? `·${s.activity}` : ''}
                            <span className="opacity-65">{s.hours}h</span>
                          </span>
                        )
                      })}
                  </div>
                )}
                {log.summary && (
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {log.summary}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 无选中日期记录 */}
      {selectedDate && selectedLogs.length === 0 && (
        <div className="border-t border-gray-100 dark:border-slate-700 pt-2 space-y-2">
          {isToday(selectedDate) ? (
            <>
              <p className="text-[11px] font-medium text-gray-700 dark:text-slate-300">
                {formatDateShort(format(selectedDate, 'yyyy-MM-dd'))} 的学习记录
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg p-3 text-center space-y-2">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  今日未有所录，速往记之
                </p>
                <Link
                  to={user ? '/my-records/new' : '/login'}
                  className="inline-block px-3 py-1.5 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 rounded-lg transition-colors"
                >
                  {user ? '去提交' : '登录后提交'}
                </Link>
              </div>
            </>
          ) : (
            <p className="text-center text-[11px] text-gray-400 dark:text-slate-500">
              当天暂无学习记录
            </p>
          )}
        </div>
      )}
    </div>
  )
}
