import { Component, useState, useCallback, useEffect, type ReactNode } from 'react'
import { getCurrentWindow, PhysicalSize, LogicalPosition } from '@tauri-apps/api/window'
import DesktopTimer from './DesktopTimer'
import Sidebar from '../components/Sidebar'
import Logo from '../components/Logo'
import App from '../App'

const WIDGET_W = 380
const WIDGET_H = 520
const FULL_W = 1120
const FULL_H = 760

/** 精简模式下窗口位置的持久化存储键 */
const WIDGET_POS_KEY = 'kaoyan_widget_pos'

/** 读取保存的精简窗口位置（{x,y}），无则返回 null */
function loadCompactPosition(): { x: number; y: number } | null {
  try {
    const raw = localStorage.getItem(WIDGET_POS_KEY)
    if (!raw) return null
    const pos = JSON.parse(raw)
    if (typeof pos?.x === 'number' && typeof pos?.y === 'number') return pos
  } catch {
    // ignore
  }
  return null
}

/** 「全部功能」模式下的容错边界：任一页面运行时出错时给出可见提示，避免整窗黑屏 */
class FullAppBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null }

  static getDerivedStateFromError(err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center gap-3 px-6 bg-slate-950 text-slate-200">
          <p className="text-sm">展开时页面出错：{this.state.error}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function WidgetApp() {
  const appWindow = getCurrentWindow()
  const [fullMode, setFullMode] = useState(false)

  const toggleMode = useCallback(async () => {
    const next = !fullMode
    setFullMode(next)
    // 先改尺寸、再切换置顶：部分平台在扩容时置顶切换会触发 WebView 重绘异常，导致黑屏
    try {
      if (next) {
        await appWindow.setSize(new PhysicalSize(FULL_W, FULL_H))
        await appWindow.setResizable(false)
        await appWindow.setAlwaysOnTop(false)
      } else {
        await appWindow.setAlwaysOnTop(true)
        await appWindow.setResizable(false)
        await appWindow.setSize(new PhysicalSize(WIDGET_W, WIDGET_H))
        // 恢复保存的精简窗口位置
        const pos = loadCompactPosition()
        if (pos) {
          await appWindow.setPosition(new LogicalPosition(pos.x, pos.y))
        }
      }
    } catch {
      // 尺寸/置顶切换失败不阻塞 UI
    }
  }, [fullMode, appWindow])

  // 组件挂载时（精简模式）恢复保存的位置
  useEffect(() => {
    if (fullMode) return
    const pos = loadCompactPosition()
    if (pos) {
      appWindow.setPosition(new LogicalPosition(pos.x, pos.y)).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 精简模式下监听窗口移动，把位置持久化到 localStorage
  useEffect(() => {
    if (fullMode) return
    let unlisten: (() => void) | undefined
    let cancelled = false
    appWindow
      .onMoved(({ payload }) => {
        if (cancelled) return
        try {
          localStorage.setItem(WIDGET_POS_KEY, JSON.stringify({ x: payload.x, y: payload.y }))
        } catch {
          // 写入失败不影响使用
        }
      })
      .then((fn) => {
        unlisten = fn
      })
    return () => {
      cancelled = true
      unlisten?.()
    }
  }, [fullMode, appWindow])

  if (fullMode) {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-gray-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {/* 顶部标题栏（全功能模式：固定窗口，不可拖拽） */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-slate-800 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <Logo size={18} />
            <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
              DiveDeep
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMode}
              className="flex items-center gap-1 px-2.5 h-7 rounded-md text-xs text-gray-500 hover:text-slate-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              ⤙ 精简计时
            </button>
            <button
              onClick={() => appWindow.minimize()}
              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-slate-900 hover:bg-gray-100 dark:text-slate-600 dark:hover:text-slate-200 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              aria-label="最小化"
              title="最小化"
            >
              ─
            </button>
            <button
              onClick={() => appWindow.close()}
              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-slate-900 hover:bg-gray-100 dark:text-slate-600 dark:hover:text-slate-200 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              aria-label="关闭"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 侧边栏 + App 内容（Sidebar 必须在 Router 内部，由 App 接收） */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <FullAppBoundary>
            <App hideBottomTab hideNavbar sidebar={<Sidebar />} fillHeight forceTwoCol />
          </FullAppBoundary>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-2xl">
      {/* 可拖拽标题栏 */}
      <div
        data-tauri-drag-region
        className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 shrink-0 select-none"
      >
        <div className="flex items-center gap-1.5">
          <Logo size={14} />
          <span data-tauri-drag-region className="text-xs font-semibold text-gray-600 dark:text-slate-400">
            DiveDeep
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMode}
            className="flex items-center gap-1 px-2 h-6 rounded-md text-[11px] text-gray-500 hover:text-slate-900 hover:bg-gray-100 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            全部功能 ⤢
          </button>
          <button
            onClick={() => appWindow.minimize()}
            className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-slate-900 hover:bg-gray-100 dark:text-slate-600 dark:hover:text-slate-200 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            aria-label="最小化"
            title="最小化"
          >
            ─
          </button>
          <button
            onClick={() => appWindow.close()}
            className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-slate-900 hover:bg-gray-100 dark:text-slate-600 dark:hover:text-slate-200 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 计时内容 */}
      <div className="flex-1 min-h-0">
        <DesktopTimer />
      </div>
    </div>
  )
}