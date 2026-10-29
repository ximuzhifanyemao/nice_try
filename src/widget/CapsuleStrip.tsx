import { useState, useEffect, useRef, useCallback, type KeyboardEvent, type MouseEvent } from 'react'
import DesktopLogo from '../components/DesktopLogo'
import TimerScale from '../components/TimerScale'
import { useAuth } from '../contexts/AuthContext'
import { formatActivityLabel, getSubjectById } from '../lib/subjects'
import { formatDuration, formatMmSs } from '../lib/format'
import { todayStr } from '../lib/dailyLogs'
import { loadOutbox } from '../lib/timerOutbox'
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
  /** 竖向窄条：科目/计时/进度尺/按钮竖排（宽度由窗口尺寸决定，= 任务栏厚度） */
  vertical?: boolean
  /** 打开科目下拉（点「选择科目开始」标签或 ▶ 按钮） */
  onOpenDropdown: () => void
}

/** 暂停/结束等按钮只接受鼠标点击：拦截空格/回车对按钮的默认激活 */
function blockKeyboard(e: KeyboardEvent<HTMLButtonElement>) {
  if (e.key === ' ' || e.key === 'Enter') e.preventDefault()
}

/** 暂停/继续圆形按钮（正计时与番茄钟共用同一形状与配色；竖向窄条用 h-7 尺寸） */
function PauseResumeButton({
  paused,
  onClick,
  sizeClass = 'h-8 w-8',
}: {
  paused: boolean
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  sizeClass?: string
}) {
  return (
    <button
      onClick={onClick}
      onKeyDown={blockKeyboard}
      title={paused ? '继续' : '暂停'}
      aria-label={paused ? '继续' : '暂停'}
      className={`${sizeClass} ${paused ? TIMER_ROUND_BTN.resume : TIMER_ROUND_BTN.pause}`}
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

/** 今日时长小按钮的时钟图标（线性 SVG，与胶囊条其他图标同一语言） */
function ClockIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  )
}

/**
 * 胶囊条：简洁模式常态（横向 500×52 / 竖向约 48×420）的主显示区。
 *
 * 横向布局分三段，靠间距而非分隔线区隔（窗口很矮，任何横线都会显得吵）：
 * - 左：品牌 logo + 当前科目胶囊（空闲时即下拉触发按钮）
 * - 中：实时计时（视觉焦点）+ 今日进度尺（番茄钟时为倒计时 + 阶段进度条）
 * - 右：今日时长 + 开始/暂停/结束（番茄钟为暂停/放弃/跳过休息）
 *
 * 竖向布局把同样的信息竖排：品牌 → 科目（竖排文字）→ 计时数字（时/分/秒三行）
 * + 竖向进度尺 → 今日时长按钮 + 控制按钮。宽度由窗口决定（等于左侧任务栏厚度），
 * 所以这里只用 h-7 小按钮和 14px 数字，不假设有富余的横向空间。
 *
 * 计时状态有两种，同一时刻只会有一种在跑（下拉仅在空闲时可打开）：
 * - 正计时：与全功能计时页共享 lib/timerSync 的进行中状态
 * - 番茄钟：与全功能计时页共享 lib/pomodoro 的进行中状态，专注/休息倒计时一致，
 *   专注段到点自动入库（失败则并入本地「今日累计」，时长不丢）
 *
 * 进度尺（TimerScale）、三态与番茄钟阶段配色（lib/timerTone）与全功能计时页共用同一份实现：
 * 两个界面的「计时中 / 暂停 / 空闲 / 专注 / 休息」必须是同一套视觉语言。
 */
