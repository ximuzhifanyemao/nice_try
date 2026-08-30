import { useAppUpdate } from '../hooks/useAppUpdate'
import { Capacitor } from '@capacitor/core'
import { isTauri } from '@tauri-apps/api/core'
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
  const isDesktop = isTauri()

  // 仅手机 App 与电脑程序（Tauri）显示横幅；普通网页不打扰
  if (!Capacitor.isNativePlatform() && !isDesktop) return null

  // 无更新或已是最新，不显示
  if (status === 'idle' || status === 'up_to_date' || status === 'checking') return null

  if (!showBanner) return null

  const handleDownload = async () => {
    if (!updateInfo) return
    downloadAndInstall(updateInfo)
  }

  const statusText = {
    available: '发现新版本',
    downloading: isDesktop ? '正在下载安装包…' : '正在打开下载...',
    installing: '正在安装…',
    downloaded: isDesktop ? '安装包已下载' : 'APK 下载已开始，请在浏览器中完成下载后安装',
    error: '更新失败',
  }[status]

  return (
    <div className="mx-4 mt-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 p-3 shadow-sm">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔄</span>
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            {statusText}
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
            {isDesktop ? '下载并安装' : Capacitor.isNativePlatform() ? '下载 APK' : '查看更新'}
          </button>
        )}

        {status === 'installing' && (
          <p className="flex-1 text-xs text-green-600 dark:text-green-400 text-center py-2">
            正在后台安装，完成后请关闭本窗口重启
          </p>
        )}

        {status === 'downloaded' && !isDesktop && (
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