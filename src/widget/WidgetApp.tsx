import { Component, useState, useCallback, useEffect, type ReactNode } from 'react'
import { getCurrentWindow, PhysicalSize, LogicalPosition, currentMonitor, type Window } from '@tauri-apps/api/window'
import DesktopTimer from './DesktopTimer'
import Sidebar from '../components/Sidebar'
import DesktopLogo from '../components/DesktopLogo'
import App from '../App'

/** 精简模式下窗口位置的持久化存储键 */
const WIDGET_POS_KEY = 'kaoyan_widget_pos'
/** 全功能模式下窗口位置的持久化存储键 */
const FULL_POS_KEY = 'kaoyan_widget_full_pos'
/** 模式记忆存储键：记住上次退出时是精简还是全部功能 */
const MODE_KEY = 'kaoyan_widget_mode'
const FULL_W = 1600
const FULL_H = 1000
const WIDGET_W = 380
const WIDGET_H = 520

/** 读取保存的窗口位置（{x,y}），无则返回 null */
function loadSavedPosition(key: string): { x: number; y: number } | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const pos = JSON.parse(raw)
    if (typeof pos?.x === 'number' && typeof pos?.y === 'number') return pos
  } catch {
    // ignore
  }
  return null
}

/**
 * 校验保存的位置是否落在屏幕可见区域内（含一定的安全边距）。
 * 若窗口完全在屏幕外（例如之前被拖到副屏/边缘，或副屏已断开），
 * 返回 null 让调用方回退到居中，避免「任务栏有程序但看不到窗口」。
 */
async function sanitizePosition(
  pos: { x: number; y: number },
  w: number,
  h: number
): Promise<{ x: number; y: number } | null> {
  try {
    const monitor = await currentMonitor()
    if (!monitor) return pos // 拿不到显示器信息时按原值恢复
    const { width, height } = monitor.size
    // 窗口必须与屏幕工作区有交集（每个方向留 20px 安全边）
    const visibleX = pos.x + w > 20 && pos.x < width - 20
    const visibleY = pos.y + h > 20 && pos.y < height - 20
    return visibleX && visibleY ? pos : null
  } catch {
    return pos
  }
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
  const appWindow: Window = getCurrentWindow()
  // 记忆模式：初始状态读取上次退出时保存的模式
  const [fullMode, setFullMode] = useState(() => localStorage.getItem(MODE_KEY) === 'full')

  /** 将窗口切换到指定模式：精简(compact) / 全部功能(full)，调整尺寸/置顶/位置 */
  const applyMode = useCallback(async (next: boolean) => {
    setFullMode(next)
    try {
      if (next) {
        // 进入全部功能：窗口在屏幕中心展开
        await appWindow.setResizable(true)
        await appWindow.setSize(new PhysicalSize(FULL_W, FULL_H))
        await appWindow.setResizable(false)
        await appWindow.setAlwaysOnTop(false)
        await appWindow.center()
      } else {
        await appWindow.setAlwaysOnTop(true)
        await appWindow.setResizable(true)
        await appWindow.setSize(new PhysicalSize(WIDGET_W, WIDGET_H))
        await appWindow.setResizable(false)
        // 恢复保存的精简窗口位置（若跑到屏幕外则居中）
        const pos = loadSavedPosition(WIDGET_POS_KEY)
        if (pos && (await sanitizePosition(pos, WIDGET_W, WIDGET_H))) {
          await appWindow.setPosition(new LogicalPosition(pos.x, pos.y))
        } else {
          await appWindow.center()
        }
      }
    } catch {
      // 尺寸/置顶切换失败不阻塞 UI
    }
  }, [appWindow])

  const toggleMode = useCallback(() => {
    const next = !fullMode
    localStorage.setItem(MODE_KEY, next ? 'full' : 'compact')
    applyMode(next)
  }, [fullMode, applyMode])

  // 启动时始终让精简窗口居中显示（满足「默认应用启动窗口在屏幕中间」）
  useEffect(() => {
    if (fullMode) return
    let cancelled = false
    ;(async () => {
      if (!cancelled) {
        appWindow.center().catch(() => {})
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 记忆模式：若上次退出时处于「全部功能」，启动即恢复展开的窗口尺寸/置顶并居中
  useEffect(() => {
    if (fullMode) {
      applyMode(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 监听窗口移动，把当前位置持久化到 localStorage（精简/全功能各存各的 key）
  useEffect(() => {
    let unlisten: (() => void) | undefined
    let cancelled = false
    appWindow
      .onMoved(({ payload }) => {
        if (cancelled) return
        try {
          localStorage.setItem(fullMode ? FULL_POS_KEY : WIDGET_POS_KEY, JSON.stringify({ x: payload.x, y: payload.y }))
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
        {/* 顶部标题栏（全功能模式：可拖动窗口） */}
        <div
          data-tauri-drag-region
          className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-slate-800 shrink-0 select-none"
        >
          <div data-tauri-drag-region className="flex items-center gap-2">
            <DesktopLogo size={22} />
            <span data-tauri-drag-region className="text-sm font-semibold text-gray-700 dark:text-slate-300">
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

        {/* 侧边栏 + App 内容（Sidebar 必须在 Router 内部，由 App 接收），固定一屏显示，不出现可下拉的滚动条 */}
        <div className="flex-1 min-h-0 overflow-hidden">
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
          <DesktopLogo size={16} />
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