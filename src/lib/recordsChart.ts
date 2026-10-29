/**
 * 「记录」页学习时长可视化图的图表类型偏好（柱状 / 折线）。
 *
 * 左栏设置一次，右栏所有日卡片的「每小时学习时长」图跟着变（含手机端窄屏布局），
 * 与进度条样式（lib/progressStyle）同一套做法：localStorage 持久化 +
 * CustomEvent 同页通知 + storage/focus 兜底同步，默认柱状、老用户观感不变。
 */
export type RecordsChartStyle = 'bar' | 'line'

const STORAGE_KEY = 'kaoyan_records_chart'
const CHANGE_EVENT = 'kaoyan:records-chart'

function isStyle(v: unknown): v is RecordsChartStyle {
  return v === 'bar' || v === 'line'
}

/** 读取持久化的图表类型；无记录 / 非法值回退柱状图 */
export function getRecordsChartStyle(): RecordsChartStyle {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isStyle(saved)) return saved
  } catch {
    /* ignore */
  }
  return 'bar'
}

/** 设置并持久化图表类型，同时通知同页订阅者（已挂载的日卡片立即重绘） */
export function setRecordsChartStyle(style: RecordsChartStyle): RecordsChartStyle {
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

/** 订阅图表类型变化（同页 CustomEvent + 跨窗口 storage + 回到窗口 focus 兜底） */
export function subscribeRecordsChartStyle(cb: (style: RecordsChartStyle) => void): () => void {
  const sync = () => cb(getRecordsChartStyle())
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
