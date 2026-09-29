import { useState, useEffect, useRef, useCallback, type KeyboardEvent, type MouseEvent } from 'react'
import DesktopLogo from '../components/DesktopLogo'
import { useAuth } from '../contexts/AuthContext'
import { getSubjectById } from '../lib/subjects'
import { formatDuration } from '../lib/format'
import { fetchLogsInRange, todayStr } from '../lib/dailyLogs'
import { sumHoursInRange } from '../lib/commitments'
import { useWeekGoal } from '../hooks/useWeekGoal'
import { format } from 'date-fns'
import {
  loadSharedTimer,
  computeTimerElapsed,
  finishSharedTimer,
  pauseSharedTimer,
  resumeSharedTimer,
  dateOf,
  type SharedTimerState,
} from '../lib/timerSync'

interface CapsuleStripProps {
  /** 精简面板/下拉是否展开：展开时开始/结束按钮交给面板，胶囊条只做状态展示 */
  expanded: boolean
  /** 打开科目下拉（点「选择科目开始」标签或 ▶ 按钮） */
  onOpenDropdown: () => void
}

/** 今日进度环的容量：8 段 = 8 小时，与既有刻度含义保持一致 */
const HOUR_MARKS = 8

/**
 * 胶囊条：简洁模式常态（460×52）的主显示区。
 *
 * 布局分三段，靠间距而非分隔线区隔（窗口很矮，任何横线都会显得吵）：
 * - 左：品牌 logo + 当前科目胶囊（空闲时即下拉触发按钮）
 * - 中：实时计时（视觉焦点）+ 今日进度尺与目标线
 * - 右：开始/暂停/结束 + 窗口控制
 *
 * 计时数字用等宽字形与渐变强调，但字号收敛，避免整条只剩一个数字在喊；
 * 暂停/结束只在计时中出现，空闲时只有一个主按钮，减少误触。
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
  // 跨零点提示去重：同一段计时只提示一次（按开始日期记录）
  const crossedNoticeRef = useRef<string | null>(null)
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
  const linePct = todayLine ? Math.min(todayLine.target / HOUR_MARKS, 1) * 100 : null
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
      // 跨零点不停表：计时继续累计（熬夜学习场景），保存/结束时按「计时开始那天」归属
      const s = loadSharedTimer()
      setRunning(s)
      setElapsed(s ? computeTimerElapsed(s) : 0)
      if (s && dateOf(s.startTime) !== todayStr()) {
        const startDate = dateOf(s.startTime)
        // 首次发现跨天时提示一次，避免用户结束打卡时才发现归属日期是昨天
        if (crossedNoticeRef.current !== startDate) {
          crossedNoticeRef.current = startDate
          showNote(`已跨零点：本段将归入 ${format(new Date(s.startTime), 'M月d日')}`)
          loadTodayHours() // 新的一天：刷新今日学习时长条
        }
        return
      }
      crossedNoticeRef.current = null
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [showNote, loadTodayHours])

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

  const paused = Boolean(running?.paused)
  const subjectLabel = running?.subjectId
    ? (getSubjectById(running.subjectId)?.name ?? running.subjectId) +
      (running.activity ? ` · ${running.activity}` : '')
    : '选择科目开始'

  /** 今日进度尺：8 格 = 8 小时，逐格精确填充；琥珀目标线标出「今天该学到的位置」 */
  const progressScale = (
    <>
      <div
        className="relative flex items-center gap-[3px]"
        role="img"
        aria-label={`今日已学 ${todayHours.toFixed(1)} 小时，共 ${HOUR_MARKS} 小时刻度`}
        title={todayLine ? `今天还差约 ${todayLine.need.toFixed(1)}h 达成周目标日均` : `今日已学 ${todayHours.toFixed(1)}h`}
      >
      {Array.from({ length: HOUR_MARKS }, (_, i) => {
        const fill = Math.max(0, Math.min(1, todayHours - i))
        const full = fill >= 1
        return (
          <span
            key={i}
            className={`relative w-[13px] overflow-hidden rounded-full transition-colors duration-300 ${
              i % 2 === 0 ? 'h-[5px]' : 'h-[3px]'
            } ${full ? 'bg-indigo-500 dark:bg-indigo-400' : 'bg-slate-300/70 dark:bg-slate-600/60'}`}
          >
            {!full && fill > 0 && (
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-indigo-500/85 transition-[width] duration-500 ease-out dark:bg-indigo-400/85"
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
          <div className="h-[10px] w-[2px] -translate-x-1/2 rounded-full bg-amber-500 shadow-[0_0_0_2px_rgba(255,255,255,0.7)] dark:bg-amber-400 dark:shadow-[0_0_0_2px_rgba(2,6,23,0.75)]" />
        </div>
      )}
      </div>
    </>
  )

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5">
      {/* ── 左：品牌 + 科目胶囊 ── */}
      <div className="flex min-w-0 shrink-0 items-center gap-2">
        <DesktopLogo size={17} />
        {running ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full py-[3px] pl-2 pr-2.5 text-[11px] font-medium leading-4 ring-1 transition-colors duration-300 ${
              paused
                ? 'bg-amber-50 text-amber-700 ring-amber-200/70 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25'
                : 'bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25'
            }`}
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              {!paused && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              )}
              <span
                className={`relative inline-flex h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                  paused ? 'bg-amber-500 dark:bg-amber-400' : 'bg-emerald-500 dark:bg-emerald-400'
                }`}
              />
            </span>
            <span className={`truncate ${expanded ? 'max-w-[150px]' : 'max-w-[122px]'}`}>
              {paused ? `${subjectLabel}（已暂停）` : subjectLabel}
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
            className="inline-flex max-w-[152px] cursor-pointer items-center gap-1 rounded-full bg-slate-100 py-[3px] pl-2.5 pr-2 text-[11px] font-medium leading-4 text-slate-600 ring-1 ring-slate-200/80 transition-colors hover:bg-slate-200/80 hover:text-slate-900 dark:bg-slate-800/90 dark:text-slate-300 dark:ring-slate-700/70 dark:hover:bg-slate-700/90 dark:hover:text-slate-100"
          >
            <span className="truncate">{subjectLabel}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-70" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* ── 中：计时 / 提示 + 今日进度 ── */}
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-[3px]">
        {note ? (
          <span className="block animate-[widget-fade-in_0.2s_ease-out] truncate text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            {note}
          </span>
        ) : (
          <span
            className={`text-[17px] font-semibold leading-none tabular-nums tracking-[-0.01em] transition-colors duration-300 ${
              paused
                ? 'text-amber-600 dark:text-amber-400'
                : running
                  ? 'bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-600 bg-clip-text text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-indigo-300'
                  : 'text-slate-300 dark:text-slate-600'
            }`}
          >
            {running ? formatDuration(elapsed) : '00:00:00'}
          </span>
        )}
        {/* 今日进度尺：仅精简常态展示（展开下拉时让位给面板内容） */}
        {!expanded && !note && progressScale}
      </div>

      {/* ── 右：开始 / 暂停 / 结束（展开时按钮交给下拉面板） ── */}
      {!expanded &&
        (running ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={handlePauseToggle}
              onKeyDown={blockKeyboard}
              title={paused ? '继续' : '暂停'}
              aria-label={paused ? '继续' : '暂停'}
              className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-white shadow-sm transition-colors ${
                paused
                  ? 'bg-amber-500 hover:bg-amber-400'
                  : 'bg-slate-500/90 hover:bg-slate-500 dark:bg-slate-600/90 dark:hover:bg-slate-500'
              }`}
            >
              {paused ? (
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
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-rose-500 text-white shadow-sm transition-colors hover:bg-rose-600 disabled:opacity-50"
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
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-indigo-600 text-white shadow-[0_3px_12px_-4px_rgba(79,70,229,0.75)] transition-all hover:bg-indigo-500 hover:shadow-[0_4px_16px_-4px_rgba(79,70,229,0.85)] active:scale-[0.96]"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="ml-[1px]">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </button>
        ))}
    </div>
  )
}
