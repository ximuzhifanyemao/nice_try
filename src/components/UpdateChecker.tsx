import { useAppUpdate } from '../hooks/useAppUpdate'
import { Capacitor } from '@capacitor/core'
import { useState } from 'react'

export default function UpdateChecker() {
  const {
    status,
    updateInfo,
    error,
    checkForUpdate,
    downloadAndInstall,
  } = useAppUpdate()

  const [showBanner, setShowBanner] = useState(true)

  // 非原生环境不显示
  if (!Capacitor.isNativePlatform()) return null

  // 无更新或已是最新，不显示
  if (status === 'idle' || status === 'up_to_date' || status === 'checking') return null

  if (!showBanner) return null

  const handleDownload = async () => {
    if (!updateInfo) return
    downloadAndInstall(updateInfo)
  }

  return (
    <div className="mx-4 mt-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 p-3 shadow-sm">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔄</span>
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            {status === 'available' && '发现新版本'}
            {status === 'downloading' && '正在打开下载...'}
            {status === 'downloaded' && 'APK 下载已开始，请在浏览器中完成下载后安装'}
            {status === 'error' && '更新失败'}
          </span>
        </div>
        <button
          onClick={() => setShowBanner(false)}
          className="text-blue-400 dark:text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* 版本信息 */}
      {updateInfo && (
        <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
          v{updateInfo.version}
          {updateInfo.fileSize && (
            <span>（{(updateInfo.fileSize / 1024).toFixed(0)} KB）</span>
          )}
        </p>
      )}

      {/* 错误信息 */}
      {status === 'error' && error && (
        <p className="text-xs text-red-600 dark:text-red-400 mb-2">{error}</p>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-2">
        {status === 'available' && (
          <button
            onClick={handleDownload}
            className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 cursor-pointer transition-colors"
          >
            下载 APK
          </button>
        )}

        {status === 'downloaded' && (
          <p className="flex-1 text-xs text-green-600 dark:text-green-400 text-center py-2">
            下载完成后，请在通知栏点击安装
          </p>
        )}

        {status === 'error' && (
          <button
            onClick={() => checkForUpdate()}
            className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 cursor-pointer transition-colors"
          >
            重试
          </button>
        )}
      </div>
    </div>
  )
}