import QRCode from 'qrcode'
import { isTauri } from '@tauri-apps/api/core'
import { Share } from '@capacitor/share'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { APP_DOWNLOAD_PAGE_URL } from './appLinks'

/**
 * 分享图（日 / 周 / 月）相关类型与导出逻辑。
 * 说明：用 Canvas 2D 直接绘制 1080×1440 的 PNG，不依赖 DOM 截图，
 * 避免 Android WebView / 低版本浏览器里 html2canvas 的各种兼容问题。
 * 电脑程序（Tauri）走系统「另存为」对话框，网页走 <a download>，
 * Capacitor 原生走 @capacitor/share 系统分享面板。
 *
 * 视觉统一为「纸墨 · 暖纸朱印」：暖纸底 + 水墨山水 + 朱砂印章 +
 * 行楷「路虽远，行则将至；事虽难，做则必成」。
 */

/** 分享图卡片固定尺寸（1080×1440 竖版 PNG） */
export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1440

/** 分享范围：一天 / 一周 / 一个月 */
export type ShareMode = 'day' | 'week' | 'month'
/** 分享形态：总计 / 逐日日历 / 单日时间轴 */
export type ShareView = 'summary' | 'calendar' | 'timeline'

/** 分享卡字体栈（与页面保持一致，缺字时回退系统无衬线字体） */
const FONT_STACK = '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", -apple-system, sans-serif'
/** 标题/数字用衬线字体，贴近纸墨书页 */
const SERIF_STACK = '"Noto Serif SC", "Songti SC", "SimSun", "STSong", serif'
/** 行楷字体栈：优先系统行楷，缺失时回退楷体/衬线（保证中文不乱码） */
const CALLIGRAPHY_STACK =
  '"STXingkai", "Xingkai SC", "STKaiti", "KaiTi", "Kaiti SC", "KaiTi_GB2312", serif'

/** 暖纸色阶（与 index.css 的 paper 主题一致） */
const PAPER = {
  base: '#f6f0e4',
  light: '#fffcf6',
  mid: '#efe4d2',
  edge: '#e4dac9',
  deep: '#d8c9b2',
}

/** 墨色阶 */
const INK = {
  strong: '#2b2521',
  body: '#463b30',
  soft: '#5a4e41',
  muted: '#8b7d6e',
  faint: '#b3a08a',
}

/** 朱砂色阶 */
const SEAL = {
  red: '#a6342a',
  deep: '#8c2a22',
  pale: '#c96657',
}

/** 分享卡一条科目的数据 */
export interface ShareCardSubject {
  name: string
  /** 该科目小时数 */
  hours: number
  /** 进度条/标签用的十六进制颜色 */
  color: string
}

/** 总计分享卡的全部渲染数据 */
export interface ShareCardData {
  kind?: 'summary'
  /** 标题，如「本周学习总结」「今日学习记录」 */
  title: string
  /** 日期区间展现，如「9月14日 ~ 9月20日」或「2026年11月6日 周四」 */
  dateLabel: string
  totalHours: number
  checkedDays: number
  /** 按时长降序 */
  subjects: ShareCardSubject[]
  /** 主指标标签，默认「本周总时长（h）」；日报传「当日总时长（h）」 */
  totalLabel?: string
  /** 副指标数值，默认用 checkedDays；日报可传科目数 */
  secondaryValue?: number
  /** 副指标标签，默认「打卡天数（天）」；日报传「学习科目（个）」 */
  secondaryLabel?: string
  /** 科目分布小标题，默认「本周投入分布」 */
  distributionLabel?: string
}

/** 逐日日历里的一天 */
export interface ShareCalendarDay {
  /** yyyy-MM-dd */
  date: string
  hours: number
  isToday?: boolean
  isFuture?: boolean
  /** 月视图补齐整周时，上月/下月的占位日 */
  isOutside?: boolean
}

/** 逐日日历分享卡（周 / 月） */
export interface ShareCalendarCardData {
  kind: 'calendar'
  title: string
  dateLabel: string
  totalHours: number
  checkedDays: number
  days: ShareCalendarDay[]
  rangeMode: 'week' | 'month'
}

/** 时间轴里的一个学习片段 */
export interface ShareTimelineBlock {
  /** HH:mm；缺省表示没有记录时间段 */
  start?: string
  end?: string
  subjectName: string
  activity?: string
  hours: number
  color: string
}

