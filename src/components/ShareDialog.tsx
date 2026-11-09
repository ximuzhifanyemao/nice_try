import { useEffect, useMemo, useState } from 'react'
import { todayStr, type DailyLog } from '../lib/dailyLogs'
import type { ShareMode, ShareView } from '../lib/shareCard'
import {
  buildCalendarPayload,
  buildSummaryPayload,
  buildTimelinePayload,
  resolveShareRange,
} from '../lib/shareCardData'
import { useShareCard } from '../lib/useShareCard'
import { Icon } from './Icon'

interface ShareDialogProps {
  open: boolean
  logs: DailyLog[]
  initialMode?: ShareMode
  initialDate?: string
  initialView?: ShareView
  onClose: () => void
}

/** 日 / 周 / 月三个范围 */
const MODES: { key: ShareMode; label: string }[] = [
  { key: 'day', label: '日' },
  { key: 'week', label: '周' },
  { key: 'month', label: '月' },
]

/**
 * 分享选择弹窗：先选「日 / 周 / 月」，再选「总计 / 逐日 / 时间轴」，
 * 最后交给 useShareCard 生成纸墨分享图。
 *
 * 记录页、单日记录卡、周总结页共用同一个弹窗，
 * 避免三个入口各写一套分享逻辑导致口径不一致。
 */
export default function ShareDialog({
  open,
  logs,
  initialMode = 'day',
  initialDate,
  initialView = 'summary',
  onClose,
}: ShareDialogProps) {
  const { sharing, share } = useShareCard()
  const [mode, setMode] = useState<ShareMode>(initialMode)
  const [date, setDate] = useState(initialDate ?? todayStr())
  const [view, setView] = useState<ShareView>(initialView)

  // 每次打开时按调用方传入的初始值重置
  useEffect(() => {
    if (!open) return
    setMode(initialMode)
    setDate(initialDate ?? todayStr())
    setView(initialView)
  }, [open, initialMode, initialDate, initialView])

  // 模式切换后若当前形态不合法（如日视图的「逐日」），自动回退到总计
  useEffect(() => {
    const allowed: ShareView[] =
      mode === 'day' ? ['summary', 'timeline'] : ['summary', 'calendar']
    if (!allowed.includes(view)) setView('summary')
  }, [mode, view])

  // Esc 关闭
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const range = useMemo(() => resolveShareRange(mode, date), [mode, date])

  /** 范围预览：总时长 / 打卡天数 / 科目数 */
  const preview = useMemo(() => {
    let totalHours = 0
    const dates = new Set<string>()
    const subjects = new Set<string>()
    for (const log of logs) {
      if (log.deleted_at) continue
      if (log.date < range.startDate || log.date > range.endDate) continue
      let dayHours = 0
      for (const s of log.subjects ?? []) {
        if (!(s.hours > 0)) continue
        dayHours += s.hours
        subjects.add(s.id)
      }
      totalHours += dayHours
      if (dayHours > 0) dates.add(log.date)
    }
    return {
      totalHours: Math.round(totalHours * 10) / 10,
      checkedDays: dates.size,
      subjectCount: subjects.size,
    }
  }, [logs, range.startDate, range.endDate])

  const views: { key: ShareView; label: string }[] =
    mode === 'day'
      ? [
          { key: 'summary', label: '总计' },
          { key: 'timeline', label: '时间轴' },
        ]
      : [
          { key: 'summary', label: '总计' },
          { key: 'calendar', label: '逐日' },
        ]

  const empty = preview.totalHours <= 0

  const handleGenerate = async () => {
    if (sharing || empty) return
    const payload =
      view === 'calendar' && mode !== 'day'
        ? buildCalendarPayload(logs, mode, date)
        : view === 'timeline' && mode === 'day'
          ? buildTimelinePayload(logs, date)
          : buildSummaryPayload(logs, mode, date)
    await share(payload)
    onClose()
  }

  if (!open) return null

  const viewHint =
    view === 'calendar'
      ? '日历展示每天学习时长，不含科目明细'
      : view === 'timeline'
        ? '按开始时间展示当天学习片段，无时间段的记录排在最后'
        : '展示总时长与各科目投入分布'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="分享学习记录"
    >
      <div
        className="card max-h-[88vh] w-full max-w-md overflow-y-auto p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">分享学习记录</h3>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500">
              选一段学习时光，生成一张纸墨分享图
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        {/* 范围 */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-slate-300">分享范围</p>
          <div className="flex gap-1 rounded-xl bg-gray-100/80 p-1 dark:bg-slate-800/70">
            {MODES.map((item) => {
              const active = mode === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMode(item.key)}
                  aria-pressed={active}
                  className={`flex-1 cursor-pointer rounded-lg py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-white font-semibold text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>

          <label className="block space-y-1">
            <span className="block text-[11px] text-gray-400 dark:text-slate-500">
              {mode === 'day' ? '选择日期' : mode === 'week' ? '选择所在周' : '选择所在月'}
            </span>
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={(e) => {
                if (e.target.value) setDate(e.target.value)
              }}
              className="input h-9 text-sm"
            />
          </label>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">{range.dateLabel}</p>
        </div>

        {/* 展示内容 */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-slate-300">展示内容</p>
          <div className="flex gap-1 rounded-xl bg-gray-100/80 p-1 dark:bg-slate-800/70">
            {views.map((item) => {
              const active = view === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setView(item.key)}
                  aria-pressed={active}
                  className={`flex-1 cursor-pointer rounded-lg py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-white font-semibold text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">{viewHint}</p>
        </div>

        {/* 数据预览 */}
        <div className="rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-slate-800/50">
          <p className="text-xs font-medium text-gray-700 dark:text-slate-200">{range.dateLabel}</p>
          <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
            总时长 <span className="font-semibold tabular-nums">{preview.totalHours}h</span>
            <span className="mx-1.5 text-gray-300 dark:text-slate-600">·</span>
            打卡 <span className="font-semibold tabular-nums">{preview.checkedDays}</span> 天
            <span className="mx-1.5 text-gray-300 dark:text-slate-600">·</span>
            科目 <span className="font-semibold tabular-nums">{preview.subjectCount}</span> 个
          </p>
          {empty && (
            <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400">
              该范围暂无学习记录，换一天 / 一周 / 一个月试试
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={sharing}
            className="px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={sharing || empty}
            className="px-4 py-2 text-sm text-white rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sharing ? '生成中…' : '生成分享图'}
          </button>
        </div>
      </div>
    </div>
  )
}
