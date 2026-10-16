import { useState, type ReactNode } from 'react'
import { Capacitor } from '@capacitor/core'
import { isTauri } from '@tauri-apps/api/core'
import { apkDownloadUrl } from '../lib/supabase'
import { Icon } from './Icon'

/**
 * 版本信息卡片：版本号 + 更新日志 + 下载链接。
 * footer：可选，渲染在卡片底部（桌面端把「检查更新」放进同一张卡，
 * 避免版本号在页面里出现两次）。
 *
 * 电脑程序（Tauri）不给「下载 APK」入口：那只是手机端的安装包，
 * 桌面端的更新由卡片底部的「检查更新 / 下载新版本安装包」承担。
 */
export default function AppVersion({ footer }: { footer?: ReactNode }) {
  const [expanded, setExpanded] = useState(false)
  const version = __APP_VERSION__
  const hash = __APP_GIT_HASH__
  const changelog = __APP_GIT_CHANGELOG__ ?? []
  const isDesktop = isTauri()

  const handleVersionClick = () => {
    // 手机 App 与网页端都用系统浏览器打开 APK 下载地址
    window.open(apkDownloadUrl, Capacitor.isNativePlatform() ? '_system' : '_blank')
  }

  return (
    <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <span className="text-sm font-medium text-gray-700 dark:text-slate-200">版本信息</span>
          <span className={`text-gray-400 dark:text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </button>
        {isDesktop ? (
          <span className="font-mono text-xs text-gray-400 dark:text-slate-500">
            v{version}{hash && ` (${hash})`}
          </span>
        ) : (
          <button
            onClick={handleVersionClick}
            className="flex items-center gap-1 cursor-pointer hover:opacity-75 transition-opacity"
            title="点击下载最新版本"
          >
            <span className="font-mono text-xs text-blue-500 dark:text-blue-400 underline decoration-dotted">
              v{version}{hash && ` (${hash})`}
            </span>
            <Icon name="download" size={13} className="text-blue-500 dark:text-blue-400" />
          </button>
        )}
      </div>

      {expanded && changelog.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-gray-100 dark:border-slate-700 pt-3">
          {changelog.map((item) => (
            <li key={item.hash} className="flex items-start gap-2 text-xs">
              <span className="font-mono text-gray-400 dark:text-slate-500 shrink-0">
                {item.date}
              </span>
              <span className="font-mono text-blue-500 dark:text-blue-400 shrink-0">
                {item.hash}
              </span>
              <span className="text-gray-600 dark:text-slate-300 break-all">
                {item.message}
              </span>
            </li>
          ))}
        </ul>
      )}

      {footer && (
        <div className="mt-3 border-t border-gray-100 pt-3 dark:border-slate-700">{footer}</div>
      )}
    </div>
  )
}
