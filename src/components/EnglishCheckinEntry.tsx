import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import { ENGLISH_TOTAL_DAYS } from '../lib/englishCheckin'

interface Props {
  size?: 'compact' | 'normal'
  /** 英语打卡已完成的次数 */
  checkinCount: number
}

/**
 * 首页「英语长难句打卡」入口。
 * - compact（桌面）：`.card` 卡片式，仅标题 + 计数，无进度条。
 * - normal（移动）：白底描边卡 + 副标题 + 已完成时的进度条。
 */
export default function EnglishCheckinEntry({ size = 'normal', checkinCount }: Props) {
  const compact = size === 'compact'
  return (
    <Link
      to="/english-checkin"
      className={
        compact
          ? 'card p-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 dark:hover:border-indigo-500/40 dark:hover:bg-slate-800/60'
          : 'block rounded-xl bg-white dark:bg-slate-900 p-3 border border-gray-100 dark:border-slate-800 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800'
      }
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 shrink-0 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 flex items-center justify-center">
            <Icon name="book" size={17} />
          </span>
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-slate-100">英语长难句打卡</p>
            <p className="text-[11px] text-gray-500 dark:text-slate-500">
              {compact
                ? `${ENGLISH_TOTAL_DAYS} 天`
                : `柴荣老师 ${ENGLISH_TOTAL_DAYS} 天 · 逐句翻译打分`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-slate-400">{checkinCount}/{ENGLISH_TOTAL_DAYS} 天</span>
          <span className="text-gray-400 dark:text-slate-600">→</span>
        </div>
      </div>
      {!compact && checkinCount > 0 && (
        <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-2">
          <div
            className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400 transition-all"
            style={{ width: `${(checkinCount / ENGLISH_TOTAL_DAYS) * 100}%` }}
          />
        </div>
      )}
    </Link>
  )
}