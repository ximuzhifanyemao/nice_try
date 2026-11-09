const THEME_STORAGE_KEY = 'app_theme'

/** 主题：light/dark 为纯色基础主题；paper（纸墨）/ink（墨夜）为一页纸配色；dawn/dusk/starry 为氛围主题 */
export type ThemeMode = 'light' | 'dark' | 'paper' | 'ink' | 'dawn' | 'dusk' | 'starry'

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
  { key: 'paper', name: '纸墨', desc: '暖纸 · 朱印', dark: false, swatch: 'linear-gradient(135deg,#f4efe6,#a6342a)' },
  { key: 'dark', name: '深色', desc: '深夜蓝', dark: true, swatch: 'linear-gradient(135deg,#1e293b,#0f172a)' },
  { key: 'ink', name: '墨夜', desc: '墨底 · 朱砂', dark: true, swatch: 'linear-gradient(135deg,#241f1a,#e17969)' },
  { key: 'dawn', name: '晨光', desc: '晨曦渐变', dark: false, swatch: 'linear-gradient(135deg,#fdf4ff,#c7d2fe,#a5f3fc)' },
  { key: 'dusk', name: '暮色', desc: '星空渐变', dark: true, swatch: 'linear-gradient(135deg,#312e81,#0f172a,#1e3a8a)' },
  { key: 'starry', name: '午夜繁星', desc: '星际闪烁', dark: true, swatch: 'radial-gradient(circle at 30% 25%, #f8fafc 0 1px, transparent 2px), radial-gradient(circle at 65% 45%, #bae6fd 0 1px, transparent 2px), linear-gradient(135deg,#11173a,#05060f)' },
]

const DARK_THEMES = new Set<ThemeMode>(['dark', 'ink', 'dusk', 'starry'])
const VALID: ThemeMode[] = ['light', 'paper', 'dark', 'ink', 'dawn', 'dusk', 'starry']

function isTheme(v: unknown): v is ThemeMode {
  return typeof v === 'string' && (VALID as string[]).includes(v)
}

const THEME_MIGRATION_KEY = 'app_theme_paper_v1'

/**
 * 一次性把老用户的 light/dark 偏好迁移到纸墨/墨夜。
 * 晨光 / 暮色 / 午夜繁星属于用户主动选的氛围主题，保持不动；
 * 迁移只做一次，之后用户手动切回浅色/深色也不会再被改。
 */
function migrateLegacyTheme(saved: ThemeMode | null): ThemeMode | null {
  try {
    if (localStorage.getItem(THEME_MIGRATION_KEY)) return saved
    localStorage.setItem(THEME_MIGRATION_KEY, '1')
    if (saved === 'light') {
      localStorage.setItem(THEME_STORAGE_KEY, 'paper')
      return 'paper'
    }
    if (saved === 'dark') {
      localStorage.setItem(THEME_STORAGE_KEY, 'ink')
      return 'ink'
    }
  } catch {
    /* ignore */
  }
  return saved
}

/** 读取持久化主题；无记录时默认「纸墨」（系统深色偏好则用「墨夜」） */
export function getInitialTheme(): ThemeMode {
  let saved: ThemeMode | null = null
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (isTheme(raw)) saved = raw
  } catch {
    /* ignore */
  }
  saved = migrateLegacyTheme(saved)
  if (saved) return saved
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'ink' : 'paper'
  }
  return 'paper'
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
  // 同步移动端状态栏/浏览器地址栏底色（否则纸墨主题下仍是深蓝）
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute(
      'content',
      mode === 'paper' ? '#f4efe6' : mode === 'ink' ? '#15120f' : DARK_THEMES.has(mode) ? '#0f172a' : '#f8fafc',
    )
  }
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

/** 依次轮换主题（顺序与 THEMES 一致，末位回到首位） */
export function nextTheme(): ThemeMode {
  const current = getCurrentTheme()
  const idx = VALID.indexOf(current)
  const next = VALID[(idx + 1) % VALID.length]
  return setTheme(next)
}