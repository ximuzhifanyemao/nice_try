import { useCallback, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { useToast } from './Toast'
import { downloadPng, renderShareCardPng, savePng, sharePngNative, type ShareCardData } from './shareCard'

/**
 * 分享图导出流程（周报 / 日报共用）：
 * Canvas 直接绘制 PNG → Capacitor 原生走系统分享面板，网页/电脑程序保存图片。
 */
export function useShareCard() {
  const toast = useToast()
  const [sharing, setSharing] = useState(false)
  const busyRef = useRef(false)

  const share = useCallback(
    async (data: ShareCardData) => {
      if (busyRef.current) return
      busyRef.current = true
      setSharing(true)
      try {
        const dataUrl = renderShareCardPng(data)
        if (!dataUrl) {
          toast.show('生成分享图失败，请重试', { icon: '×' })
          return
        }
        if (Capacitor.isNativePlatform()) {
          const shared = await sharePngNative(dataUrl)
          if (shared) {
            toast.show('分享图已生成', { icon: '✓' })
          } else {
            // 分享面板不可用：至少让图片能存下来（网页端下载 / 桌面另存为）
            downloadPng(dataUrl)
            toast.show('分享失败，已尝试保存分享图', { icon: '×' })
          }
        } else {
          // 网页 / 电脑程序：电脑程序弹系统「另存为」对话框（用户取消则不提示成功），网页走浏览器下载
          const saved = await savePng(dataUrl)
          if (saved) toast.show('分享图已生成', { icon: '✓' })
        }
      } finally {
        setSharing(false)
        busyRef.current = false
      }
    },
    [toast],
  )

  return { sharing, share }
}
