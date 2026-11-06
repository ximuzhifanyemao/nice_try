import QRCode from 'qrcode'
import { isTauri } from '@tauri-apps/api/core'
import { Share } from '@capacitor/share'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { APP_DOWNLOAD_PAGE_URL } from './appLinks'

/**
 * 分享图（周报 / 日报）相关类型与导出逻辑。
 * 说明：用 Canvas 2D 直接绘制 1080×1440 的 PNG，不依赖 DOM 截图，
 * 避免 Android WebView / 低版本浏览器里 html2canvas 的各种兼容问题。
 * 电脑程序（Tauri）走系统「另存为」对话框，网页走 <a download>，
 * Capacitor 原生走 @capacitor/share 系统分享面板。
 */

/** 分享图卡片固定尺寸（1080×1440 竖版 PNG） */
export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1440

/** 分享卡字体栈（与页面保持一致，缺字时回退系统无衬线字体） */
const FONT_STACK = '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", -apple-system, sans-serif'

/** 分享卡一条科目的数据 */
export interface ShareCardSubject {
  name: string
  /** 该科目小时数 */
  hours: number
  /** 进度条/标签用的十六进制颜色 */
  color: string
}

/** 分享卡全部渲染数据 */
export interface ShareCardData {
  /** 标题，如「本周学习总结」「今日学习记录」 */
  title: string
  /** 日期区间展现，如「9月14日 ~ 9月20日」或「2026.11.6 周四」 */
  dateLabel: string
  totalHours: number
  checkedDays: number
  /** 按时长降序 */
  subjects: ShareCardSubject[]
  /** 一句鼓励格言 */
  motto: string
  /** 主指标标签，默认「本周总时长（h）」；日报传「当日总时长（h）」 */
  totalLabel?: string
  /** 副指标数值，默认用 checkedDays；日报可传科目数 */
  secondaryValue?: number
  /** 副指标标签，默认「打卡天数（天）」；日报传「学习科目（个）」 */
  secondaryLabel?: string
  /** 科目分布小标题，默认「本周投入分布」 */
  distributionLabel?: string
}

/** 各科目类别 → 十六进制强调色（纯 hex，保证 Canvas 与页面颜色一致） */
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

/** 分享卡最多展示的科目行数：再多会和底部二维码/格言区重叠 */
export const MAX_SHARE_SUBJECT_ROWS = 4

/**
 * 科目行超出上限时，把多出的部分合并成「其他 N 科」，
 * 避免最后一科压到卡片底部的格言 / 二维码区域。
 */
export function mergeShareSubjects(
  sorted: ShareCardSubject[],
  max = MAX_SHARE_SUBJECT_ROWS,
): ShareCardSubject[] {
  if (sorted.length <= max) return sorted
  const head = sorted.slice(0, max - 1)
  const rest = sorted.slice(max - 1)
  const restHours = Math.round(rest.reduce((sum, s) => sum + s.hours, 0) * 10) / 10
  return [...head, { name: `其他 ${rest.length} 科`, hours: restHours, color: HEX_FALLBACK }]
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

interface DrawTextOptions {
  size: number
  weight?: number
  color?: string
  align?: CanvasTextAlign
  italic?: boolean
  /** 字间距（px），用于品牌名等展示性文字 */
  spacing?: number
}

/** 按分享卡排版绘制一行文字（统一用 top 基线，便于按 y 坐标排布） */
function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, opts: DrawTextOptions) {
  const { size, weight = 400, color = '#ffffff', align = 'left', italic = false, spacing = 0 } = opts
  ctx.save()
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${FONT_STACK}`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'top'
  if (spacing) (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${spacing}px`
  ctx.fillText(text, x, y)
  ctx.restore()
}

/** 计算文字宽度（需与 drawText 使用同一套 font / 字间距） */
function measureText(ctx: CanvasRenderingContext2D, text: string, size: number, weight = 400, italic = false, spacing = 0) {
  ctx.save()
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${FONT_STACK}`
  if (spacing) (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${spacing}px`
  const width = ctx.measureText(text).width
  ctx.restore()
  return width
}

/** 逐字换行：中文按字、英文按字符边界累加，超出宽度即换行 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  size: number,
  weight = 400,
  italic = false,
): string[] {
  const lines: string[] = []
  let current = ''
  for (const char of text) {
    if (char === '\n') {
      lines.push(current)
      current = ''
      continue
    }
    const next = current + char
    if (current && measureText(ctx, next, size, weight, italic) > maxWidth) {
      lines.push(current)
      current = char
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines.length > 0 ? lines : ['']
}

/** 单行超长时截断并加省略号，避免科目名压到右侧时长 */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, weight = 400): string {
  if (measureText(ctx, text, size, weight) <= maxWidth) return text
  let cut = text
  while (cut.length > 1 && measureText(ctx, `${cut}…`, size, weight) > maxWidth) {
    cut = cut.slice(0, -1)
  }
  return `${cut}…`
}

function fillRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
  ctx.fill()
}

function fillCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

/** 绘制扫码下载二维码：直接把模块画成小方块，不依赖图片加载 */
function drawQrCode(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' })
  const symbolSize = qr.modules.size
  // 2 个模块静默区，保证白底卡片内外都有足够留白
  const quiet = 2
  const cell = size / (symbolSize + quiet * 2)
  ctx.save()
  ctx.fillStyle = '#111827'
  for (let row = 0; row < symbolSize; row++) {
    for (let col = 0; col < symbolSize; col++) {
      if (qr.modules.data[row * symbolSize + col]) {
        ctx.fillRect(x + (col + quiet) * cell, y + (row + quiet) * cell, Math.ceil(cell), Math.ceil(cell))
      }
    }
  }
  ctx.restore()
}

/**
 * 用 Canvas 2D 直接绘制分享卡 1080×1440 PNG。
 * 不截图 DOM，因此不受页面全局 CSS（oklch/color-mix/transform/字体）影响，
 * 在 Android WebView 等环境下也能稳定生成。
 * 返回 dataURL；绘制或编码失败返回 null。
 */
export function renderShareCardPng(data: ShareCardData): string | null {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = CARD_WIDTH
    canvas.height = CARD_HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // 背景渐变 + 两处装饰光斑
    const bg = ctx.createLinearGradient(0, 0, CARD_WIDTH * 0.18, CARD_HEIGHT)
    bg.addColorStop(0, '#151a5e')
    bg.addColorStop(0.45, '#312e81')
    bg.addColorStop(1, '#5b21b6')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
    fillCircle(ctx, CARD_WIDTH - 80, 50, 230, 'rgba(255,255,255,0.08)')
    fillCircle(ctx, 70, CARD_HEIGHT - 50, 190, 'rgba(167,139,250,0.16)')

    // 头部：品牌 / 标题 / 日期
    drawText(ctx, 'DIVEDEEP', 64, 76, { size: 30, weight: 600, color: '#a5b4fc', spacing: 6 })
    drawText(ctx, data.title, 64, 140, { size: 64, weight: 800 })
    drawText(ctx, data.dateLabel, 64, 228, { size: 28, color: '#c7d2fe' })

    // 核心数据面板
    const panelY = 306
    const panelH = 191
    fillRoundRect(ctx, 64, panelY, CARD_WIDTH - 128, panelH, 28)
    ctx.fillStyle = 'rgba(255,255,255,0.10)'
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    ctx.fillRect(CARD_WIDTH / 2 - 1, panelY + 48, 2, panelH - 96)
    drawText(ctx, String(data.totalHours), 302, panelY + 40, { size: 72, weight: 800, align: 'center' })
    drawText(ctx, data.totalLabel ?? '本周总时长（h）', 302, panelY + 122, {
      size: 24,
      color: '#c7d2fe',
      align: 'center',
    })
    drawText(ctx, String(data.secondaryValue ?? data.checkedDays), 778, panelY + 40, {
      size: 72,
      weight: 800,
      align: 'center',
    })
    drawText(ctx, data.secondaryLabel ?? '打卡天数（天）', 778, panelY + 122, {
      size: 24,
      color: '#c7d2fe',
      align: 'center',
    })

    // 科目分布
    const subjectsTop = panelY + panelH + 40
    drawText(ctx, '各科目学习时长', 64, subjectsTop, { size: 32, weight: 700, color: '#f5f3ff' })
    drawText(ctx, data.distributionLabel ?? '本周投入分布', 64, subjectsTop + 44, { size: 22, color: '#a5b4fc' })

    let rowY = subjectsTop + 96
    const barWidth = CARD_WIDTH - 128
    const maxHours = Math.max(1, ...data.subjects.map((s) => s.hours))
    if (data.subjects.length === 0) {
      drawText(ctx, '暂无科目记录', 64, rowY, { size: 26, color: '#c7d2fe' })
    }
    for (const s of data.subjects) {
      drawText(ctx, fitText(ctx, s.name, barWidth - 160, 30, 600), 64, rowY, { size: 30, weight: 600, color: '#e0e7ff' })
      drawText(ctx, `${s.hours} h`, CARD_WIDTH - 64, rowY, { size: 30, weight: 700, align: 'right' })
      const barY = rowY + 48
      fillRoundRect(ctx, 64, barY, barWidth, 18, 9)
      ctx.fillStyle = 'rgba(255,255,255,0.14)'
      ctx.fill()
      const pct = Math.max(2, Math.min(100, (s.hours / maxHours) * 100))
      fillRoundRect(ctx, 64, barY, (barWidth * pct) / 100, 18, 9)
      ctx.fillStyle = s.color
      ctx.fill()
      rowY += 90
    }

    // 底部分割线 + 左侧格言 + 右侧扫码下载
    const footerBorderY = 1103
    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    ctx.fillRect(64, footerBorderY, CARD_WIDTH - 128, 2)

    const qrBox = 196
    const qrBoxX = CARD_WIDTH - 64 - qrBox
    const qrBoxY = CARD_HEIGHT - 56 - 255
    fillRoundRect(ctx, qrBoxX, qrBoxY, qrBox, qrBox, 18)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    drawQrCode(ctx, APP_DOWNLOAD_PAGE_URL, qrBoxX + 10, qrBoxY + 10, 176)
    drawText(ctx, '扫码下载 App', qrBoxX + qrBox / 2, qrBoxY + 206, {
      size: 21,
      weight: 600,
      color: '#e0e7ff',
      align: 'center',
    })
    drawText(ctx, '一起打卡上岸', qrBoxX + qrBox / 2, qrBoxY + 233, { size: 18, color: '#a5b4fc', align: 'center' })

    // 格言（最多 3 行，超出省略，保证不与分割线重叠）
    const mottoWidth = CARD_WIDTH - 128 - (qrBox + 32) - 52
    const mottoLines = wrapText(ctx, data.motto, mottoWidth, 28, 400, true).slice(0, 3)
    if (mottoLines.length === 3 && data.motto.length > mottoLines.join('').length) {
      mottoLines[2] = `${mottoLines[2].slice(0, -1)}…`
    }
    const lineHeight = 42
    const brandGap = 20
    const brandHeight = 29
    const blockHeight = mottoLines.length * lineHeight + brandGap + brandHeight
    const blockTop = qrBoxY + (255 - blockHeight) / 2
    drawText(ctx, '“', 64, blockTop, { size: 34, color: '#a5b4fc' })
    mottoLines.forEach((line, i) => {
      const y = blockTop + i * lineHeight
      drawText(ctx, line, 90, y, { size: 28, color: '#e0e7ff', italic: true })
      if (i === mottoLines.length - 1) {
        const endX = 90 + measureText(ctx, line, 28, 400, true)
        drawText(ctx, '”', endX, y, { size: 34, color: '#a5b4fc' })
      }
    })
    drawText(ctx, 'DiveDeep · 考研学习打卡', 64, blockTop + mottoLines.length * lineHeight + brandGap, {
      size: 24,
      weight: 700,
      color: '#c7d2fe',
      spacing: 2,
    })

    return canvas.toDataURL('image/png')
  } catch (e) {
    console.error('[ShareCard] Canvas 生成分享图失败', e)
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

/**
 * 保存分享图 PNG。
 * - 电脑程序（Tauri）：弹系统「另存为」对话框后落盘
 * - 网页 / 安卓：沿用浏览器下载
 * 返回 false 表示用户取消了保存。
 */
export async function savePng(dataUrl: string, filename = 'weekly-summary.png'): Promise<boolean> {
  if (isTauri()) {
    const result = await savePngViaDialog(dataUrl, filename)
    if (result !== null) return result
  }
  downloadPng(dataUrl, filename)
  return true
}

/** dataURL(PNG) → 字节：手工 base64 解码，避免 fetch(data:) 被 CSP 的 connect-src 拦下 */
function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

/** 桌面端：系统「另存为」对话框 + 写文件；插件不可用时返回 null（交给调用方回退） */
async function savePngViaDialog(dataUrl: string, filename: string): Promise<boolean | null> {
  try {
    const [{ save }, { writeFile }] = await Promise.all([
      import('@tauri-apps/plugin-dialog'),
      import('@tauri-apps/plugin-fs'),
    ])
    const path = await save({
      defaultPath: filename,
      filters: [{ name: 'PNG 图片', extensions: ['png'] }],
    })
    if (!path) return false
    await writeFile(path, dataUrlToBytes(dataUrl))
    return true
  } catch {
    return null
  }
}

/**
 * Capacitor 原生：把 PNG 写入缓存目录，再调系统分享面板。
 * Android WebView 不支持 Web Share API（navigator.share），
 * 所以必须走 @capacitor/share + @capacitor/filesystem。
 * 返回 true 表示已唤起分享；失败返回 false，由调用方提示重试。
 */
export async function sharePngNative(
  dataUrl: string,
  filename = 'divedeep-share.png',
): Promise<boolean> {
  try {
    const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
    await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache })
    const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache })
    await Share.share({
      title: '学习打卡分享',
      text: '一起来打卡上岸',
      files: [uri],
      dialogTitle: '分享学习打卡',
    })
    return true
  } catch (e) {
    console.error('[ShareCard] 系统分享失败', e)
    return false
  }
}