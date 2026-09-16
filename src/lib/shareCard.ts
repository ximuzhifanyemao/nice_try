import html2canvas from 'html2canvas'

/**
 * 分享图（周报生成分享卡）相关类型与导出逻辑。
 * 说明：仅用 html2canvas 对 DOM 节点截图，导出为 PNG；Web/Tauri 走 <a download>，
 * Capacitor 原生优先用 navigator.share 分享文件（不支持再回退下载）。
 */

/** 分享卡一条科目的数据 */
export interface ShareCardSubject {
  name: string
  /** 本周该科目小时数 */
  hours: number
  /** 进度条/标签用的十六进制颜色 */
  color: string
}

/** 分享卡全部渲染数据 */
export interface ShareCardData {
  /** 标题，默认「本周学习总结」 */
  title: string
  /** 日期区间展现，如「9月14日 ~ 9月20日」 */
  dateLabel: string
  totalHours: number
  checkedDays: number
  /** 按本周时长降序 */
  subjects: ShareCardSubject[]
  /** 一句鼓励格言 */
  motto: string
}

/** 各科目类别 → 十六进制强调色（纯 hex，避免 html2canvas 不支持的 oklch/color-mix） */
const CATEGORY_HEX: Record<string, string> = {
  math: '#3b82f6',
  english: '#22c55e',
  '408': '#a855f7',
  politics: '#ef4444',
  custom: '#94a3b8',
}

const HEX_FALLBACK = '#94a3b8'

/** 科目类别编码 → 十六进制颜色；未知类别回退灰色 */
export function subjectCategoryColor(category: string | undefined | null): string {
  if (!category) return HEX_FALLBACK
  return CATEGORY_HEX[category] ?? HEX_FALLBACK
}

/** 鼓励格言文案池（按周起点哈希取一条，保证同一周不变） */
const MOTTO_POOL = [
  '积跬步，至千里；每一次打卡都算数。',
  '今日的坚持，是明日的底气。',
  '自律给答案，时间看得见。',
  '把平凡的日子，过成向前的节奏。',
  '每天进步一点点，复习没有白费功。',
  '稳住节奏，稳步向前，你正在靠近目标。',
]

/** 由周起点字符串（如 '2026-09-14'）取一条稳定的格言 */
export function pickMotto(weekStart: string): string {
  let h = 0
  for (let i = 0; i < weekStart.length; i++) h = (h * 31 + weekStart.charCodeAt(i)) >>> 0
  return MOTTO_POOL[h % MOTTO_POOL.length]
}

/** 把分享卡 DOM 节点截成 PNG 的 dataURL；失败返回 null */
export async function generateSharePng(node: HTMLElement): Promise<string | null> {
  try {
    const canvas = await html2canvas(node, {
      scale: 1,
      backgroundColor: null,
      useCORS: true,
      logging: false,
    })
    return canvas.toDataURL('image/png')
  } catch (e) {
    console.error('[ShareCard] html2canvas 截图失败', e)
    return null
  }
}

/** Web/Tauri：通过 <a download> 触发浏览器下载 PNG */
export function downloadPng(dataUrl: string, filename = 'weekly-summary.png') {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/** 带文件分享能力判定用的 navigator 类型 */
type ShareNavigator = Navigator & {
  canShare?: (data: ShareData) => boolean
  share?: (data: ShareData) => Promise<void>
}

/**
 * Capacitor 原生：若支持文件分享则用 navigator.share 分享 PNG。
 * 返回 true 表示分享成功；不支持或失败返回 false，由调用方回退下载。
 */
export async function sharePngFile(dataUrl: string, filename = 'weekly-summary.png'): Promise<boolean> {
  const nav = navigator as ShareNavigator
  if (!nav.canShare || !nav.share) return false
  try {
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], filename, { type: 'image/png' })
    if (!nav.canShare({ files: [file] })) return false
    await nav.share({ files: [file] })
    return true
  } catch {
    // 用户取消或分享失败：交由调用方回退下载
    return false
  }
}