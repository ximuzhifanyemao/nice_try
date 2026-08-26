import { useState, useCallback } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { PhysicalSize } from '@tauri-apps/api/window'
import DesktopTimer from './DesktopTimer'
import Sidebar from '../components/Sidebar'
import App from '../App'

const WIDGET_W = 380
const WIDGET_H = 520
const FULL_W = 960
const FULL_H = 640

export default function WidgetApp() {
  const appWindow = getCurrentWindow()
  const [fullMode, setFullMode] = useState(false)

  const toggleMode = useCallback(async () => {
    const next = !fullMode
    setFullMode(next)
    if (next) {
      await appWindow.setAlwaysOnTop(false)
      await appWindow.setSize(new PhysicalSize(FULL_W, FULL_H))
    } else {
      await appWindow.setAlwaysOnTop(true)
      await appWindow.setSize(new PhysicalSize(WIDGET_W, WIDGET_H))
    }
  }, [fullMode, appWindow])

  if (fullMode) {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
        {/* 侧边栏 */}
        <Sidebar />

        {/* 主内容区 */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* 顶部标题栏（可拖拽） */}
          <div
            data-tauri-drag-region
            className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 shrink-0 select-none"
          >
            <span data-tauri-drag-region className="text-sm font-semibold text-slate-300">
              大学深埋
            </span>
            <button
              onClick={toggleMode}
              className="flex items-center gap-1 px-2.5 h-7 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              ⤙ 收起计时器
            </button>
          </div>

          {/* App 内容 */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <App hideBottomTab hideNavbar />
          </div>
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
            展开 ⤢
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