/** 单日时间轴分享卡 */
export interface ShareTimelineCardData {
  kind: 'timeline'
  title: string
  dateLabel: string
  totalHours: number
  blocks: ShareTimelineBlock[]
}

/** 三种分享卡的数据联合类型 */
export type ShareCardPayload = ShareCardData | ShareCalendarCardData | ShareTimelineCardData

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

/** 分享卡最多展示的科目行数：再多会和底部山水/二维码区重叠 */
export const MAX_SHARE_SUBJECT_ROWS = 4

/**
 * 科目行超出上限时，把多出的部分合并成「其他 N 科」，
 * 避免最后一科压到卡片底部的山水 / 格言区域。
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

interface DrawTextOptions {
  size: number
  weight?: number
  color?: string
  align?: CanvasTextAlign
  italic?: boolean
  /** 字间距（px），用于品牌名等展示性文字 */
  spacing?: number
  /** 自定义字体栈；默认使用无衬线字体 */
  font?: string
}

/** 按分享卡排版绘制一行文字（统一用 top 基线，便于按 y 坐标排布） */
function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: DrawTextOptions,
) {
  const {
    size,
    weight = 400,
    color = INK.strong,
    align = 'left',
    italic = false,
    spacing = 0,
    font = FONT_STACK,
  } = opts
  ctx.save()
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${font}`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'top'
  if (spacing) (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${spacing}px`
  ctx.fillText(text, x, y)
  ctx.restore()
}

/** 计算文字宽度（需与 drawText 使用同一套 font / 字间距） */
function measureText(
  ctx: CanvasRenderingContext2D,
  text: string,
  size: number,
  weight = 400,
  italic = false,
  spacing = 0,
  font = FONT_STACK,
) {
  ctx.save()
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${font}`
  if (spacing) (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${spacing}px`
  const width = ctx.measureText(text).width
  ctx.restore()
  return width
}

/** 单行超长时截断并加省略号，避免科目名压到右侧时长 */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  size: number,
  weight = 400,
  font = FONT_STACK,
): string {
  if (measureText(ctx, text, size, weight, false, 0, font) <= maxWidth) return text
  let cut = text
  while (cut.length > 1 && measureText(ctx, `${cut}…`, size, weight, false, 0, font) > maxWidth) {
    cut = cut.slice(0, -1)
  }
  return `${cut}…`
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
) {
  ctx.save()
  roundRectPath(ctx, x, y, w, h, r)
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}

function strokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
  lineWidth = 2,
) {
  ctx.save()
  roundRectPath(ctx, x, y, w, h, r)
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.stroke()
  ctx.restore()
}

function fillCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** 绘制扫码下载二维码：直接把模块画成小方块，不依赖图片加载 */
function drawQrCode(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' })
  const symbolSize = qr.modules.size
  // 2 个模块静默区，保证白底卡片内外都有足够留白
  const quiet = 2
  const cell = size / (symbolSize + quiet * 2)
  ctx.save()
  ctx.fillStyle = INK.strong
  for (let row = 0; row < symbolSize; row++) {
    for (let col = 0; col < symbolSize; col++) {
      if (qr.modules.data[row * symbolSize + col]) {
        ctx.fillRect(x + (col + quiet) * cell, y + (row + quiet) * cell, Math.ceil(cell), Math.ceil(cell))
      }
    }
  }
  ctx.restore()
}

/* ────────────── 纸墨视觉基础 ────────────── */

