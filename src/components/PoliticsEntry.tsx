import { Link } from 'react-router-dom'
import { Icon } from './Icon'

/**
 * 首页的「考研政治一页纸」入口卡片。
 * 用印章式「政」字 + 暖纸渐变承载，和侧边栏的「政治」导航指向同一个全屏页面。
 */
export default function PoliticsEntry() {
  return (
    <Link
      to="/politics"
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 via-white to-amber-50 px-3.5 py-3 transition-all hover:-translate-y-0.5 hover:border-red-200 hover:shadow-[0_10px_28px_-18px_rgba(166,52,42,0.55)] dark:border-red-500/20 dark:from-red-500/10 dark:via-slate-900 dark:to-amber-500/10 dark:hover:border-red-500/30"
    >
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
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-gray-800 dark:text-slate-100">2027 考研政治一页纸</span>
          <span className="shrink-0 rounded-full bg-red-100/80 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-500/15 dark:text-red-300">
            100 考点
          </span>
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-gray-500 dark:text-slate-400">
          马原 · 史纲 · 时政｜检索、背诵、时轴
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-[#a6342a] shadow-sm dark:bg-slate-800/80 dark:text-red-300">
        打开
        <Icon name="chevronRight" size={12} />
      </span>
    </Link>
  )
}
