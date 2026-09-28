import { useState, useEffect, useRef, useCallback, type KeyboardEvent, type MouseEvent } from 'react'
import DesktopLogo from '../components/DesktopLogo'
import { useAuth } from '../contexts/AuthContext'
import { getSubjectById } from '../lib/subjects'
import { formatDuration } from '../lib/format'
import { fetchLogsInRange } from '../lib/dailyLogs'
import { sumHoursInRange } from '../lib/commitments'
import { useWeekGoal } from '../hooks/useWeekGoal'
import { format } from 'date-fns'
import {
  loadSharedTimer,
  computeTimerElapsed,
  finishSharedTimer,
  pauseSharedTimer,
  resumeSharedTimer,
  settleOvernightTimer,
  type SharedTimerState,
} from '../lib/timerSync'

interface CapsuleStripProps {
  /** 精简面板/下拉是否展开：展开时开始/结束按钮交给面板，胶囊条只做状态展示 */
  expanded: boolean
  /** 打开科目下拉（点「选择科目开始」标签或 ▶ 按钮） */
  onOpenDropdown: () => void
}

/**
 * 胶囊条：简洁模式常态（460×52）的主显示区。
 * - 常显：品牌 logo + 当前科目 + 实时计时 + 今日学习时长（8 段，1 段 = 1 小时）
 * - 空闲时点 ▶ 展开面板选择科目；计时中点 ■ 直接结束并打卡
 * - 暂停/停止仅接受鼠标点击（拦截空格/回车，避免暂停视频时误触计时）
 * - 每秒与共享计时对齐，面板/全功能切换后显示保持一致
 */