/** 暖纸底：渐变 + 固定种子的纸纤维颗粒 + 暗角，保证每次生成一致 */
function drawPaperBackground(ctx: CanvasRenderingContext2D) {
  const bg = ctx.createLinearGradient(0, 0, CARD_WIDTH * 0.35, CARD_HEIGHT)
  bg.addColorStop(0, '#fbf7ee')
  bg.addColorStop(0.52, PAPER.base)
  bg.addColorStop(1, '#eadfca')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  // 纸纤维颗粒（线性同余伪随机，固定种子 → 每次一致）
  let seed = 20261109
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  for (let i = 0; i < 900; i++) {
    const x = rand() * CARD_WIDTH
    const y = rand() * CARD_HEIGHT
    const alpha = 0.018 + rand() * 0.035
    ctx.fillStyle = `rgba(96, 74, 48, ${alpha})`
    ctx.fillRect(x, y, 1 + rand() * 1.8, 1 + rand() * 1.2)
  }
  // 少量细长纤维
  ctx.strokeStyle = 'rgba(120, 95, 60, 0.045)'
  ctx.lineWidth = 1
  for (let i = 0; i < 26; i++) {
    const x = rand() * CARD_WIDTH
    const y = rand() * CARD_HEIGHT
    const len = 8 + rand() * 26
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + len, y + (rand() - 0.5) * 4)
    ctx.stroke()
  }

  // 四周暗角
  const vignette = ctx.createRadialGradient(
    CARD_WIDTH / 2,
    CARD_HEIGHT * 0.44,
    CARD_WIDTH * 0.3,
    CARD_WIDTH / 2,
    CARD_HEIGHT * 0.5,
    CARD_WIDTH * 0.78,
  )
  vignette.addColorStop(0, 'rgba(255,252,246,0)')
  vignette.addColorStop(1, 'rgba(120,90,50,0.12)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
}

/** 一层水墨山脊 */
function drawRidge(
  ctx: CanvasRenderingContext2D,
  bottom: number,
  baseY: number,
  amplitude: number,
  color: string,
) {
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(-24, baseY)
  ctx.bezierCurveTo(
    CARD_WIDTH * 0.1,
    baseY - amplitude * 1.25,
    CARD_WIDTH * 0.2,
    baseY - amplitude * 0.18,
    CARD_WIDTH * 0.34,
    baseY - amplitude * 0.62,
  )
  ctx.bezierCurveTo(
    CARD_WIDTH * 0.46,
    baseY - amplitude * 1.05,
    CARD_WIDTH * 0.55,
    baseY - amplitude * 0.12,
    CARD_WIDTH * 0.68,
    baseY - amplitude * 0.55,
  )
  ctx.bezierCurveTo(
    CARD_WIDTH * 0.8,
    baseY - amplitude * 0.95,
    CARD_WIDTH * 0.9,
    baseY - amplitude * 0.2,
    CARD_WIDTH + 24,
    baseY - amplitude * 0.5,
  )
  ctx.lineTo(CARD_WIDTH + 24, bottom + 24)
  ctx.lineTo(-24, bottom + 24)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/** 底部水墨山水：日轮 + 三层远山 + 雾带 + 飞鸟 */
function drawInkLandscape(ctx: CanvasRenderingContext2D, top: number, height: number) {
  const bottom = top + height

  // 日轮（低饱和朱砂）
  const sunX = 604
  const sunY = top + 104
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 180)
  sunGlow.addColorStop(0, 'rgba(182,69,52,0.20)')
  sunGlow.addColorStop(0.55, 'rgba(182,69,52,0.09)')
  sunGlow.addColorStop(1, 'rgba(182,69,52,0)')
  ctx.fillStyle = sunGlow
  ctx.fillRect(sunX - 190, sunY - 190, 380, 380)
  fillCircle(ctx, sunX, sunY, 70, 'rgba(166,52,42,0.15)')

  // 三层远山
  drawRidge(ctx, bottom, top + height * 0.56, 130, 'rgba(70,59,48,0.09)')
  drawRidge(ctx, bottom, top + height * 0.72, 92, 'rgba(70,59,48,0.15)')
  drawRidge(ctx, bottom, top + height * 0.86, 62, 'rgba(43,37,33,0.24)')

  // 雾带
  const mist1 = ctx.createLinearGradient(0, top + height * 0.55, 0, top + height * 0.72)
  mist1.addColorStop(0, 'rgba(246,240,228,0)')
  mist1.addColorStop(0.55, 'rgba(246,240,228,0.55)')
  mist1.addColorStop(1, 'rgba(246,240,228,0)')
  ctx.fillStyle = mist1
  ctx.fillRect(0, top + height * 0.55, CARD_WIDTH, height * 0.17)

  const mist2 = ctx.createLinearGradient(0, top + height * 0.74, 0, top + height * 0.9)
  mist2.addColorStop(0, 'rgba(246,240,228,0)')
  mist2.addColorStop(0.5, 'rgba(246,240,228,0.42)')
  mist2.addColorStop(1, 'rgba(246,240,228,0)')
  ctx.fillStyle = mist2
  ctx.fillRect(0, top + height * 0.74, CARD_WIDTH, height * 0.16)

  // 飞鸟：三组两笔圆弧
  const bird = (x: number, y: number, s: number) => {
    ctx.save()
    ctx.strokeStyle = 'rgba(43,37,33,0.5)'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x - s, y)
    ctx.quadraticCurveTo(x - s * 0.45, y - s * 0.62, x, y - s * 0.08)
    ctx.quadraticCurveTo(x + s * 0.45, y - s * 0.62, x + s, y)
    ctx.stroke()
    ctx.restore()
  }
  bird(742, top + 78, 18)
  bird(802, top + 52, 13)
  bird(860, top + 92, 10)
}

