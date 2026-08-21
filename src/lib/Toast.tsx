// 轻量 Toast 提示
import { createContext, useContext, useCallback, useRef, useState, type ReactNode } from 'react'

interface Toast {
  id: number
  message: string
  icon?: string
  duration: number
}

interface ToastContextValue {
  show: (message: string, opts?: { icon?: string; duration?: number }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

let toastIdCounter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  // 只在 toasts 变化时清理空 timer 不做额外逻辑
  void toasts

  const show = useCallback(
    (message: string, opts?: { icon?: string; duration?: number }) => {
      const id = ++toastIdCounter
      const duration = opts?.duration ?? 3000
      setToasts((prev) => [...prev, { id, message, icon: opts?.icon, duration }])
      const timer = setTimeout(() => dismiss(id), duration)
      timersRef.current.set(id, timer)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* Toast 容器 */}
      <div className="fixed top-16 inset-x-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => dismiss(t.id)}
            className="pointer-events-auto max-w-sm w-auto flex items-center gap-2 rounded-xl bg-gray-900/95 dark:bg-slate-800/95 text-white px-4 py-2.5 text-sm shadow-lg border border-white/10 animate-[toastIn_.25s_ease-out]"
          >
            {t.icon && <span className="shrink-0 text-base leading-none">{t.icon}</span>}
            <span className="leading-snug">{t.message}</span>
          </button>
        ))}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}