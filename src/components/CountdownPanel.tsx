import { Link } from 'react-router-dom'
import Countdown from './Countdown'

export interface HomeStats {
  totalHours: number
  checkedDays: number
}

interface Props {
  size?: 'compact' | 'normal'
  phaseInfo: { tag: string; desc: string; tone: string }
  dailyQuote: string
  user: boolean
  stats: HomeStats
  todayHours: number
  hasCheckedToday: boolean
  /** 数据加载中：今日时长等数值就以骨架屏占位，避免「0h」跳变 */
  loading?: boolean
}

/**
 * 首页「倒计时 + 备考阶段 + 每日格言 + 三格统计（今日时长/打卡天数/去打卡）」面板。
 * compact（桌面）/ normal（移动）用字号与间距差异服务两个分支。
 */
export default function CountdownPanel({
  size = 'normal',
  phaseInfo,
  dailyQuote,
  user,
  stats,
  todayHours,
  hasCheckedToday,
  loading = false,
}: Props) {
  const compact = size === 'compact'
  const panelPad = compact ? 'px-3 py-3' : 'px-3 py-3 sm:px-4 sm:py-4'
  const footerPad = compact ? 'mt-2 border-t' : 'mt-3 border-t'
  const statCell = compact ? 'p-2' : 'p-2 sm:p-2.5'
  const statLabel = compact ? 'text-[10px]' : 'text-[10px] sm:text-[11px]'
  const statValue = compact ? 'text-[15px]' : 'text-base sm:text-lg'
  const statSub = compact ? 'text-[9px]' : 'text-[9px] sm:text-[10px]'
  const tagTxt = compact ? 'text-[10px] px-2 py-0.5' : 'text-[10px] sm:text-[11px] px-2.5 py-0.5'
  const quoteTxt = compact ? 'text-[10px]' : 'text-[10px] sm:text-[11px]'
  const guestText = compact ? 'text-[11px]' : 'text-[11px] sm:text-xs'
  const guestSub = compact ? 'text-[10px]' : 'text-[10px] sm:text-[11px]'
  const guestBtn = compact ? 'text-[11px]' : 'text-[11px] sm:text-xs'
  const guestPad = compact ? 'px-3 py-2' : 'px-3 py-2.5'

  return (
    <div className={`card relative ${panelPad} overflow-hidden`}>
      {compact ? <Countdown title="距考试还有" /> : <Countdown />}

      {/* 阶段标签 + 累计 / 格言 —— 填空白 */}
      <div className={`${footerPad} pt-2 border-dashed border-gray-200 dark:border-slate-800`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${phaseInfo.tone} text-white font-semibold ${tagTxt} shadow-sm`}
          >
            {phaseInfo.tag}
          </span>
          <span className={`${quoteTxt} text-gray-400 dark:text-slate-500 italic truncate`}>
            「{dailyQuote}」
          </span>
        </div>
        {user ? (
          <div className="grid grid-cols-3 gap-2">
            <div className={`rounded-xl bg-gradient-to-b from-blue-50 to-white dark:from-blue-500/10 dark:to-slate-900 border border-blue-100 dark:border-blue-500/15 ${statCell} text-center`}>
              <p className={`${statLabel} text-blue-500/90 dark:text-blue-400/80 font-medium`}>今日时长</p>
              {loading ? (
                <div className={`h-5 w-10 mx-auto rounded bg-gray-200 dark:bg-slate-700 animate-pulse mt-1`} />
              ) : (
                <p className={`${statValue} font-bold tabular-nums text-blue-700 dark:text-blue-300 mt-0.5 leading-none`}>
                  {todayHours.toFixed(1)}<span className="text-[10px] font-medium ml-0.5">h</span>
                </p>
              )}
              <p className={`${statSub} text-blue-400/80 dark:text-blue-400/50 mt-0.5 leading-none`}>
                累计 {stats.totalHours.toFixed(0)}h
              </p>
            </div>
            <div className={`rounded-xl bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-500/10 dark:to-slate-900 border border-indigo-100 dark:border-indigo-500/15 ${statCell} text-center`}>
              <p className={`${statLabel} text-indigo-500/90 dark:text-indigo-400/80 font-medium`}>打卡天数</p>
              <p className={`${statValue} font-bold tabular-nums text-indigo-700 dark:text-indigo-300 mt-0.5 leading-none`}>
                {stats.checkedDays}<span className="text-[10px] font-medium ml-0.5">天</span>
              </p>
            </div>
            <Link
              to="/my-records/new"
              className={`group rounded-xl bg-gradient-to-b from-violet-50 to-white dark:from-violet-500/10 dark:to-slate-900 border border-violet-100 dark:border-violet-500/15 ${statCell} text-center transition-colors hover:from-violet-100 dark:hover:from-violet-500/20`}
            >
              <p className={`${statLabel} text-violet-500/90 dark:text-violet-400/80 font-medium`}>
                {hasCheckedToday ? '今日继续' : '今日去打卡'}
              </p>
              <p className={`${statValue} font-bold tabular-nums text-violet-700 dark:text-violet-300 mt-0.5 leading-none group-hover:translate-y-px transition-transform`}>
                {hasCheckedToday ? '继续+' : '打卡→'}
              </p>
            </Link>
          </div>
        ) : (
          <div className={`rounded-xl bg-gradient-to-br from-indigo-50 via-violet-50 to-white dark:from-indigo-500/10 dark:via-violet-500/5 dark:to-slate-900 border border-indigo-100/80 dark:border-indigo-500/20 ${guestPad} flex items-center justify-between gap-2`}>
            <div className="min-w-0">
              <p className={`${guestText} font-semibold text-indigo-700 dark:text-indigo-300`}>{phaseInfo.desc}</p>
              <p className={`${guestSub} text-gray-500 dark:text-slate-500 mt-0.5`}>登录后开始记录你的考研足迹</p>
            </div>
            <Link
              to="/login"
              className={`shrink-0 inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white ${guestBtn} font-semibold shadow-sm transition-colors`}
            >
              立即登录
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}