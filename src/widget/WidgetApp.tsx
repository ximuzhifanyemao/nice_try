import { Component, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { getCurrentWindow, LogicalSize, PhysicalPosition, currentMonitor, type Window } from '@tauri-apps/api/window'
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
 * 校验保存的位置是否落在屏幕可见区域内（含安全边距）。
 * onMoved 提供的是物理坐标（PhysicalPosition），monitor.size 也是物理像素，
 * 两者单位一致，直接比较即可。
 * 要求窗口至少有 60px 落在屏幕内，否则视为不可见返回 null，让调用方回退到居中，
 * 避免高 DPI/多显示器/副屏断开后窗口"消失"。
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
    // 要求窗口至少有 60px 落在屏幕内，否则视为不可见，回退居中
    const visibleX = pos.x + w > 60 && pos.x < width - 60
    const visibleY = pos.y + h > 60 && pos.y < height - 60
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
  // 标记当前是否正在切换模式：切换过程中由 setSize/setPosition 等触发的 onMoved 应跳过落盘，避免覆盖正确位置
  const switchingRef = useRef(false)

  /** 将窗口切换到指定模式：精简(compact) / 全部功能(full)，调整尺寸/置顶/位置 */
  const applyMode = useCallback(async (next: boolean) => {
    setFullMode(next)
    switchingRef.current = true
    try {
      if (next) {
        // 进入全部功能：窗口在屏幕中心展开
        await appWindow.setResizable(true)
        // 钳制到显示器工作区可用尺寸，避免窄屏/小工作区下溢出屏幕
        let w = FULL_W
        let h = FULL_H
        try {
          const monitor = await currentMonitor()
          if (monitor) {
            // monitor.size 为物理像素，除以 scaleFactor 换算为逻辑像素，与 setSize 的逻辑单位一致
            const scale = monitor.scaleFactor || 1
            const logicalW = monitor.size.width / scale
            const logicalH = monitor.size.height / scale
            w = Math.min(FULL_W, logicalW)
            h = Math.min(FULL_H, logicalH)
            // 至少保留合理下限，避免过度钳制导致窗口过小
            w = Math.max(w, Math.min(960, logicalW))
            h = Math.max(h, Math.min(700, logicalH))
          }
        } catch {
          // 取显示器失败则维持 1600×1000 兜底
        }
        await appWindow.setSize(new LogicalSize(w, h))
        await appWindow.setResizable(false)
        await appWindow.setAlwaysOnTop(false)
        await appWindow.center()
        // 保险：确保展开后窗口可见
        await appWindow.show().catch(() => {})
      } else {
        await appWindow.setAlwaysOnTop(true)
        await appWindow.setResizable(true)
        await appWindow.setSize(new LogicalSize(WIDGET_W, WIDGET_H))
        await appWindow.setResizable(false)
        // 恢复保存的精简窗口位置（若跑到屏幕外则居中）
        const pos = loadSavedPosition(WIDGET_POS_KEY)
        if (pos && (await sanitizePosition(pos, WIDGET_W, WIDGET_H))) {
          // onMoved 提供的是物理坐标，恢复时也必须用物理单位，避免高 DPI 下窗口跑到屏外
          await appWindow.setPosition(new PhysicalPosition(pos.x, pos.y))
        } else {
          await appWindow.center()
        }
        // 保险：确保缩小后窗口可见（防止 DPI/屏幕变化导致窗口"消失"）
        await appWindow.show().catch(() => {})
      }
    } catch {
      // 尺寸/置顶切换失败不阻塞 UI
    } finally {
      switchingRef.current = false
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
        // 切换模式过程中由 setSize/setPosition/center 触发的移动不落盘，避免覆盖正确位置
        if (switchingRef.current) return
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
          className="flex items-center justify-end px-4 py-2.5 border-b border-gray-200 dark:border-slate-800 shrink-0 select-none"
        >
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMode}
              className="flex items-center gap-1 px-2.5 h-7 rounded-md text-xs text-gray-500 hover:text-slate-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              ⤙ 精简计时
            </button>
            <button
              onClick={() => appWindow.minimize()}
              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-slate-900 hover:bg-gray-100 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              aria-label="最小化"
              title="最小化"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14" />
              </svg>
            </button>
            <button
              onClick={() => appWindow.close()}
              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-slate-900 hover:bg-gray-100 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              aria-label="关闭"
              title="关闭"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 侧边栏 + App 内容（Sidebar 必须在 Router 内部，由 App 接收）
        首页靠 fillHeight/forceTwoCol 内部严格一屏无滚动条；
        记录统计、打卡等页面内容超高时允许纵向滚动 */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <FullAppBoundary>
            <App hideBottomTab hideNavbar sidebar={<Sidebar />} fillHeight forceTwoCol />
          </FullAppBoundary>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7)]">
      {/* 顶部环境光：深色挂件里加一点品牌色呼吸感 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-indigo-500/15 via-indigo-500/5 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-violet-500/10 blur-2xl"
      />

      {/* 可拖拽标题栏 */}
      <div
        data-tauri-drag-region
        className="relative flex shrink-0 select-none items-center justify-between px-3 py-2"
      >
        <div className="flex items-center gap-1.5">
          <DesktopLogo size={17} />
          <span data-tauri-drag-region className="bg-gradient-to-r from-indigo-300 via-violet-300 to-indigo-300 bg-clip-text text-xs font-bold tracking-wide text-transparent">
            DiveDeep
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={toggleMode}
            title="全部功能"
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 3h6v6" />
              <path d="M9 21H3v-6" />
              <path d="M21 3l-7 7" />
              <path d="M3 21l7-7" />
            </svg>
          </button>
          <button
            onClick={() => appWindow.minimize()}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 cursor-pointer"
            aria-label="最小化"
            title="最小化"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M5 12h14" />
            </svg>
          </button>
          <button
            onClick={() => appWindow.close()}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-500/15 hover:text-red-400 cursor-pointer"
            aria-label="关闭"
            title="关闭"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 计时内容 */}
      <div className="relative min-h-0 flex-1">
        <DesktopTimer />
      </div>
    </div>
  )
}