export default function CapsuleStrip({ expanded, onOpenDropdown }: CapsuleStripProps) {
  const { user } = useAuth()
  const [running, setRunning] = useState<SharedTimerState | null>(() => loadSharedTimer())
  const [elapsed, setElapsed] = useState(() => {
    const s = loadSharedTimer()
    return s ? computeTimerElapsed(s) : 0
  })
  const [note, setNote] = useState('')
  const [stopping, setStopping] = useState(false)
  const noteTimer = useRef<number | null>(null)
  // 今日已打卡学习时长（小时）：挂载时拉取，结束打卡后刷新
  const [todayHours, setTodayHours] = useState(0)
  const userId = user?.id
  // 本周目标进度：红线 = 今日目标线（今天总共要学到的位置）。
  // target = 今日已学 + 剩余缺口均摊的「今天还差」= 学到即完成今天的份额；
  // 打卡/后台刷新数据时重算一次并冻结，学习过程中不随已学滑动。
  const { goal, refresh: refreshWeekGoal } = useWeekGoal(userId)
  const [todayLine, setTodayLine] = useState<{ date: string; target: number; need: number } | null>(null)
  useEffect(() => {
    if (!goal || goal.target <= 0) {
      setTodayLine(null)
      return
    }
    const daysLeft = 8 - Number(format(new Date(), 'i'))
    if (daysLeft <= 0) {
      setTodayLine(null)
      return
    }
    const need = (goal.target - goal.actual) / daysLeft
    if (need <= 0) {
      setTodayLine(null)
      return
    }
    // 红线画在「今日目标总量」位置：今日已学 + 今天还差的时长
    setTodayLine({ date: format(new Date(), 'yyyy-MM-dd'), target: todayHours + need, need })
  }, [goal, todayHours])
  const linePct = todayLine ? Math.min(todayLine.target / 8, 1) * 100 : null
  const loadTodayHours = useCallback(async () => {
    if (!userId) {
      setTodayHours(0)
      return
    }
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const logs = await fetchLogsInRange(userId, today, today)
      setTodayHours(sumHoursInRange(logs, today, today))
    } catch {
      /* 拉取失败保持原值 */
    }
  }, [userId])

  useEffect(() => {
    loadTodayHours()
  }, [loadTodayHours])

  // 暂停/停止只接受鼠标点击：拦截空格/回车对按钮的默认激活
  const blockKeyboard = useCallback((e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') e.preventDefault()
  }, [])

  useEffect(
    () => () => {
      if (noteTimer.current) clearTimeout(noteTimer.current)
    },
    [],
  )

  const showNote = useCallback((msg: string) => {
    setNote(msg)
    if (noteTimer.current) clearTimeout(noteTimer.current)
    noteTimer.current = window.setTimeout(() => setNote(''), 4000)
  }, [])

  // 每秒与共享计时对齐（本组件不直接改状态，全部以 localStorage 为准）
  useEffect(() => {
    const tick = () => {
      // 跨零点：计时 startTime 已属昨日时先留存已学时长（幂等），
      // 避免被 loadSharedTimer 静默清零导致时长丢失；留存后 UI 自然切回空闲
      const settled = settleOvernightTimer()
      const s = loadSharedTimer()
      setRunning(s)
      setElapsed(s ? computeTimerElapsed(s) : 0)
      if (settled && settled.seconds >= 1) {
        showNote(`跨零点：已留存昨日 ${formatDuration(settled.seconds)}，可在全功能「计时」页保存`)
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNote])

  const handleStop = useCallback(
    async (e?: MouseEvent<HTMLButtonElement>) => {
      e?.currentTarget.blur()
      if (!loadSharedTimer()) return
      setStopping(true)
      try {
        const result = await finishSharedTimer(user)
        if (result.status === 'saved') {
          loadTodayHours()
          refreshWeekGoal()
          showNote(`已记入 ${formatDuration(result.seconds)}`)
        } else if (result.message) {
          showNote(result.message)
        }
        // running/elapsed 将在下一次 tick 自动对齐到已停止状态
      } finally {
        setStopping(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, showNote, refreshWeekGoal],
  )

  /** 暂停 / 恢复：写入共享计时后立即对齐本地状态（无需等下个 tick） */
  const handlePauseToggle = useCallback(
    (e?: MouseEvent<HTMLButtonElement>) => {
      e?.currentTarget.blur()
      if (running?.paused) resumeSharedTimer()
      else pauseSharedTimer()
      const s = loadSharedTimer()
      setRunning(s)
      setElapsed(s ? computeTimerElapsed(s) : 0)
    },
    [running?.paused],
  )

  const subjectLabel = running?.subjectId
    ? (getSubjectById(running.subjectId)?.name ?? running.subjectId) +
      (running.activity ? ` · ${running.activity}` : '')
    : '选择科目开始'

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      {/* 品牌 + 科目（空闲时即下拉触发按钮） */}
      <div className="flex min-w-0 shrink-0 items-center gap-1.5">
        <DesktopLogo size={16} />
        {running ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-4 transition-colors duration-300 ${
              running.paused
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
            }`}
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              {!running.paused && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              )}
              <span
                className={`relative inline-flex h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                  running.paused
                    ? 'bg-amber-500 dark:bg-amber-400'
                    : 'bg-emerald-500 dark:bg-emerald-400'
                }`}
              />
            </span>
            <span className={`truncate ${expanded ? 'max-w-[150px]' : 'max-w-[120px]'}`}>
              {running.paused ? `${subjectLabel}（已暂停）` : subjectLabel}
            </span>
          </span>
        ) : (
          <button
            onClick={(ev) => {
              ev.currentTarget.blur()
              onOpenDropdown()
            }}
            onKeyDown={blockKeyboard}
            title="选择科目开始"
            aria-label="选择科目开始"
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-4 transition-colors bg-gray-100 text-slate-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer max-w-[150px]`}
          >
            <span className="truncate">{subjectLabel}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* 计时 / 一次性的保存提示 */}
      <div className="min-w-0 flex-1 text-center">
        {note ? (
          <span className="block animate-[widget-fade-in_0.2s_ease-out] truncate text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            {note}
          </span>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <span
              className={`font-mono text-[15px] font-semibold leading-none tabular-nums tracking-tight transition-colors duration-300 ${
                running?.paused
                  ? 'text-amber-600 dark:text-amber-400'
                  : running
                    ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-indigo-400'
                    : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {running ? formatDuration(elapsed) : '00:00:00'}
            </span>
            {/* 今日学习时长：8 段，1 段 = 1 小时，按比例精确填充，下方小字标注小时刻度（仅精简常态展示） */}
            {!expanded && (
              <div className="relative mt-1" title={todayLine ? `今天还差约 ${todayLine.need.toFixed(1)}h 达成周目标日均` : undefined}>
                <div className="relative flex items-center gap-[3px]" aria-label={`今日已学 ${todayHours.toFixed(1)} 小时`}>
                  {Array.from({ length: 8 }, (_, i) => {
                    const fill = Math.max(0, Math.min(1, todayHours - i))
                    const full = fill >= 1
                    return (
                      <span
                        key={i}
                        className={`relative h-[5px] w-[13px] overflow-hidden rounded-[2px] transition-colors duration-300 ${
                          full ? 'bg-indigo-500 dark:bg-indigo-400' : 'bg-slate-200 dark:bg-slate-700/70'
                        }`}
                      >
                        {!full && fill > 0 && (
                          <span
                            className="absolute inset-y-0 left-0 rounded-[2px] bg-indigo-500/80 transition-[width] duration-500 ease-out dark:bg-indigo-400/80"
                            style={{ width: `${fill * 100}%` }}
                          />
                        )}
                      </span>
                    )
                  })}
                  {/* 今日目标线：打卡后按最新剩余缺口冻结当天，今日已学超过该线即今天达标 */}
                  {linePct !== null && (
                    <div
                      className="pointer-events-none absolute top-1/2 -translate-y-1/2 transition-[left] duration-500 ease-out"
                      style={{ left: `${linePct}%` }}
                      aria-hidden="true"
                    >
                      <div className="h-[11px] w-[2px] -translate-x-1/2 rounded-full bg-amber-500 dark:bg-amber-400" />
                    </div>
                  )}
                </div>
                {/* 小时刻度（宽与进度条一致：8 段 × 13px + 7 处 3px 间距），罗马数字标注 */}
                <div className="relative mt-0.5 h-[10px] w-[125px]" aria-hidden="true">
                  {[
                    { h: 0, label: '0' },
                    { h: 2, label: 'II' },
                    { h: 4, label: 'IV' },
                    { h: 6, label: 'VI' },
                    { h: 8, label: 'VIII' },
                  ].map(({ h, label }) => (
                    <span
                      key={h}
                      className="absolute text-[9px] leading-none font-medium text-slate-400 dark:text-slate-500"
                      style={
                        h === 0
                          ? { left: 0 }
                          : h === 8
                            ? { right: 0 }
                            : { left: `${(h / 8) * 100}%`, transform: 'translateX(-50%)' }
                      }
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 开始 / 暂停 / 结束（展开时按钮交给下拉/面板，这里仅展示） */}
      {!expanded &&
        (running ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={handlePauseToggle}
              onKeyDown={blockKeyboard}
              title={running.paused ? '继续' : '暂停'}
              aria-label={running.paused ? '继续' : '暂停'}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm transition-colors cursor-pointer ${
                running.paused
                  ? 'bg-amber-500 hover:bg-amber-400'
                  : 'bg-slate-500 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500'
              }`}
            >
              {running.paused ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.5v13l11-6.5z" />
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              )}
            </button>
            <button
              onClick={handleStop}
              onKeyDown={blockKeyboard}
              disabled={stopping}
              title="结束并打卡"
              aria-label="结束并打卡"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-colors hover:bg-red-600 disabled:opacity-50 cursor-pointer"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={(ev) => {
              ev.currentTarget.blur()
              onOpenDropdown()
            }}
            onKeyDown={blockKeyboard}
            title="选择科目开始"
            aria-label="选择科目开始"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm transition-colors hover:bg-indigo-500 cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </button>
        ))}
    </div>
  )
}