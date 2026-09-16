import { Link } from 'react-router-dom'
import { Icon } from './Icon'

/** 首页「生词本 / 每周总结」两格快捷入口（移动分支使用量较重，桌面仅登录态可见） */
export default function QuickLinksRow() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Link
        to="/vocabulary"
        className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 px-3 py-2 border border-gray-100 dark:border-slate-800 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
      >
        <span className="w-7 h-7 shrink-0 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 flex items-center justify-center">
          <Icon name="vocab" size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-800 dark:text-slate-100">生词本</p>
          <p className="text-[10px] text-gray-500 dark:text-slate-500 truncate">背单词与复习</p>
        </div>
        <Icon name="chevronRight" size={14} className="text-gray-400 dark:text-slate-600 shrink-0" />
      </Link>

      <Link
        to="/weekly-summary"
        className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 px-3 py-2 border border-gray-100 dark:border-slate-800 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
      >
        <span className="w-7 h-7 shrink-0 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 flex items-center justify-center">
          <Icon name="star" size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-800 dark:text-slate-100">每周总结</p>
          <p className="text-[10px] text-gray-500 dark:text-slate-500 truncate">本周 vs 上周 · 反思</p>
        </div>
        <Icon name="chevronRight" size={14} className="text-gray-400 dark:text-slate-600 shrink-0" />
      </Link>
    </div>
  )
}