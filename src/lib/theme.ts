const THEME_STORAGE_KEY = 'app_theme'

/** 主题：light/dark 为纯色基础主题；dawn（晨光）/dusk（暮色）/starry（午夜繁星）为氛围主题 */
export type ThemeMode = 'light' | 'dark' | 'dawn' | 'dusk' | 'starry'

export interface ThemeMeta {
  key: ThemeMode
  name: string
  desc: string
  /** 是否属于暗色系（决定 html.dark 是否启用） */
  dark: boolean
  /** 主题选择器里的渐变色块 */
  swatch: string
}

export const THEMES: ThemeMeta[] = [
  { key: 'light', name: '浅色', desc: '纯净白', dark: false, swatch: 'linear-gradient(135deg,#f8fafc,#e2e8f0)' },
  { key: 'dark', name: '深色', desc: '深夜蓝', dark: true, swatch: 'linear-gradient(135deg,#1e293b,#0f172a)' },
  { key: 'dawn', name: '晨光', desc: '晨曦渐变', dark: false, swatch: 'linear-gradient(135deg,#fdf4ff,#c7d2fe,#a5f3fc)' },
  { key: 'dusk', name: '暮色', desc: '星空渐变', dark: true, swatch: 'linear-gradient(135deg,#312e81,#0f172a,#1e3a8a)' },
  { key: 'starry', name: '午夜繁星', desc: '星际闪烁', dark: true, swatch: 'radial-gradient(circle at 30% 25%, #f8fafc 0 1px, transparent 2px), radial-gradient(circle at 65% 45%, #bae6fd 0 1px, transparent 2px), linear-gradient(135deg,#11173a,#05060f)' },
]

const DARK_THEMES = new Set<ThemeMode>(['dark', 'dusk', 'starry'])
const VALID: ThemeMode[] = ['light', 'dark', 'dawn', 'dusk', 'starry']

function isTheme(v: unknown): v is ThemeMode {
  return typeof v === 'string' && (VALID as string[]).includes(v)
}

/** 读取持久化主题；无记录时跟随系统偏好 */
export function getInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (isTheme(saved)) return saved
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

/** 当前生效的主题（供组件初始化显示） */
export function getCurrentTheme(): ThemeMode {
  const attr = document.documentElement.getAttribute('data-theme')
  if (isTheme(attr)) return attr
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/** 应用主题到 <html>：data-theme 标识主题，dark class 决定 dark: 变体是否生效 */
export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  root.classList.toggle('dark', DARK_THEMES.has(mode))
  root.setAttribute('data-theme', mode)
}

/** 设置并持久化主题 */
export function setTheme(mode: ThemeMode): ThemeMode {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode)
  } catch {
    /* ignore */
  }
  applyTheme(mode)
  return mode
}

/** 依次轮换主题：light → dark → dawn → dusk → light */
export function nextTheme(): ThemeMode {
  const current = getCurrentTheme()
  const idx = VALID.indexOf(current)
  const next = VALID[(idx + 1) % VALID.length]
  return setTheme(next)
}