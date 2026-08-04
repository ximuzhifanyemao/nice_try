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
import { getSubjectById } from '../lib/subjects'

const CATEGORY_COLORS: Record<string, string> = {
  math: 'bg-blue-100 text-blue-800',
  english: 'bg-green-100 text-green-800',
  '408': 'bg-purple-100 text-purple-800',
  politics: 'bg-red-100 text-red-800',
}

interface CalendarProps {
  logs: DailyLog[]
  loading: boolean
}

export default function Calendar({ logs, loading }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
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

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  const monthLabel = format(currentMonth, 'yyyy年M月', { locale: zhCN })

  const handlePrevMonth = () => setCurrentMonth((m) => subMonths(m, 1))
  const handleNextMonth = () => setCurrentMonth((m) => addMonths(m, 1))

  const handleDayClick = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd')
    if (logsByDate.has(key)) {
      setSelectedDate((prev) =>
        prev && isSameDay(prev, day) ? null : day,
      )
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-3 border-blue-200 border-t-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
      {/* 月份导航 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-gray-800">{monthLabel}</h3>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 text-center">
        {weekDays.map((d) => (
          <div key={d} className="text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 text-center gap-y-1">
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
              disabled={!hasLogs}
              className={`relative flex flex-col items-center justify-center w-full aspect-square rounded-lg text-sm transition-colors cursor-pointer
                ${!inMonth ? 'text-gray-300' : 'text-gray-700'}
                ${today ? 'font-bold text-blue-600' : ''}
                ${isSelected ? 'bg-blue-100 ring-1 ring-blue-300' : 'hover:bg-gray-50'}
                ${!hasLogs ? 'cursor-default hover:bg-transparent' : ''}
              `}
            >
              {today ? (
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">
                  {format(day, 'd')}
                </span>
              ) : (
                <span>{format(day, 'd')}</span>
              )}
              {hasLogs && (
                <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${today ? 'bg-blue-400' : 'bg-blue-500'}`} />
              )}
            </button>
          )
        })}
      </div>

      {/* 选中日期的记录列表 */}
      {selectedDate && selectedLogs.length > 0 && (
        <div className="border-t border-gray-100 pt-3 space-y-3">
          <p className="text-sm font-medium text-gray-700">
            {format(selectedDate, 'M月d日 EEEE', { locale: zhCN })} 的学习记录
          </p>
          {selectedLogs.map((log) => {
            const totalHours = log.subjects?.reduce((sum, s) => sum + (s.hours || 0), 0) ?? 0

            return (
              <div key={log.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-mono">
                    {log.user_id.slice(0, 8)}
                  </span>
                  {totalHours > 0 && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                      {totalHours}h
                    </span>
                  )}
                </div>
                {log.subjects && log.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {log.subjects
                      .filter((s) => s.hours > 0)
                      .map((s) => {
                        const subject = getSubjectById(s.id)
                        const colorClass = subject
                          ? CATEGORY_COLORS[subject.category] ?? 'bg-gray-100 text-gray-700'
                          : 'bg-gray-100 text-gray-700'
                        return (
                          <span
                            key={s.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
                          >
                            {subject?.name ?? s.id}
                            <span className="opacity-65">{s.hours}h</span>
                          </span>
                        )
                      })}
                  </div>
                )}
                {log.summary && (
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
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
        <div className="border-t border-gray-100 pt-3 text-center text-sm text-gray-400">
          当天暂无学习记录
        </div>
      )}
    </div>
  )
}
