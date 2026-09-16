import { Link } from 'react-router-dom'

interface Props {
  /** 今天是否已打卡：已打卡则不显示提醒条 */
  hasCheckedToday: boolean
  /** 是否有过记录且当前已断签（用于切换断签话术） */
  showBreak: boolean
}

/**
 * 首页「打卡提醒」条（桌面/移动两分支共用）。
 * 已在今天打卡时渲染 null，断签 vs 未打卡展示不同话术。
 */
export default function CheckinReminderCard({ hasCheckedToday, showBreak }: Props) {
  if (hasCheckedToday) return null
  return (
    <Link
      to="/my-records/new"
      className="block rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/70 dark:from-amber-500/10 dark:to-orange-500/5 border border-amber-200/80 dark:border-amber-500/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-300/90 transition-colors hover:from-amber-100 dark:hover:from-amber-500/15"
    >
      {showBreak
        ? '🔥 连续打卡已断签，今天重新开始吧'
        : '✍️ 今天还没打卡，别忘了记录学习'}
    </Link>
  )
}