import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PwaBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl: string, r: any) {
      if (import.meta.env.DEV) console.log('[PWA] SW registered:', swUrl)
      if (r) r.update()
    },
    onRegisterError(error: any) {
      console.warn('[PWA] SW register error:', error)
    },
  })

  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [installed, setInstalled] = useState(false)
  const [dismissed, setDismissed] = useState<{ ready?: boolean; install?: boolean }>({})

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as any)
    }
    const onAppInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    try {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice
      if (choice.outcome === 'accepted') setInstalled(true)
    } catch {
      /* 用户已手动触发 */
    }
    setInstallPrompt(null)
  }

  const showOffline = offlineReady && !dismissed.ready
  const showInstall = !!installPrompt && !installed && !dismissed.install
  const showUpdate = needRefresh

  if (!showOffline && !showInstall && !showUpdate) return null

  return (
    <div className="sticky top-0 z-[60]">
      {showUpdate && (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2.5 text-sm shadow-md">
          <div className="mx-auto max-w-4xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">🔔</span>
              <span className="truncate">检测到新版本，点击刷新立即更新</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setNeedRefresh(false)}
                className="rounded px-3 py-1 bg-white/15 hover:bg-white/25 transition-colors cursor-pointer"
              >
                稍后
              </button>
              <button
                onClick={() => updateServiceWorker(true)}
                className="rounded px-3 py-1 bg-white text-indigo-700 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
              >
                立即刷新
              </button>
            </div>
          </div>
        </div>
      )}

      {showOffline && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-sm shadow-md">
          <div className="mx-auto max-w-4xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">✅</span>
              <span className="truncate">应用已准备完成，离线也可继续使用</span>
            </div>
            <button
              onClick={() => setDismissed((d) => ({ ...d, ready: true }))}
              className="rounded px-3 py-1 bg-white/15 hover:bg-white/25 transition-colors cursor-pointer flex-shrink-0"
            >
              知道了
            </button>
          </div>
        </div>
      )}

      {showInstall && (
        <div className="bg-amber-500 text-white px-4 py-2.5 text-sm shadow-md">
          <div className="mx-auto max-w-4xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">📱</span>
              <span className="truncate">安装到桌面，像原生 App 一样使用「考研倒计时」</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setDismissed((d) => ({ ...d, install: true }))}
                className="rounded px-3 py-1 bg-white/15 hover:bg-white/25 transition-colors cursor-pointer"
              >
                暂不
              </button>
              <button
                onClick={handleInstall}
                className="rounded px-3 py-1 bg-white text-amber-700 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
              >
                安装
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