/** 朱砂印章：圆角方块 + 白色竖排文字 */
function drawSeal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  chars: string,
) {
  fillRoundRect(ctx, x, y, size, size, size * 0.12, SEAL.red)
  strokeRoundRect(
    ctx,
    x + size * 0.08,
    y + size * 0.08,
    size * 0.84,
    size * 0.84,
    size * 0.07,
    'rgba(255,252,246,0.65)',
    2,
  )
  ctx.save()
  ctx.font = `600 ${Math.round(size * (chars.length > 1 ? 0.3 : 0.48))}px ${CALLIGRAPHY_STACK}`
  ctx.fillStyle = '#fff8ef'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const list = [...chars]
  list.forEach((char, i) => {
    const cy = list.length === 1 ? y + size / 2 : y + size * (0.3 + i * 0.4)
    ctx.fillText(char, x + size / 2, cy)
  })
  ctx.restore()
}

/** 分享卡顶部：印章 + 品牌 + 标题 + 日期 */
function drawHeader(
  ctx: CanvasRenderingContext2D,
  title: string,
  dateLabel: string,
) {
  drawSeal(ctx, 64, 62, 56, '深')
  drawText(ctx, 'DIVEDEEP', 138, 64, {
    size: 26,
    weight: 700,
    color: INK.soft,
    spacing: 6,
    font: SERIF_STACK,
  })
  drawText(ctx, '考研学习打卡', 138, 100, { size: 18, color: INK.muted })

  drawText(ctx, title, 64, 148, {
    size: 58,
    weight: 700,
    color: INK.strong,
    font: SERIF_STACK,
  })
  drawText(ctx, dateLabel, 64, 230, { size: 26, color: INK.muted })

  ctx.fillStyle = 'rgba(166,52,42,0.62)'
  ctx.fillRect(64, 276, 96, 4)
  ctx.fillStyle = 'rgba(70,59,48,0.16)'
  ctx.fillRect(160, 277, CARD_WIDTH - 224, 2)
}

/** 固定行楷文案 + 水墨山水 + 朱印 + 二维码 */
function drawFooter(ctx: CanvasRenderingContext2D) {
  const footerTop = 1030
  drawInkLandscape(ctx, footerTop, CARD_HEIGHT - footerTop)

  // 行楷固定文案（两行）
  drawText(ctx, '路虽远，行则将至；', 64, 1102, {
    size: 42,
    color: INK.strong,
    font: CALLIGRAPHY_STACK,
  })
  drawText(ctx, '事虽难，做则必成。', 64, 1166, {
    size: 42,
    color: INK.strong,
    font: CALLIGRAPHY_STACK,
  })

  // 文案旁朱印
  drawSeal(ctx, 508, 1148, 58, '行远')

  // 左下品牌
  drawText(ctx, 'DiveDeep · 考研学习打卡', 64, 1350, {
    size: 22,
    weight: 600,
    color: INK.soft,
    spacing: 1,
  })

  // 右下角二维码
  const qrBox = 196
  const qrBoxX = CARD_WIDTH - 64 - qrBox
  const qrBoxY = 1058
  fillRoundRect(ctx, qrBoxX, qrBoxY, qrBox, qrBox, 16, PAPER.light)
  strokeRoundRect(ctx, qrBoxX, qrBoxY, qrBox, qrBox, 16, 'rgba(70,59,48,0.35)', 2)
  drawQrCode(ctx, APP_DOWNLOAD_PAGE_URL, qrBoxX + 10, qrBoxY + 10, 176)
  drawText(ctx, '扫码下载 App', qrBoxX + qrBox / 2, qrBoxY + 204, {
    size: 21,
    weight: 600,
    color: INK.body,
    align: 'center',
  })
  drawText(ctx, '一起打卡上岸', qrBoxX + qrBox / 2, qrBoxY + 232, {
    size: 18,
    color: INK.muted,
    align: 'center',
  })
}

