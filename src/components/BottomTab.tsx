import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon, type IconName } from './Icon'

interface TabItem {
  key: string
  label: string
  icon: IconName
  path: string
}

/**
 * 底部导航（移动端）。
 *
 * 只保留 5 个高频入口，与桌面侧边栏保持同一顺序（首页 → 记录 → 计时 → 统计 → 我的），
 * 避免同一产品两端顺序不同造成肌肉记忆冲突。
 * 英语打卡 / 周总结 / 记一记 / 成就 / 目标 这些二级功能统一收进「我的」，
 * 其中英语打卡在首页另有显眼入口卡片。
 */
const ALL_TABS: TabItem[] = [
  { key: 'home', label: '首页', icon: 'home', path: '/' },
  { key: 'records', label: '记录', icon: 'pencil', path: '/my-records' },
  { key: 'timer', label: '计时', icon: 'clock', path: '/timer' },
  { key: 'summary', label: '统计', icon: 'chart', path: '/summary' },
  { key: 'profile', label: '我的', icon: 'user', path: '/profile' },
]

/**
 * 路径 → Tab 的映射表。
 *
 * 用前缀匹配覆盖子路由（/my-records/new、/my-records/:id/edit 等）。
 * 未命中的页面一律回落到「我的」——因为「我的」是二级功能的索引页，
 * 但**所有会落到「我的」的页面都必须显式列出**，否则新增页面时很容易出现
 * 「在 A 页面底部却高亮了 B」这类静默错误（历史上就踩过这个坑）。
 */
const ROUTE_TAB: [RegExp, string][] = [
  [/^\/$/, 'home'],
  [/^\/my-records/, 'records'],
  [/^\/timer/, 'timer'],
  [/^\/summary/, 'summary'],
  [/^\/english-checkin/, 'home'], // 由首页入口进入，高亮首页更符合来源直觉
  [/^\/politics/, 'home'], // 政治一页纸是应用内的正常页面，导航语境仍属于首页
  [/^\/study-notes/, 'home'], // 记一记主要从首页快捷入口进入
  [
    /^\/(profile|settings|goal|vocabulary|achievements|weekly-summary|trash|scan-qr|login|register)/,
    'profile',
  ],
]

function resolveActiveKey(pathname: string): string {
  for (const [pattern, key] of ROUTE_TAB) {
    if (pattern.test(pathname)) return key
  }
  return 'profile'
}

/** 当前焦点是否在可输入元素上（软键盘只会因输入而弹起） */
function isEditableFocused(): boolean {
  const el = document.activeElement as HTMLElement | null
  if (!el) return false
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.isContentEditable
  )
}

/**
 * 软键盘是否弹起。
 *
 * 两端表现不同：
 * - Android（adjustResize）：WebView 高度被压缩，window.innerHeight 变小；
 * - iOS / adjustPan：布局视口不变，只有 visualViewport 变矮。
 * 任一信号命中即视为键盘弹起——此时底部导航会被顶到键盘上方挡住输入框，需要临时隐藏。
 * 差值小于 120px 的波动（地址栏收缩、窗口拉伸）不算键盘。
 */
function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const THRESHOLD = 120
    const vv = window.visualViewport
    let baseHeight = window.innerHeight
    const update = () => {
      if (window.innerHeight > baseHeight) baseHeight = window.innerHeight
      const vvInset = vv ? window.innerHeight - (vv.height + vv.offsetTop) : 0
      const shrink = baseHeight - window.innerHeight
      setOpen(vvInset > THRESHOLD || (shrink > THRESHOLD && isEditableFocused()))
    }
    update()
    window.addEventListener('resize', update)
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)
    // 横竖屏切换会改变基准高度，重新取一次，避免误判
    const onOrientationChange = () => {
      baseHeight = window.innerHeight
      update()
    }
    window.addEventListener('orientationchange', onOrientationChange)
    return () => {
      window.removeEventListener('resize', update)
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
      window.removeEventListener('orientationchange', onOrientationChange)
    }
  }, [])
  return open
}

export default function BottomTab() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const keyboardOpen = useKeyboardOpen()

  // 未登录时只显示首页和登录，隐藏需要登录的功能入口
  const tabs = user ? ALL_TABS : ALL_TABS.filter((t) => t.key === 'home' || t.key === 'profile')
  const activeKey = resolveActiveKey(location.pathname)

  // 软键盘弹起时收起底部导航，避免它悬在键盘上方遮挡输入区域
  if (keyboardOpen) return null

  return (
    <nav className="flex sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/70 bg-white/90 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/90 pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab) => {
        const active = activeKey === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            aria-current={active ? 'page' : undefined}
            aria-label={tab.label}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors cursor-pointer ${
              active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
            }`}
          >
            <span
              className={`flex items-center justify-center rounded-full transition-all duration-200 ${
                active
                  ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 w-10 h-6 shadow-sm shadow-indigo-200/60 dark:shadow-none'
                  : 'w-6 h-6'
              }`}
            >
              <Icon name={tab.icon} size={active ? 17 : 18} strokeWidth={active ? 2.1 : 1.8} />
            </span>
            <span className={active ? 'font-semibold' : 'font-medium'}>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
