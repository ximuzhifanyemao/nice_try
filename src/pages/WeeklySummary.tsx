import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { addDays, endOfWeek, format, parseISO } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import { useLogs } from '../contexts/LogsContext'
import { useWideLayout } from '../App'
import { useToast } from '../lib/Toast'
import { getWeekStartStr, fetchCommitments, type WeeklyCommitment } from '../lib/commitments'
import {
  fetchReflection,
  fetchReflectionWeekStarts,
  upsertReflection,
  computeWeeklyComparison,
  type WeeklyReflection,
  type WeeklyComparison,
  type SubjectDiff,
} from '../lib/weeklyReflections'
import { getSubjectById } from '../lib/subjects'
import { getChipColor } from '../lib/colors'
import { Icon } from '../components/Icon'
import ShareCard, { CARD_WIDTH, CARD_HEIGHT } from '../components/ShareCard'
import {
  generateSharePng,
  downloadPng,
  sharePngFile,
  pickMotto,
  subjectCategoryColor,
  type ShareCardData,
  type ShareCardSubject,
} from '../lib/shareCard'

/** 数值展示：保留 1 位小数，整数省略小数位 */
function fmtNum(n: number): string {
  const r = Math.round(n * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

/** 增减差异展示：正（绿 ↑ +x）、负（红 ↓ x）、周无数据（中性提示） */
function DiffChip({
  diff,
  unit,
  hasLastWeek,
  firstTime,
}: {
  diff: number
  unit: string
  hasLastWeek: boolean
  firstTime?: boolean
}) {
  if (!hasLastWeek) {
    return <span className="text-[11px] font-medium text-white/60">上周暂无数据</span>
  }
  if (firstTime) {
    return <span className="text-[11px] font-medium text-white/70">本周新增</span>
  }
  if (diff > 0) {
    return <span className="text-[11px] font-medium text-emerald-300">↑ +{fmtNum(diff)}{unit}</span>
  }
  if (diff < 0) {
    return <span className="text-[11px] font-medium text-rose-300">↓ {fmtNum(Math.abs(diff))}{unit}</span>
  }
  return <span className="text-[11px] font-medium text-white/60">持平</span>
}

function CompareStat({
  label,
  value,
  unit,
  diff,
  hasLastWeek,
}: {
  label: string
  value: string
  unit: string
  diff: number
  hasLastWeek: boolean
}) {
  return (
    <div className="rounded-xl bg-white/10 px-2 py-2 text-center backdrop-blur-sm">
      <p className="text-[10px] text-white/65">{label}</p>
      <p className="mt-0.5 num text-2xl leading-none">
        {value}
        {unit && <span className="ml-0.5 text-[10px] text-white/60">{unit}</span>}
      </p>
      <div className="mt-1 flex justify-center">
        <DiffChip diff={diff} unit={unit} hasLastWeek={hasLastWeek} />
      </div>
    </div>
  )
}

function SubjectRow({ diff, hasLastWeek }: { diff: SubjectDiff; hasLastWeek: boolean }) {
  const subject = getSubjectById(diff.subjectId)
  const chipColor = getChipColor(subject?.category ?? '')
  const isFirstTime = diff.lastWeekHours === 0 && diff.thisWeekHours > 0
  return (
    <div className="flex items-center gap-2">
      <span className={`${chipColor} inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium`}>
        {diff.name}
      </span>
      <span className="ml-auto text-sm font-semibold text-gray-700 dark:text-slate-200">
        {fmtNum(diff.thisWeekHours)}h
      </span>
      <span
        className={`w-16 shrink-0 text-right text-xs ${
          !hasLastWeek || isFirstTime
            ? 'text-gray-400 dark:text-slate-500'
            : diff.diff > 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : diff.diff < 0
                ? 'text-rose-500 dark:text-rose-400'
                : 'text-gray-400 dark:text-slate-500'
        }`}
      >
        {!hasLastWeek
          ? '上周暂无'
          : isFirstTime
            ? '新增'
            : diff.diff > 0
              ? `↑ +${fmtNum(diff.diff)}h`
              : diff.diff < 0
                ? `↓ ${fmtNum(Math.abs(diff.diff))}h`
                : '持平'}
      </span>
    </div>
  )
}

function GoalCard({ commit, actualHours }: { commit: WeeklyCommitment; actualHours: number }) {
  const progress = commit.target_hours > 0 ? Math.min(100, (actualHours / commit.target_hours) * 100) : 0
  const reached = actualHours >= commit.target_hours
  const stateBadge =
    commit.status === 'active'
      ? { text: '进行中', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' }
      : commit.status === 'won'
        ? { text: '目标达成 ✓', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' }
        : { text: '未达成', cls: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' }
  const targetShadow = stateBadge.text === '目标达成 ✓' ? null : `目标 ${fmtNum(commit.target_hours)}h`
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-gray-500 dark:text-slate-400">
          目标 {fmtNum(commit.target_hours)}h / 实际 {fmtNum(actualHours)}h
        </span>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${stateBadge.cls}`}>{stateBadge.text}</span>
      </div>
      {commit.status === 'active' ? (
        <>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
            <div
              className={`h-full rounded-full transition-all ${reached ? 'bg-gradient-to-r from-emerald-300 to-emerald-400' : 'bg-gradient-to-r from-indigo-400 to-violet-400'}`}
              style={{ width: `${Math.max(2, progress)}%` }}
            />
          </div>
          {!reached && (
            <p className="text-xs text-gray-400 dark:text-slate-500">
              还差 {fmtNum(Math.max(0, commit.target_hours - actualHours))}h 达成目标
            </p>
          )}
        </>
      ) : (
        <p className="text-sm">{targetShadow}</p>
      )}
    </div>
  )
}

const WeeklySummary: React.FC = () => {
  const wide = useWideLayout()
  const { user } = useAuth()
  const { logs, loading, error, refetch } = useLogs()
  const toast = useToast()

  const [weekStart, setWeekStart] = useState<string>(() => getWeekStartStr())
  const [commitments, setCommitments] = useState<WeeklyCommitment[]>([])
  const [reflectionWeeks, setReflectionWeeks] = useState<string[]>([])
  const [reflection, setReflection] = useState<WeeklyReflection | null>(null)
  const [reflectionLoading, setReflectionLoading] = useState(false)
  const [reflectionError, setReflectionError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareData, setShareData] = useState<ShareCardData | null>(null)
  const shareNodeRef = useRef<HTMLDivElement | null>(null)

  const currentWeekStart = getWeekStartStr()
  const isCurrentWeek = weekStart === currentWeekStart
  const canNext = format(addDays(parseISO(weekStart), 7), 'yyyy-MM-dd') <= currentWeekStart

  // 承诺与反思历史周次：只拉一次
  useEffect(() => {
    if (!user) return
    let alive = true
    fetchCommitments(user.id)
      .then((list) => alive && setCommitments(list))
      .catch(() => alive && setCommitments([]))
    fetchReflectionWeekStarts(user.id)
      .then((weeks) => alive && setReflectionWeeks(weeks))
      .catch(() => alive && setReflectionWeeks([]))
    return () => {
      alive = false
    }
  }, [user])

  // 切换周次：加载对应周反思
  useEffect(() => {
    if (!user) return
    let alive = true
    setReflection(null)
    setReflectionError(null)
    setDraft('')
    setEditing(false)
    setReflectionLoading(true)
    fetchReflection(user.id, weekStart)
      .then((r) => {
        if (!alive) return
        setReflection(r)
        setDraft(r?.content ?? '')
      })
      .catch((e: unknown) => alive && setReflectionError(e instanceof Error ? e.message : '加载反思失败'))
      .finally(() => alive && setReflectionLoading(false))
    return () => {
      alive = false
    }
  }, [user, weekStart])

  const comparison: WeeklyComparison = useMemo(() => computeWeeklyComparison(logs, weekStart), [logs, weekStart])
  const commit = useMemo(() => commitments.find((c) => c.week_start === weekStart), [commitments, weekStart])

  const weekEnd = format(endOfWeek(parseISO(weekStart), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const dateLabel = `${format(parseISO(weekStart), 'M月d日')} ~ ${format(parseISO(weekEnd), 'M月d日')}`

  const goPrevWeek = () => setWeekStart(format(addDays(parseISO(weekStart), -7), 'yyyy-MM-dd'))
  const goNextWeek = () => {
    if (!canNext) return
    setWeekStart(format(addDays(parseISO(weekStart), 7), 'yyyy-MM-dd'))
  }

  const saveReflection = async () => {
    if (!user || saving) return
    setSaving(true)
    try {
      const saved = await upsertReflection(user.id, weekStart, draft.trim())
      setReflection(saved)
      setEditing(false)
      toast.show('反思已保存', { icon: '✓' })
    } catch {
      toast.show('保存失败，请重试', { icon: '×' })
    } finally {
      setSaving(false)
    }
  }

  const startEdit = () => {
    setDraft(reflection?.content ?? '')
    setEditing(true)
  }
  const cancelEdit = () => {
    setDraft(reflection?.content ?? '')
    setEditing(false)
  }

  // 轮询等待分享卡 DOM 挂载完成（React 提交渲染后 ref 才可用），超时返回 null
  const waitForShareNode = () =>
    new Promise<HTMLDivElement | null>((resolve) => {
      let tries = 0
      const check = () => {
        const el = shareNodeRef.current
        if (el) resolve(el)
        else if (tries++ > 30) resolve(null)
        else setTimeout(check, 40)
      }
      setTimeout(check, 0)
    })

  // 点击「分享」：校验数据充足 → 渲染 ShareCard → 截图 → 按平台导出/分享
  const handleShare = async () => {
    if (sharing) return
    if (thisWeek.totalHours <= 0) {
      toast.show('有学习记录才能生成分享图', { icon: '×' })
      return
    }
    const subjects: ShareCardSubject[] = comparison.subjectDiffs
      .filter((d) => d.thisWeekHours > 0)
      .sort((a, b) => b.thisWeekHours - a.thisWeekHours)
      .map((d) => ({
        name: d.name,
        hours: d.thisWeekHours,
        color: subjectCategoryColor(getSubjectById(d.subjectId)?.category),
      }))
    setShareData({
      title: '本周学习总结',
      dateLabel,
      totalHours: thisWeek.totalHours,
      checkedDays: thisWeek.checkedDays,
      subjects,
      motto: pickMotto(weekStart),
    })
    setSharing(true)
    try {
      const node = await waitForShareNode()
      if (!node) return
      const dataUrl = await generateSharePng(node)
      if (!dataUrl) {
        toast.show('生成分享图失败，请重试', { icon: '×' })
        return
      }
      if (Capacitor.isNativePlatform()) {
        // Capacitor 原生：优先系统分享；该环境不支持文件分享时回退下载
        const shared = await sharePngFile(dataUrl)
        if (shared) {
          toast.show('分享图已生成', { icon: '✓' })
        } else {
          downloadPng(dataUrl)
          toast.show('当前环境不支持直接分享，已保存分享图', { icon: '✓' })
        }
      } else {
        // Web / Tauri：触发浏览器下载
        downloadPng(dataUrl)
        toast.show('分享图已生成', { icon: '✓' })
      }
    } finally {
      // 截图完成即卸载分享卡、复位按钮状态
      setShareData(null)
      setSharing(false)
    }
  }

  const { thisWeek, lastWeek, totalHoursDiff, checkedDaysDiff, avgDailyDiff } = comparison
  const thisWeekHasNoData = thisWeek.totalHours === 0 && lastWeek.totalHours === 0
  const hasLastWeek = lastWeek.totalHours > 0

  return (
    <div className={`mx-auto ${wide ? 'max-w-[1280px]' : 'max-w-4xl'} px-4 py-4 space-y-4`}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">每周总结</h1>
        <button
          type="button"
          onClick={handleShare}
          disabled={sharing}
          title="生成分享图"
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-slate-700 cursor-pointer"
        >
          <Icon name={sharing ? 'refresh' : 'download'} size={16} className={sharing ? 'animate-spin' : ''} />
          {sharing ? '生成中…' : '分享'}
        </button>
      </div>

      {/* 周次切换 */}
      <div className="card p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goPrevWeek}
            title="上一周"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Icon name="arrowLeft" size={18} />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">{dateLabel}</p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">{isCurrentWeek ? '本周' : '回顾往周'}</p>
          </div>
          <button
            type="button"
            onClick={goNextWeek}
            disabled={!canNext}
            title="下一周"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer ${
              canNext
                ? 'text-gray-500 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700'
                : 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            <Icon name="arrowRight" size={18} />
          </button>
        </div>
        {reflectionWeeks.length > 0 && (
          <select
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value={weekStart}>当前浏览周</option>
            {reflectionWeeks.map((w) => (
              <option key={w} value={w}>
                已写反思 · {format(parseISO(w), 'M月d日')} 那周
              </option>
            ))}
          </select>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <svg
            className="h-8 w-8 animate-spin text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}

      {error && !loading && (
        <div className="card p-8 text-center">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg mt-3 transition-colors cursor-pointer"
          >
            重试
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* 本周 vs 上周 核心对比 */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-4 text-white shadow-[0_8px_28px_-10px_rgba(79,70,229,0.5)] dark:shadow-none sm:p-5">
            <div aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-16 right-20 h-36 w-36 rounded-full bg-violet-300/20 blur-lg" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                    <Icon name="chart" size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-none">周学习对比</p>
                    <p className="mt-1 text-[11px] text-white/70">本周 vs 上周</p>
                  </div>
                </div>
              </div>

              {thisWeekHasNoData ? (
                <div className="mt-3">
                  <p className="text-sm text-white/85">本周与上周都还没有学习记录</p>
                  <Link
                    to="/my-records/new"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-indigo-700 shadow-sm transition-transform hover:scale-[1.03]"
                  >
                    去打卡 <Icon name="arrowRight" size={14} />
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <CompareStat label="总时长" value={fmtNum(thisWeek.totalHours)} unit="h" diff={totalHoursDiff} hasLastWeek={hasLastWeek} />
                    <CompareStat label="打卡天数" value={fmtNum(thisWeek.checkedDays)} unit="天" diff={checkedDaysDiff} hasLastWeek={hasLastWeek} />
                    <CompareStat label="日均" value={fmtNum(thisWeek.avgDaily)} unit="h" diff={avgDailyDiff} hasLastWeek={hasLastWeek} />
                  </div>
                  <p className="mt-3 border-t border-white/15 pt-2.5 text-[11px] text-white/70">
                    上周：总时长 {fmtNum(lastWeek.totalHours)}h · 打卡 {lastWeek.checkedDays} 天
                  </p>
                </>
              )}
            </div>
          </div>

          {/* 科目对比 */}
          <div className="card p-5 space-y-3">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">各科目 · 本周 vs 上周</h2>
            {comparison.subjectDiffs.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500">本周与上周暂无科目记录</p>
            ) : (
              <div className="space-y-2.5">
                {comparison.subjectDiffs.map((s) => (
                  <SubjectRow key={s.subjectId} diff={s} hasLastWeek={hasLastWeek} />
                ))}
              </div>
            )}
          </div>

          {/* 周目标 */}
          <div className="card p-5 space-y-3">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">周目标</h2>
            {commit ? (
              <GoalCard commit={commit} actualHours={thisWeek.totalHours} />
            ) : (
              <p className="text-sm text-gray-400 dark:text-slate-500">该周未设置周目标</p>
            )}
          </div>

          {/* 反思笔记 */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">反思笔记</h2>
              {!editing && !reflectionLoading && (
                <button
                  type="button"
                  onClick={startEdit}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {reflection ? '编辑反思' : '写反思'}
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400">这周哪些地方做得不够好？写下反思，下周改进。</p>

            {reflectionLoading && <div className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-700" />}

            {reflectionError && !reflectionLoading && (
              <p className="text-xs text-red-500 dark:text-red-400">{reflectionError}</p>
            )}

            {!editing && !reflectionLoading && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-slate-200">
                {reflection?.content || <span className="text-gray-400 dark:text-slate-500">还没有写反思</span>}
              </p>
            )}

            {editing && (
              <div className="space-y-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={5}
                  placeholder="这周哪些地方做得不够好？打算怎么改进？"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 resize-y"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={saveReflection}
                    disabled={saving}
                    className="px-4 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {saving ? '保存中...' : '保存反思'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 分享图渲染容器：固定尺寸、移到视口外，截图完成后即卸载 */}
      {shareData && (
        <div
          aria-hidden
          ref={shareNodeRef}
          style={{ position: 'fixed', left: -9999, top: -9999, width: CARD_WIDTH, height: CARD_HEIGHT, pointerEvents: 'none' }}
        >
          <ShareCard data={shareData} />
        </div>
      )}
    </div>
  )
}

export default WeeklySummary