/* ────────────── 三种分享卡 ────────────── */

/** 总计分享卡：总时长 + 副指标 + 各科目时长 */
function renderSummaryCard(ctx: CanvasRenderingContext2D, data: ShareCardData) {
  drawHeader(ctx, data.title, data.dateLabel)

  // 核心数据面板
  const panelY = 306
  const panelH = 180
  fillRoundRect(ctx, 64, panelY, CARD_WIDTH - 128, panelH, 24, 'rgba(255,252,246,0.76)')
  strokeRoundRect(ctx, 64, panelY, CARD_WIDTH - 128, panelH, 24, 'rgba(70,59,48,0.18)', 2)
  ctx.fillStyle = 'rgba(70,59,48,0.14)'
  ctx.fillRect(CARD_WIDTH / 2 - 1, panelY + 40, 2, panelH - 80)

  drawText(ctx, String(data.totalHours), 302, panelY + 38, {
    size: 68,
    weight: 700,
    color: INK.strong,
    align: 'center',
    font: SERIF_STACK,
  })
  drawText(ctx, data.totalLabel ?? '本周总时长（h）', 302, panelY + 122, {
    size: 23,
    color: INK.muted,
    align: 'center',
  })
  drawText(ctx, String(data.secondaryValue ?? data.checkedDays), 778, panelY + 38, {
    size: 68,
    weight: 700,
    color: INK.strong,
    align: 'center',
    font: SERIF_STACK,
  })
  drawText(ctx, data.secondaryLabel ?? '打卡天数（天）', 778, panelY + 122, {
    size: 23,
    color: INK.muted,
    align: 'center',
  })

  // 科目分布
  const subjectsTop = 526
  drawText(ctx, '各科目学习时长', 64, subjectsTop, {
    size: 31,
    weight: 700,
    color: INK.strong,
    font: SERIF_STACK,
  })
  drawText(ctx, data.distributionLabel ?? '本周投入分布', 64, subjectsTop + 42, {
    size: 21,
    color: INK.muted,
  })

  let rowY = subjectsTop + 92
  const barWidth = CARD_WIDTH - 128
  const maxHours = Math.max(1, ...data.subjects.map((s) => s.hours))
  if (data.subjects.length === 0) {
    drawText(ctx, '暂无科目记录', 64, rowY, { size: 26, color: INK.muted })
  }
  for (const s of data.subjects) {
    drawText(ctx, fitText(ctx, s.name, barWidth - 190, 29, 600), 64, rowY, {
      size: 29,
      weight: 600,
      color: INK.body,
    })
    drawText(ctx, `${s.hours} h`, CARD_WIDTH - 64, rowY, {
      size: 29,
      weight: 700,
      color: SEAL.red,
      align: 'right',
      font: SERIF_STACK,
    })
    const barY = rowY + 46
    fillRoundRect(ctx, 64, barY, barWidth, 16, 8, PAPER.edge)
    const pct = Math.max(2, Math.min(100, (s.hours / maxHours) * 100))
    ctx.save()
    ctx.globalAlpha = 0.9
    fillRoundRect(ctx, 64, barY, (barWidth * pct) / 100, 16, 8, s.color)
    ctx.restore()
    rowY += 88
  }

  drawFooter(ctx)
}

