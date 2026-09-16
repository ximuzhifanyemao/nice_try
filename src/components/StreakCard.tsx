import { Link } from 'react-router-dom'
import { Icon } from './Icon'

interface Props {
  /** computeStreak 的结构：{ current, longest } */
  streak: { current: number; longest: number }
  /** 数据加载中：显示骨架屏占位，避免「0 天」跳变 */
  loading?: boolean
}

/** 首页「连续打卡」卡（桌面/移动两分支共用的骨架屏 + 实卡） */
export default function StreakCard({ streak, loading }: Props) {
  if (loading) {
    return (
      <div className="card p-3">
        <div className="flex items-baseline justify-between">
          <div className="h-2.5 w-12 rounded bg-gray-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-2.5 w-9 rounded bg-gray-200 dark:bg-slate-700 animate-pulse" />
        </div>
        <div className="h-5 w-16 rounded bg-gray-200 dark:bg-slate-700 animate-pulse mt-2.5" />
      </div>
    )
  }
  return (
    <Link
      to="/achievements"
      className="card p-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 dark:hover:border-indigo-500/40 dark:hover:bg-slate-800/60"
    >
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] text-gray-500 dark:text-slate-500">连续打卡</p>
        <p className="text-[11px] text-gray-400 dark:text-slate-600">最长{streak.longest}天</p>
      </div>
      <p className="text-lg font-bold text-orange-500 dark:text-orange-400 mt-0.5 flex items-center gap-1">
        <Icon name="flame" size={19} />
        <span className="num">{streak.current} 天</span>
      </p>
    </Link>
  )
}