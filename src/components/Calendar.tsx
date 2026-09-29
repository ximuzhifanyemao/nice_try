import { useState, useMemo, useEffect } from 'react'
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
import type { CalendarEvent } from '../lib/calendarEvents'
import { fetchMyEvents, createEvent, deleteEvent } from '../lib/calendarEvents'
import { getSubjectById } from '../lib/subjects'
import { getChipColor } from '../lib/colors'
import { formatDateShort } from '../lib/format'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'

/** localStorage 键：日历是否显示每日时长 */
const DURATION_VISIBLE_KEY = 'calendar.showDuration'

/** 重要日新增表单的预设 emoji 选项 */
const EVENT_EMOJIS = ['🎂', '🎉', '📝', '📖', '⭐', '❤️', '🎯', '📌', '🏆', '💊', '✈️', '🏠']

/** 小时数格式化：2 → '2'，2.5 → '2.5'（去掉末尾多余 0） */
function fmtHours(h: number): string {
  const v = Math.round(h * 10) / 10
  return Number.isInteger(v) ? `${v}` : `${v}`
}

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
  /** 是否在日期格子上显示每日学习时长（localStorage 持久化） */
  const [showDuration, setShowDuration] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DURATION_VISIBLE_KEY) !== '0'
    } catch {
      return true
    }
  })

  /** 重要日事件：按日期聚合 */
  const [eventsByDate, setEventsByDate] = useState<Map<string, CalendarEvent[]>>(new Map())
  const [eventsError, setEventsError] = useState<string | null>(null)
  /** 新增表单状态 */
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [eventEmoji, setEventEmoji] = useState(EVENT_EMOJIS[0])
  const [eventTitle, setEventTitle] = useState('')
  const [eventSaving, setEventSaving] = useState(false)

  useEffect(() => {
    if (!user) {
      setEventsByDate(new Map())
      setEventsError(null)
      return
    }
    fetchMyEvents(user.id)
      .then((list) => {
        const map = new Map<string, CalendarEvent[]>()
        for (const ev of list) {
          const key = ev.date
          if (!map.has(key)) map.set(key, [])
          map.get(key)!.push(ev)
        }
        setEventsByDate(map)
        setEventsError(null)
      })
      .catch((err: unknown) => {
        setEventsByDate(new Map())
        setEventsError((err as Error)?.message ?? '加载重要日失败')
      })
  }, [user])

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

  /** 每天总学习时长（小时），仅在 >0 时记录 */
  const durationByDate = useMemo(() => {
    const map = new Map<string, number>()
    for (const [date, dayLogs] of logsByDate) {
      const total = dayLogs.reduce(
        (sum, log) =>
          sum +
          (log.subjects?.reduce((s, sub) => s + (sub.hours || 0), 0) ?? 0),
        0,
      )
      if (total > 0) map.set(date, Math.round(total * 10) / 10)
    }
    return map
  }, [logsByDate])

  const weekDays = ['一', '二', '三', '四', '五', '六', '日']

  const monthLabel = format(currentMonth, 'yyyy年M月', { locale: zhCN })

  const handlePrevMonth = () => setCurrentMonth((m) => subMonths(m, 1))
  const handleNextMonth = () => setCurrentMonth((m) => addMonths(m, 1))
  const handleToday = () => setCurrentMonth(new Date())

  const handleDayClick = (day: Date) => {
    if (!isSameMonth(day, currentMonth)) return
    setSelectedDate((prev) => (prev && isSameDay(prev, day) ? null : day))
  }

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return []
    const key = format(selectedDate, 'yyyy-MM-dd')
    return eventsByDate.get(key) ?? []
  }, [selectedDate, eventsByDate])

  /** 保存新增的重要日事件 */
  const handleSaveEvent = async () => {
    if (!user || !selectedDate) return
    const title = eventTitle.trim()
    if (!title) return
    setEventSaving(true)
    try {
      const created = await createEvent(user.id, {
        date: format(selectedDate, 'yyyy-MM-dd'),
        title,
        emoji: eventEmoji,
      })
      setEventsByDate((prev) => {
        const next = new Map(prev)
        const key = created.date
        const list = [...(next.get(key) ?? []), created]
        next.set(key, list)
        return next
      })
      setEventTitle('')
      setEventEmoji(EVENT_EMOJIS[0])
      setShowAddEvent(false)
      setEventsError(null)
    } catch (err) {
      setEventsError((err as Error)?.message ?? '添加失败')
    } finally {
      setEventSaving(false)
    }
  }

  /** 删除一条重要日事件 */
  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId)
      setEventsByDate((prev) => {
        const next = new Map(prev)
        for (const [key, list] of next) {
          next.set(
            key,
            list.filter((ev) => ev.id !== eventId),
          )
        }
        return next
      })
    } catch (err) {
      setEventsError((err as Error)?.message ?? '删除失败')
    }
  }

  const handleToggleDuration = () => {
    setShowDuration((prev) => {
      const next = !prev
      try {
        localStorage.setItem(DURATION_VISIBLE_KEY, next ? '1' : '0')
      } catch {
        /* 忽略存储失败 */
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="card p-4">
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 dark:border-slate-700 border-t-indigo-600 dark:border-t-indigo-500" />
        </div>
      </div>
    )
  }

  // expanded：方正的日期格让日历不显瘦高。
  // 最小高度只做「地板」用途，取 300 是为了在桌面全功能窗口（内容区高度有限、
  // 日历下方还压着两张小卡）时仍能靠 flex 收缩到可用高度，避免底部被裁切。
  const bodyWrap = (content: React.ReactNode) =>
    expanded ? (
      <div className="w-full flex flex-col" style={{ minHeight: 300 }}>
        {content}
      </div>
    ) : (
      <>{content}</>
    )

  return (
    <div
      className={`relative card overflow-hidden ${
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
                  onClick={handleToggleDuration}
                  aria-pressed={showDuration}
                  aria-label={showDuration ? '隐藏学习时长' : '显示学习时长'}
                  title={showDuration ? '隐藏学习时长' : '显示学习时长'}
                  className={`h-7 w-7 inline-flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                    showDuration
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-100/80 dark:bg-indigo-500/20 hover:bg-indigo-200/80 dark:hover:bg-indigo-500/30'
                      : 'text-gray-400 dark:text-slate-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon name="clock" size={13} />
                </button>
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
                ? 'flex-1 grid-rows-[repeat(6,1fr)] shrink-1 min-h-[200px] gap-x-2 gap-y-1'
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
              const clickable = inMonth
              const dayTotal = showDuration ? durationByDate.get(dateKey) ?? 0 : 0
              const eventEmojis = eventsByDate.get(dateKey) ?? []

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  disabled={!clickable}
                  aria-label={`${format(day, 'yyyy年M月d日')}${hasLogs ? '，有学习记录' : ''}${eventEmojis.length > 0 ? `，重要日${eventEmojis.map((e) => ` ${e.emoji}${e.title}`).join('，')}` : ''}`}
                  aria-pressed={isSelected ?? false}
                  className={`group relative mx-auto flex items-center justify-center rounded-lg transition-all duration-150 ease-out cursor-pointer motion-reduce:transition-none
                    ${
                      expanded
                        ? 'w-full h-full'
                        : 'w-full aspect-[5/4] max-[374px]:aspect-auto max-[374px]:min-h-[40px]'
                    }
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
                  <span className="flex flex-col items-center justify-center gap-0.5 leading-none">
                    <span
                      className={`${
                        today || isSelected ? 'font-bold' : 'font-medium'
                      } ${expanded ? 'text-sm' : 'text-[12px]'} leading-none tabular-nums`}
                    >
                      {format(day, 'd')}
                    </span>
                    {eventEmojis.length > 0 && (
                      <span
                        className={`leading-none ${
                          today || isSelected
                            ? 'text-white/90'
                            : expanded && isWeekend
                              ? 'opacity-80'
                              : 'opacity-70'
                        } ${expanded ? 'text-[12px]' : 'text-[9px]'}`}
                      >
                        {eventEmojis[0].emoji}
                      </span>
                    )}
                    {dayTotal > 0 && (
                      <span
                        className={`leading-none tabular-nums ${
                          today || isSelected
                            ? 'text-white/85'
                            : expanded && isWeekend
                              ? 'text-rose-400/80'
                              : 'text-gray-400 dark:text-slate-500'
                        } ${expanded ? 'text-[10px]' : 'text-[8.5px]'}`}
                      >
                        {fmtHours(dayTotal)}h
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          {/* 详情区：完全展开（学习记录 + 重要日 + 添加表单直接可见，无需滚动）；没选中就不占空间 */}
          {selectedDate && (
            <div
              className={`border-t border-gray-100 dark:border-slate-800/80 px-3 py-2 bg-gradient-to-b from-gray-50/60 to-white dark:from-slate-900/40 dark:to-slate-900 ${
                expanded ? 'shrink-0' : ''
              }`}
            >
              {/* 学习记录块：有记录时照常展示；无记录且无重要日时才展示空态占位，避免与事件块文案重复 */}
              {selectedLogs.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold tracking-wide text-gray-700 dark:text-slate-300">
                      {formatDateShort(format(selectedDate, 'yyyy-MM-dd'))} 的学习记录
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
                              {fmtHours(totalHours)}h
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
                                  {subject?.name ?? '已删除科目'}
                                  {s.activity ? `·${s.activity}` : ''}
                                  <span className="opacity-70">{fmtHours(s.hours)}h</span>
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
              {selectedLogs.length === 0 && selectedEvents.length === 0 && (
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

              {/* 重要日块（仅登录用户可见） */}
              {user && (
                <div
                  className={`${
                    selectedLogs.length > 0
                      ? 'mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-slate-800'
                      : ''
                  } space-y-1.5`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon name="calendar" size={13} className="text-rose-500 dark:text-rose-400" />
                      <p className="text-[11px] font-semibold tracking-wide text-gray-700 dark:text-slate-300">重要日</p>
                      {selectedEvents.length > 0 && (
                        <span className="text-[10px] text-gray-400 dark:text-slate-500">{selectedEvents.length} 个</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {eventsError && (
                        <span className="text-[10px] text-rose-500 dark:text-rose-400 max-w-[140px] truncate" title={eventsError}>
                          {eventsError}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowAddEvent((v) => !v)}
                        className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-1 rounded-full transition-colors ${
                          showAddEvent
                            ? 'text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800'
                            : 'text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                        }`}
                      >
                        {showAddEvent ? '收起' : (
                          <>
                            <Icon name="plus" size={11} />
                            标记重要日
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {selectedEvents.length > 0 ? (
                    <div className="space-y-1">
                      {selectedEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 px-2 py-1"
                        >
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[13px] leading-none shrink-0">{ev.emoji}</span>
                            <span className="text-[11px] text-gray-700 dark:text-slate-300 truncate">{ev.title}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(ev.id)}
                            aria-label="删除重要日"
                            className="shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full text-gray-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                          >
                            <Icon name="trash" size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-[11px] text-gray-400 dark:text-slate-500 py-1">
                      这一天还没有重要日
                    </p>
                  )}

                  {showAddEvent && (
                    <div className="rounded-xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-2 space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {EVENT_EMOJIS.map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => setEventEmoji(em)}
                            aria-pressed={eventEmoji === em}
                            className={`h-7 w-7 rounded-lg text-[15px] flex items-center justify-center transition-colors ${
                              eventEmoji === em
                                ? 'bg-rose-100 dark:bg-rose-500/20 ring-1 ring-rose-300 dark:ring-rose-500/40'
                                : 'hover:bg-gray-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={eventTitle}
                          onChange={(e) => setEventTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEvent()
                          }}
                          placeholder={isToday(selectedDate) ? '今天是什么日子？' : `${format(selectedDate, 'M月d日')}是什么日子？`}
                          maxLength={30}
                          className="flex-1 min-w-0 h-8 px-2.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[11px] text-gray-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-300 dark:focus:ring-rose-500/40"
                        />
                        <button
                          type="button"
                          onClick={handleSaveEvent}
                          disabled={!eventTitle.trim() || eventSaving}
                          className="shrink-0 h-8 px-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                          {eventSaving ? '添加中…' : '添加'}
                        </button>
                      </div>
                    </div>
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
