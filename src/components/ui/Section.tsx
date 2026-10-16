import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../Icon'

/**
 * 桌面端的「设置分区」容器：分区标题在卡片内部、左对齐，
 * 用一条细分隔线与内容区隔开 —— 这是桌面软件（系统设置、IDE 偏好页）
 * 的典型组织方式，替代移动端那种「一整页卡片列表 + 悬浮分组标题」的堆叠。
 *
 * 视觉要点：
 * - 标题行更矮更紧凑（py-2.5），下划线贯穿整卡，形成清晰的区块边界；
 * - 内容区由 SettingRow 自带的 border-b 分隔，整卡看起来像一张清单/表格，
 *   而不是一堆彼此独立的圆角块。
 */
export default function SettingsSection({
  title,
  desc,
  action,
  children,
}: {
  title: string
  /** 标题右侧的一句话说明 */
  desc?: string
  /** 分区右上角的操作（按钮/链接） */
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="card overflow-hidden">
      <header className="flex items-center gap-3 border-b border-gray-100 px-4 py-2.5 dark:border-slate-800">
        <h2 className="shrink-0 text-sm font-semibold text-gray-800 dark:text-slate-100">{title}</h2>
        {desc && <p className="min-w-0 truncate text-xs text-gray-400 dark:text-slate-500">{desc}</p>}
        {action && <div className="ml-auto shrink-0">{action}</div>}
      </header>
      <div>{children}</div>
    </section>
  )
}

type RowProps = {
  icon: ReactNode
  /** 图标底色（浅色 tint 类名） */
  tint?: string
  label: string
  desc?: string
  /** 行右侧的补充信息（如账号、状态） */
  meta?: ReactNode
  /** 行右侧的主控件（按钮/开关），存在时不再显示默认右箭头 */
  control?: ReactNode
  to?: string
  onClick?: () => void
  /** 最后一行不加分隔线 */
  last?: boolean
}

/**
 * 统一的图标底色 tint：行/磁贴左侧的小圆角图标块共用同一套底色，
 * 避免每行各写一长串类名，也保证各页面配色一致。
 */
export const TINT = {
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300',
} as const

const TINT_DEFAULT = TINT.indigo

/**
 * 分区内的一行：图标 + 标题/描述 + 右侧补充信息或控件。
 * 可点击行悬停时整行轻微染色、右侧箭头右移，给桌面端明确的命中反馈。
 */
export function SettingRow({
  icon,
  tint = TINT_DEFAULT,
  label,
  desc,
  meta,
  control,
  to,
  onClick,
  last = false,
}: RowProps) {
  const interactive = Boolean(to || onClick)
  const body = (
    <>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tint}`}>{icon}</span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[13px] font-medium text-gray-800 dark:text-slate-100">{label}</span>
        {desc && <span className="mt-0.5 block truncate text-xs text-gray-400 dark:text-slate-500">{desc}</span>}
      </span>
      {meta && <span className="shrink-0 text-xs text-gray-400 dark:text-slate-500">{meta}</span>}
      {control}
      {interactive && !control && (
        <span className="shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-400 dark:text-slate-600">
          <Icon name="chevronRight" size={16} />
        </span>
      )}
    </>
  )

  const cls = `group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
    interactive ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50' : ''
  } ${last ? '' : 'border-b border-gray-100 dark:border-slate-800'}`

  if (to) {
    return (
      <Link to={to} className={cls}>
        {body}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {body}
      </button>
    )
  }
  return <div className={cls}>{body}</div>
}

/** 带右侧说明文字的小按钮（分区标题栏上的操作，如「更换」） */
export function SectionAction({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
    >
      {children}
    </button>
  )
}
