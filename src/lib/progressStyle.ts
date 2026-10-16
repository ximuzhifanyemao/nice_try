/**
 * 今日进度尺的视觉风格偏好。
 *
 * 简洁模式胶囊条与全功能计时页共用同一份样式（两边的进度尺是同一份实现的视觉呼应），
 * 所以在设置页改一次，两处同时生效。默认 'ruler' 即历史样式，不做迁移也不会改变老用户观感。
 */
export type ProgressStyle = 'ruler' | 'blocks' | 'track' | 'dual' | 'dots'

export interface ProgressStyleMeta {
  key: ProgressStyle
  name: string
  desc: string
}

export const PROGRESS_STYLES: ProgressStyleMeta[] = [
  { key: 'ruler', name: '刻度尺', desc: '10 段高低交替，像一把尺子' },
  { key: 'blocks', name: '等高胶囊', desc: '等宽等高，正在计时的这一小时会呼吸' },
  { key: 'track', name: '轨道 + 目标', desc: '一条连续轨道，超出目标的部分转绿' },
  { key: 'dual', name: '双轨对比', desc: '上轨今日已学，下轨周目标日均' },
  { key: 'dots', name: '打卡点阵', desc: '每小时一个点，进行中为空心' },
]

const STORAGE_KEY = 'kaoyan_progress_style'
const CHANGE_EVENT = 'kaoyan:progress-style'

const VALID: ProgressStyle[] = ['ruler', 'blocks', 'track', 'dual', 'dots']

function isStyle(v: unknown): v is ProgressStyle {
  return typeof v === 'string' && (VALID as string[]).includes(v)
}

/** 读取持久化的进度尺样式；无记录 / 非法值回退到刻度尺 */
export function getProgressStyle(): ProgressStyle {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isStyle(saved)) return saved
  } catch {
    /* ignore */
  }
  return 'ruler'
}

/** 设置并持久化进度尺样式，同时通知同页订阅者 */
export function setProgressStyle(style: ProgressStyle): ProgressStyle {
  try {
    localStorage.setItem(STORAGE_KEY, style)
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: style }))
  } catch {
    /* ignore */
  }
  return style
}

/**
 * 订阅样式变化。
 *
 * 同页改动用 CustomEvent 通知；简洁模式是独立窗口，靠 storage 事件跨窗口同步，
 * 再兜底监听窗口 focus，确保切换回挂件时样式一定是最新的。
 */
export function subscribeProgressStyle(cb: (style: ProgressStyle) => void): () => void {
  const sync = () => cb(getProgressStyle())
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === STORAGE_KEY) sync()
  }
  window.addEventListener(CHANGE_EVENT, sync)
  window.addEventListener('storage', onStorage)
  window.addEventListener('focus', sync)
  return () => {
    window.removeEventListener(CHANGE_EVENT, sync)
    window.removeEventListener('storage', onStorage)
    window.removeEventListener('focus', sync)
  }
}
