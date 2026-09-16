import { useEffect, useRef, useState } from 'react'

interface PromptDialogProps {
  open: boolean
  title: string
  /** 说明文字（可选） */
  message?: string
  /** 输入框上方的标签 */
  label?: string
  placeholder?: string
  defaultValue?: string
  inputType?: 'text' | 'number'
  inputMode?: 'text' | 'decimal' | 'numeric'
  /** 输入框下方常驻提示，如「当前余额 ¥120」 */
  hint?: string
  confirmText?: string
  /**
   * 提交回调。
   * - 返回字符串 → 校验/请求失败，弹窗保持打开并把该字符串作为错误提示展示；
   * - 返回 void（或 resolve 为 void）→ 视为成功，由调用方负责关闭弹窗；
   * - 支持 async，提交期间按钮自动进入 pending 态，避免重复点击。
   */
  onConfirm: (value: string) => string | void | Promise<string | void>
  onCancel: () => void
}

/**
 * 通用输入弹窗，替代 window.prompt。
 *
 * 原生 prompt 样式不可控、移动端体验差，且无法展示余额等辅助信息，
 * 与全站视觉体系割裂；这里用应用内弹窗统一处理需要用户输入文本/数字的场景。
 */
export default function PromptDialog({
  open,
  title,
  message,
  label,
  placeholder,
  defaultValue = '',
  inputType = 'text',
  inputMode,
  hint,
  confirmText = '确认',
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 每次打开重置为默认值，并聚焦输入框
  useEffect(() => {
    if (!open) return
    setValue(defaultValue)
    setError(null)
    setPending(false)
    const timer = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [open, defaultValue])

  // Esc 关闭
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  const submit = async () => {
    if (pending) return
    setPending(true)
    try {
      const result = await onConfirm(value)
      if (typeof result === 'string') {
        setError(result)
        inputRef.current?.focus()
        return
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请重试')
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="card w-full max-w-sm p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
          {message && (
            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{message}</p>
          )}
        </div>

        <div>
          {label && <label className="label text-xs">{label}</label>}
          <input
            ref={inputRef}
            type={inputType}
            inputMode={inputMode}
            value={value}
            placeholder={placeholder}
            disabled={pending}
            onChange={(e) => {
              setValue(e.target.value)
              if (error) setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void submit()
              }
            }}
            className="input"
          />
          {hint && !error && (
            <p className="mt-1.5 text-[11px] text-gray-400 dark:text-slate-500">{hint}</p>
          )}
          {error && <p className="mt-1.5 text-xs text-rose-500 dark:text-rose-400">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={pending}
            className="px-4 py-2 text-sm text-white rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors cursor-pointer disabled:opacity-50"
          >
            {pending ? '处理中…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
