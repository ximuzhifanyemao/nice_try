import { useState, useRef, type ChangeEvent, type ReactNode } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUpdateContext } from '../contexts/UpdateContext'
import AppVersion from '../components/AppVersion'
import { useToast } from '../lib/Toast'
import { syncVocabularyFromCloud } from '../lib/vocabulary'
import { Capacitor } from '@capacitor/core'
import { isTauri } from '@tauri-apps/api/core'
import { Icon, type IconName } from '../components/Icon'
import { exportAllData, downloadTextFile, importAllData, type ImportResult } from '../lib/export'
import ConfirmDialog from '../components/ConfirmDialog'
import { useWideLayout } from '../App'

/** 分组标题 */
function GroupLabel({ children }: { children: ReactNode }) {
  return <p className="section-label">{children}</p>
}

type RowProps = {
  icon: IconName
  /** 图标底色（浅色 tint），默认 indigo */
  tint?: string
  label: string
  desc?: string
  to?: string
  onClick?: () => void
}

/** 统一入口行：icon 色块 + 标题 + 描述 + 右箭头 */
function Row({ icon, tint = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400', label, desc, to, onClick }: RowProps) {
  const inner = (
    <>
      <span className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${tint}`}>
        <Icon name={icon} size={18} />
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">{label}</span>
        {desc && <span className="block text-xs text-gray-400 dark:text-slate-500 truncate">{desc}</span>}
      </span>
      <span className="ml-auto text-gray-300 dark:text-slate-600">
        <Icon name="chevronRight" size={16} />
      </span>
    </>
  )
  const cls =
    'card-hover w-full flex items-center gap-3 px-3 py-3 cursor-pointer'
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
  const wide = useWideLayout()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { status, checkForUpdate, downloadAndInstall, updateInfo, error } = useUpdateContext()
  const [checkingText, setCheckingText] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [pendingImport, setPendingImport] = useState<{ payload: unknown; tables: number; rows: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
          : status === 'installing'
            ? '正在打开下载页…'
            : status === 'error'
              ? '检查失败'
              : '检查更新')

  const handleExport = async () => {
    if (!user || exporting) return
    setExporting(true)
    try {
      const json = await exportAllData(user.id)
      const stamp = new Date().toISOString().slice(0, 10)
      downloadTextFile(`divedeep-backup-${stamp}.json`, json)
      show('数据已导出为 JSON 文件', { icon: '✅' })
    } catch {
      show('导出失败，请稍后再试', { icon: '⚠️' })
    } finally {
      setExporting(false)
    }
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // 允许重复选择同一文件
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const payload = JSON.parse(text) as unknown
      if (typeof payload !== 'object' || payload === null || typeof (payload as Record<string, unknown>).data !== 'object') {
        throw new Error('bad')
      }
      const dataObj = (payload as Record<string, Record<string, unknown>>).data
      let tables = 0
      let rows = 0
      for (const k of Object.keys(dataObj)) {
        const arr = dataObj[k]
        if (Array.isArray(arr) && arr.length > 0) {
          tables += 1
          rows += arr.length
        }
      }
      if (tables === 0) {
        show('备份中没有可导入的数据', { icon: '⚠️' })
        return
      }
      setPendingImport({ payload, tables, rows })
    } catch {
      show('文件不是有效的备份 JSON', { icon: '⚠️' })
    }
  }

  const handleConfirmImport = async () => {
    if (!user || importing || !pendingImport) return
    setImporting(true)
    const { payload } = pendingImport
    setPendingImport(null)
    try {
      const res: ImportResult = await importAllData(user.id, payload)
      const failedCount = Object.values(res.tables).filter((t) => (t.failed?.length ?? 0) > 0).length
      const successCount = Object.keys(res.tables).length - failedCount
      const refreshNote = '部分页面需刷新后可见最新数据'
      if (res.ok) {
        show(`导入完成：${successCount} 张表成功，${refreshNote}`, { icon: '✅' })
      } else {
        show(`导入完成：${successCount} 张表成功，${failedCount} 张表失败，${refreshNote}`, { icon: '⚠️' })
      }
    } catch (err) {
      show(err instanceof Error ? err.message : '导入失败，请稍后再试', { icon: '⚠️' })
    } finally {
      setImporting(false)
    }
  }

  const handleImport = () => {
    if (!user) {
      show('请先登录后再导入', { icon: '🔐' })
      return
    }
    fileInputRef.current?.click()
  }

  return (
    <div className={`mx-auto ${wide ? 'max-w-[1280px]' : 'max-w-3xl'} px-4 py-4 pb-6`}>
      {/* 用户信息头部：渐变横幅 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-4 text-white shadow-[0_8px_28px_-10px_rgba(79,70,229,0.5)] dark:shadow-none">
        <div aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-violet-300/20 blur-lg" />
        <div className="relative flex items-center gap-4">
          <div className="h-14 w-14 shrink-0 rounded-full bg-white/20 backdrop-blur-sm border border-white/25 flex items-center justify-center text-xl font-bold shadow-inner">
            {avatarText}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{email}</p>
            <p className="text-xs text-white/70 mt-0.5">
              {createdAt ? `注册于 ${createdAt}` : '未登录'}
            </p>
          </div>
        </div>
      </div>

      {/* 学习目标 */}
      <GroupLabel>学习目标</GroupLabel>
      <div className="space-y-2 pt-1.5">
        <Row icon="medal" tint="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" label="成就" desc="徽章与里程碑" to="/achievements" />
        <Row icon="target" label="目标与承诺金" desc="每周目标 · 承诺" to="/goal" />
        <Row icon="vocab" tint="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" label="生词本" desc="背单词与复习" to="/vocabulary" />
        <Row icon="star" tint="bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400" label="每周总结" desc="本周 vs 上周 · 反思笔记" to="/weekly-summary" />
        <Row icon="heart" tint="bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400" label="健康打卡" desc="饮食 · 饮水 · 体重" to="/health" />
      </div>

      {/* 设备与数据 */}
      <GroupLabel>设备与数据</GroupLabel>
      <div className="space-y-2 pt-1.5">
        <Row icon="smartphone" tint="bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400" label="扫码登录电脑" desc="扫电脑二维码，一键登录" to="/scan-qr" />
        <Row icon="cloud" tint="bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400" label="同步数据" desc={syncing ? '正在同步…' : '同步生词本到云'} onClick={handleSync} />
        <Row icon="download" tint="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" label={exporting ? '正在导出…' : '导出数据'} desc="备份学习 · 健康 · 生词本 · 待办" onClick={handleExport} />
        <Row icon="upload" tint="bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400" label={importing ? '正在导入…' : '导入数据'} desc="从备份 JSON 恢复 · 合并，文件为准" onClick={handleImport} />
        <Row icon="settings" tint="bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300" label="设置" desc="倒计时 · 科目 · 主题" to="/settings" />
      </div>

      {/* 关于与账户 */}
      <GroupLabel>关于与账户</GroupLabel>
      <div className="space-y-2 pt-1.5">
        {/* 检查更新 */}
        <div className="card px-3 py-3">
          <button
            onClick={async () => {
              setCheckingText('正在检查…')
              await checkForUpdate()
              setCheckingText('')
            }}
            className="w-full flex items-center gap-3 cursor-pointer"
          >
            <span className="w-9 h-9 shrink-0 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 flex items-center justify-center">
              <Icon name="refresh" size={18} />
            </span>
            <span className="text-sm font-semibold text-gray-800 dark:text-slate-100">{updateLabel}</span>
            <span className="ml-auto text-gray-300 dark:text-slate-600">
              <Icon name="chevronRight" size={16} />
            </span>
          </button>

          {status === 'available' && updateInfo && (
            <div className="mt-3 border-t border-gray-100 dark:border-slate-800 pt-3">
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-2">
                新版本 v{updateInfo.version}
                {updateInfo.fileSize && `（${(updateInfo.fileSize / 1024).toFixed(0)} KB）`}
              </p>
              {Capacitor.isNativePlatform() || isTauri() ? (
                <button
                  onClick={() => downloadAndInstall(updateInfo)}
                  className="btn-primary w-full py-2 text-xs"
                >
                  {Capacitor.isNativePlatform() ? '下载 APK' : '打开下载页'}
                </button>
              ) : (
                <p className="text-xs text-gray-400 dark:text-slate-500">请在手机 App 或电脑版中更新</p>
              )}
            </div>
          )}

          {status === 'downloaded' && (
            <p className="mt-3 border-t border-gray-100 dark:border-slate-800 pt-3 text-xs text-emerald-600 dark:text-emerald-400">
              {isTauri() ? '已在浏览器打开下载页，请下载后手动运行安装' : '下载完成，请在通知栏点击完成安装'}
            </p>
          )}

          {status === 'error' && (
            <p className="mt-2 text-xs text-red-500 dark:text-red-400">{error || '检查失败'}</p>
          )}
        </div>

        {/* 版本信息 */}
        <AppVersion />

        {/* 退出登录 */}
        <button onClick={handleSignOut} className="btn-danger w-full py-3">
          退出登录
        </button>
      </div>

      {/* 隐藏的文件选择器：点击「导入数据」时触发 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 导入确认弹窗 */}
      <ConfirmDialog
        open={pendingImport !== null}
        title="确认导入数据"
        message={`将从备份恢复 ${pendingImport?.tables ?? 0} 张表（共 ${pendingImport?.rows ?? 0} 条记录），以文件数据为准，将合并进当前账号。确认导入？`}
        confirmText="确认导入"
        onConfirm={handleConfirmImport}
        onCancel={() => setPendingImport(null)}
      />
    </div>
  )
}