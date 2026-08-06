import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import BottomTab from './components/BottomTab'
import ProtectedRoute from './components/ProtectedRoute'
import AppVersion from './components/AppVersion'

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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-200 pb-16 sm:pb-0">
          <ConfigBanner />
          <Navbar />
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/my-records" element={<MyRecords />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/summary" element={<Summary />} />
                <Route path="/my-records/new" element={<NewRecord />} />
                <Route path="/my-records/:id/edit" element={<EditRecord />} />
                <Route path="/timer" element={<TimerPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <BottomTab />
          <footer className="pt-2 pb-4 sm:pb-4">
            <AppVersion />
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
