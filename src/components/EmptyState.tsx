import { Link } from 'react-router-dom'
import { Icon, type IconName } from './Icon'

interface EmptyStateProps {
  /** 可选图标（使用全站 Icon 库名） */
  icon?: IconName
  /** 空态主标题 */
  title: string
  /** 一句引导性描述 */
  desc?: string
  /** 可选动作：跳转路由（to）或回调（onClick） */
  action?: { label: string; to?: string; onClick?: () => void }
}

/** 全站统一空态：卡片居中展示，区别于裸文本，视觉更完整 */
export default function EmptyState({ icon, title, desc, action }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      {icon && (
        <Icon name={icon} size={36} className="text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</p>
        {desc && <p className="text-xs text-slate-400 dark:text-slate-500">{desc}</p>}
      </div>
      {action &&
        (action.to ? (
          <Link to={action.to} className="btn-primary mt-1">
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className="btn-primary mt-1">
            {action.label}
          </button>
        ))}
    </div>
  )
}