import { lazy, Suspense, useEffect, useLayoutEffect, createContext, useRef, useState, type ReactNode } from 'react'
import { HashRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { UpdateProvider } from './contexts/UpdateContext'
import { LogsProvider } from './contexts/LogsContext'
import Navbar from './components/Navbar'
import BottomTab from './components/BottomTab'
import ProtectedRoute from './components/ProtectedRoute'
import UpdateChecker from './components/UpdateChecker'
import AchievementNotifier from './components/AchievementNotifier'
import CheckinReminder from './components/CheckinReminder'
import { ToastProvider } from './lib/Toast'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'

// 路由级代码分割：按需加载页面，减少首屏 bundle 体积
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const MyRecords = lazy(() => import('./pages/MyRecords'))
const NewRecord = lazy(() => import('./pages/NewRecord'))
const EditRecord = lazy(() => import('./pages/EditRecord'))
const Summary = lazy(() => import('./pages/Summary'))
const TimerPage = lazy(() => import('./pages/TimerPage'))
const Profile = lazy(() => import('./pages/Profile'))
const Trash = lazy(() => import('./pages/Trash'))
const Achievements = lazy(() => import('./pages/Achievements'))
const GoalPage = lazy(() => import('./pages/GoalPage'))
const EnglishCheckin = lazy(() => import('./pages/EnglishCheckin'))
const VocabularyBook = lazy(() => import('./pages/VocabularyBook'))
const Settings = lazy(() => import('./pages/Settings'))
const Health = lazy(() => import('./pages/Health'))
const QrLogin = lazy(() => import('./pages/QrLogin'))
const ScanQr = lazy(() => import('./pages/ScanQr'))

/** 首页布局上下文：桌面端「全部功能」全功能模式下强制双栏布局 */
export const HomeLayoutContext = createContext<{ twoCol: boolean }>({ twoCol: false })

/** 自适应缩放的下限兜底：极端窄高窗口下也不至于缩到看不清 */
const MIN_FIT_SCALE = 0.4

/**
 * 桌面「全部功能」模式下，让页面内容按内容高度自适应缩放填满窗口。
 * 首页本身已用 forceTwoCol 双栏单屏，无需缩放，故跳过首页。
 *
 * 当内容高度超过视口 1.2 倍时，允许纵向滚动而非继续缩小，保证长页面可读性。
 *
 * 关键约束：内容层必须始终保持固定布局宽度（100%），绝不能用 `width: 100% / scale`
 * 反向补偿缩放后的视觉宽度。否则会形成正反馈——
 * scale 变小 → 布局变宽 → aspect-square / aspect-[5/4] 这类元素高度变大 → scrollHeight 变大
 * → scale 更小；再加上宽度兜底分支 `ow / scrollWidth` 恒 ≤ 当前 scale（因为
 * scrollWidth ≥ clientWidth = ow / scale），scale 就成了只能降不能升的单向棘轮，
 * 页面会一路缩小下去。固定布局宽度后，测量值与已应用的缩放无关，结果天然收敛。
 */
function ScaleToFit({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const location = useLocation()
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    if (!enabled) {
      setScale(1)
      return
    }
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return

    let raf = 0
    // rAF 节流：合并同一帧内的多次回调，避免 ResizeObserver 抖动与循环告警
    const apply = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const ow = outer.clientWidth
        const oh = outer.clientHeight
        const ih = inner.scrollHeight
        const iw = inner.scrollWidth
        if (ow <= 0 || oh <= 0 || ih <= 0 || iw <= 0) return
        // 内容超高（超过视口 1.2 倍）时允许滚动，不再继续缩小
        if (ih > oh * 1.2) {
          setScale(1)
          return
        }
        // 按高度缩放，同时用宽度兜底保证不横向溢出；不放大（上限 1）
        const next = Math.max(MIN_FIT_SCALE, Math.min(1, oh / ih, ow / iw))
        // 变化极小则忽略，避免浮点误差引起无意义的重渲染
        setScale((prev) => (Math.abs(prev - next) < 0.005 ? prev : next))
      })
    }

    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(outer)
    ro.observe(inner)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [location.pathname, enabled])

  // 非桌面全功能模式，或首页已双栏单屏，直接渲染不缩放
  if (!enabled || location.pathname === '/') return <>{children}</>

  return (
    <div ref={outerRef} className="w-full h-full overflow-y-auto min-h-0">
      <div
        ref={innerRef}
        style={{ transform: `scale(${scale})`, transformOrigin: 'top center', width: '100%' }}
      >
        {children}
      </div>
    </div>
  )
}

function PageLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500" />
    </div>
  )
}

function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="text-6xl font-bold text-gray-200 dark:text-slate-700 mb-4">404</p>
      <p className="text-lg text-gray-600 dark:text-slate-300 mb-6">页面不存在或已被移除</p>
      <Link
        to="/"
        className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
      >
        返回首页
      </Link>
    </div>
  )
}

/** 全局配置/认证错误横幅（如 Supabase 未配置时给出明确提示，避免无感知白屏） */
function ConfigBanner() {
  const { error } = useAuth()
  if (!error) return null
  return (
    <div className="bg-amber-100 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-700/50 text-amber-800 dark:text-amber-200 text-center text-sm py-2 px-4">
      {error}
    </div>
  )
}

/** Capacitor 原生返回按钮处理：在 App 内导航回退，而非直接退出应用 */
function BackButtonHandler() {
  const navigate = useNavigate()
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const handler = CapacitorApp.addListener('backButton', () => {
      // 如果当前页面不是首页，则导航回退；否则最小化应用
      if (window.location.hash !== '#/') {
        navigate(-1)
      } else {
        CapacitorApp.minimizeApp()
      }
    })
    return () => {
      handler.then((h) => h.remove())
    }
  }, [navigate])
  return null
}

export default function App({
  hideBottomTab = false,
  hideNavbar = false,
  sidebar = null,
  fillHeight = false,
  forceTwoCol = false,
}: {
  hideBottomTab?: boolean
  hideNavbar?: boolean
  /** 需要侧边栏导航时传入（如桌面端展开模式）；必须在 Router 内部渲染，故由 App 接收）
   */ sidebar?: ReactNode | null
  /** 桌面展开模式下用 100% 高度替代 100vh，配合滚动容器避免页面底部被裁切 */
  fillHeight?: boolean
  /** 桌面「全部功能」全功能模式下强制首页双栏布局（无视视口宽度） */
  forceTwoCol?: boolean
}) {
  const pageHeight = fillHeight ? 'min-h-full' : 'min-h-screen'
  return (
    <HashRouter>
      <ToastProvider>
        <BackButtonHandler />
        <UpdateProvider>
          <AuthProvider>
          <LogsProvider>
          <div className={`relative overflow-x-clip ${pageHeight} bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200 pb-16 sm:pb-0`}>
          {/* 顶部环境光：页面顶部分层淡出，增加呼吸感 */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-indigo-100/70 via-indigo-50/40 to-transparent dark:from-indigo-500/10 dark:via-indigo-900/5 dark:to-transparent"
          />
          <div className={`relative flex ${pageHeight}`}>
            {sidebar && <div className="sticky top-0 self-start h-full shrink-0">{sidebar}</div>}
            <div className="flex-1 min-w-0">
              <ConfigBanner />
              <UpdateChecker />
              <AchievementNotifier />
              <CheckinReminder />
              {!hideNavbar && <Navbar />}
              <Suspense fallback={<PageLoading />}>
                <HomeLayoutContext.Provider value={{ twoCol: forceTwoCol }}>
                <ScaleToFit enabled={forceTwoCol}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/qr-login" element={<QrLogin />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/my-records" element={<MyRecords />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/summary" element={<Summary />} />
                    <Route path="/my-records/new" element={<NewRecord />} />
                    <Route path="/my-records/:id/edit" element={<EditRecord />} />
                    <Route path="/timer" element={<TimerPage />} />
                    <Route path="/trash" element={<Trash />} />
                    <Route path="/achievements" element={<Achievements />} />
                    <Route path="/goal" element={<GoalPage />} />
                    <Route path="/english-checkin" element={<EnglishCheckin />} />
                    <Route path="/vocabulary" element={<VocabularyBook />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/health" element={<Health />} />
                    <Route path="/scan-qr" element={<ScanQr />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </ScaleToFit>
                </HomeLayoutContext.Provider>
              </Suspense>
              {!hideBottomTab && <BottomTab />}
            </div>
          </div>
          </div>
          </LogsProvider>
      </AuthProvider>
      </UpdateProvider>
      </ToastProvider>
    </HashRouter>
  )
}