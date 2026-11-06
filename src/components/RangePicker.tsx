import { useState, useEffect } from 'react'
import { getWeekRange, getMonthRange, validateCustomRange, type SummaryRange } from '../lib/summary'

export type { SummaryRange }

interface RangePickerProps {
  value: SummaryRange
  onChange: (next: SummaryRange) => void
  /** 手机端紧凑形态：分段控件直接嵌在页头下方，不再单独占一张卡片 */
  compact?: boolean
}

export default function RangePicker({ value, onChange, compact = false }: RangePickerProps) {
  const [customStart, setCustomStart] = useState<string>(value.startDate)
  const [customEnd, setCustomEnd] = useState<string>(value.endDate)

  useEffect(() => {
    if (value.mode === 'custom') {
      setCustomStart(value.startDate)
      setCustomEnd(value.endDate)
    }
  }, [value.mode, value.startDate, value.endDate])

  const validation = validateCustomRange(customStart, customEnd)

  const baseBtnClass =
    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer'
  const activeBtnClass = 'bg-blue-600 text-white'
  const inactiveBtnClass =
    'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600'
  const inputClass =
    'px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 sm:w-auto w-full'

  const handleWeek = () => {
    const { startDate, endDate } = getWeekRange()
    onChange({ mode: 'week', startDate, endDate })
  }

  const handleMonth = () => {
    const { startDate, endDate } = getMonthRange()
    onChange({ mode: 'month', startDate, endDate })
  }

  const handleCustom = () => {
    onChange({ ...value, mode: 'custom' })
  }

  const handleApply = () => {
    const result = validateCustomRange(customStart, customEnd)
    if (result.valid) {
      onChange({ mode: 'custom', startDate: result.startDate, endDate: result.endDate })
    }
  }

  if (compact) {
    const modeBtnClass = 'flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors cursor-pointer'
    return (
      <div className="space-y-2">
        <div className="flex gap-1 rounded-xl bg-gray-100/80 p-1 dark:bg-slate-800/70">
          {[
            { mode: 'week' as const, label: '本周', action: handleWeek },
            { mode: 'month' as const, label: '本月', action: handleMonth },
            { mode: 'custom' as const, label: '自定义', action: handleCustom },
          ].map((item) => (
            <button
              key={item.mode}
              type="button"
              onClick={item.action}
              aria-pressed={value.mode === item.mode}
              className={`${modeBtnClass} ${
                value.mode === item.mode
                  ? 'bg-white font-semibold text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300'
                  : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {value.mode === 'custom' && (
          <div className="space-y-2 rounded-xl border border-gray-200/80 bg-white/70 p-2.5 dark:border-slate-700 dark:bg-slate-800/40">
            {/* 窄屏下日期框各占半行，完整显示「年/月/日」；应用按钮单独一行，避免把日期挤到只剩年月 */}
            <div className="grid grid-cols-2 gap-2">
              <label className="min-w-0 space-y-1">
                <span className="block text-[10px] text-gray-400 dark:text-slate-500">开始日期</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="h-8 w-full min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </label>
              <label className="min-w-0 space-y-1">
                <span className="block text-[10px] text-gray-400 dark:text-slate-500">结束日期</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="h-8 w-full min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              {validation.error ? (
                <p className="min-w-0 flex-1 text-[11px] text-red-500 dark:text-red-400">
                  {validation.error}
                </p>
              ) : (
                <span className="flex-1" />
              )}
              <button
                type="button"
                onClick={handleApply}
                disabled={!validation.valid}
                className="h-8 shrink-0 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                应用
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleWeek}
          className={`${baseBtnClass} ${value.mode === 'week' ? activeBtnClass : inactiveBtnClass}`}
        >
          本周
        </button>
        <button
          type="button"
          onClick={handleMonth}
          className={`${baseBtnClass} ${value.mode === 'month' ? activeBtnClass : inactiveBtnClass}`}
        >
          本月
        </button>
        <button
          type="button"
          onClick={handleCustom}
          className={`${baseBtnClass} ${value.mode === 'custom' ? activeBtnClass : inactiveBtnClass}`}
        >
          自定义
        </button>
      </div>

      {value.mode === 'custom' && (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-sm text-gray-700 dark:text-slate-200">从：</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className={inputClass}
            />
            <label className="text-sm text-gray-700 dark:text-slate-200">到：</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className={inputClass}
            />
            <button
              type="button"
              onClick={handleApply}
              disabled={!validation.valid}
              className={`${baseBtnClass} bg-blue-600 text-white ${
                !validation.valid ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              应用
            </button>
          </div>
          {validation.error && (
            <p className="text-xs text-red-500 dark:text-red-400">{validation.error}</p>
          )}
        </>
      )}
    </div>
  )
}
