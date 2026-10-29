import type { Monitor } from '@tauri-apps/api/window'

/**
 * 简洁模式挂件的方向偏好。
 *
 * - horizontal：历史形态，细长胶囊条（500×52）
 * - vertical  ：贴在屏幕左侧的竖条，宽度取任务栏厚度（用户的任务栏在左侧），高度固定
 *
 * 与「进度条样式」同一套偏好同步方式：设置页改一次，挂件窗口立即按新方向变形。
 */
export type WidgetOrientation = 'horizontal' | 'vertical'

/** 竖向挂件的固定高度（逻辑像素）：科目、计时、进度尺、按钮各占一段，约半屏高 */
export const VERTICAL_H = 420
/** 拿不到任务栏厚度时的竖向宽度兜底值（接近 Windows 默认任务栏厚度） */
export const VERTICAL_W_FALLBACK = 48
/** 竖向宽度的合理区间：太窄放不下圆形按钮，太宽就不像贴边窄条了 */
const VERTICAL_W_MIN = 40
const VERTICAL_W_MAX = 120

const STORAGE_KEY = 'kaoyan_widget_orientation'
const CHANGE_EVENT = 'kaoyan:widget-orientation'

/** 读取方向偏好；无记录 / 非法值回退横向（老用户无感知） */
export function getWidgetOrientation(): WidgetOrientation {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'vertical' ? 'vertical' : 'horizontal'
  } catch {
    return 'horizontal'
  }
}

/** 设置并持久化方向，同时通知同页订阅者 */
export function setWidgetOrientation(orientation: WidgetOrientation): WidgetOrientation {
  try {
    localStorage.setItem(STORAGE_KEY, orientation)
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: orientation }))
  } catch {
    /* ignore */
  }
  return orientation
}

/**
 * 订阅方向变化：同页用 CustomEvent，跨窗口（设置页在全部功能窗口里改）靠 storage 事件，
 * 再兜底监听窗口 focus，保证回到挂件时一定读到最新值。
 */
export function subscribeWidgetOrientation(cb: (orientation: WidgetOrientation) => void): () => void {
  const sync = () => cb(getWidgetOrientation())
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

/**
 * 任务栏厚度（逻辑像素）：显示器工作区相对整屏的内缩量。
 * 任务栏在左侧时就是「工作区左边界 − 屏幕左边界」——用户要的正是这个宽度。
 * 任务栏在下侧 / 自动隐藏时左右内缩为 0，返回 null 让调用方走兜底。
 */
export function taskbarThickness(monitor: Monitor | null): number | null {
  if (!monitor) return null
  const wa = monitor.workArea
  if (!wa) return null
  const scale = monitor.scaleFactor || 1
  const insetLeft = (wa.position.x - monitor.position.x) / scale
  const insetRight = (monitor.position.x + monitor.size.width - (wa.position.x + wa.size.width)) / scale
  const inset = Math.max(insetLeft, insetRight)
  if (inset < VERTICAL_W_MIN) return null
  return Math.min(VERTICAL_W_MAX, Math.round(inset))
}

/** 浏览器 / WebView 兜底：屏幕宽度与可用宽度之差即左右任务栏厚度 */
export function taskbarThicknessFromScreen(): number | null {
  try {
    const inset = window.screen.width - window.screen.availWidth
    if (inset >= VERTICAL_W_MIN) return Math.min(VERTICAL_W_MAX, Math.round(inset))
  } catch {
    /* ignore */
  }
  return null
}
