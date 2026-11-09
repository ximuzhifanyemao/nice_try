import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { isTauri } from '@tauri-apps/api/core'
import { useAuth } from '../contexts/AuthContext'
import {
  fetchPoliticsProgress,
  mergePoliticsProgress,
  sanitizePoliticsProgress,
  savePoliticsProgress,
  type PoliticsProgress,
} from '../lib/politicsProgress'

/** App 内（桌面程序 / 手机 APK）不走网页端登录门禁，一页纸保持免登录可用 */
const NATIVE_APP = Capacitor.isNativePlatform() || isTauri()

/** 一页纸静态页面地址：放在 public/politics 下，三端（网页 / 桌面 / APK）共用同一份资源 */
const POLITICS_URL = `${import.meta.env.BASE_URL}politics/index.html?native=${NATIVE_APP ? '1' : '0'}`

/** 进度变化后延迟落库，合并连续勾选，避免每次点击都打一次请求 */
const SAVE_DEBOUNCE_MS = 800

/**
 * 考研政治「一页纸」。
 *
 * 内容与交互（知识库检索、背诵卡、收藏标记、史纲时间轴）完全复用原版单文件应用，
 * 这里只负责把它全屏承载，并和页内通过 postMessage 通信：
 * - 返回：页内「返回」按钮通知父页面回退；
 * - 进度同步：登录后把本机进度与云端进度取并集，再回灌给页内；之后页内每次保存都防抖写入数据库。
 * 用 portal + fixed 铺满整屏，避免被应用外壳（侧边栏 / 底部 Tab / 页面缩放容器）裁切。
 */
export default function Politics() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const userId = user?.id ?? null
  const frameRef = useRef<HTMLIFrameElement>(null)
  /** 云端进度预取结果（ready 消息早于请求返回时用 Promise 兜底） */
  const remoteRef = useRef<PoliticsProgress | null>(null)
  const remotePromiseRef = useRef<Promise<PoliticsProgress | null> | null>(null)
  /** 尚未落库的最新进度 */
  const latestRef = useRef<PoliticsProgress | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handshakeDoneRef = useRef(false)
  /** 保存时取当前登录用户，避免组件卸载后 user 已变化 */
  const userIdRef = useRef<string | null>(null)
  userIdRef.current = userId

  const flushSave = useCallback(() => {
    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    const uid = userIdRef.current
    const progress = latestRef.current
    if (!uid || !progress) return
    latestRef.current = null
    void savePoliticsProgress(uid, progress)
  }, [])

  const scheduleSave = useCallback(
    (progress: PoliticsProgress) => {
      latestRef.current = progress
      if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null
        flushSave()
      }, SAVE_DEBOUNCE_MS)
    },
    [flushSave],
  )

  /** 登录用户变化：预取云端进度并重置握手状态 */
  useEffect(() => {
    remoteRef.current = null
    remotePromiseRef.current = null
    latestRef.current = null
    handshakeDoneRef.current = false
    if (!userId) return
    let cancelled = false
    const promise = fetchPoliticsProgress(userId)
    remotePromiseRef.current = promise
    void promise.then((progress) => {
      if (!cancelled) remoteRef.current = progress
    })
    return () => {
      cancelled = true
      remotePromiseRef.current = null
    }
  }, [userId])

  /** 卸载时把还在防抖窗口里的进度补写一次，避免快速退出丢最后一次勾选 */
  useEffect(() => {
    return () => {
      flushSave()
    }
  }, [flushSave])

  useEffect(() => {
    const onMessage = async (event: MessageEvent) => {
      // 用消息来源窗口校验，而不是 origin：Tauri/Capacitor 的自定义协议下
      // origin 可能是 null，按 origin 比较会让页内「返回」按钮失效
      const frame = frameRef.current
      if (!frame || event.source !== frame.contentWindow) return
      const data = event.data as { type?: string; progress?: unknown } | null
      const type = data?.type
      if (!type) return

      if (type === 'kaoyan:politics-back') {
        // 直接打开 /politics（无来源页）时回首页，否则退回上一页
        if (location.key === 'default') navigate('/')
        else navigate(-1)
        return
      }

      // 未登录（原生 App 可免登录使用）：不接云端，进度只留本机
      if (!userId) return

      if (type === 'kaoyan:politics-ready') {
        if (handshakeDoneRef.current) return
        handshakeDoneRef.current = true
        const local = sanitizePoliticsProgress(data.progress)
        // 云端可能还在请求中：优先用已返回的结果，否则等这次请求
        const remote = remoteRef.current ?? (await remotePromiseRef.current)
        const merged = mergePoliticsProgress(remote, local)
        latestRef.current = merged
        frame.contentWindow?.postMessage({ type: 'kaoyan:politics-hydrate', progress: merged }, '*')
        void savePoliticsProgress(userId, merged)
        return
      }

      if (type === 'kaoyan:politics-progress') {
        scheduleSave(sanitizePoliticsProgress(data.progress))
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [navigate, location.key, userId, scheduleSave])

  /** iframe 脚本就绪后再要一次本机进度：避免父页面监听器尚未挂载时消息丢失 */
  const handleFrameLoad = () => {
    if (!userId) return
    handshakeDoneRef.current = false
    frameRef.current?.contentWindow?.postMessage({ type: 'kaoyan:politics-request-state' }, '*')
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] bg-[#f4efe6] dark:bg-[#15120f]">
      <iframe
        ref={frameRef}
        src={POLITICS_URL}
        title="2027 考研政治一页纸"
        className="h-full w-full border-0"
        allow="clipboard-write"
        onLoad={handleFrameLoad}
      />
    </div>,
    document.body,
  )
}
