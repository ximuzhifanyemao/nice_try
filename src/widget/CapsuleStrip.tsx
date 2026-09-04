import { useState, useEffect, useRef, useCallback } from 'react'
import DesktopLogo from '../components/DesktopLogo'
import { useAuth } from '../contexts/AuthContext'
import { getSubjectById } from '../lib/subjects'
import { formatDuration } from '../lib/format'
import {
  loadSharedTimer,
  computeTimerElapsed,
  finishSharedTimer,
  pauseSharedTimer,
  resumeSharedTimer,
  type SharedTimerState,
} from '../lib/timerSync'

interface CapsuleStripProps {
  /** 精简面板/下拉是否展开：展开时开始/结束按钮交给面板，胶囊条只做状态展示 */
  expanded: boolean
  /** 打开科目下拉（点「选择科目开始」标签或 ▶ 按钮） */
  onOpenDropdown: () => void
}

/**
 * 胶囊条：简洁模式常态（460×56）的主显示区。
 * - 常显：品牌 logo + 当前科目 + 实时计时
 * - 空闲时点 ▶ 展开面板选择科目；计时中点 ■ 直接结束并打卡
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

  // 每秒与共享计时对齐（本组件不直接改状态，全部以 localStorage 为准）
  useEffect(() => {
    const tick = () => {
      const s = loadSharedTimer()
      setRunning(s)
      setElapsed(s ? computeTimerElapsed(s) : 0)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
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

  const handleStop = useCallback(async () => {
    if (!loadSharedTimer()) return
    setStopping(true)
    try {
      const result = await finishSharedTimer(user)
      if (result.status === 'saved') {
        showNote(`已记入 ${formatDuration(result.seconds)}`)
      } else if (result.message) {
        showNote(result.message)
      }
      // running/elapsed 将在下一次 tick 自动对齐到已停止状态
    } finally {
      setStopping(false)
    }
  }, [user, showNote])

  /** 暂停 / 恢复：写入共享计时后立即对齐本地状态（无需等下个 tick） */
  const handlePauseToggle = useCallback(() => {
    if (running?.paused) resumeSharedTimer()
    else pauseSharedTimer()
    const s = loadSharedTimer()
    setRunning(s)
    setElapsed(s ? computeTimerElapsed(s) : 0)
  }, [running?.paused])

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
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-4 ${
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
                className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
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
            onClick={onOpenDropdown}
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
          <span className="block truncate text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            {note}
          </span>
        ) : (
          <span
            className={`font-mono text-[15px] font-semibold tabular-nums tracking-tight ${
              running?.paused
                ? 'text-amber-600 dark:text-amber-400'
                : running
                  ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-indigo-400'
                  : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {running ? formatDuration(elapsed) : '00:00:00'}
          </span>
        )}
      </div>

      {/* 开始 / 暂停 / 结束（展开时按钮交给下拉/面板，这里仅展示） */}
      {!expanded &&
        (running ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={handlePauseToggle}
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
            onClick={onOpenDropdown}
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