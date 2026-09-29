import { format, parseISO, addDays } from 'date-fns'
import { Icon } from './Icon'
import { getWeekStartStr } from '../lib/commitments'

interface WeekSwitcherProps {
  /** 当前选中的周起点（周一，yyyy-MM-dd） */
  weekStart: string
  /** 切换周次；不允许切到未来周 */
  onChange: (weekStart: string) => void
}

/**
 * 周次切换器：左右箭头翻周 + 中间显示本周日期区间。
 *
 * 记录页用它把列表限制在「一周」范围内——不再无限「加载更多」，
 * 页面长度有上限，更早的记录交给首页日历按天查看。
 * 算法与「周总结」页一致（周一起始、不能翻到未来周）。
 */
export default function WeekSwitcher({ weekStart, onChange }: WeekSwitcherProps) {
  const weekEnd = format(addDays(parseISO(weekStart), 6), 'yyyy-MM-dd')
  const thisWeekStart = getWeekStartStr()
  const isCurrentWeek = weekStart === thisWeekStart
  // 允许切到下一周的前提：下一周的起点不晚于本周
  const canNext = format(addDays(parseISO(weekStart), 7), 'yyyy-MM-dd') <= thisWeekStart

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onChange(format(addDays(parseISO(weekStart), -7), 'yyyy-MM-dd'))}
          title="上一周"
          aria-label="上一周"
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <Icon name="arrowLeft" size={18} />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">
            {format(parseISO(weekStart), 'M月d日')} ~ {format(parseISO(weekEnd), 'M月d日')}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">{isCurrentWeek ? '本周' : '回顾往周'}</p>
        </div>
        <button
          type="button"
          onClick={() => canNext && onChange(format(addDays(parseISO(weekStart), 7), 'yyyy-MM-dd'))}
          disabled={!canNext}
          title="下一周"
          aria-label="下一周"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
            canNext
              ? 'cursor-pointer text-gray-500 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700'
              : 'cursor-not-allowed text-gray-300 dark:text-slate-600'
          }`}
        >
          <Icon name="arrowRight" size={18} />
        </button>
      </div>
    </div>
  )
}
