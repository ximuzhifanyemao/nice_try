import { Component, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { getCurrentWindow, LogicalSize, PhysicalPosition, currentMonitor, type Window } from '@tauri-apps/api/window'
import CapsuleStrip from './CapsuleStrip'
import SubjectPicker from './SubjectPicker'
import Sidebar from '../components/Sidebar'
import App from '../App'
import { saveSharedTimer } from '../lib/timerSync'

/** 精简模式下窗口位置的持久化存储键 */
const WIDGET_POS_KEY = 'kaoyan_widget_pos'
/** 全功能模式下窗口位置的持久化存储键 */
const FULL_POS_KEY = 'kaoyan_widget_full_pos'
/** 模式记忆存储键：记住上次退出时是精简还是全部功能 */
const MODE_KEY = 'kaoyan_widget_mode'
const FULL_W = 1600
const FULL_H = 1000
/** 胶囊条宽度：保证「选择科目开始」等文案完整显示 */
const WIDGET_W = 460
/** 胶囊条常态高度（尽量紧凑，比原 64 略矮） */
const WIDGET_H = 56
/** 科目下拉高度（选科后自动收回胶囊条），含本周目标进度行 */
const DROPDOWN_H = 300

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
  // 胶囊条科目下拉是否打开（窗口高度增至 360，选科后自动收回）
  const [dropdownOpen, setDropdownOpen] = useState(false)
  // 标记当前是否正在切换模式：切换过程中由 setSize/setPosition 等触发的 onMoved 应跳过落盘，避免覆盖正确位置
  const switchingRef = useRef(false)
  // 展开下拉前记录胶囊条位置，收起时恢复，避免贴底展开导致窗口被顶离原处
  const preExpandPosRef = useRef<{ x: number; y: number } | null>(null)

  /** 将窗口切换到指定模式：精简(compact) / 全部功能(full)，调整尺寸/置顶/位置 */
  const applyMode = useCallback(async (next: boolean) => {
    setFullMode(next)
    // 科目下拉只属于精简模式，切换模式时一律复位为胶囊条
    setDropdownOpen(false)
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
        // 显式居中：以当前显示器中心为对称点放置窗口，避免窗口停在角落时展开伸出桌面
        try {
          const monitor = await currentMonitor()
          if (monitor) {
            const scale = monitor.scaleFactor || 1
            const cx = monitor.position.x + Math.round(monitor.size.width / 2)
            const cy = monitor.position.y + Math.round(monitor.size.height / 2)
            const wPhys = Math.round(w * scale)
            const hPhys = Math.round(h * scale)
            await appWindow.setPosition(new PhysicalPosition(cx - Math.round(wPhys / 2), cy - Math.round(hPhys / 2)))
          } else {
            // 拿不到显示器信息则回退默认居中
            await appWindow.center().catch(() => {})
          }
        } catch {
          // 显式居中失败则回退默认居中
          await appWindow.center().catch(() => {})
        }
        await appWindow.setResizable(false)
        await appWindow.setAlwaysOnTop(false)
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

  /**
   * 加高窗口（展开面板/科目下拉）：
   * 以胶囊条底部为锚「从下往上展开」——展开时底部保持原位、顶部向上生长，
   * 并在上下/左右越界时自动收进屏幕，保证整块面板可见。
   */
  const openLayer = useCallback(
    async (height: number) => {
      try {
        preExpandPosRef.current = (await appWindow.outerPosition().catch(() => null)) ?? null
        const monitor = await currentMonitor()
        const scale = monitor?.scaleFactor || 1
        const cur = (await appWindow.outerPosition().catch(() => null)) ?? null
        let nx = cur?.x ?? 0
        // 顶边上移 (新高度 - 胶囊高)，底部保持不动
        let ny = (cur?.y ?? 0) - Math.round((height - WIDGET_H) * scale)
        if (monitor && cur) {
          const top = monitor.position.y
          const bottom = monitor.position.y + monitor.size.height
          const left = monitor.position.x
          const right = monitor.position.x + monitor.size.width
          const physW = Math.round(WIDGET_W * scale)
          const physH = Math.round(height * scale)
          // 左右越界收进屏幕
          if (nx < left) nx = left
          if (nx + physW > right) nx = right - physW
          // 垂直：优先保持底部不动向上长；仍越界时贴顶/贴底兜底
          if (ny < top) ny = top
          if (ny + physH > bottom) ny = bottom - physH
        }
        await appWindow.setPosition(new PhysicalPosition(nx, ny))
        await appWindow.setSize(new LogicalSize(WIDGET_W, height))
        await appWindow.show().catch(() => {})
      } catch {
        // 尺寸调整失败不阻塞 UI
      }
    },
    [appWindow],
  )

  /** 收回胶囊条高度，并恢复展开前记录的窗口位置 */
  const closeLayer = useCallback(async () => {
    try {
      await appWindow.setSize(new LogicalSize(WIDGET_W, WIDGET_H))
      if (preExpandPosRef.current) {
        await appWindow.setPosition(new PhysicalPosition(preExpandPosRef.current.x, preExpandPosRef.current.y))
        preExpandPosRef.current = null
      }
      await appWindow.show().catch(() => {})
    } catch {
      // 尺寸调整失败不阻塞 UI
    }
  }, [appWindow])

  const openDropdown = useCallback(() => {
    setDropdownOpen(true)
    openLayer(DROPDOWN_H)
  }, [openLayer])

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false)
    closeLayer()
  }, [closeLayer])

  /** 下拉里选中科目：写入共享计时并收回胶囊条 */
  const quickStart = useCallback(
    (subjectId: string, activity: string) => {
      saveSharedTimer({ subjectId, activity, startTime: Date.now() })
      closeDropdown()
    },
    [closeDropdown],
  )

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
      <div className="theme-surface relative isolate flex h-screen w-screen flex-col overflow-hidden bg-gray-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
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
    <div
      data-tauri-drag-region={dropdownOpen ? undefined : 'deep'}
      className={`theme-surface relative isolate flex h-screen w-screen overflow-hidden border border-gray-200 bg-white text-slate-900 shadow-[0_16px_48px_-20px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7)] ${
        dropdownOpen ? 'flex-col rounded-2xl' : 'flex-row items-center rounded-full'
      }`}
    >
      {/* 顶部环境光：仅下拉展开时展示 */}
      {dropdownOpen && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-14 h-24 bg-gradient-to-b from-indigo-400/10 via-indigo-400/5 to-transparent dark:from-indigo-500/15 dark:via-indigo-500/5 dark:to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 top-0 h-36 w-36 rounded-full bg-violet-500/10 blur-2xl"
          />
        </>
      )}

      {/* 胶囊条：品牌/科目 + 实时计时 + 开始/结束；右侧为窗口控制
          deep 拖拽区：胶囊条任意位置（含文字/空白/内边距）均可拖动窗口，按钮除外 */}
      <div
        data-tauri-drag-region="deep"
        className={`relative z-10 flex shrink-0 select-none items-center ${
          dropdownOpen ? 'h-14 w-full gap-2 border-b border-gray-200 px-3 dark:border-slate-800' : 'w-full min-w-0 flex-1 gap-2 pl-3 pr-2'
        }`}
      >
        <CapsuleStrip expanded={dropdownOpen} onOpenDropdown={openDropdown} />
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={toggleMode}
            title="全部功能"
            aria-label="全部功能"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-gray-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 3h6v6" />
              <path d="M9 21H3v-6" />
              <path d="M21 3l-7 7" />
              <path d="M3 21l7-7" />
            </svg>
          </button>
          {dropdownOpen && (
            <button
              onClick={() => appWindow.minimize()}
              aria-label="最小化"
              title="最小化"
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-gray-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14" />
              </svg>
            </button>
          )}
          <button
            onClick={() => appWindow.close()}
            title="关闭"
            aria-label="关闭"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-slate-400 dark:hover:bg-red-500/15 dark:hover:text-red-400 cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 科目下拉（快速开始，选科后自动收回胶囊条） */}
      {dropdownOpen && (
        <div className="relative min-h-0 flex-1 border-t border-gray-200 dark:border-slate-800">
          <SubjectPicker onPick={quickStart} onClose={closeDropdown} />
        </div>
      )}
    </div>
  )
}