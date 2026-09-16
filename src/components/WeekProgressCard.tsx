import { Link } from 'react-router-dom'

interface Props {
  /** 本周承诺目标小时数；为空表示未设定 */
  weekTarget: number | null
  /** 本周已学小时数 */
  actualHours: number
  /** 0~100 的进度百分比（调用方已 clamp） */
  progress: number
  /** 数据加载中：显示骨架屏占位，避免「0h」跳变 */
  loading?: boolean
}

/** 首页「本周进度」卡（桌面/移动两分支共用的骨架屏 + 实卡） */
export default function WeekProgressCard({ weekTarget, actualHours, progress, loading }: Props) {
  if (loading) {
    return (
      <div className="card p-3">
        <div className="flex items-baseline justify-between">
          <div className="h-2.5 w-12 rounded bg-gray-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-2.5 w-10 rounded bg-gray-200 dark:bg-slate-700 animate-pulse" />
        </div>
        <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden mt-3.5">
          <div className="w-1/3 h-full rounded-full bg-gray-200 dark:bg-slate-700 animate-pulse" />
        </div>
      </div>
    )
  }
  return (
    <Link
      to="/goal"
      className="card p-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 dark:hover:border-indigo-500/40 dark:hover:bg-slate-800/60"
    >
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] text-gray-500 dark:text-slate-500">本周进度</p>
        <p className="text-[11px] text-gray-400 dark:text-slate-600">
          {weekTarget ? `${actualHours.toFixed(1)}/${weekTarget}h` : '未设定'}
        </p>
      </div>
      {weekTarget ? (
        <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-2">
          <div
            className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-indigo-500 dark:bg-indigo-400'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : (
        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1.5">去设定目标 →</p>
      )}
    </Link>
  )
}