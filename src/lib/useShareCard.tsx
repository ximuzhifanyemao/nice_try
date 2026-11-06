import { useCallback, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Capacitor } from '@capacitor/core'
import ShareCard, { CARD_WIDTH, CARD_HEIGHT } from '../components/ShareCard'
import { useToast } from './Toast'
import {
  generateSharePng,
  generateShareQrDataUrl,
  downloadPng,
  savePng,
  sharePngFile,
  type ShareCardData,
} from './shareCard'

/** 轮询等待分享卡 DOM 挂载完成（React 提交渲染后 ref 才可用），超时返回 null */
function waitForShareNode(ref: RefObject<HTMLDivElement | null>): Promise<HTMLDivElement | null> {
  return new Promise((resolve) => {
    let tries = 0
    const check = () => {
      const el = ref.current
      if (el) resolve(el)
      else if (tries++ > 30) resolve(null)
      else setTimeout(check, 40)
    }
    setTimeout(check, 0)
  })
}

/**
 * 分享图导出流程（周报 / 日报共用）：
 * 生成下载二维码 → 渲染 ShareCard（视口外）→ html2canvas 截图 → 按平台分享或保存。
 * 调用方把返回的 shareNode 放进 JSX，截图完成后会自动卸载。
 */
export function useShareCard() {
  const toast = useToast()
  const [sharing, setSharing] = useState(false)
  const [shareData, setShareData] = useState<ShareCardData | null>(null)
  const nodeRef = useRef<HTMLDivElement | null>(null)
  const busyRef = useRef(false)

  const share = useCallback(
    async (data: Omit<ShareCardData, 'qrDataUrl'>) => {
      if (busyRef.current) return
      busyRef.current = true
      setSharing(true)
      try {
        // 二维码生成失败不阻断分享，卡片会少一块二维码区域
        const qrDataUrl = await generateShareQrDataUrl()
        setShareData({ ...data, qrDataUrl: qrDataUrl ?? undefined })
        const node = await waitForShareNode(nodeRef)
        if (!node) return
        const dataUrl = await generateSharePng(node)
        if (!dataUrl) {
          toast.show('生成分享图失败，请重试', { icon: '×' })
          return
        }
        if (Capacitor.isNativePlatform()) {
          // Capacitor 原生：优先系统分享；该环境不支持文件分享时回退下载
          const shared = await sharePngFile(dataUrl)
          if (shared) {
            toast.show('分享图已生成', { icon: '✓' })
          } else {
            downloadPng(dataUrl)
            toast.show('当前环境不支持直接分享，已保存分享图', { icon: '✓' })
          }
        } else {
          // 网页 / 电脑程序：电脑程序弹系统「另存为」对话框（用户取消则不提示成功），网页走浏览器下载
          const saved = await savePng(dataUrl)
          if (saved) toast.show('分享图已生成', { icon: '✓' })
        }
      } finally {
        setShareData(null)
        setSharing(false)
        busyRef.current = false
      }
    },
    [toast],
  )

  // 挂到 body 上：避免卡片父级（如 hover 位移、桌面 ScaleToFit）的 transform 改变 fixed 的定位基准
  const shareNode = shareData
    ? createPortal(
        <div
          aria-hidden
          ref={nodeRef}
          style={{ position: 'fixed', left: -9999, top: -9999, width: CARD_WIDTH, height: CARD_HEIGHT, pointerEvents: 'none' }}
        >
          <ShareCard data={shareData} />
        </div>,
        document.body,
      )
    : null

  return { sharing, share, shareNode }
}
