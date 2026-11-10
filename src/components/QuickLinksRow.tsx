import { Link } from 'react-router-dom'
import { Icon } from './Icon'

/** 首页「记一记 / 每周总结」快捷入口（移动分支使用量较重，桌面仅登录态可见） */
export default function QuickLinksRow() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Link
        to="/study-notes"
        className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2 transition-colors hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
          <Icon name="bulb" size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-800 dark:text-slate-100">记一记</p>
          <p className="truncate text-[10px] text-gray-500 dark:text-slate-500">知识点 · 真题 · 生词</p>
        </div>
        <Icon name="chevronRight" size={14} className="shrink-0 text-gray-400 dark:text-slate-600" />
      </Link>

      <Link
        to="/weekly-summary"
        className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2 transition-colors hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
          <Icon name="star" size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-800 dark:text-slate-100">每周总结</p>
          <p className="truncate text-[10px] text-gray-500 dark:text-slate-500">本周 vs 上周 · 反思</p>
        </div>
        <Icon name="chevronRight" size={14} className="shrink-0 text-gray-400 dark:text-slate-600" />
      </Link>
    </div>
  )
}