export default function CapsuleStrip({ expanded, vertical = false, onOpenDropdown }: CapsuleStripProps) {
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
  // 今日时长原位切换：点小按钮后时间区改为「今日已学」，再点一下回到计时显示
  const [todayOpen, setTodayOpen] = useState(false)
  /* 今日待入库秒数（队列是未入库时长的唯一来源；今日总时长 = 云端已打卡 + 待入库） */
  const [pendingSeconds, setPendingSeconds] = useState(0)
  const userId = user?.id
  // 今日已打卡时长与今日目标线（与全功能计时页同一份实现与口径）
  const { hours: todayHours, line: todayLine, refresh: refreshTodayProgress } = useTodayProgress(userId)

  // 打开科目下拉时收起今日视图：回来时显示的是新开始的计时，而不是停留在今日数字上
  useEffect(() => {
    if (expanded) setTodayOpen(false)
  }, [expanded])

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

  /** 结束一段专注：先落待入库队列再补传（失败/未登录/跨天则留在队列里自动补传） */
  const settleSession = useCallback(
    async (session: TimerSession, done: string) => {
      const res = await saveOrStashSession(user, session)
      if (res === 'saved') {
        refreshTodayProgress()
        showNote(`${done} · 已记入 ${formatDuration(session.seconds)}`)
      } else {
        showNote(`${done} · 已暂存${user ? '，将自动补传' : '，登录后可保存'}`)
      }
    },
    [user, refreshTodayProgress, showNote],
  )

  // 每秒与共享计时/番茄钟对齐（本组件不直接改状态，全部以 localStorage 为准）
  useEffect(() => {
    const tick = () => {
      // 待入库时长：今日总时长 = 云端已打卡 + 尚未补传的段（离线/刚结束还没写完时也不漏）
      try {
        const today = todayStr()
        setPendingSeconds(loadOutbox().reduce((sum, item) => (item.date === today ? sum + item.seconds : sum), 0))
      } catch {
        /* 队列读取失败时保持原值 */
      }
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
        // 首次发现跨天时提示一次：结束时会按自然日拆分，零点前后各记各的
        if (crossedNoticeRef.current !== startDate) {
          crossedNoticeRef.current = startDate
          showNote(`已跨零点：本段将按天拆分（${format(new Date(s.startTime), 'M月d日')} 与今天各记一部分）`)
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
      (running.activity ? ` · ${formatActivityLabel(running.activity)}` : '')
    : '选择科目开始'

  /* 番茄钟展示值：阶段胶囊 = 专注/休息 + 科目，中段 = 倒计时 + 阶段进度 */
  const pomoPaused = Boolean(pomo?.paused)
  const pomoTone: 'focus' | 'rest' | 'paused' = pomo ? (pomoPaused ? 'paused' : pomo.phase) : 'focus'
  const pomoSubjectText = pomo
    ? (getSubjectById(pomo.subjectId)?.name ?? pomo.subjectId) +
      (pomo.activity ? ` · ${formatActivityLabel(pomo.activity)}` : '')
    : ''
  const pomoLabel = pomo ? `${pomo.phase === 'focus' ? '专注' : '休息'} · ${pomoSubjectText}` : ''
  const pomoRoundText = pomo ? `第 ${pomo.round + (pomo.phase === 'focus' ? 1 : 0)} 轮` : ''
  const pomoProgress = (() => {
    if (!pomo) return 0
    const total = (pomo.phase === 'focus' ? pomo.focusMin : pomo.restMin) * 60000
    if (total <= 0) return 0
    return Math.max(0, Math.min(1, (total - pomoRemain) / total))
  })()

  /* ── 今日时长小按钮（原位切换，不占额外窗口尺寸） ── */
  /** 今日总时长 = 云端已打卡 + 待入库段（正在计时的那一段不计，与「今日累计」口径一致） */
  const todayValue = `${(todayHours + pendingSeconds / 3600).toFixed(1)}h`
  const todayDetail = `今日已学 ${todayValue}${pendingSeconds > 0 ? '（含待入库时长）' : ''}`
  const todayScaleTitle = todayLine
    ? `今日已打卡 ${todayHours.toFixed(1)}h，今天还差约 ${todayLine.need.toFixed(1)}h 达成周目标日均`
    : `今日已打卡 ${todayHours.toFixed(1)}h`
  const btnSize = vertical ? 'h-7 w-7' : 'h-8 w-8'
  /* 竖向计时按「时/分/秒」三行堆叠：窄条里放不下 01:23:45 一行 */
  const timerGroups = (running ? formatDuration(elapsed) : '00:00:00').split(':')
  const pomoGroups = formatMmSs(pomoRemain).split(':')
  /* 竖向只显示科目名（活动名放到 title 里）：窄条宽度放不下「数学 · 高数 · 听课」 */
  const verticalSubjectName = pomo
    ? (getSubjectById(pomo.subjectId)?.name ?? pomo.subjectId)
    : running?.subjectId
      ? (getSubjectById(running.subjectId)?.name ?? running.subjectId)
      : '选择科目'
  const verticalSubjectText =
    verticalSubjectName.length > 5 ? `${verticalSubjectName.slice(0, 4)}…` : verticalSubjectName

  const todayButton = (
    <button
      type="button"
      onClick={(ev) => {
        ev.currentTarget.blur()
        setTodayOpen((v) => !v)
      }}
      onKeyDown={blockKeyboard}
      title={todayOpen ? '收起今日时长，返回计时' : '查看今日已学时长'}
      aria-label="今日已学时长"
      aria-pressed={todayOpen}
      className={`${btnSize} flex shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors ${
        todayOpen
          ? 'border-indigo-400 bg-indigo-50 text-indigo-600 dark:border-indigo-500/60 dark:bg-indigo-500/15 dark:text-indigo-300'
          : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
      }`}
    >
      <ClockIcon size={vertical ? 12 : 13} />
    </button>
  )

  const timerControls = pomo ? (
    <>
      <PauseResumeButton paused={pomoPaused} onClick={handlePomoPauseToggle} sizeClass={btnSize} />
      {pomo.phase === 'rest' ? (
        <button
          onClick={handlePomoSkipRest}
          onKeyDown={blockKeyboard}
          title="跳过休息"
          aria-label="跳过休息"
          className={`${btnSize} ${TIMER_ROUND_BTN.skipRest}`}
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
          className={`${btnSize} ${TIMER_ROUND_BTN.stop}`}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>
      )}
    </>
  ) : running ? (
    <>
      <PauseResumeButton paused={paused} onClick={handlePauseToggle} sizeClass={btnSize} />
      <button
        onClick={handleStop}
        onKeyDown={blockKeyboard}
        disabled={stopping}
        title="结束并打卡"
        aria-label="结束并打卡"
        className={`${btnSize} ${TIMER_ROUND_BTN.stop} disabled:opacity-50`}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      </button>
    </>
  ) : (
    <button
      onClick={(ev) => {
        ev.currentTarget.blur()
        onOpenDropdown()
      }}
      onKeyDown={blockKeyboard}
      title="选择科目开始"
      aria-label="选择科目开始"
      className={`${btnSize} ${TIMER_ROUND_BTN.start}`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="ml-[1px]">
        <path d="M8 5.5v13l11-6.5z" />
      </svg>
    </button>
  )

  /* ── 竖向窄条：品牌 / 科目 / 计时 + 进度尺 / 今日 + 控制 ── */
  if (vertical) {
    const activePillTone = pomo ? POMO_PILL_TONE[pomoTone] : running ? SUBJECT_PILL_TONE[phase] : SUBJECT_PILL_TONE.idle
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-1">
        <DesktopLogo size={16} />

        {pomo || running ? (
          <span
            title={pomo ? pomoLabel : subjectLabel}
            className={`flex shrink-0 flex-col items-center gap-1 rounded-full px-1 py-1 ring-1 transition-colors duration-300 ${activePillTone}`}
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              {!(pomo ? pomoPaused : paused) && (
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
                    pomo ? POMO_DOT_TONE[pomoTone] : 'bg-emerald-400'
                  }`}
                />
              )}
              <span
                className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                  pomo
                    ? POMO_DOT_TONE[pomoTone]
                    : paused
                      ? 'bg-amber-500 dark:bg-amber-400'
                      : 'bg-emerald-500 dark:bg-emerald-400'
                }`}
              />
            </span>
            <span className="max-h-[56px] overflow-hidden whitespace-nowrap text-[10px] font-medium leading-none [writing-mode:vertical-rl]">
              {verticalSubjectText}
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
            className={`flex cursor-pointer flex-col items-center gap-1 rounded-full px-1 py-1 ring-1 transition-colors hover:bg-slate-200/80 hover:text-slate-900 dark:hover:bg-slate-700/90 dark:hover:text-slate-100 ${SUBJECT_PILL_TONE.idle}`}
          >
            <span className="whitespace-nowrap text-[10px] font-medium leading-none [writing-mode:vertical-rl]">
              {verticalSubjectText}
            </span>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="shrink-0 -rotate-90 opacity-70" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        )}

        {/* 中段：计时数字竖排 / 今日时长 / 提示 */}
        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-1.5">
          {note ? (
            <span className="max-h-[84px] overflow-hidden break-all text-center text-[9px] font-medium leading-[1.35] text-emerald-600 dark:text-emerald-400">
              {note}
            </span>
          ) : todayOpen ? (
            <div className="flex flex-col items-center gap-1.5" title={todayDetail}>
              <span className="text-[9px] leading-none text-slate-400 dark:text-slate-500">今日已学</span>
              <span className="text-[15px] font-semibold leading-none tabular-nums text-indigo-600 dark:text-indigo-300">
                {todayValue}
              </span>
              <div className="mt-0.5 flex h-[88px] w-full items-center justify-center">
                <div className="-rotate-90 scale-50">
                  <TimerScale hours={todayHours} linePct={todayLine?.pct ?? null} title={todayScaleTitle} />
                </div>
              </div>
            </div>
          ) : pomo ? (
            <>
              <div
                className={`flex flex-col items-center gap-[2px] text-[14px] font-semibold leading-none tabular-nums ${
                  pomoPaused ? TIMER_DIGIT_TONE.paused : POMO_DIGIT_TONE[pomo.phase]
                }`}
                title={`${pomoRoundText} · ${pomo.phase === 'focus' ? '专注' : '休息'}中`}
              >
                {pomoGroups.map((g, i) => (
                  <span key={i}>{g}</span>
                ))}
              </div>
              <div
                className="h-[3px] w-7 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/70"
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
              <div
                className={`flex flex-col items-center gap-[2px] text-[14px] font-semibold leading-none tabular-nums transition-colors duration-300 ${TIMER_DIGIT_TONE[phase]}`}
                title={running ? '正在计时' : '空闲'}
              >
                {timerGroups.map((g, i) => (
                  <span key={i}>{g}</span>
                ))}
              </div>
              <div className="flex h-[88px] w-full items-center justify-center">
                <div className="-rotate-90 scale-50">
                  <TimerScale hours={todayHours} linePct={todayLine?.pct ?? null} title={todayScaleTitle} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* 今日时长 + 开始/暂停/结束（竖排） */}
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          {todayButton}
          {timerControls}
        </div>
      </div>
    )
  }

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
        ) : todayOpen ? (
          /* 今日时长原位切换：不额外加高窗口，再点时钟按钮回到计时显示 */
          <>
            <span
              className="block max-w-full truncate text-[15px] font-semibold leading-none tabular-nums text-indigo-600 dark:text-indigo-300"
              title={todayDetail}
            >
              今日 {todayValue}
            </span>
            <TimerScale hours={todayHours} linePct={todayLine?.pct ?? null} title={todayScaleTitle} />
          </>
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
                title={todayScaleTitle}
              />
            )}
          </>
        )}
      </div>

      {/* ── 右：今日时长 + 开始 / 暂停 / 结束（展开时按钮交给下拉面板） ── */}
      {!expanded && (
        <div className="flex shrink-0 items-center gap-1.5">
          {todayButton}
          {timerControls}
        </div>
      )}
    </div>
  )
}