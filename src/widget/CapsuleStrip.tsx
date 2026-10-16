import { useState, useEffect, useRef, useCallback, type KeyboardEvent, type MouseEvent } from 'react'
import DesktopLogo from '../components/DesktopLogo'
import TimerScale from '../components/TimerScale'
import { useAuth } from '../contexts/AuthContext'
import { getSubjectById } from '../lib/subjects'
import { formatDuration, formatMmSs } from '../lib/format'
import { todayStr } from '../lib/dailyLogs'
import { useTodayProgress } from '../hooks/useTodayProgress'
import {
  POMO_BAR_TONE,
  POMO_DIGIT_TONE,
  POMO_DOT_TONE,
  POMO_PILL_TONE,
  SUBJECT_PILL_TONE,
  TIMER_DIGIT_TONE,
  TIMER_ROUND_BTN,
} from '../lib/timerTone'
import {
  abandonPomo,
  advancePomo,
  computePomoRemain,
  loadPomoState,
  pausePomo,
  pomodoroNotify,
  resumePomo,
  savePomoState,
  type PomoState,
} from '../lib/pomodoro'
import { saveOrStashSession } from '../lib/timerSync'
import type { TimerSession } from '../lib/timerAccum'
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

/** 暂停/结束等按钮只接受鼠标点击：拦截空格/回车对按钮的默认激活 */
function blockKeyboard(e: KeyboardEvent<HTMLButtonElement>) {
  if (e.key === ' ' || e.key === 'Enter') e.preventDefault()
}

