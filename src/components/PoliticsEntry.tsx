import { Link } from 'react-router-dom'
import { Icon } from './Icon'

/**
 * 首页的「考研政治一页纸」入口卡片。
 * 用印章式「政」字 + 暖纸渐变承载，除了进入政治首页，还提供「解题」直达入口，
 * 手机端与网页端都能一眼看到解题手册。
 */
export default function PoliticsEntry() {
  return (
    <div className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 via-white to-amber-50 px-3.5 py-3 transition-all hover:-translate-y-0.5 hover:border-red-200 hover:shadow-[0_10px_28px_-18px_rgba(166,52,42,0.55)] dark:border-red-500/20 dark:from-red-500/10 dark:via-slate-900 dark:to-amber-500/10 dark:hover:border-red-500/30">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-red-200/30 blur-2xl dark:bg-red-500/10"
      />
      <span
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#a6342a] text-[15px] font-semibold tracking-widest text-[#fff8ef] shadow-[0_8px_18px_-10px_rgba(127,36,29,0.8)]"
        style={{ fontFamily: '"Songti SC","STSong","Source Han Serif SC","Noto Serif SC",serif' }}
      >
        政
      </span>
      <Link to="/politics" className="relative min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-gray-800 dark:text-slate-100">2027 考研政治一页纸</span>
          <span className="hidden shrink-0 rounded-full bg-red-100/80 px-1.5 py-0.5 text-[10px] font-medium text-red-700 sm:inline dark:bg-red-500/15 dark:text-red-300">
            100 考点
          </span>
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-gray-500 dark:text-slate-400">
          马原 · 史纲 · 时政｜检索、解题、会议速查
        </span>
      </Link>
      <span className="relative flex shrink-0 items-center gap-1.5">
        <Link
          to="/politics?page=solution"
          className="rounded-full bg-[#a6342a] px-2.5 py-1 text-[11px] font-medium text-[#fff8ef] shadow-[0_6px_14px_-8px_rgba(127,36,29,0.7)] transition-colors hover:bg-[#7f241d]"
        >
          解题
        </Link>
        <Link
          to="/politics"
          className="flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[11px] font-medium text-[#a6342a] shadow-sm transition-colors hover:bg-white sm:px-2.5 dark:bg-slate-800/80 dark:text-red-300 dark:hover:bg-slate-800"
        >
          <span className="hidden sm:inline">打开</span>
          <Icon name="chevronRight" size={12} />
        </Link>
      </span>
    </div>
  )
}