/** 逐日日历分享卡：只展示每天学了多久，不展示科目 */
function renderCalendarCard(ctx: CanvasRenderingContext2D, data: ShareCalendarCardData) {
  drawHeader(ctx, data.title, data.dateLabel)

  // 统计条
  const statsY = 300
  const statsH = 108
  fillRoundRect(ctx, 64, statsY, CARD_WIDTH - 128, statsH, 22, 'rgba(255,252,246,0.72)')
  strokeRoundRect(ctx, 64, statsY, CARD_WIDTH - 128, statsH, 22, 'rgba(70,59,48,0.16)', 2)
  const stats = [
    { label: '总时长（h）', value: String(data.totalHours) },
    { label: '打卡天数（天）', value: String(data.checkedDays) },
    {
      label: '日均（h）',
      value: data.checkedDays > 0 ? (data.totalHours / data.checkedDays).toFixed(1) : '0',
    },
  ]
  stats.forEach((s, i) => {
    const cx = 64 + ((CARD_WIDTH - 128) / 3) * (i + 0.5)
    drawText(ctx, s.value, cx, statsY + 20, {
      size: 40,
      weight: 700,
      color: INK.strong,
      align: 'center',
      font: SERIF_STACK,
    })
    drawText(ctx, s.label, cx, statsY + 70, {
      size: 19,
      color: INK.muted,
      align: 'center',
    })
    if (i > 0) {
      ctx.fillStyle = 'rgba(70,59,48,0.14)'
      ctx.fillRect(64 + ((CARD_WIDTH - 128) / 3) * i, statsY + 26, 2, statsH - 52)
    }
  })

  const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日']
  const gridLeft = 64
  const gridWidth = CARD_WIDTH - 128
  const gap = 8
  const cellWidth = (gridWidth - gap * 6) / 7
  const isWeek = data.rangeMode === 'week'
  const cellHeight = isWeek ? 240 : 82
  const gridTop = isWeek ? 494 : 470

  // 星期表头
  weekdayLabels.forEach((label, i) => {
    drawText(ctx, label, gridLeft + (cellWidth + gap) * i + cellWidth / 2, gridTop - 40, {
      size: 21,
      weight: 600,
      color: INK.muted,
      align: 'center',
    })
  })

  const maxHours = Math.max(0.5, ...data.days.map((d) => d.hours))
  data.days.forEach((day, index) => {
    const col = index % 7
    const row = Math.floor(index / 7)
    const x = gridLeft + (cellWidth + gap) * col
    const y = gridTop + (cellHeight + gap) * row
    const ratio = day.hours > 0 ? Math.min(1, day.hours / maxHours) : 0

    let fill = 'rgba(255,252,246,0.55)'
    if (day.isOutside) fill = 'rgba(255,252,246,0.28)'
    else if (day.hours > 0) fill = `rgba(166,52,42,${0.06 + ratio * 0.22})`
    fillRoundRect(ctx, x, y, cellWidth, cellHeight, 12, fill)
    if (day.isToday) {
      strokeRoundRect(ctx, x, y, cellWidth, cellHeight, 12, SEAL.red, 3)
    } else if (!day.isOutside) {
      strokeRoundRect(ctx, x, y, cellWidth, cellHeight, 12, 'rgba(70,59,48,0.10)', 1)
    }

    const dayNum = Number(day.date.slice(8, 10))
    const dateLabel = isWeek ? day.date.slice(5).replace('-', '/') : String(dayNum)
    const textColor = day.isOutside ? INK.faint : day.hours > 0 ? INK.strong : INK.muted
    drawText(ctx, dateLabel, x + 12, y + 10, {
      size: isWeek ? 22 : 19,
      weight: 600,
      color: textColor,
    })

    if (isWeek) {
      const weekday = ['日', '一', '二', '三', '四', '五', '六'][new Date(`${day.date}T00:00:00`).getDay()]
      drawText(ctx, `周${weekday}`, x + cellWidth - 12, y + 12, {
        size: 18,
        color: INK.muted,
        align: 'right',
      })
      drawText(ctx, day.hours > 0 ? `${day.hours.toFixed(1)}h` : '—', x + cellWidth / 2, y + 92, {
        size: 38,
        weight: 700,
        color: day.hours > 0 ? SEAL.red : INK.faint,
        align: 'center',
        font: SERIF_STACK,
      })
      // 底部小柱
      const barW = cellWidth - 32
      const barY = y + cellHeight - 34
      fillRoundRect(ctx, x + 16, barY, barW, 10, 5, 'rgba(70,59,48,0.10)')
      if (day.hours > 0) {
        fillRoundRect(ctx, x + 16, barY, Math.max(6, barW * ratio), 10, 5, SEAL.pale)
      }
    } else {
      drawText(ctx, day.hours > 0 ? `${day.hours.toFixed(1)}h` : '', x + cellWidth / 2, y + 36, {
        size: 22,
        weight: 600,
        color: day.hours > 0 ? SEAL.red : INK.faint,
        align: 'center',
        font: SERIF_STACK,
      })
    }
  })

  drawFooter(ctx)
}