/** 暂停/继续圆形按钮（正计时与番茄钟共用同一形状与配色） */
function PauseResumeButton({ paused, onClick }: { paused: boolean; onClick: (e: MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <button
      onClick={onClick}
      onKeyDown={blockKeyboard}
      title={paused ? '继续' : '暂停'}
      aria-label={paused ? '继续' : '暂停'}
      className={`h-8 w-8 ${paused ? TIMER_ROUND_BTN.resume : TIMER_ROUND_BTN.pause}`}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={paused ? 'ml-[1px]' : ''}>
        {paused ? (
          <path d="M8 5.5v13l11-6.5z" />
        ) : (
          <>
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </>
        )}
      </svg>
    </button>
  )
}

/**
 * 胶囊条：简洁模式常态（460×52）的主显示区。
 *
 * 布局分三段，靠间距而非分隔线区隔（窗口很矮，任何横线都会显得吵）：
 * - 左：品牌 logo + 当前科目胶囊（空闲时即下拉触发按钮）
 * - 中：实时计时（视觉焦点）+ 今日进度尺（番茄钟时为倒计时 + 阶段进度条）
 * - 右：开始/暂停/结束（番茄钟为暂停/放弃/跳过休息）+ 窗口控制
 *
 * 计时状态有两种，同一时刻只会有一种在跑（下拉仅在空闲时可打开）：
 * - 正计时：与全功能计时页共享 lib/timerSync 的进行中状态
 * - 番茄钟：与全功能计时页共享 lib/pomodoro 的进行中状态，专注/休息倒计时一致，
 *   专注段到点自动入库（失败则并入本地「今日累计」，时长不丢）
 *
 * 进度尺（TimerScale）、三态与番茄钟阶段配色（lib/timerTone）与全功能计时页共用同一份实现：
 * 两个界面的「计时中 / 暂停 / 空闲 / 专注 / 休息」必须是同一套视觉语言。
 */
export default function CapsuleStrip({ expanded, onOpenDropdown }: CapsuleStripProps) {
  const { user } = useAuth()
  const [running, setRunning] = useState<SharedTimerState | null>(() => loadSharedTimer())
  const [elapsed, setElapsed] = useState(() => {
    const s = loadSharedTimer()
    return s ? computeTimerElapsed(s) : 0
  })
  /* 进行中的番茄钟（与全功能计时页同一份共享状态） */
  const [pomo, setPomo] = useState<PomoState | null>(() => loadPomoState())
  const [pomoRemain, setPomoRemain] = useState(() => {
    const p = loadPomoState()
    return p ? computePomoRemain(p, Date.now()) : 0
  })
  const [note, setNote] = useState('')
  const [stopping, setStopping] = useState(false)
  const noteTimer = useRef<number | null>(null)
  // 跨零点提示去重：同一段计时只提示一次（按开始日期记录）
  const crossedNoticeRef = useRef<string | null>(null)
  const userId = user?.id
  // 今日已打卡时长与今日目标线（与全功能计时页同一份实现与口径）
  const { hours: todayHours, line: todayLine, refresh: refreshTodayProgress } = useTodayProgress(userId)

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

  /** 结束一段专注：入库（失败/未登录/跨天则并入本地「今日累计」），并在胶囊条反馈结果 */
  const settleSession = useCallback(
    async (session: TimerSession, done: string) => {
      const res = await saveOrStashSession(user, session)
      if (res === 'saved') {
        refreshTodayProgress()
        showNote(`${done} · 已记入 ${formatDuration(session.seconds)}`)
      } else {
        showNote(`${done} · 已暂存本地`)
      }
    },
    [user, refreshTodayProgress, showNote],
  )

  // 每秒与共享计时/番茄钟对齐（本组件不直接改状态，全部以 localStorage 为准）
  useEffect(() => {
    const tick = () => {
      /* 番茄钟：到期的阶段先结算——专注完成记入时长并提醒，休息结束回空闲。
         先同步落盘：全功能计时页与本组件的定时器不会对同一阶段重复结算。 */
      const due = loadPomoState()
      if (due && !due.paused && Date.now() >= due.endAt) {
        const t = advancePomo(due, Date.now())
        savePomoState(t.next)
        if (t.notify === 'rest') showNote('休息结束')
        if (t.notify) void pomodoroNotify(t.notify)
        if (t.session) void settleSession(t.session, '专注完成')
      }
      // 跨零点不停表：计时继续累计（熬夜学习场景），保存/结束时按「计时开始那天」归属
      const s = loadSharedTimer()
      setRunning(s)
      setElapsed(s ? computeTimerElapsed(s) : 0)
      // 番茄钟状态（可能刚被上面结算过，这里统一读最新值用于展示）
      const p = loadPomoState()
      setPomo(p)
      setPomoRemain(p ? computePomoRemain(p, Date.now()) : 0)
      if (s && dateOf(s.startTime) !== todayStr()) {
        const startDate = dateOf(s.startTime)
        // 首次发现跨天时提示一次，避免用户结束打卡时才发现归属日期是昨天
        if (crossedNoticeRef.current !== startDate) {
          crossedNoticeRef.current = startDate
          showNote(`已跨零点：本段将归入 ${format(new Date(s.startTime), 'M月d日')}`)
          refreshTodayProgress() // 新的一天：刷新今日进度尺
        }
        return
      }
      crossedNoticeRef.current = null
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [showNote, refreshTodayProgress, settleSession])

  const handleStop = useCallback(
    async (e?: MouseEvent<HTMLButtonElement>) => {
      e?.currentTarget.blur()
      if (!loadSharedTimer()) return
      setStopping(true)
      try {
        const result = await finishSharedTimer(user)
        if (result.status === 'saved') {
          refreshTodayProgress()
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
    [user, showNote, refreshTodayProgress],
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

  /** 番茄钟暂停 / 恢复：写入共享状态后立即对齐显示 */
  const handlePomoPauseToggle = useCallback((e?: MouseEvent<HTMLButtonElement>) => {
    e?.currentTarget.blur()
    const cur = loadPomoState()
    if (!cur) return
    const now = Date.now()
    const next = cur.paused ? resumePomo(cur, now) : pausePomo(cur, now)
    savePomoState(next)
    setPomo(next)
    setPomoRemain(computePomoRemain(next, now))
  }, [])

  /** 番茄钟放弃本轮：已专注的时长照常记入，然后回空闲 */
  const handlePomoAbandon = useCallback(
    async (e?: MouseEvent<HTMLButtonElement>) => {
      e?.currentTarget.blur()
      const cur = loadPomoState()
      if (!cur) return
      const session = abandonPomo(cur, Date.now())
      savePomoState(null)
      setPomo(null)
      setPomoRemain(0)
      if (session) await settleSession(session, '结束专注')
    },
    [settleSession],
  )

  /** 番茄钟跳过休息：直接回空闲，开始下一轮 */
  const handlePomoSkipRest = useCallback((e?: MouseEvent<HTMLButtonElement>) => {
    e?.currentTarget.blur()
    savePomoState(null)
    setPomo(null)
    setPomoRemain(0)
  }, [])

  const paused = Boolean(running?.paused)
  /** 正计时三态：空闲 / 计时中 / 暂停（配色统一从 lib/timerTone 取） */
  const phase = running ? (paused ? 'paused' : 'running') : 'idle'
  const subjectLabel = running?.subjectId
    ? (getSubjectById(running.subjectId)?.name ?? running.subjectId) +
      (running.activity ? ` · ${running.activity}` : '')
    : '选择科目开始'

  /* 番茄钟展示值：阶段胶囊 = 专注/休息 + 科目，中段 = 倒计时 + 阶段进度 */
  const pomoPaused = Boolean(pomo?.paused)
  const pomoTone: 'focus' | 'rest' | 'paused' = pomo ? (pomoPaused ? 'paused' : pomo.phase) : 'focus'
  const pomoLabel = pomo
    ? `${pomo.phase === 'focus' ? '专注' : '休息'} · ` +
      (getSubjectById(pomo.subjectId)?.name ?? pomo.subjectId) +
      (pomo.activity ? ` · ${pomo.activity}` : '')
    : ''
  const pomoRoundText = pomo ? `第 ${pomo.round + (pomo.phase === 'focus' ? 1 : 0)} 轮` : ''
  const pomoProgress = (() => {
    if (!pomo) return 0
    const total = (pomo.phase === 'focus' ? pomo.focusMin : pomo.restMin) * 60000
    if (total <= 0) return 0
    return Math.max(0, Math.min(1, (total - pomoRemain) / total))
  })()

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5">
      {/* ── 左：品牌 + 科目胶囊 ── */}
      <div className="flex min-w-0 shrink-0 items-center gap-2">
        <DesktopLogo size={17} />
        {pomo ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full py-[3px] pl-2 pr-2.5 text-[11px] font-medium leading-4 ring-1 transition-colors duration-300 ${POMO_PILL_TONE[pomoTone]}`}
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              {!pomoPaused && (
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${POMO_DOT_TONE[pomoTone]}`} />
              )}
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${POMO_DOT_TONE[pomoTone]}`} />
            </span>
            <span className={`truncate ${expanded ? 'max-w-[150px]' : 'max-w-[122px]'}`}>
              {pomoPaused ? `${pomoLabel}（已暂停）` : pomoLabel}
            </span>
          </span>
        ) : running ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full py-[3px] pl-2 pr-2.5 text-[11px] font-medium leading-4 ring-1 transition-colors duration-300 ${
              SUBJECT_PILL_TONE[phase]
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
            className={`inline-flex max-w-[152px] cursor-pointer items-center gap-1 rounded-full py-[3px] pl-2.5 pr-2 text-[11px] font-medium leading-4 ring-1 transition-colors hover:bg-slate-200/80 hover:text-slate-900 dark:hover:bg-slate-700/90 dark:hover:text-slate-100 ${
              SUBJECT_PILL_TONE.idle
            }`}
          >
            <span className="truncate">{subjectLabel}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-70" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* ── 中：计时 / 提示 + 今日进度（番茄钟为倒计时 + 阶段进度条） ── */}
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-[3px]">
        {note ? (
          <span className="block animate-[widget-fade-in_0.2s_ease-out] truncate text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            {note}
          </span>
        ) : pomo ? (
          <>
            <span
              className={`text-[17px] font-semibold leading-none tabular-nums tracking-[-0.01em] transition-colors duration-300 ${
                pomoPaused ? TIMER_DIGIT_TONE.paused : POMO_DIGIT_TONE[pomo.phase]
              }`}
              title={`${pomoRoundText} · ${pomo.phase === 'focus' ? '专注' : '休息'}中`}
            >
              {formatMmSs(pomoRemain)}
            </span>
            {/* 阶段进度条：专注 / 休息各自一段，与全功能计时页同一套配色 */}
            <div
              className="h-[3px] w-full max-w-[170px] overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/70"
              role="img"
              aria-label={`${pomoRoundText} ${pomo.phase === 'focus' ? '专注' : '休息'}进度 ${Math.round(pomoProgress * 100)}%`}
              title={`${pomoRoundText} · ${pomo.phase === 'focus' ? '专注' : '休息'}中`}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-500 ease-out ${POMO_BAR_TONE[pomo.phase]}`}
                style={{ width: `${pomoProgress * 100}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <span
              className={`text-[17px] font-semibold leading-none tabular-nums tracking-[-0.01em] transition-colors duration-300 ${
                TIMER_DIGIT_TONE[phase]
              }`}
            >
              {running ? formatDuration(elapsed) : '00:00:00'}
            </span>
            {/* 今日进度尺：仅精简常态展示（展开下拉时让位给面板内容） */}
            {!expanded && (
              <TimerScale
                hours={todayHours}
                linePct={todayLine?.pct ?? null}
                title={
                  todayLine
                    ? `今日已打卡 ${todayHours.toFixed(1)}h，今天还差约 ${todayLine.need.toFixed(1)}h 达成周目标日均`
                    : `今日已打卡 ${todayHours.toFixed(1)}h`
                }
              />
            )}
          </>
        )}
      </div>

      {/* ── 右：开始 / 暂停 / 结束（展开时按钮交给下拉面板） ── */}
      {!expanded &&
        (pomo ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <PauseResumeButton paused={pomoPaused} onClick={handlePomoPauseToggle} />
            {pomo.phase === 'rest' ? (
              <button
                onClick={handlePomoSkipRest}
                onKeyDown={blockKeyboard}
                title="跳过休息"
                aria-label="跳过休息"
                className={`h-8 w-8 ${TIMER_ROUND_BTN.skipRest}`}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M5 5.2v13.6L15.5 12z" />
                  <rect x="16.5" y="5" width="3" height="14" rx="1" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handlePomoAbandon}
                onKeyDown={blockKeyboard}
                title="放弃本轮（已专注的时长会记入）"
                aria-label="放弃本轮"
                className={`h-8 w-8 ${TIMER_ROUND_BTN.stop}`}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            )}
          </div>
        ) : running ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <PauseResumeButton paused={paused} onClick={handlePauseToggle} />
            <button
              onClick={handleStop}
              onKeyDown={blockKeyboard}
              disabled={stopping}
              title="结束并打卡"
              aria-label="结束并打卡"
              className={`h-8 w-8 ${TIMER_ROUND_BTN.stop} disabled:opacity-50`}
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
            className={`h-8 w-8 ${TIMER_ROUND_BTN.start}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="ml-[1px]">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </button>
        ))}
    </div>
  )
}