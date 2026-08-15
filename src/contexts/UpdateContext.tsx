import { createContext, useContext, type ReactNode } from 'react'
import { useAppUpdate, type UpdateStatus, type UpdateInfo } from '../hooks/useAppUpdate'

interface UpdateContextType {
  status: UpdateStatus
  updateInfo: UpdateInfo | null
  downloadProgress: number
  error: string | null
  checkForUpdate: () => Promise<UpdateInfo | null>
  downloadAndInstall: (info: UpdateInfo) => Promise<any>
}

const UpdateContext = createContext<UpdateContextType | null>(null)

/** 在 App 根组件包裹，实现启动时自动静默检查更新 */
export function UpdateProvider({ children }: { children: ReactNode }) {
  const update = useAppUpdate()
  return (
    <UpdateContext.Provider value={update}>
      {children}
    </UpdateContext.Provider>
  )
}

/** 在「我的」页面等子组件中使用，读取共享的更新状态 */
export function useUpdateContext() {
  const ctx = useContext(UpdateContext)
  if (!ctx) throw new Error('useUpdateContext 必须在 UpdateProvider 内使用')
  return ctx
}