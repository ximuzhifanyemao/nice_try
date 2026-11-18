import { Link } from 'react-router-dom'
import { Icon, type IconName } from './Icon'

const LINKS: { to: string; label: string; desc: string; icon: IconName; tint: string }[] = [
  {
    to: '/study-notes',
    label: '记一记',
    desc: '知识点 · 真题 · 生词',
    icon: 'bulb',
    tint: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  },
  {
    to: '/questions',
    label: '题目',
    desc: '真题 · 变形题',
    icon: 'questions',
    tint: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
  },
  {
    to: '/weekly-summary',
    label: '每周总结',
    desc: '本周 vs 上周 · 反思',
    icon: 'star',
    tint: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  },
]

/** 首页「记一记 / 题目 / 每周总结」快捷入口（移动分支使用量较重，桌面仅登录态可见） */
export default function QuickLinksRow() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {LINKS.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-2.5 py-2 transition-colors hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${link.tint}`}>
            <Icon name={link.icon} size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-gray-800 dark:text-slate-100">{link.label}</p>
            <p className="hidden truncate text-[10px] text-gray-500 sm:block dark:text-slate-500">{link.desc}</p>
          </div>
          <Icon name="chevronRight" size={14} className="hidden shrink-0 text-gray-400 sm:block dark:text-slate-600" />
        </Link>
      ))}
    </div>
  )
}
