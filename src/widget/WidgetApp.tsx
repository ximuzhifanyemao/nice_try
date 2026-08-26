import { Component, useState, useCallback, type ReactNode } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { PhysicalSize } from '@tauri-apps/api/window'
import DesktopTimer from './DesktopTimer'
import Sidebar from '../components/Sidebar'
import App from '../App'

const WIDGET_W = 380
const WIDGET_H = 520
const FULL_W = 960
const FULL_H = 640

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
        await appWindow.setAlwaysOnTop(false)
      } else {
        await appWindow.setAlwaysOnTop(true)
        await appWindow.setSize(new PhysicalSize(WIDGET_W, WIDGET_H))
      }
    } catch {
      // 尺寸/置顶切换失败不阻塞 UI
    }
  }, [fullMode, appWindow])

  if (fullMode) {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
        {/* 顶部标题栏（可拖拽） */}
        <div
          data-tauri-drag-region
          className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 shrink-0 select-none"
        >
          <span data-tauri-drag-region className="text-sm font-semibold text-slate-300">
            大学深埋
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMode}
              className="flex items-center gap-1 px-2.5 h-7 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              ⤙ 精简计时
            </button>
            <button
              onClick={() => appWindow.close()}
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-600 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer"
              aria-label="关闭"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 侧边栏 + App 内容（Sidebar 必须在 Router 内部，由 App 接收） */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <FullAppBoundary>
            <App hideBottomTab hideNavbar sidebar={<Sidebar />} />
          </FullAppBoundary>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
      {/* 可拖拽标题栏 */}
      <div
        data-tauri-drag-region
        className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 shrink-0 select-none"
      >
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <span data-tauri-drag-region className="text-xs font-semibold text-slate-400">
            计时器
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMode}
            className="flex items-center gap-1 px-2 h-6 rounded-md text-[11px] text-slate-500 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            全部功能 ⤢
          </button>
          <button
            onClick={() => appWindow.close()}
            className="w-6 h-6 flex items-center justify-center rounded-md text-slate-600 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer"
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