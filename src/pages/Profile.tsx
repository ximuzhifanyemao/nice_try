import { useCallback, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUpdateContext } from '../contexts/UpdateContext'
import { useLogs } from '../contexts/LogsContext'
import AppVersion from '../components/AppVersion'
import { useToast } from '../lib/Toast'
import { syncVocabularyFromCloud } from '../lib/vocabulary'
import { Capacitor } from '@capacitor/core'
import { isTauri } from '@tauri-apps/api/core'
import { Icon, type IconName } from '../components/Icon'
import { exportAllData, downloadTextFile, importAllData, type ImportResult } from '../lib/export'
import ConfirmDialog from '../components/ConfirmDialog'
import SettingsSection, { SettingRow, TINT } from '../components/ui/Section'
import { useWideLayout } from '../App'
import { getCurrentTheme, setTheme as persistTheme, THEMES, type ThemeMode } from '../lib/theme'
import { computeAchievements, computeStreak, computeStudyStats } from '../lib/achievements'

/** 顶部概览条里的一格数据：点击可跳到对应页面，让概览本身也是入口 */
function StatTile({
  icon,
  tint,
  label,
  value,
  suffix,
  hint,
  to,
}: {
  icon: IconName
  tint: string
  label: string
  value: string
  suffix?: string
  hint?: string
  to: string
}) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      title={hint}
      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-white/70 px-3.5 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_8px_24px_-16px_rgba(79,70,229,0.45)] dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-indigo-500/40"
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tint}`}>
        <Icon name={icon} size={17} />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] text-gray-500 dark:text-slate-500">{label}</span>
        <span className="num block text-lg leading-tight text-gray-900 dark:text-slate-50">
          {value}
          {suffix && <span className="ml-0.5 text-xs font-medium text-gray-400 dark:text-slate-500">{suffix}</span>}
        </span>
      </span>
    </button>
  )
}

/** 浅色的信息徽标（挂在页面标题右侧，替代移动端的「大横幅」） */
function Chip({ icon, children, tone = 'indigo' }: { icon: IconName; children: React.ReactNode; tone?: 'indigo' | 'emerald' }) {
  const cls =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/12 dark:text-emerald-400'
      : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/12 dark:text-indigo-400'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      <Icon name={icon} size={13} />
      {children}
    </span>
  )
}

export default function Profile() {
  const wide = useWideLayout()
  const { user, signOut } = useAuth()
  const { logs } = useLogs()
  const navigate = useNavigate()
  const { status, checkForUpdate, downloadAndInstall, updateInfo, error } = useUpdateContext()
  const [checkingText, setCheckingText] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [pendingImport, setPendingImport] = useState<{ payload: unknown; tables: number; rows: number } | null>(null)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getCurrentTheme())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { show } = useToast()

  /** 桌面端概览数据：直接从本地学习记录算，不额外发请求 */
  const overview = useMemo(() => {
    const streak = computeStreak(logs.filter((l) => !l.deleted_at).map((l) => l.date))
    const stats = computeStudyStats(logs)
    const unlocked = computeAchievements(logs).filter((a) => a.unlocked).length
    return { streak, stats, unlocked }
  }, [logs])

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

  const handleCopyEmail = useCallback(async () => {
    if (!email) return
    try {
      await navigator.clipboard.writeText(email)
      show('邮箱已复制', { icon: '📋' })
    } catch {
      show('复制失败，请手动选择', { icon: '⚠️' })
    }
  }, [email, show])

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
      // 电脑程序会弹系统「另存为」对话框；用户取消保存时不提示成功
      const saved = await downloadTextFile(`divedeep-backup-${stamp}.json`, json)
      if (saved) show('数据已导出为 JSON 文件', { icon: '✅' })
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

  const handlePickTheme = (key: ThemeMode) => {
    setThemeMode(persistTheme(key))
  }

  /** 两个布局分支共用的浮层（隐藏的文件选择器 + 导入确认弹窗） */
  const overlays = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />
      <ConfirmDialog
        open={pendingImport !== null}
        title="确认导入数据"
        message={`将从备份恢复 ${pendingImport?.tables ?? 0} 张表（共 ${pendingImport?.rows ?? 0} 条记录），以文件数据为准，将合并进当前账号。确认导入？`}
        confirmText="确认导入"
        onConfirm={handleConfirmImport}
        onCancel={() => setPendingImport(null)}
      />
    </>
  )

  /* ── 桌面端「我的」：账号面板，而不是功能索引页 ──
     桌面端左侧边栏常驻，目标 / 周总结 / 生词本 / 成就 / 英语打卡 都已经在侧边栏里，
     再在「我的」里列一遍就是同一批入口出现两次（这正是它此前看起来像手机 App 的原因）。
     所以桌面端只保留「只有这里才有」的三类内容：账号身份、数据备份、版本更新。
     窄屏（真正的手机端，底部 Tab 只有 5 个）仍保留「二级功能索引页」形态。 */
  if (wide) {
    return (
      <>
        <div className="mx-auto max-w-[1280px] px-5 py-4 pb-6">
          {/* 页头：账号身份 + 状态 */}
          <header className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-base font-bold text-white shadow-[0_8px_20px_-10px_rgba(79,70,229,0.7)]">
                {avatarText}
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-gray-900 dark:text-slate-50">我的</h1>
                <p className="flex min-w-0 items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                  <span className="truncate">{email || '未登录'}</span>
                  {email && (
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      title="复制邮箱"
                      className="shrink-0 cursor-pointer text-gray-400 transition-colors hover:text-indigo-500 dark:text-slate-500 dark:hover:text-indigo-400"
                    >
                      <Icon name="copy" size={13} />
                    </button>
                  )}
                </p>
              </div>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {createdAt && <Chip icon="calendar">注册于 {createdAt}</Chip>}
              <Chip icon={user ? 'check' : 'alert'} tone={user ? 'emerald' : 'indigo'}>
                {user ? '已登录 · 云端同步可用' : '未登录'}
              </Chip>
            </div>
          </header>

          {/* 概览条：一眼可读的学习数据，点击直达对应页面 */}
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile icon="flame" tint={TINT.amber} label="连续打卡" value={String(overview.streak.current)} suffix="天" hint={`历史最长 ${overview.streak.longest} 天`} to="/achievements" />
            <StatTile icon="clock" tint={TINT.indigo} label="累计学习" value={overview.stats.totalHours.toFixed(1)} suffix="h" to="/summary" />
            <StatTile icon="calendar" tint={TINT.emerald} label="打卡天数" value={String(overview.stats.checkedDays)} suffix="天" to="/my-records" />
            <StatTile icon="medal" tint={TINT.violet} label="已解锁成就" value={String(overview.unlocked)} hint="查看全部徽章" to="/achievements" />
          </div>

          {/* 主区 + 右侧账号栏：宽屏左右分栏，把「清单」摊开成桌面面板 */}
          <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-4">
            <div className="space-y-4">
              <SettingsSection title="数据与备份" desc={user ? '云端同步 · 本地备份' : '登录后可用'}>
                <SettingRow
                  icon={<Icon name="cloud" size={17} />}
                  tint={TINT.blue}
                  label={syncing ? '正在同步…' : '同步数据'}
                  desc="把生词本与学习数据同步到云端"
                  meta="云端"
                  control={
                    <button type="button" className="btn-ghost h-8 px-3 py-0 text-xs" onClick={handleSync} disabled={syncing}>
                      {syncing ? '同步中' : '立即同步'}
                    </button>
                  }
                />
                <SettingRow
                  icon={<Icon name="download" size={17} />}
                  tint={TINT.emerald}
                  label={exporting ? '正在导出…' : '导出数据'}
                  desc="导出学习记录 / 生词本 / 待办为 JSON 备份"
                  meta="JSON"
                  control={
                    <button type="button" className="btn-ghost h-8 px-3 py-0 text-xs" onClick={handleExport} disabled={exporting}>
                      导出
                    </button>
                  }
                />
                <SettingRow
                  icon={<Icon name="upload" size={17} />}
                  tint={TINT.cyan}
                  label={importing ? '正在导入…' : '导入数据'}
                  desc="从备份 JSON 恢复，以文件数据为准合并进当前账号"
                  meta="合并"
                  control={
                    <button type="button" className="btn-ghost h-8 px-3 py-0 text-xs" onClick={handleImport} disabled={importing}>
                      选择文件
                    </button>
                  }
                  last
                />
              </SettingsSection>

              <SettingsSection title="回收站" desc="已删除的学习记录">
                <SettingRow
                  icon={<Icon name="trash" size={17} />}
                  tint={TINT.slate}
                  label="查看并恢复已删除的记录"
                  desc="删除的学习记录会先放在这里，可随时恢复"
                  to="/trash"
                  last
                />
              </SettingsSection>
            </div>

            {/* 右侧：账号信息 + 版本与更新 + 退出登录，固定窄栏常驻可见。
                主题/外观只放在「设置」页与侧边栏底部快切，这里不再重复一份。 */}
            <div className="space-y-4">
              <SettingsSection title="账号" desc={user ? '已登录' : '未登录'}>
                <SettingRow
                  icon={<Icon name="key" size={17} />}
                  tint={TINT.violet}
                  label="邮箱"
                  meta={email || '—'}
                />
                <SettingRow
                  icon={<Icon name="user" size={17} />}
                  tint={TINT.indigo}
                  label="用户 ID"
                  meta={user?.id ? `${user.id.slice(0, 8)}…` : '—'}
                />
                <SettingRow
                  icon={<Icon name="calendar" size={17} />}
                  tint={TINT.slate}
                  label="注册时间"
                  meta={createdAt || '—'}
                  last
                />
              </SettingsSection>

              {/* 版本与更新合到一张卡：版本号只在同一处出现，避免页面里重复显示 */}
              <AppVersion
                footer={
                  <div className="space-y-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-700 dark:text-slate-200">{updateLabel}</p>
                      <p className="mt-0.5 text-[11px] text-gray-400 dark:text-slate-500">
                        {status === 'available' && updateInfo ? `新版本 v${updateInfo.version} 可更新` : '检查是否有新版本可用'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {status === 'available' && updateInfo && (Capacitor.isNativePlatform() || isTauri()) && (
                        <button type="button" className="btn-primary h-8 px-3 py-0 text-xs" onClick={() => downloadAndInstall(updateInfo)}>
                          {Capacitor.isNativePlatform() ? '下载 APK' : '下载新版本安装包'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-ghost h-8 px-3 py-0 text-xs"
                        disabled={checkingText !== ''}
                        onClick={async () => {
                          setCheckingText('正在检查…')
                          await checkForUpdate()
                          setCheckingText('')
                        }}
                      >
                        {checkingText ? '检查中' : '检查更新'}
                      </button>
                    </div>
                  </div>
                }
              />

              {status === 'available' && updateInfo && !(Capacitor.isNativePlatform() || isTauri()) && (
                <p className="-mt-2 px-1 text-[11px] text-gray-400 dark:text-slate-500">
                  请在手机 App 或电脑版中完成更新
                </p>
              )}
              {status === 'downloaded' && (
                <p className="-mt-2 px-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                  {isTauri() ? '已用默认浏览器打开安装包下载页，下载后运行安装包即可完成更新' : '下载完成，请在通知栏点击完成安装'}
                </p>
              )}
              {status === 'error' && (
                <p className="-mt-2 px-1 text-[11px] text-red-500 dark:text-red-400">{error || '检查失败'}</p>
              )}

              <button
                onClick={handleSignOut}
                className="btn-danger w-full py-2.5"
                title="退出当前账号"
              >
                <Icon name="arrowRight" size={15} className="rotate-180" />
                退出登录
              </button>
            </div>
          </div>
        </div>
        {overlays}
      </>
    )
  }

  /* ── 窄屏（手机端）：底部 Tab 只有 5 个入口，「我的」承担二级功能索引页的职责 ── */
  return (
    <div className="mx-auto max-w-3xl px-4 py-4 pb-6">
      {/* ── 页头：左标题右状态，替代移动端的整块渐变横幅 ── */}
      <header className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-base font-bold text-white shadow-[0_8px_20px_-10px_rgba(79,70,229,0.7)]">
            {avatarText}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-gray-900 dark:text-slate-50">我的</h1>
            <p className="flex min-w-0 items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
              <span className="truncate">{email || '未登录'}</span>
              {email && (
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  title="复制邮箱"
                  className="shrink-0 cursor-pointer text-gray-400 transition-colors hover:text-indigo-500 dark:text-slate-500 dark:hover:text-indigo-400"
                >
                  <Icon name="copy" size={13} />
                </button>
              )}
            </p>
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {createdAt && <Chip icon="calendar">注册于 {createdAt}</Chip>}
          <Chip icon={user ? 'check' : 'alert'} tone={user ? 'emerald' : 'indigo'}>
            {user ? '已登录 · 云端同步可用' : '未登录'}
          </Chip>
        </div>
      </header>

      <div className="space-y-4">
        {/* ── 学习目标：手机端「我的」是二级功能索引页，这组入口只在这里出现 ── */}
        <div className="space-y-4">
          <SettingsSection title="学习目标" desc="计划、积累与复盘">
            <SettingRow
              to="/goal"
              icon={<Icon name="target" size={17} />}
              label="目标与承诺金"
              desc="设定每周目标时长，用承诺金约束自己"
            />
            <SettingRow
              to="/weekly-summary"
              icon={<Icon name="star" size={17} />}
              tint={TINT.violet}
              label="每周总结"
              desc="本周 vs 上周对比与反思笔记"
            />
            <SettingRow
              to="/vocabulary"
              icon={<Icon name="vocab" size={17} />}
              tint={TINT.emerald}
              label="生词本"
              desc="背单词、复习与发音"
            />
            <SettingRow
              to="/achievements"
              icon={<Icon name="medal" size={17} />}
              tint={TINT.amber}
              label="成就"
              desc={`徽章与里程碑 · 已解锁 ${overview.unlocked} 个`}
            />
            <SettingRow
              to="/english-checkin"
              icon={<Icon name="book" size={17} />}
              tint={TINT.sky}
              label="英语长难句打卡"
              desc="每日一句，逐条攻克长难句"
              last
            />
          </SettingsSection>

          <SettingsSection title="外观" desc="主题与显示风格">
            <div className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {THEMES.map((t) => {
                  const active = themeMode === t.key
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => handlePickTheme(t.key)}
                      aria-pressed={active}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors ${
                        active
                          ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-500/10'
                          : 'border-gray-200 hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-500/40'
                      }`}
                    >
                      <span className="h-5 w-5 shrink-0 rounded-full border border-black/10 dark:border-white/20" style={{ background: t.swatch }} />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-gray-800 dark:text-slate-100">{t.name}</span>
                        <span className="block truncate text-[11px] text-gray-400 dark:text-slate-500">{t.desc}</span>
                      </span>
                      {active && <span className="ml-auto text-indigo-500 dark:text-indigo-300">✓</span>}
                    </button>
                  )
                })}
              </div>
              <Link to="/settings" className="mt-3 flex w-fit items-center gap-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400">
                更多设置（倒计时 · 科目 · 提醒 · 进度条样式）
                <Icon name="arrowRight" size={13} />
              </Link>
            </div>
          </SettingsSection>
        </div>

        {/* ── 右列：数据与账号 ── */}
        <div className="space-y-4">
          <SettingsSection title="数据与备份" desc={user ? '云端同步 · 本地备份' : '登录后可用'}>
            <SettingRow
              icon={<Icon name="cloud" size={17} />}
              tint={TINT.blue}
              label={syncing ? '正在同步…' : '同步数据'}
              desc="把生词本与学习数据同步到云端"
              meta="云端"
              control={
                <button type="button" className="btn-ghost h-8 px-3 py-0 text-xs" onClick={handleSync} disabled={syncing}>
                  {syncing ? '同步中' : '立即同步'}
                </button>
              }
            />
            <SettingRow
              icon={<Icon name="download" size={17} />}
              tint={TINT.emerald}
              label={exporting ? '正在导出…' : '导出数据'}
              desc="导出学习记录 / 生词本 / 待办为 JSON 备份"
              meta="JSON"
              control={
                <button type="button" className="btn-ghost h-8 px-3 py-0 text-xs" onClick={handleExport} disabled={exporting}>
                  导出
                </button>
              }
            />
            <SettingRow
              icon={<Icon name="upload" size={17} />}
              tint={TINT.cyan}
              label={importing ? '正在导入…' : '导入数据'}
              desc="从备份 JSON 恢复，以文件数据为准合并进当前账号"
              meta="合并"
              control={
                <button type="button" className="btn-ghost h-8 px-3 py-0 text-xs" onClick={handleImport} disabled={importing}>
                  选择文件
                </button>
              }
              last
            />
          </SettingsSection>

          <SettingsSection title="设备" desc="多端协同">
            <SettingRow
              to="/scan-qr"
              icon={<Icon name="smartphone" size={17} />}
              tint={TINT.sky}
              label="扫码登录电脑"
              desc="手机上扫电脑屏幕的二维码，一键在电脑端登录"
            />
            <SettingRow
              to="/timer"
              icon={<Icon name="clock" size={17} />}
              tint={TINT.indigo}
              label="计时器"
              desc="正计时 / 番茄钟，桌面端可切换为置顶小挂件"
            />
            <SettingRow
              to="/trash"
              icon={<Icon name="trash" size={17} />}
              tint={TINT.slate}
              label="回收站"
              desc="查看并恢复已删除的学习记录"
              last
            />
          </SettingsSection>

          <SettingsSection title="关于与账户" desc={`当前版本 v${__APP_VERSION__}`}>
            <SettingRow
              icon={<Icon name="refresh" size={17} />}
              label={updateLabel}
              desc={status === 'available' && updateInfo ? `新版本 v${updateInfo.version} 可更新` : '检查是否有新版本可用'}
              meta={__APP_GIT_HASH__ ? `v${__APP_VERSION__} (${__APP_GIT_HASH__})` : `v${__APP_VERSION__}`}
              control={
                <div className="flex shrink-0 items-center gap-2">
                  {status === 'available' && updateInfo && (Capacitor.isNativePlatform() || isTauri()) && (
                    <button type="button" className="btn-primary h-8 px-3 py-0 text-xs" onClick={() => downloadAndInstall(updateInfo)}>
                      {Capacitor.isNativePlatform() ? '下载 APK' : '下载新版本安装包'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-ghost h-8 px-3 py-0 text-xs"
                    disabled={checkingText !== ''}
                    onClick={async () => {
                      setCheckingText('正在检查…')
                      await checkForUpdate()
                      setCheckingText('')
                    }}
                  >
                    {checkingText ? '检查中' : '检查更新'}
                  </button>
                </div>
              }
            />
            {status === 'available' && updateInfo && !(Capacitor.isNativePlatform() || isTauri()) && (
              <p className="border-b border-gray-100 px-4 py-2 text-xs text-gray-400 dark:border-slate-800 dark:text-slate-500">
                请在手机 App 或电脑版中完成更新
              </p>
            )}
            {status === 'downloaded' && (
              <p className="border-b border-gray-100 px-4 py-2 text-xs text-emerald-600 dark:border-slate-800 dark:text-emerald-400">
                {isTauri() ? '已用默认浏览器打开安装包下载页，下载后运行安装包即可完成更新' : '下载完成，请在通知栏点击完成安装'}
              </p>
            )}
            {status === 'error' && (
              <p className="border-b border-gray-100 px-4 py-2 text-xs text-red-500 dark:border-slate-800 dark:text-red-400">
                {error || '检查失败'}
              </p>
            )}
            <SettingRow
              icon={<Icon name="key" size={17} />}
              tint={TINT.violet}
              label="账号"
              desc={user?.id ? `用户 ID：${user.id.slice(0, 8)}…` : '未登录'}
              meta={email || ''}
            />
            <SettingRow
              icon={<Icon name="settings" size={17} />}
              tint={TINT.slate}
              label="全部设置"
              desc="倒计时 · 科目 · 提醒 · 进度条样式"
              to="/settings"
              last
            />
          </SettingsSection>

          <div className="space-y-3">
            <AppVersion />
            <button
              onClick={handleSignOut}
              className="btn-danger w-full py-2.5"
              title="退出当前账号"
            >
              <Icon name="arrowRight" size={15} className="rotate-180" />
              退出登录
            </button>
          </div>
        </div>
      </div>

      {overlays}
    </div>
  )
}
