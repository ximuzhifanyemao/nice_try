import { useState, useEffect } from 'react'
import { getWeekRange, getMonthRange, validateCustomRange, type SummaryRange } from '../lib/summary'

export type { SummaryRange }

interface RangePickerProps {
  value: SummaryRange
  onChange: (next: SummaryRange) => void
}

export default function RangePicker({ value, onChange }: RangePickerProps) {
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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 space-y-3">
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
