import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { isTauri } from '@tauri-apps/api/core'

/** App 内（桌面程序 / 手机 APK）不走网页端登录门禁，一页纸保持免登录可用 */
const NATIVE_APP = Capacitor.isNativePlatform() || isTauri()

/** 一页纸静态页面地址：放在 public/politics 下，三端（网页 / 桌面 / APK）共用同一份资源 */
const POLITICS_URL = `${import.meta.env.BASE_URL}politics/index.html?native=${NATIVE_APP ? '1' : '0'}`

/**
 * 考研政治「一页纸」。
 *
 * 内容与交互（知识库检索、背诵卡、收藏标记、史纲时间轴）完全复用原版单文件应用，
 * 这里只负责把它全屏承载，并接收页内「返回」按钮发来的消息回到应用。
 * 用 portal + fixed 铺满整屏，避免被应用外壳（侧边栏 / 底部 Tab / 页面缩放容器）裁切。
 */
export default function Politics() {
  const navigate = useNavigate()
  const location = useLocation()
  const frameRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // 用消息来源窗口校验，而不是 origin：Tauri/Capacitor 的自定义协议下
      // origin 可能是 null，按 origin 比较会让页内「返回」按钮失效
      if (event.source !== frameRef.current?.contentWindow) return
      if ((event.data as { type?: string } | null)?.type !== 'kaoyan:politics-back') return
      // 直接打开 /politics（无来源页）时回首页，否则退回上一页
      if (location.key === 'default') navigate('/')
      else navigate(-1)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [navigate, location.key])

  return createPortal(
    <div className="fixed inset-0 z-[70] bg-[#f4efe6] dark:bg-[#15120f]">
      <iframe
        ref={frameRef}
        src={POLITICS_URL}
        title="2027 考研政治一页纸"
        className="h-full w-full border-0"
        allow="clipboard-write"
      />
    </div>,
    document.body,
  )
}
