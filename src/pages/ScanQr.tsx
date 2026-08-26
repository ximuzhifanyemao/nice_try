import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import jsQR from 'jsqr'
import { useAuth } from '../contexts/AuthContext'
import { confirmQrLogin } from '../lib/qrLogin'

type Status = 'idle' | 'decoding' | 'confirming' | 'success' | 'error' | 'not-login'

/** 从扫码文本中解析出 token（二维码内容形如 https://.../#/qr-login?token=xxx） */
function extractToken(text: string): string | null {
  const m = text.match(/[?&]token=([0-9a-f]+)/i)
  return m ? m[1] : null
}

/** 二维码内容指向的确认页域名，用于限制只接受本站二维码 */
const ALLOWED_HOST = 'notoday-code-app-d3ggyfrxu0f39d17f.webapps.tcloudbase.com'

export default function ScanQr() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const lockedRef = useRef(false)

  // 用系统相机拍照：通过隐藏的 <input type="file" capture> 拉起原生相机，
  // 完全不依赖 WebView 的 getUserMedia（该接口在部分 Android WebView 上会一直转圈）。
  const readImage = (file: File): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('读取图片失败'))
        img.src = reader.result as string
      }
      reader.onerror = () => reject(new Error('读取图片失败'))
      reader.readAsDataURL(file)
    })

  const handleFile = async (file: File) => {
    if (lockedRef.current) return
    lockedRef.current = true
    setStatus('decoding')
    setError('')
    try {
      // 缩放到不超过 800px 再解码，兼顾速度与识别精度
      const img = await readImage(file)
      const MAX = 800
      const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('无法创建画布')
      ctx.drawImage(img, 0, 0, w, h)
      const data = ctx.getImageData(0, 0, w, h)

      // 优先普通方向，识别不到再尝试反色（兼容深底浅色二维码）
      let code = jsQR(data.data, data.width, data.height, { inversionAttempts: 'dontInvert' })
      if (!code) {
        code = jsQR(data.data, data.width, data.height, { inversionAttempts: 'attemptBoth' })
      }
      if (!code || !code.data) throw new Error('未识别到二维码，请对准后重拍')

      const text = code.data
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
    } finally {
      lockedRef.current = false
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const openCamera = () => fileInputRef.current?.click()
  const back = () => navigate(-1)

  const renderScannable = (
    status === 'idle' || (status === 'error' && error === '未识别到二维码，请对准后重拍')
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
              {/* 模拟取景框，点击调用系统相机，体验类似微信扫码 */}
              <button
                onClick={openCamera}
                className="relative mx-auto max-w-sm aspect-square w-full overflow-hidden rounded-xl bg-slate-950 flex flex-col items-center justify-center cursor-pointer focus:outline-none"
              >
                {/* 隐藏的文件输入：capture=environment 调起后置相机 */}
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
                {/* 扫描框四角 */}
                <span className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-blue-400 rounded-tl-md pointer-events-none" />
                <span className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-blue-400 rounded-tr-md pointer-events-none" />
                <span className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-blue-400 rounded-bl-md pointer-events-none" />
                <span className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-blue-400 rounded-br-md pointer-events-none" />
                {/* 中央提示 */}
                <div className="flex flex-col items-center gap-2 text-white/90">
                  <span className="text-4xl leading-none">📷</span>
                  <span className="text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
                    点击打开相机扫码
                  </span>
                  <span className="text-[11px] text-white/60">
                    像微信一样调用系统相机，稳定不会卡
                  </span>
                </div>
              </button>
              <p className="mt-3 text-center text-xs text-gray-400 dark:text-slate-500">
                打开相机后，对准电脑屏幕上的二维码拍照即可自动识别
              </p>
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
              <p className="text-base font-medium text-emerald-600 dark:text-emerald-400">登录确认成功</p>
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
    </div>
  )
}