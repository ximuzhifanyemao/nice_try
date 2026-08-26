import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import jsQR from 'jsqr'
import { Capacitor } from '@capacitor/core'
import { BarcodeScanner, BarcodeFormat, LensFacing } from '@capacitor-mlkit/barcode-scanning'
import type { PluginListenerHandle } from '@capacitor/core'
import { useAuth } from '../contexts/AuthContext'
import { confirmQrLogin } from '../lib/qrLogin'
import './scan-overlay.css'

type Status = 'idle' | 'decoding' | 'confirming' | 'success' | 'error' | 'not-login' | 'no-camera'

/** 是否为 App 原生环境（Android/iOS）。原生走 @capacitor-mlkit 实时取景，浏览器走 getUserMedia + jsQR */
const isNative = Capacitor.isNativePlatform()

/** 从扫码文本中解析出 token（二维码内容形如 https://.../#/qr-login?token=xxx） */
function extractToken(text: string): string | null {
  const m = text.match(/[?&]token=([0-9a-f]+)/i)
  return m ? m[1] : null
}

/** 二维码内容指向的确认页域名，用于限制只接受本站二维码 */
const ALLOWED_HOST = 'notoday-code-app-d3ggyfrxu0f39d17f.webapps.tcloudbase.com'

/** 单帧解码图片；scale 到不超过 MAX 像素边长，兼顾速度与识别精度 */
function decodeFrame(video: HTMLVideoElement): string | null {
  const MAX = 720
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (!vw || !vh) return null
  const scale = Math.min(1, MAX / Math.max(vw, vh))
  const w = Math.round(vw * scale)
  const h = Math.round(vh * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(video, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h)
  let code = jsQR(data.data, data.width, data.height, { inversionAttempts: 'dontInvert' })
  if (!code) {
    code = jsQR(data.data, data.width, data.height, { inversionAttempts: 'attemptBoth' })
  }
  return code && code.data ? code.data : null
}

/** 关闭媒体流的所有视频轨道 */
function stopStream(stream: MediaStream | null) {
  if (!stream) return
  stream.getTracks().forEach((t) => t.stop())
}

export default function ScanQr() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [startingStream, setStartingStream] = useState(true)
  const [nativeScanning, setNativeScanning] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastDecodeRef = useRef(0)
  const decodingRef = useRef(false)
  const nativeListenerRef = useRef<PluginListenerHandle | null>(null)
  const handlingNativeRef = useRef(false)

  // 组件挂载后立即启动扫码：
  // - 原生 App：走 @capacitor-mlkit 的 startScan（实时取景，像微信扫一扫）
  // - 浏览器：getUserMedia + jsQR 逐帧解码
  // 卸载时分别做对应清理，避免相机常开/泄漏。
  useEffect(() => {
    if (isNative) {
      startNativeScan()
    } else {
      startCamera()
    }
    return () => {
      stopStream(streamRef.current)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      if (isNative) {
        void cleanupNativeScan()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** 原生扫码：请求相机权限 → 隐藏 WebView 内容（露出原生相机）→ 监听识别结果 */
  const startNativeScan = async () => {
    setStartingStream(true)
    setError('')
    try {
      // 1. 相机权限（AndroidManifest 已声明 CAMERA）
      let perms = await BarcodeScanner.checkPermissions()
      if (perms.camera !== 'granted') {
        perms = await BarcodeScanner.requestPermissions()
        if (perms.camera !== 'granted') {
          setStatus('no-camera')
          setError('未获相机权限，请到系统设置中开启相机权限后重试')
          return
        }
      }

      // 2. 隐藏 WebView 内容并让背景透明，露出原生相机预览
      document.body.classList.add('barcode-scanner-active')

      // 3. 监听识别结果（插件事先做了多帧投票，避免误报）
      const listener = await BarcodeScanner.addListener('barcodesScanned', async (event) => {
        if (handlingNativeRef.current) return
        const barcode = event.barcodes?.[0]
        const raw = barcode?.rawValue ?? barcode?.displayValue
        if (!raw) return
        handlingNativeRef.current = true
        await cleanupNativeScan()
        try {
          await handleDecoded(raw)
        } finally {
          handlingNativeRef.current = false
        }
      })
      nativeListenerRef.current = listener

      // 4. 打开相机实时扫描（仅识别 QR_CODE）
      setNativeScanning(true)
      setStatus('idle')
      await BarcodeScanner.startScan({
        formats: [BarcodeFormat.QrCode],
        lensFacing: LensFacing.Back,
      })
    } catch (e) {
      document.body.classList.remove('barcode-scanner-active')
      setNativeScanning(false)
      setStatus('no-camera')
      setError(e instanceof Error ? e.message : '无法打开相机')
    } finally {
      setStartingStream(false)
    }
  }

  /** 停止原生扫码：移除遮罩类、移除监听、关闭相机 */
  const cleanupNativeScan = async () => {
    document.body.classList.remove('barcode-scanner-active')
    setNativeScanning(false)
    if (nativeListenerRef.current) {
      try {
        await nativeListenerRef.current.remove()
      } catch {
        /* ignore */
      }
      nativeListenerRef.current = null
    }
    try {
      await BarcodeScanner.removeAllListeners()
    } catch {
      /* ignore */
    }
    try {
      await BarcodeScanner.stopScan()
    } catch {
      /* ignore */
    }
  }

  /** 原生扫码界面里的“取消/关闭” */
  const cancelNativeScan = async () => {
    await cleanupNativeScan()
    navigate(-1)
  }

  /** 启动后置摄像头实时取景 */
  const startCamera = async () => {
    setStartingStream(true)
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      stopStream(streamRef.current)
      streamRef.current = stream

      const video = videoRef.current
      if (!video) {
        stopStream(stream)
        return
      }

      // 强制 playsinline / muted / autoplay，避免部分 Android WebView 下视频黑屏
      video.muted = true
      video.setAttribute('playsinline', '')
      video.setAttribute('autoplay', '')
      video.setAttribute('muted', '')
      video.srcObject = stream
      try {
        await video.play()
      } catch {
        // 自动播放被拒绝时静默处理，等待后续帧解码
      }
      setStatus('idle')
      startDecodeLoop()
    } catch (e) {
      stopStream(streamRef.current)
      streamRef.current = null
      setStatus('no-camera')
      setError(
        e instanceof Error && (e.name === 'NotAllowedError' || e.name === 'SecurityError')
          ? '未获相机权限，请到系统设置中开启相机权限后重试'
          : '无法打开相机，可改用拍照识别',
      )
      // eslint-disable-next-line no-console
      console.warn('getUserMedia 失败:', e instanceof Error ? e : e)
    } finally {
      setStartingStream(false)
    }
  }

  /** requestAnimationFrame 循环 + 时间戳节流：约每 200ms 解码一帧 */
  const startDecodeLoop = () => {
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
    const detect = (now: number) => {
      const video = videoRef.current
      if (!video) return
      if (!video.videoWidth || !video.videoHeight) {
        // 视频元数据尚未就绪，等待下一帧
        rafRef.current = requestAnimationFrame(detect)
        return
      }
      if (now - lastDecodeRef.current >= 200 && !decodingRef.current) {
        lastDecodeRef.current = now
        decodingRef.current = true
        let found: string | null = null
        try {
          found = decodeFrame(video)
        } finally {
          decodingRef.current = false
        }
        if (found) {
          stop()
          handleDecoded(found)
          return
        }
      }
      rafRef.current = requestAnimationFrame(detect)
    }
    stop()
    rafRef.current = requestAnimationFrame(detect)
  }

  /** 解码到二维码文本后的校验 + 确认登录（命中后停止取景并关闭相机） */
  const handleDecoded = async (text: string) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) // 命中后停止取景
    stopStream(streamRef.current) // 立即关闭相机轨道，避免继续占用
    streamRef.current = null
    try {
      if (!user) {
        setStatus('not-login')
        return
      }
      let url: URL
      try {
        url = new URL(text)
      } catch {
        throw new Error('不是有效的登录二维码')
      }
      if (url.host !== ALLOWED_HOST) throw new Error('不是本应用的登录二维码')
      const token = extractToken(text)
      if (!token) throw new Error('二维码缺少登录凭据')

      setStatus('confirming')
      const { error: err } = await confirmQrLogin(token)
      if (err) {
        setError(err)
        setStatus('error')
      } else {
        setStatus('success')
      }
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : '扫码失败')
    }
  }

  /** 拍照识别兜底：把所选图片放入视频容器后复用同一解码逻辑 */
  const handleFile = async (file: File) => {
    if (decodingRef.current) return
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    stopStream(streamRef.current)
    streamRef.current = null
    decodingRef.current = true
    setStatus('decoding')
    setError('')
    try {
      const url = URL.createObjectURL(file)
      const tmp = document.createElement('video')
      tmp.muted = true
      tmp.preload = 'auto'
      tmp.src = url
      await new Promise<void>((resolve, reject) => {
        tmp.onloadeddata = () => resolve()
        tmp.onerror = () => reject(new Error('读取图片失败'))
      })
      const text = decodeFrame(tmp)
      URL.revokeObjectURL(url)
      decodingRef.current = false
      if (!text) throw new Error('未识别到二维码，请对准后重拍')
      await handleDecoded(text)
    } catch (e) {
      decodingRef.current = false
      setStatus('error')
      setError(e instanceof Error ? e.message : '扫码失败')
    }
  }

  const back = () => navigate(-1)

  const renderScannable =
    status === 'idle' || status === 'no-camera' || status === 'error'
  const isCameraActive = streamRef.current !== null && status === 'idle'

  const renderScanFrame = (
    <div className="relative mx-auto max-w-sm aspect-square w-full overflow-hidden rounded-xl bg-slate-950">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        autoPlay
        muted
      />
      {/* 扫描框四角 */}
      <span className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-blue-400 rounded-tl-md pointer-events-none" />
      <span className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-blue-400 rounded-tr-md pointer-events-none" />
      <span className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-blue-400 rounded-bl-md pointer-events-none" />
      <span className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-blue-400 rounded-br-md pointer-events-none" />
      {/* 中央提示 */}
      <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
        <span className="text-sm font-medium bg-black/40 px-3 py-1 rounded-full text-white/90">
          {startingStream ? '正在开启相机…' : '正在扫码，请将二维码对准取景框…'}
        </span>
      </div>
    </div>
  )

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
          ) : renderScannable ? (
            <div>
              {renderScanFrame}

              {isCameraActive ? (
                <p className="mt-3 text-center text-xs text-gray-400 dark:text-slate-500">
                  对准电脑屏幕上的二维码，将自动识别
                  <br />
                  也可点击下方按钮改用手动拍照
                </p>
              ) : (
                status !== 'idle' && (
                  <p className="mt-3 text-center text-xs text-red-500 dark:text-red-400">{error}</p>
                )
              )}

              {/* 兜底入口：实时取景失效时可拍照识别；识别失败时可重开相机（原生走原生扫码重试） */}
              <div className="mt-3 flex justify-center gap-2">
                {!isCameraActive && (
                  <button
                    onClick={() => {
                      if (isNative) void startNativeScan()
                      else startCamera()
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors cursor-pointer"
                  >
                    {isNative ? '重新开始扫码' : '重新开启相机'}
                  </button>
                )}
                {!isNative && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-sm font-medium text-gray-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    拍照识别
                  </button>
                )}
              </div>

              {/* 隐藏的文件输入：capture=environment 调起后置相机；浏览器下可选文件 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
            </div>
          ) : status === 'decoding' || status === 'confirming' ? (
            <div className="text-center py-16">
              <div className="inline-block w-8 h-8 animate-spin rounded-full border-2 border-gray-200 dark:border-slate-700 border-t-blue-500" />
              <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">
                {status === 'decoding' ? '正在识别二维码…' : '正在确认登录…'}
              </p>
            </div>
          ) : status === 'success' ? (
            <div className="text-center py-14 space-y-2">
              <p className="text-4xl">✅</p>
              <p className="text-base font-medium text-emerald-600 dark:text-emerald-400">
                登录确认成功
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400">电脑端已自动登录</p>
            </div>
          ) : (
            <div className="text-center py-10 space-y-3">
              <p className="text-4xl">{error.includes('二维码') ? '🔄' : '⚠️'}</p>
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setStatus('idle')}
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
          )}
        </div>
      </div>

      {/* 原生扫码遮罩：挂在 document.body 上，和相机预览同层；#root 此时已隐藏 */}
      {isNative &&
        nativeScanning &&
        createPortal(
          <div
            className="scan-overlay flex flex-col items-center justify-between px-6 py-10"
            style={{ color: '#fff' }}
          >
            <div className="pt-4">
              <p className="text-center text-white/90 font-medium text-base drop-shadow-md">
                将二维码对准屏幕中央
              </p>
            </div>

            {/* 扫描框四角 */}
            <div className="relative w-64 h-64">
              <span className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white/90 rounded-tl-xl pointer-events-none" />
              <span className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white/90 rounded-tr-xl pointer-events-none" />
              <span className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white/90 rounded-bl-xl pointer-events-none" />
              <span className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white/90 rounded-br-xl pointer-events-none" />
              <div className="absolute inset-x-0 -bottom-12 flex justify-center">
                <span className="text-xs text-white/90 bg-black/50 px-3 py-1 rounded-full">
                  {startingStream ? '正在开启相机…' : '扫描中…'}
                </span>
              </div>
            </div>

            <button
              onClick={cancelNativeScan}
              className="mt-8 mb-6 px-12 py-3 rounded-full bg-white/95 text-slate-800 text-base font-medium cursor-pointer active:scale-95 transition-transform"
            >
              取消
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}