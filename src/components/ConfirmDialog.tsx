interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  /** 危险操作（如彻底删除）时为红色按钮 */
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** 通用确认弹窗：覆盖层 + 居中卡片，点击遮罩或取消关闭 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '确认',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-gray-100 dark:border-slate-700 p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm text-white rounded-lg transition-colors cursor-pointer ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
