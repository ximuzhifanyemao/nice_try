import { Component, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { getCurrentWindow, LogicalSize, PhysicalPosition, currentMonitor, type Window } from '@tauri-apps/api/window'
import CapsuleStrip from './CapsuleStrip'
import SubjectPicker from './SubjectPicker'
import Sidebar, { desktopPageTitle } from '../components/Sidebar'
import App from '../App'
import { saveSharedTimer } from '../lib/timerSync'
import { loadPomoFocusMin, savePomoState, startPomo, type TimerMode } from '../lib/pomodoro'
import {
  getWidgetOrientation,
  subscribeWidgetOrientation,
  taskbarThickness,
  taskbarThicknessFromScreen,
  VERTICAL_H,
  VERTICAL_W_FALLBACK,
  type WidgetOrientation,
} from '../lib/widgetOrientation'

declare global {
  interface Window {
    /**
     * 内部标记：科目列表内容块已挂载（回调 ref 置位）。
     * 用于让 WidgetApp 的 effect 知道「待观察节点刚就位」，立即测一次高度；
     * 未置位时（例如刷新后下拉已开）由 ResizeObserver 兜底。
     */
    __widgetContentReady?: boolean
  }
}

/** 精简模式下窗口位置的持久化存储键 */
const WIDGET_POS_KEY = 'kaoyan_widget_pos'
/** 全功能模式下窗口位置的持久化存储键 */
const FULL_POS_KEY = 'kaoyan_widget_full_pos'
/** 模式记忆存储键：记住上次退出时是精简还是全部功能 */
const MODE_KEY = 'kaoyan_widget_mode'
/**
 * 全功能窗口的期望尺寸。
 * 1440×900：在 1080p（逻辑约 1707×1067、150% 缩放）上留出足够余量，
 * 内容列仍有约 1250px 宽，足够两栏铺开；比 1600×1000 更不容易顶到任务栏。
 * 实际尺寸还会按显示器工作区钳制，见 applyMode。
 */
const FULL_W = 1440
const FULL_H = 900
/**
 * 任务栏/底栏预留高度（逻辑像素）。
 * Tauri 的 Monitor 只给整屏尺寸、不给工作区，这里按常见任务栏高度预留，
 * 避免全功能窗口居中后底边被任务栏盖住。
 */
const TASKBAR_MARGIN = 48
/**
 * 胶囊条宽度：保证「选择科目开始」等文案完整显示。
 * 500（原 460）：右侧多了「今日时长」小按钮，加宽 40px 才能让中间计时数字不被挤掉。
 */
const WIDGET_W = 500
/** 胶囊条常态高度（尽量紧凑） */
const WIDGET_H = 52
/** 科目下拉常态高度（内容放得下时就用它，避免窗口无谓变大） */
const DROPDOWN_H_BASE = 300
/**
 * 下拉面板之外的固定高度：根容器上下各 1px 边框 + 52px 胶囊条行 + 面板上方 1px 分隔线。
 * 这几段都是同一份布局里的写死高度（见 CompactShell），直接量常数比从 DOM 反推可靠：
 * 展开瞬间窗口还没变高，反推会退化成「胶囊条高度」，窗口就永远漏掉面板头部那几十像素。
 */
const DROPDOWN_OUTER_CHROME = WIDGET_H + 3
/**
 * 科目下拉高度上限的兜底值（拿不到显示器信息时使用）。
 * 正常情况下的上限由显示器可用高度决定（见下方 effect）：
 * 用户要求「科目一页看全、不要翻页」，所以不再按半屏截断，
 * 而是允许窗口长到几乎占满可用高度，只有科目真的多到放不下才在列表内部滚动。
 */
const DROPDOWN_H_CAP = 560
/** 科目下拉的绝对上限：超大显示器上也不让面板无限长下去 */
const DROPDOWN_H_ABS_CAP = 1000

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

/**
 * 简洁模式窗口的基础尺寸。
 * 横向是固定的 500×52 胶囊条；竖向宽度取「显示器工作区相对整屏的内缩量」，
 * 也就是用户左侧任务栏的实际厚度（拿不到时先退回屏幕 API，再退回 48）。
 */
async function compactBaseSize(orientation: WidgetOrientation): Promise<{ width: number; height: number }> {
  if (orientation !== 'vertical') return { width: WIDGET_W, height: WIDGET_H }
  let thickness: number | null = null
  try {
    thickness = taskbarThickness(await currentMonitor())
  } catch {
    /* 取显示器失败时走后面的兜底 */
  }
  if (thickness === null) thickness = taskbarThicknessFromScreen()
  return { width: thickness ?? VERTICAL_W_FALLBACK, height: VERTICAL_H }
}

/** 把窗口整体收进显示器工作区：换方向后尺寸变了，原位置可能有一部分落在屏幕外 */
async function clampIntoWorkArea(win: Window, width: number, height: number): Promise<void> {
  try {
    const [monitor, pos] = await Promise.all([currentMonitor().catch(() => null), win.outerPosition().catch(() => null)])
    if (!monitor?.workArea || !pos) return
    const scale = monitor.scaleFactor || 1
    const w = Math.round(width * scale)
    const h = Math.round(height * scale)
    const left = monitor.workArea.position.x
    const top = monitor.workArea.position.y
    const right = left + monitor.workArea.size.width
    const bottom = top + monitor.workArea.size.height
    let x = pos.x
    let y = pos.y
    if (x + w > right) x = right - w
    if (x < left) x = left
    if (y + h > bottom) y = bottom - h
    if (y < top) y = top
    if (x !== pos.x || y !== pos.y) await win.setPosition(new PhysicalPosition(x, y))
  } catch {
    /* 位置校正失败不阻塞使用 */
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

/** 窗口控制按钮的统一样式：图标按钮，悬停给底色反馈 */
const windowBtnBase =
  'flex h-7 w-7 items-center justify-center rounded-md transition-colors cursor-pointer focus-visible:outline-none'

/**
 * 全功能模式的窗口标题栏：整条都是窗口拖拽区，左侧显示当前页面名（桌面窗口惯例），
 * 右侧放模式切换与窗口控制。
 * 高度与侧边栏品牌区（h-12）一致，两者顶部落在同一水平线上、横线连贯。
 * 由 App 渲染在右侧内容列顶部（侧边栏不在该列内），因此只横跨内容区、不参与滚动。
 */
function FullModeTitleBar({ onToggleMode }: { onToggleMode: () => void }) {
  const { pathname } = useLocation()
  return (
    <div
      data-tauri-drag-region
      className="flex h-12 shrink-0 select-none items-center gap-1 border-b border-gray-200 px-3 dark:border-slate-800/80"
    >
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-gray-500 dark:text-slate-400">
        {desktopPageTitle(pathname)}
      </span>
      <button
        onClick={onToggleMode}
        title="切换到置顶计时小挂件"
        className="flex h-7 cursor-pointer items-center gap-1 rounded-md px-2.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 21H3v-6" />
          <path d="M3 21l7-7" />
        </svg>
        精简计时
      </button>
      <span className="mx-0.5 h-4 w-px bg-gray-200 dark:bg-slate-800" aria-hidden="true" />
      <button
        onClick={() => getCurrentWindow().minimize()}
        className={`${windowBtnBase} text-gray-400 hover:bg-gray-100 hover:text-slate-900 dark:text-slate-500 dark:hover:bg-slate-800/60 dark:hover:text-slate-200`}
        aria-label="最小化"
        title="最小化"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
          <path d="M5 12h14" />
        </svg>
      </button>
      <button
        onClick={() => getCurrentWindow().close()}
        className={`${windowBtnBase} text-gray-400 hover:bg-rose-50 hover:text-rose-500 dark:text-slate-500 dark:hover:bg-rose-500/15 dark:hover:text-rose-400`}
        aria-label="关闭"
        title="关闭"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

/**
 * 全功能模式的窗口外壳：左侧常驻侧边栏 + 右侧内容（顶部一条可拖动标题栏）。
 *
 * 用 h-full/w-full 填满宿主窗口，而不是 h-screen/w-screen：
 * 窗口尺寸本来就由 Tauri 固定，跟随宿主更准确，也让预览台能把它放进任意尺寸容器里审阅
 * （高度链条靠 index.css 的 html/body/#root=100% 与 App 的 fillHeight 成立）。
 *
 * 侧边栏必须由 App 在 HashRouter 内部渲染（Sidebar 用了 useLocation），
 * 因此滚动职责也放在 App 里：只有右侧内容列滚动，侧边栏整列固定在窗口高度上，
 * 滚轮上划下滑都不会带着它移动。
 */
export function FullModeShell({ onToggleMode }: { onToggleMode: () => void }) {
  return (
    <div className="theme-surface relative isolate flex h-full w-full overflow-hidden bg-gray-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      <FullAppBoundary>
        <App
          hideBottomTab
          hideNavbar
          fillHeight
          forceTwoCol
          sidebar={<Sidebar />}
          topBar={<FullModeTitleBar onToggleMode={onToggleMode} />}
        />
      </FullAppBoundary>
    </div>
  )
}

/**
 * 精简模式的窗口外壳：胶囊条 + 可展开的科目下拉。
 * dropdownOpen / dropdownClosing 由调用方控制，因此预览台可以强制展开下拉来审阅该界面，
 * 无需真的去改窗口尺寸。
 */
export function CompactShell({
  dropdownOpen,
  dropdownClosing,
  vertical,
  onToggleMode,
  onOpenDropdown,
  onCloseDropdown,
  onPick,
  dropdownContentRef,
}: {
  dropdownOpen: boolean
  dropdownClosing: boolean
  /** 竖向窄条（设置页可切换）；打开科目下拉时临时切回横向 500 宽的标准面板 */
  vertical?: boolean
  onToggleMode: () => void
  onOpenDropdown: () => void
  onCloseDropdown: () => void
  onPick: (subjectId: string, activity: string, mode: TimerMode) => void
  /** 透传给 SubjectPicker 的科目列表内容块回调 ref（供 WidgetApp 测量并加高窗口） */
  dropdownContentRef?: (node: HTMLDivElement | null) => void
}) {
  const window = getCurrentWindow()

  /* 竖向窄条：宽度由窗口尺寸决定（= 任务栏厚度），这里只排内容。
     科目下拉是横向面板，展开时切换回胶囊条 + 下拉的横向外壳，选完科目再收回竖向。 */
  if (vertical && !dropdownOpen) {
    return (
      <div
        data-tauri-drag-region="deep"
        className="theme-surface relative isolate flex h-full w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-slate-900 shadow-[0_16px_48px_-20px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7)]"
      >
        {/* 竖向环境光：左上品牌靛、右下紫，弱到不干扰计时数字 */}
        <div aria-hidden className="pointer-events-none absolute -left-10 top-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-8 -right-10 h-28 w-28 rounded-full bg-violet-500/10 blur-2xl" />

        <div
          data-tauri-drag-region="deep"
          className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center px-1 pb-1 pt-2"
        >
          <CapsuleStrip vertical expanded={false} onOpenDropdown={onOpenDropdown} />
        </div>

        {/* 窗口控制在底部竖排：全部功能 / 关闭（窄条用 24px 小按钮，给计时区多留高度） */}
        <div className="relative z-10 flex shrink-0 flex-col items-center gap-1 pb-2">
          <button
            onClick={onToggleMode}
            title="全部功能"
            aria-label="全部功能"
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-gray-200 hover:text-slate-900 focus-visible:outline-none dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 3h6v6" />
              <path d="M9 21H3v-6" />
              <path d="M21 3l-7 7" />
              <path d="M3 21l7-7" />
            </svg>
          </button>
          <button
            onClick={() => window.close()}
            title="关闭"
            aria-label="关闭"
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none dark:text-slate-400 dark:hover:bg-red-500/15 dark:hover:text-red-400"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      data-tauri-drag-region={dropdownOpen ? undefined : 'deep'}
      className={`theme-surface relative isolate flex h-full w-full overflow-hidden border border-gray-200 bg-white text-slate-900 shadow-[0_16px_48px_-20px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7)] ${
        dropdownOpen ? 'flex-col rounded-2xl' : 'flex-row items-center rounded-full'
      }`}
    >
      {/* 顶部环境光：仅下拉展开时展示 */}
      {dropdownOpen && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-[52px] h-24 bg-gradient-to-b from-indigo-400/10 via-indigo-400/5 to-transparent dark:from-indigo-500/15 dark:via-indigo-500/5 dark:to-transparent"
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
          dropdownOpen ? 'h-[52px] w-full gap-2 border-b border-gray-200 px-3 dark:border-slate-800' : 'w-full min-w-0 flex-1 gap-2 pl-3 pr-2'
        }`}
      >
        <CapsuleStrip expanded={dropdownOpen} onOpenDropdown={onOpenDropdown} />
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={onToggleMode}
            title="全部功能"
            aria-label="全部功能"
            className={`${windowBtnBase} text-slate-500 hover:bg-gray-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100`}
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
              onClick={() => window.minimize()}
              aria-label="最小化"
              title="最小化"
              className={`${windowBtnBase} text-slate-500 hover:bg-gray-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14" />
              </svg>
            </button>
          )}
          <button
            onClick={() => window.close()}
            title="关闭"
            aria-label="关闭"
            className={`${windowBtnBase} text-slate-500 hover:bg-red-50 hover:text-red-500 dark:text-slate-400 dark:hover:bg-red-500/15 dark:hover:text-red-400`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 科目下拉（快速开始，选科后自动收回）：展开随窗口立即出现，收起先淡出下滑再缩窗 */}
      {dropdownOpen && (
        <div
          className={`relative min-h-0 flex-1 border-t border-gray-200 dark:border-slate-800 ${
            dropdownClosing ? 'animate-[widget-fade-out-down_0.18s_ease-in] forwards' : ''
          }`}
        >
          <SubjectPicker ref={dropdownContentRef} onPick={onPick} onClose={onCloseDropdown} />
        </div>
      )}
    </div>
  )
}

export default function WidgetApp() {
  const appWindow: Window = getCurrentWindow()
  // 记忆模式：初始状态读取上次退出时保存的模式
  const [fullMode, setFullMode] = useState(() => localStorage.getItem(MODE_KEY) === 'full')
  /* 简洁模式方向（横向胶囊 / 竖向窄条）：设置页改完立即生效 */
  const [orientation, setOrientation] = useState<WidgetOrientation>(() => getWidgetOrientation())
  // 胶囊条科目下拉是否打开
  const [dropdownOpen, setDropdownOpen] = useState(false)
  // 面板出场动画播放中：先淡出下滑，动画结束后再真正收起窗口，避免内容瞬间消失
  const [dropdownClosing, setDropdownClosing] = useState(false)
  const closeTimerRef = useRef<number | null>(null)
  // 标记当前是否正在切换模式：切换过程中由 setSize/setPosition 等触发的 onMoved 应跳过落盘，避免覆盖正确位置
  const switchingRef = useRef(false)
  // 当前简洁模式的基础尺寸（竖向宽度依赖任务栏厚度，收起下拉时要还原到它）
  const compactBaseRef = useRef({ width: WIDGET_W, height: WIDGET_H })
  // 展开下拉前记录胶囊条位置；仅当展开时窗口被上移（贴底场景）时，收起才恢复，避免无谓跳位
  const preExpandPosRef = useRef<{ x: number; y: number } | null>(null)
  const layerMovedRef = useRef(false)

  // 方向偏好变化（设置页 / 其他窗口写入）：同步状态，紧凑窗口会按新方向变形
  useEffect(() => {
    return subscribeWidgetOrientation(setOrientation)
  }, [])

  /* ── 科目下拉按内容自适应高度 ──
     窗口常态高度是 DROPDOWN_H_BASE；科目多到放不下时按需加高，
     上限由显示器可用高度决定（见下方 effect）——用户要求「科目一页看全、不要翻页」。
     测量点是 SubjectPicker 内部科目列表内容块的自然高度 + 头部/目标行等固定部分，
     所以被观察节点必须与窗口高度解耦（不能用 h-full / flex-1），
     否则窗口变高会让内容跟着变高，形成「长高 → 更高」的正反馈。

     用**回调 ref** 而不是 useRef：SubjectPicker 挂在 CompactShell 这个子组件里，
     它的 ref 是在子组件提交阶段才赋值的，WidgetApp 自己的 effect 会先跑完
     （那时 ref.current 还是 null，观察逻辑会被整段跳过）。 */
  const dropdownContentElRef = useRef<HTMLElement | null>(null)
  /** 放下全部科目所需的窗口高度（含胶囊条/头部/目标行）：变化即触发窗口调整 */
  const [dropdownNeedH, setDropdownNeedH] = useState(DROPDOWN_H_BASE)
  const [dropdownMaxH, setDropdownMaxH] = useState(DROPDOWN_H_CAP)
  /**
   * 回调 ref：SubjectPicker 挂载时置位。除了记录节点，还要触发一次「内容已就位」标记，
   * 因为待观察节点随下拉一起挂载时，WidgetApp 的 effect 早于子组件 ref 赋值跑完。
   */
  const setDropdownContentEl = useCallback((node: HTMLDivElement | null) => {
    dropdownContentElRef.current = node
    if (node) window.__widgetContentReady = true
  }, [])
  // 展开时读取的当前值：避免把两个 state 塞进 openDropdown 的依赖里反复重建回调
  const dropdownNeedHRef = useRef(DROPDOWN_H_BASE)
  const dropdownMaxHRef = useRef(DROPDOWN_H_CAP)
  dropdownNeedHRef.current = dropdownNeedH
  dropdownMaxHRef.current = dropdownMaxH

  /** 目标高度 = 上次测得的需求值（按上限钳制）：展开时先照它变形，挂载后再精确校正 */
  const dropdownTargetH = useCallback(() => {
    const base = DROPDOWN_H_BASE
    const cap = Math.max(base, dropdownMaxHRef.current)
    return Math.min(cap, Math.max(base, Math.ceil(dropdownNeedHRef.current)))
  }, [])

  // 显示器高度决定上限：允许用到几乎整个屏幕可用高度，让科目尽量一页看全（不滚动）
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const monitor = await currentMonitor()
        if (cancelled || !monitor) return
        const scale = monitor.scaleFactor || 1
        const usableH = monitor.size.height / scale - TASKBAR_MARGIN
        setDropdownMaxH(Math.max(DROPDOWN_H_BASE, Math.min(Math.floor(usableH - 24), DROPDOWN_H_ABS_CAP)))
      } catch {
        // 取不到显示器信息就沿用 DROPDOWN_H_CAP 兜底
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // 观察科目列表内容块的自然高度（rAF 节流 + 200ms 静默窗口，与 App.tsx 的 ScaleToFit 同一写法）
  useEffect(() => {
    if (!dropdownOpen) return
    const el = dropdownContentElRef.current
    if (!el) return
    // 下拉面板根节点（被观察，窗口尺寸变化会改变它的高度）
    const panelRoot = el.closest('[data-widget-dropdown]') as HTMLElement | null
    // 科目列表滚动容器与它的父节点（面板内容列）：用来把「固定行」与「列表」分开
    const listBox = el.parentElement as HTMLElement | null
    const view = listBox?.parentElement as HTMLElement | null
    let raf = 0
    let settleTimer: ReturnType<typeof setTimeout> | null = null
    const measure = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        // 科目列表内容自然高度：offsetHeight 是布局高度，不受滚动位置影响
        const contentH = el.offsetHeight
        /* 面板内部的固定高度（快速开始行 + 本周目标行）：
           直接累加「除列表滚动容器外的兄弟节点」的高度与外边距。
           不能写成「面板高度 − 列表高度」：展开瞬间窗口还没变高、面板被压扁，
           该式退化成 0，窗口就永远漏掉头部这几十像素，列表差一截要滚动
           （用户反馈的「科目要翻页」正是这个原因）。这几行都是 shrink-0，
           被压扁时仍保持自然高度，直接量它们才可靠。 */
        let panelChromeH = 0
        if (view) {
          for (const child of Array.from(view.children)) {
            if (child === listBox) continue
            const row = child as HTMLElement
            const cs = getComputedStyle(row)
            panelChromeH += row.offsetHeight + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0)
          }
        }
        // 需求高度 = 面板外的固定部分（胶囊条/边框）+ 面板内的固定行 + 科目列表
        const needH = DROPDOWN_OUTER_CHROME + panelChromeH + contentH
        // 迟滞：微小变化保持原值，避免科目增删时窗口抖动
        setDropdownNeedH((prev) => (Math.abs(prev - needH) < 2 ? prev : needH))
      })
    }
    const schedule = () => {
      if (settleTimer !== null) clearTimeout(settleTimer)
      settleTimer = setTimeout(measure, 200)
    }
    if (window.__widgetContentReady) {
      // 元素已就位（回调 ref 在挂载时置位），立即测量
      measure()
      window.__widgetContentReady = false
    }
    const ro = new ResizeObserver(schedule)
    ro.observe(el)
    // 面板本身也要观察：窗口尺寸变化会改变面板高度，据此校正需求值
    if (panelRoot) ro.observe(panelRoot)
    /* 本周目标行是异步取数后才出现的：它出现时面板尺寸不变（差额由列表让位吸收），
       ResizeObserver 观察不到，得靠 DOM 变化（固定行增删）再测一次 */
    const mo = new MutationObserver(schedule)
    if (view) mo.observe(view, { childList: true })
    return () => {
      cancelAnimationFrame(raf)
      if (settleTimer !== null) clearTimeout(settleTimer)
      ro.disconnect()
      mo.disconnect()
    }
  }, [dropdownOpen])

  

  /** 将窗口切换到指定模式：精简(compact) / 全部功能(full)，调整尺寸/置顶/位置 */
  const applyMode = useCallback(async (next: boolean) => {
    setFullMode(next)
    // 科目下拉只属于精简模式，切换模式时一律复位为胶囊条（跳过出场动画，窗口立即变形）
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setDropdownClosing(false)
    setDropdownOpen(false)
    switchingRef.current = true
    try {
      if (next) {
        // 进入全部功能：窗口在屏幕中心展开
        await appWindow.setResizable(true)
        // 钳制到显示器可用尺寸（屏高扣掉任务栏预留），避免溢出屏幕或被任务栏盖住
        let w = FULL_W
        let h = FULL_H
        let cx = 0
        let cy = 0
        let hasCenter = false
        try {
          const monitor = await currentMonitor()
          if (monitor) {
            // monitor.size 为物理像素，除以 scaleFactor 换算为逻辑像素，与 setSize 的逻辑单位一致
            const scale = monitor.scaleFactor || 1
            const logicalW = monitor.size.width / scale
            const logicalH = monitor.size.height / scale - TASKBAR_MARGIN
            w = Math.min(FULL_W, logicalW)
            h = Math.min(FULL_H, logicalH)
            // 至少保留合理下限，避免过度钳制导致窗口过小
            w = Math.max(w, Math.min(960, logicalW))
            h = Math.max(h, Math.min(640, logicalH))
            // 以「扣掉任务栏后的可用区域」中心为对称点，窗口整体落在任务栏上方
            cx = monitor.position.x + Math.round(monitor.size.width / 2)
            cy = monitor.position.y + Math.round((monitor.size.height / scale - TASKBAR_MARGIN) * scale / 2)
            hasCenter = true
          }
        } catch {
          // 取显示器失败则维持 FULL_W×FULL_H 兜底
        }
        await appWindow.setSize(new LogicalSize(w, h))
        // 显式居中：以可用区域中心为对称点放置窗口，避免停在角落或被任务栏遮挡
        if (hasCenter) {
          try {
            const scale = (await currentMonitor())?.scaleFactor || 1
            const wPhys = Math.round(w * scale)
            const hPhys = Math.round(h * scale)
            await appWindow.setPosition(new PhysicalPosition(cx - Math.round(wPhys / 2), cy - Math.round(hPhys / 2)))
          } catch {
            await appWindow.center().catch(() => {})
          }
        } else {
          await appWindow.center().catch(() => {})
        }
        await appWindow.setResizable(false)
        await appWindow.setAlwaysOnTop(false)
        // 保险：确保展开后窗口可见
        await appWindow.show().catch(() => {})
      } else {
        await appWindow.setAlwaysOnTop(true)
        // 横向是 500×52；竖向宽度按左侧任务栏厚度取值（约 48×420）
        const size = await compactBaseSize(getWidgetOrientation())
        compactBaseRef.current = size
        await appWindow.setResizable(true)
        await appWindow.setSize(new LogicalSize(size.width, size.height))
        await appWindow.setResizable(false)
        // 恢复保存的精简窗口位置（若跑到屏幕外则居中）
        const pos = loadSavedPosition(WIDGET_POS_KEY)
        if (pos && (await sanitizePosition(pos, size.width, size.height))) {
          // onMoved 提供的是物理坐标，恢复时也必须用物理单位，避免高 DPI 下窗口跑到屏外
          await appWindow.setPosition(new PhysicalPosition(pos.x, pos.y))
          await clampIntoWorkArea(appWindow, size.width, size.height)
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
   * 把精简窗口调整到目标高度（展开面板 / 科目下拉加高）：以胶囊条顶部为锚「向下展开」——
   * 胶囊条（时间）保持原位，面板从下方弹出；仅当面板底部会越出屏幕可用区域（贴底、
   * 或科目变多后继续加高）时，才整窗上移（底部锚定），保证整块面板都能看到、不压在任务栏下。
   * 宽度始终是 WIDGET_W：展开只是「胶囊条下方多出一个同宽的下拉框」，
   * 绝不横向加宽（否则就不像下拉框了）；横向越界时同样收进屏幕。
   * record=true（展开时）记录当前窗口位置为「展开前位置」，收起时若发生过移动则恢复。
   */
  const fitLayer = useCallback(
    async (height: number, record: boolean) => {
      try {
        const cur = (await appWindow.outerPosition().catch(() => null)) ?? null
        if (record) {
          preExpandPosRef.current = cur
          layerMovedRef.current = false
        }
        const monitor = await currentMonitor()
        const scale = monitor?.scaleFactor || 1
        let nx = cur?.x ?? 0
        // 默认顶部锚定：顶部保持原位，向下弹出面板
        let ny = cur?.y ?? 0
        if (monitor && cur) {
          const top = monitor.position.y
          // 屏幕底部要扣掉任务栏预留（逻辑→物理），否则面板最后几行会被任务栏盖住
          const bottom = monitor.position.y + monitor.size.height - Math.round(TASKBAR_MARGIN * scale)
          const left = monitor.position.x
          const right = monitor.position.x + monitor.size.width
          const physW = Math.round(WIDGET_W * scale)
          const physH = Math.round(height * scale)
          // 左右越界收进屏幕
          if (nx < left) nx = left
          if (nx + physW > right) nx = right - physW
          // 底部越界（贴底 / 加高后超出）：退回「底部锚定」——顶边上移，收起时需恢复原位
          if (ny + physH > bottom) ny = bottom - physH
          if (ny < top) ny = top
        }
        // 只有发生位移（贴边收进屏幕）时才移动窗口；否则只变高变矮，胶囊不动
        if (cur && (nx !== cur.x || ny !== cur.y)) {
          layerMovedRef.current = true
          await appWindow.setPosition(new PhysicalPosition(nx, ny))
        }
        await appWindow.setSize(new LogicalSize(WIDGET_W, height))
        await appWindow.show().catch(() => {})
      } catch {
        // 尺寸调整失败不阻塞 UI
      }
    },
    [appWindow],
  )

  // 需求高度或上限变化时同步窗口高度：变高/变矮都跟随（上限内）
  useEffect(() => {
    if (!dropdownOpen) return
    const base = DROPDOWN_H_BASE
    const cap = Math.max(base, dropdownMaxH)
    const h = Math.min(cap, Math.max(base, Math.ceil(dropdownNeedH)))
    void fitLayer(h, false)
  }, [dropdownNeedH, dropdownMaxH, dropdownOpen, fitLayer])

  /** 收回胶囊条高度：顶部锚定向上收起，时间保持原位；仅贴底展开导致位移时恢复原位置 */
  const closeLayer = useCallback(async () => {
    try {
      // 竖向模式下展开下拉时窗口临时是 500 宽的横向面板，收起要还原成任务栏宽的竖条
      const base = compactBaseRef.current
      await appWindow.setSize(new LogicalSize(base.width, base.height))
      if (layerMovedRef.current && preExpandPosRef.current) {
        await appWindow.setPosition(new PhysicalPosition(preExpandPosRef.current.x, preExpandPosRef.current.y))
      }
      preExpandPosRef.current = null
      layerMovedRef.current = false
      await appWindow.show().catch(() => {})
    } catch {
      // 尺寸调整失败不阻塞 UI
    }
  }, [appWindow])

  const openDropdown = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setDropdownClosing(false)
    setDropdownOpen(true)
    // 首次展开按上次测得的需求高度决定；挂载后的测量会再精确校正一次
    fitLayer(dropdownTargetH(), true)
  }, [fitLayer, dropdownTargetH])

  /** 收起下拉：先播出场动画（淡出下滑），动画结束后再卸载面板并缩回窗口 */
  const closeDropdown = useCallback(() => {
    if (closeTimerRef.current) return
    setDropdownClosing(true)
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null
      setDropdownClosing(false)
      setDropdownOpen(false)
      closeLayer()
    }, 180)
  }, [closeLayer])

  // 卸载时清理出场动画计时器
  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    },
    [],
  )

  /** 下拉里选中科目：按当前计时模式写入共享正计时或共享番茄钟，并收回胶囊条 */
  const quickStart = useCallback(
    (subjectId: string, activity: string, mode: TimerMode) => {
      if (mode === 'pomodoro') {
        // 番茄钟：开始一轮专注倒计时（时长取当前偏好），胶囊条随即展示倒计时
        savePomoState(startPomo(subjectId, activity, loadPomoFocusMin(), Date.now()))
      } else {
        saveSharedTimer({ subjectId, activity, startTime: Date.now() })
      }
      closeDropdown()
    },
    [closeDropdown],
  )

  // 启动时始终让精简窗口居中显示（满足「默认应用启动窗口在屏幕中间」）
  // 竖向挂件还要先把窗口改成「任务栏宽 × 420」，否则会先闪一下横向胶囊条的尺寸
  useEffect(() => {
    if (fullMode) return
    let cancelled = false
    void (async () => {
      const size = await compactBaseSize(getWidgetOrientation())
      if (cancelled) return
      compactBaseRef.current = size
      try {
        await appWindow.setResizable(true)
        await appWindow.setSize(new LogicalSize(size.width, size.height))
        await appWindow.setResizable(false)
        if (!cancelled) await appWindow.center()
      } catch {
        // 尺寸调整失败时仍按配置尺寸显示
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* 在设置页切换横/竖后立即变形：保持左上角位置，把窗口收进显示器工作区；
     首帧不执行（启动尺寸由上面的 effect 负责）；从全部功能切回时不执行
     （applyMode 已经按最新方向设置过尺寸与位置，避免两处同时改窗口）。 */
  const orientationMountedRef = useRef(false)
  const prevFullModeRef = useRef(fullMode)
  useEffect(() => {
    const first = !orientationMountedRef.current
    orientationMountedRef.current = true
    const wasFull = prevFullModeRef.current
    prevFullModeRef.current = fullMode
    let cancelled = false
    void (async () => {
      const size = await compactBaseSize(orientation)
      if (cancelled) return
      compactBaseRef.current = size
      if (first || fullMode || wasFull || dropdownOpen) return
      switchingRef.current = true
      try {
        await appWindow.setResizable(true)
        await appWindow.setSize(new LogicalSize(size.width, size.height))
        await appWindow.setResizable(false)
        if (!cancelled) await clampIntoWorkArea(appWindow, size.width, size.height)
      } catch {
        // 变形失败不阻塞使用，下次切换模式时会重新按偏好取尺寸
      } finally {
        switchingRef.current = false
      }
    })()
    return () => {
      cancelled = true
    }
  }, [orientation, fullMode, dropdownOpen, appWindow])

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

  if (fullMode) return <FullModeShell onToggleMode={toggleMode} />

  return (
    <CompactShell
      dropdownOpen={dropdownOpen}
      dropdownClosing={dropdownClosing}
      vertical={orientation === 'vertical'}
      onToggleMode={toggleMode}
      onOpenDropdown={openDropdown}
      onCloseDropdown={closeDropdown}
      dropdownContentRef={setDropdownContentEl}
      onPick={quickStart}
    />
  )
}