/** 单日时间轴分享卡 */
function renderTimelineCard(ctx: CanvasRenderingContext2D, data: ShareTimelineCardData) {
  drawHeader(ctx, data.title, data.dateLabel)

  // 统计条
  const statsY = 300
  const statsH = 108
  fillRoundRect(ctx, 64, statsY, CARD_WIDTH - 128, statsH, 22, 'rgba(255,252,246,0.72)')
  strokeRoundRect(ctx, 64, statsY, CARD_WIDTH - 128, statsH, 22, 'rgba(70,59,48,0.16)', 2)
  const stats = [
    { label: '当日总时长（h）', value: String(data.totalHours) },
    { label: '学习片段（段）', value: String(data.blocks.length) },
  ]
  stats.forEach((s, i) => {
    const cx = 64 + ((CARD_WIDTH - 128) / 2) * (i + 0.5)
    drawText(ctx, s.value, cx, statsY + 20, {
      size: 40,
      weight: 700,
      color: INK.strong,
      align: 'center',
      font: SERIF_STACK,
    })
    drawText(ctx, s.label, cx, statsY + 70, {
      size: 19,
      color: INK.muted,
      align: 'center',
    })
    if (i > 0) {
      ctx.fillStyle = 'rgba(70,59,48,0.14)'
      ctx.fillRect(CARD_WIDTH / 2 - 1, statsY + 26, 2, statsH - 52)
    }
  })

  const timelineTop = 470
  const timelineBottom = 1000
  const visible = data.blocks.slice(0, 10)
  const overflow = data.blocks.length - visible.length
  const rows = visible.length + (overflow > 0 ? 1 : 0)
  const rowHeight = rows > 0 ? Math.min(88, Math.floor((timelineBottom - timelineTop) / rows)) : 88
  const lineX = 300

  // 时间轴竖线
  if (rows > 0) {
    ctx.fillStyle = 'rgba(70,59,48,0.22)'
    ctx.fillRect(lineX - 1, timelineTop + 12, 2, Math.max(0, rowHeight * visible.length - 24))
  }

  if (visible.length === 0) {
    drawText(ctx, '暂无学习片段记录', 64, timelineTop + 24, { size: 28, color: INK.muted })
  }

  visible.forEach((block, i) => {
    const y = timelineTop + i * rowHeight
    drawText(ctx, block.start ? `${block.start}` : '--:--', lineX - 48, y + 10, {
      size: 23,
      weight: 600,
      color: block.start ? INK.body : INK.faint,
      align: 'right',
      font: SERIF_STACK,
    })
    if (block.end) {
      drawText(ctx, block.end, lineX - 48, y + 38, {
        size: 18,
        color: INK.muted,
        align: 'right',
      })
    }
    fillCircle(ctx, lineX, y + 24, 8, block.color)
    fillCircle(ctx, lineX, y + 24, 3.5, PAPER.light)

    const contentX = lineX + 40
    const contentWidth = CARD_WIDTH - 64 - contentX
    drawText(ctx, fitText(ctx, block.subjectName, contentWidth - 120, 27, 600), contentX, y + 4, {
      size: 27,
      weight: 600,
      color: INK.strong,
    })
    if (block.activity) {
      drawText(ctx, fitText(ctx, block.activity, contentWidth - 120, 19), contentX, y + 40, {
        size: 19,
        color: INK.muted,
      })
    }
    drawText(ctx, `${block.hours} h`, CARD_WIDTH - 64, y + 14, {
      size: 26,
      weight: 700,
      color: SEAL.red,
      align: 'right',
      font: SERIF_STACK,
    })
  })

  if (overflow > 0) {
    drawText(ctx, `其余 ${overflow} 条记录`, 64, timelineTop + visible.length * rowHeight + 8, {
      size: 22,
      color: INK.muted,
    })
  }

  drawFooter(ctx)
}

/**
 * 用 Canvas 2D 直接绘制分享卡 1080×1440 PNG。
 * 不截图 DOM，因此不受页面全局 CSS（oklch/color-mix/transform/字体）影响，
 * 在 Android WebView 等环境下也能稳定生成。
 * 返回 dataURL；绘制或编码失败返回 null。
 */
export function renderShareCardPng(data: ShareCardPayload): string | null {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = CARD_WIDTH
    canvas.height = CARD_HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    drawPaperBackground(ctx)

    if (data.kind === 'calendar') {
      renderCalendarCard(ctx, data)
    } else if (data.kind === 'timeline') {
      renderTimelineCard(ctx, data)
    } else {
      renderSummaryCard(ctx, data)
    }

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
