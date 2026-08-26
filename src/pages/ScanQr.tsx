import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import jsQR from 'jsqr'
import { useAuth } from '../contexts/AuthContext'
import { confirmQrLogin } from '../lib/qrLogin'

type Status = 'starting' | 'scanning' | 'confirming' | 'success' | 'error' | 'not-login' | 'denied'

/** 从扫码文本中解析出 token（二维码内容形如 https://.../#/qr-login?token=xxx） */
function extractToken(text: string): string | null {
  const m = text.match(/[?&]token=([0-9a-f]+)/i)
  return m ? m[1] : null
}

export default function ScanQr() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [status, setStatus] = useState<Status>('starting')
  const [error, setError] = useState('')

  // 二维码内容指向的确认页域名，用于限制只接受本站二维码
  const ALLOWED_HOST = 'notoday-code-app-d3ggyfrxu0f39d17f.webapps.tcloudbase.com'

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const lockedRef = useRef(false)

  useEffect(() => {
    let disposed = false

    const cleanup = () => {
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    // 带超时的 getUserMedia：部分 Android WebView 对 facingMode 约束会一直 pending，
    // 若 5 秒内未就绪则回退到默认摄像头，避免永远停在「正在启动摄像头…」
    const getStream = (constraints: MediaStreamConstraints): Promise<MediaStream | null> =>
      new Promise((resolve) => {
        navigator.mediaDevices.getUserMedia(constraints).then(resolve).catch(() => resolve(null))
      })

    const start = async () => {
      setStatus('starting')
      // 优先后置摄像头（手机扫电脑屏幕）
      let stream: MediaStream | null = await Promise.race([
        getStream({ video: { facingMode: { ideal: 'environment' } }, audio: false }),
        new Promise<null>((r) => setTimeout(() => r(null), 5000)),
      ])
      // 后置不可用/超时 → 回退默认摄像头
      if (!stream) {
        stream = await getStream({ video: true, audio: false })
      }
      if (!stream) {
        if (disposed) return
        setStatus('denied')
        return
      }
      if (disposed) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      streamRef.current = stream
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      // Android WebView 下必须 playsinline，否则视频无法在页面内渲染（导致黑屏）
      video.setAttribute('playsinline', 'true')
      video.muted = true
      video.playsInline = true
      setStatus('scanning')
      try {
        await video.play()
      } catch {
        /* 自动播放策略导致的播放失败，配合 muted 通常可自愈，忽略 */
      }

      // 逐帧从 video 抽到 canvas，再用 jsQR 解码
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      const decodeLoop = () => {
        if (disposed) return
        if (!canvas || !ctx) return
        const vw = video.videoWidth
        const vh = video.videoHeight
        if (vw > 0 && vh > 0) {
          // 保持比例缩放到 canvas
          const scale = Math.min(canvas.width / vw, canvas.height / vh)
          const dw = vw * scale
          const dh = vh * scale
          ctx.drawImage(video, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh)
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(data.data, data.width, data.height, { inversionAttempts: 'dontInvert' })
          if (code && code.data && !lockedRef.current) {
            const text = code.data
            // eslint-disable-next-line react-hooks/exhaustive-deps
            if (!user) {
              cleanup()
              setStatus('not-login')
              return
            }
            let url: URL
            try {
              url = new URL(text)
            } catch {
              rafRef.current = requestAnimationFrame(decodeLoop)
              return
            }
            if (url.host !== ALLOWED_HOST) {
              rafRef.current = requestAnimationFrame(decodeLoop)
              return
            }
            const token = extractToken(text)
            if (!token) {
              rafRef.current = requestAnimationFrame(decodeLoop)
              return
            }
            confirmAndStop(token)
            return
          }
        }
        rafRef.current = requestAnimationFrame(decodeLoop)
      }
      decodeLoop()
    }

    const confirmAndStop = async (token: string) => {
      lockedRef.current = true
      setStatus('confirming')
      const { error: err } = await confirmQrLogin(token)
      if (disposed) return
      if (err) {
        cleanup()
        setStatus('error')
        setError(err)
      } else {
        cleanup()
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
      cleanup()
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
          ) : status === 'denied' ? (
            <div className="text-center py-10 space-y-3">
              <p className="text-4xl">📷</p>
              <p className="text-sm text-red-500 dark:text-red-400">
                无法访问相机，请在系统设置中允许「相机」权限后重试
              </p>
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
                <video
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full object-cover"
                  muted
                  playsInline
                  autoPlay
                />
                {/* 解码用的离屏 canvas */}
                <canvas ref={canvasRef} width={500} height={500} className="hidden" />
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