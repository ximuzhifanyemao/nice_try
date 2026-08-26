import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { useAuth } from '../contexts/AuthContext'
import { confirmQrLogin } from '../lib/qrLogin'

type Status = 'starting' | 'scanning' | 'confirming' | 'success' | 'error' | 'not-login'

const CAMERA_ID = 'scan-qr-region'

/** 从扫码文本中解析出 token（二维码内容形如 https://.../#/qr-login?token=xxx） */
function extractToken(text: string): string | null {
  const m = text.match(/[?&]token=([0-9a-f]+)/i)
  return m ? m[1] : null
}

export default function ScanQr() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [status, setStatus] = useState<Status>('starting')
  const [error, setError] = useState('')

  // 二维码内容指向的确认页域名，用于限制只接受本站二维码
  const ALLOWED_HOST = 'notoday-code-app-d3ggyfrxu0f39d17f.webapps.tcloudbase.com'

  useEffect(() => {
    let disposed = false
    const scanner = new Html5Qrcode(CAMERA_ID)
    scannerRef.current = scanner

    const stop = async () => {
      try {
        await scannerRef.current?.stop()
      } catch {
        /* 未启动时 stop 会抛错，忽略 */
      }
      try {
        scannerRef.current?.clear()
      } catch {
        /* ignore */
      }
    }

    const start = async () => {
      setStatus('starting')
      try {
        // 优先用后置摄像头（手机扫电脑屏幕）
        let cameraId: string | undefined
        try {
          const devices = await Html5Qrcode.getCameras().catch(() => [])
          const env = devices.find((d) => d.label.toLowerCase().includes('back'))
          cameraId = (env ?? devices[0])?.id
        } catch {
          /* 无法枚举时交给 html5-qrcode 自动选择 */
        }
        setStatus('scanning')
        await scanner.start(
          cameraId ?? { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            if (disposed || status !== 'scanning') return
            // eslint-disable-next-line react-hooks/exhaustive-deps
            if (!user) {
              stop()
              setStatus('not-login')
              return
            }
            let url: URL
            try {
              url = new URL(decodedText)
            } catch {
              return // 非 URL 二维码忽略
            }
            if (url.host !== ALLOWED_HOST) return
            const token = extractToken(decodedText)
            if (!token) return
            confirmAndStop(token)
          },
          () => {
            /* 每帧回调，忽略 */
          },
        )
      } catch {
        if (disposed) return
        setStatus('error')
        setError('无法启动摄像头，请检查相机权限后重试')
      }
    }

    const confirmAndStop = async (token: string) => {
      setStatus('confirming')
      const { error: err } = await confirmQrLogin(token)
      if (disposed) return
      if (err) {
        stop()
        setStatus('error')
        setError(err)
      } else {
        stop()
        setStatus('success')
      }
    }

    // auth 仍在加载时等待
    if (loading) return
    if (!user) {
      setStatus('not-login')
      return
    }

    start()

    return () => {
      disposed = true
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id])

  const back = () => navigate(-1)

  return (
    <div className="mx-auto max-w-3xl px-4 py-4">
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">扫码登录电脑</h2>
          <button
            onClick={back}
            className="text-sm text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 cursor-pointer"
          >
            关闭
          </button>
        </div>

        <div className="p-4">
          {status === 'not-login' ? (
            <div className="text-center py-10 space-y-3">
              <p className="text-4xl">🔐</p>
              <p className="text-sm text-gray-600 dark:text-slate-300">
                请先登录后，再扫码确认电脑端登录
              </p>
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors cursor-pointer"
              >
                去登录
              </button>
            </div>
          ) : status === 'starting' ? (
            <div className="text-center py-16">
              <div className="inline-block w-8 h-8 animate-spin rounded-full border-2 border-gray-200 dark:border-slate-700 border-t-blue-500" />
              <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">正在启动摄像头…</p>
            </div>
          ) : status === 'confirming' ? (
            <div className="text-center py-16">
              <div className="inline-block w-8 h-8 animate-spin rounded-full border-2 border-gray-200 dark:border-slate-700 border-t-blue-500" />
              <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">正在确认登录…</p>
            </div>
          ) : status === 'success' ? (
            <div className="text-center py-14 space-y-2">
              <p className="text-4xl">✅</p>
              <p className="text-base font-medium text-emerald-600 dark:text-emerald-400">登录确认成功</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">电脑端已自动登录</p>
            </div>
          ) : status === 'error' ? (
            <div className="text-center py-10 space-y-3">
              <p className="text-4xl">⚠️</p>
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => {
                    setStatus('starting')
                    navigate(0)
                  }}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer"
                >
                  重试
                </button>
                <button
                  onClick={back}
                  className="px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-xs font-medium text-gray-700 dark:text-slate-200 cursor-pointer"
                >
                  返回
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* 摄像头取景区域 */}
              <div className="relative mx-auto max-w-sm aspect-square overflow-hidden rounded-xl bg-black">
                <div id={CAMERA_ID} className="w-full h-full" />
                {/* 扫描框提示 */}
                <div className="absolute inset-x-8 top-6 bottom-6 border border-white/70 rounded-lg pointer-events-none" />
                <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
                  <p className="text-xs text-white/80 bg-black/40 px-2 py-0.5 rounded-full">
                    对准电脑屏幕上的二维码
                  </p>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-gray-400 dark:text-slate-500">
                在电脑软件或网站登录页点「扫码登录」，用此页面扫描
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}