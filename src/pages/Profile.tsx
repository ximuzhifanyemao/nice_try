import { useState, type ReactNode } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUpdateContext } from '../contexts/UpdateContext'
import AppVersion from '../components/AppVersion'
import { useToast } from '../lib/Toast'
import { syncVocabularyFromCloud } from '../lib/vocabulary'
import { Capacitor } from '@capacitor/core'

/** 分组标题 */
function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-1 pt-3 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-500">
      {children}
    </p>
  )
}

type RowProps = {
  icon: string
  label: string
  desc?: string
  to?: string
  onClick?: () => void
}

/** 统一入口行：icon 色块 + 标题 + 描述 + 右箭头 */
function Row({ icon, label, desc, to, onClick }: RowProps) {
  const inner = (
    <>
      <span className="w-9 h-9 shrink-0 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15 flex items-center justify-center text-lg leading-none">
        {icon}
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">{label}</span>
        {desc && <span className="block text-xs text-gray-400 dark:text-slate-500 truncate">{desc}</span>}
      </span>
      <span className="ml-auto text-gray-300 dark:text-slate-600">›</span>
    </>
  )
  const cls =
    'w-full flex items-center gap-3 rounded-xl bg-white dark:bg-slate-900 px-3 py-3 border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors cursor-pointer'
  if (to) {
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    )
  }
  return (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  )
}

export default function Profile() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { status, checkForUpdate, downloadAndInstall, updateInfo, error } = useUpdateContext()
  const [checkingText, setCheckingText] = useState('')
  const [syncing, setSyncing] = useState(false)
  const { show } = useToast()

  const handleSync = async () => {
    if (!user) {
      show('请先登录后再同步', { icon: '🔐' })
      return
    }
    if (syncing) return
    setSyncing(true)
    try {
      await syncVocabularyFromCloud(user.id)
      show('数据同步完成', { icon: '✅' })
    } catch {
      show('同步失败，请稍后再试', { icon: '⚠️' })
    } finally {
      setSyncing(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const email = user?.email ?? ''
  const avatarText = email.slice(0, 1).toUpperCase() || '我'
  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : ''

  const updateLabel =
    checkingText ||
    (status === 'available'
      ? '发现新版本！'
      : status === 'up_to_date'
        ? '已是最新版本'
        : status === 'downloading'
          ? '正在下载更新…'
          : status === 'error'
            ? '检查失败'
            : '检查更新')

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 pb-6">
      {/* 用户信息头部 */}
      <div className="flex items-center gap-4 rounded-2xl bg-white dark:bg-slate-900 p-4 border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none">
        <div className="h-14 w-14 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-xl font-bold shadow-sm">
          {avatarText}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-slate-100 truncate">{email}</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
            {createdAt ? `注册于 ${createdAt}` : '未登录'}
          </p>
        </div>
      </div>

      {/* 学习目标 */}
      <GroupLabel>学习目标</GroupLabel>
      <div className="space-y-2 pt-1.5">
        <Row icon="🏅" label="成就" desc="徽章与里程碑" to="/achievements" />
        <Row icon="🎯" label="目标与承诺金" desc="每周目标 · 承诺" to="/goal" />
        <Row icon="📖" label="生词本" desc="背单词与复习" to="/vocabulary" />
      </div>

      {/* 设备与数据 */}
      <GroupLabel>设备与数据</GroupLabel>
      <div className="space-y-2 pt-1.5">
        <Row icon="📱" label="扫码登录电脑" desc="扫电脑二维码，一键登录" to="/scan-qr" />
        <Row icon="☁️" label="同步数据" desc={syncing ? '正在同步…' : '同步生词本到云'} onClick={handleSync} />
        <Row icon="⚙️" label="设置" desc="倒计时 · 科目 · 主题" to="/settings" />
      </div>

      {/* 关于与账户 */}
      <GroupLabel>关于与账户</GroupLabel>
      <div className="space-y-2 pt-1.5">
        {/* 检查更新 */}
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none px-3 py-3">
          <button
            onClick={async () => {
              setCheckingText('正在检查…')
              await checkForUpdate()
              setCheckingText('')
            }}
            className="w-full flex items-center gap-3 cursor-pointer"
          >
            <span className="w-9 h-9 shrink-0 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15 flex items-center justify-center text-lg leading-none">
              🔄
            </span>
            <span className="text-sm font-semibold text-gray-800 dark:text-slate-100">{updateLabel}</span>
            <span className="ml-auto text-gray-300 dark:text-slate-600">›</span>
          </button>

          {status === 'available' && updateInfo && (
            <div className="mt-3 border-t border-gray-100 dark:border-slate-800 pt-3">
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-2">
                新版本 v{updateInfo.version}
                {updateInfo.fileSize && `（${(updateInfo.fileSize / 1024).toFixed(0)} KB）`}
              </p>
              {Capacitor.isNativePlatform() ? (
                <button
                  onClick={() => downloadAndInstall(updateInfo)}
                  className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-2 cursor-pointer transition-colors"
                >
                  下载并安装
                </button>
              ) : (
                <p className="text-xs text-gray-400 dark:text-slate-500">请在手机 App 中下载安装</p>
              )}
            </div>
          )}

          {status === 'error' && (
            <p className="mt-2 text-xs text-red-500 dark:text-red-400">{error || '检查失败'}</p>
          )}
        </div>

        {/* 版本信息 */}
        <AppVersion />

        {/* 退出登录 */}
        <button
          onClick={handleSignOut}
          className="w-full rounded-xl bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 py-3 font-medium transition-colors hover:bg-red-100 dark:hover:bg-red-900/50 cursor-pointer text-sm"
        >
          退出登录
        </button>
      </div>
    </div>
  )
}