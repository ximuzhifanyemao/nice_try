import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { format, parseISO, addDays } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import { useLogs } from '../contexts/LogsContext'
import { useToast } from '../lib/Toast'
import LogCard from '../components/LogCard'
import WeekSwitcher from '../components/WeekSwitcher'
import { Icon } from '../components/Icon'
import SettingsSection, { SettingRow, TINT } from '../components/ui/Section'
import type { DailyLog } from '../lib/dailyLogs'
import { fetchLogsInRange, deleteLog, todayStr } from '../lib/dailyLogs'
import { getWeekStartStr } from '../lib/commitments'
import { useWideLayout } from '../App'

/**
 * 记录页：只展示「一天一天」的打卡记录，范围限定在一周内。
 *
 * 刻意不做无限分页——记录会随使用不断累积，无边界列表会让页面越滑越长；
 * 而按天查看学习情况已经有首页日历这个更直观的入口，
 * 所以这里只保留「本周（可翻往周）」这一个有上限的视图。
 */
export default function MyRecords() {
  const wide = useWideLayout()
  const { user } = useAuth()
  const { refetch } = useLogs()
  const toast = useToast()
  const navigate = useNavigate()
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** 当前查看的周起点（周一，yyyy-MM-dd）；初始为本周 */
  const [weekStart, setWeekStart] = useState<string>(() => getWeekStartStr())

  const weekEnd = format(addDays(parseISO(weekStart), 6), 'yyyy-MM-dd')
  const currentWeekStart = getWeekStartStr()
  const isCurrentWeek = weekStart === currentWeekStart

  const loadLogs = useCallback(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchLogsInRange(user.id, weekStart, weekEnd)
      .then((rows) => {
        if (!cancelled) setLogs(rows)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    // 切周/切用户时丢弃上一次请求的结果，避免旧数据覆盖新周
    return () => {
      cancelled = true
    }
  }, [user, weekStart, weekEnd])

  useEffect(() => loadLogs(), [loadLogs])

  const today = todayStr()
  // 「今日」状态只在查看本周时才有意义（往周没有今天这一说）
  const todayLog = isCurrentWeek ? (logs.find((l) => l.date === today) ?? null) : null
  const hasTodayLog = !!todayLog
  const todayMissing = !!todayLog && !(todayLog.summary ?? '').trim()

  const handleDelete = useCallback(async (logId: string) => {
    try {
      await deleteLog(logId)
      setLogs((prev) => prev.filter((l) => l.id !== logId))
      refetch()
    } catch {
      toast.show('删除失败，请重试', { icon: '❌' })
    }
  }, [refetch, toast])

  const handleEdit = useCallback((logId: string) => {
    navigate(`/my-records/${logId}/edit`)
  }, [navigate])

  /** 记录列表（含加载/失败/空态）：桌面与手机两个布局分支共用 */
  const recordsList = (
    <>
      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500" />
        </div>
      )}

      {error && <div className="py-8 text-center text-red-500 dark:text-red-400">加载失败: {error}</div>}

      {!loading && !error && logs.length === 0 && (
        wide ? (
          /* 桌面端：左对齐的说明条 + 行动按钮，不用手机那套整块居中虚线大框 */
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white/60 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-800/30">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-slate-700/60 dark:text-slate-500">
              <Icon name="calendar" size={15} />
            </span>
            <p className="min-w-0 flex-1 text-[13px] text-gray-500 dark:text-slate-400">
              {isCurrentWeek ? '本周还没有学习记录' : '这一周没有学习记录'}
            </p>
            <Link to="/my-records/new" className="btn-primary h-8 shrink-0 px-3 py-0 text-xs">
              + 新建今日记录
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-sm text-gray-400 dark:border-slate-800 dark:text-slate-500">
            {isCurrentWeek ? '本周还没有学习记录' : '这一周没有学习记录'}
          </div>
        )
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {logs.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              isOwner={true}
              onEdit={() => handleEdit(log.id)}
              onDelete={() => handleDelete(log.id)}
              onSummarySaved={loadLogs}
            />
          ))}

          {/* 范围说明：记录列表到此为止，更早的记录用日历按天回看 */}
          {logs.length > 0 && (
            <p className="py-4 text-center text-xs text-gray-400 dark:text-slate-500">
              共 {logs.length} 条记录 · 更早的记录请用
              <Link to="/" className="mx-1 text-indigo-500 hover:underline dark:text-indigo-400">
                首页日历
              </Link>
              按天回看
            </p>
          )}
        </div>
      )}
    </>
  )

  /* ── 桌面端「记录」：把周切换、汇总做成顶部工具栏 + 左侧概览栏 ──
     手机端那块「左右箭头撑满一整行的周切换卡片」在桌面上又长又空，
     换成工具栏里的紧凑翻周控件，并把本周数据汇总到左侧，符合桌面软件的信息层次。 */
  if (wide) {
    const totalHours = logs.reduce(
      (sum, l) => sum + (l.subjects ?? []).reduce((a, s) => a + (s.hours ?? 0), 0),
      0,
    )
    const checkedDays = new Set(logs.map((l) => l.date)).size
    const canNext = format(addDays(parseISO(weekStart), 7), 'yyyy-MM-dd') <= currentWeekStart
    const stepWeek = (days: number) => setWeekStart(format(addDays(parseISO(weekStart), days), 'yyyy-MM-dd'))
    const rangeText = `${format(parseISO(weekStart), 'M月d日')} – ${format(parseISO(weekEnd), 'M月d日')}`

    return (
      <div className="mx-auto max-w-[1280px] px-5 py-4 pb-6">
        {/* 工具栏：标题 + 当前周次 + 翻周 + 新建 */}
        <header className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">记录</h1>
          <span className="text-xs text-gray-400 dark:text-slate-500">
            {rangeText} · {isCurrentWeek ? '本周' : '回顾往周'}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => stepWeek(-7)}
                title="上一周"
                aria-label="上一周"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-l-xl text-gray-500 transition-colors hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <Icon name="arrowLeft" size={16} />
              </button>
              <span className="h-4 w-px bg-gray-200 dark:bg-slate-700" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setWeekStart(currentWeekStart)}
                disabled={isCurrentWeek}
                title="回到本周"
                className="h-9 cursor-pointer px-3 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-default disabled:text-gray-300 dark:text-slate-300 dark:hover:bg-slate-700 dark:disabled:text-slate-600"
              >
                本周
              </button>
              <span className="h-4 w-px bg-gray-200 dark:bg-slate-700" aria-hidden="true" />
              <button
                type="button"
                onClick={() => canNext && stepWeek(7)}
                disabled={!canNext}
                title="下一周"
                aria-label="下一周"
                className="flex h-9 w-9 items-center justify-center rounded-r-xl text-gray-500 transition-colors enabled:cursor-pointer enabled:hover:bg-gray-50 disabled:text-gray-300 dark:text-slate-300 dark:enabled:hover:bg-slate-700 dark:disabled:text-slate-600"
              >
                <Icon name="arrowRight" size={16} />
              </button>
            </div>
            <Link
              to={hasTodayLog ? `/my-records/${todayLog?.id}/edit` : '/my-records/new'}
              className={`btn-primary h-9 px-4 py-0 text-xs ${
                hasTodayLog ? 'bg-amber-500 hover:bg-amber-400 dark:bg-amber-500 dark:hover:bg-amber-400' : ''
              }`}
            >
              {hasTodayLog ? '编辑今日记录' : '+ 新建今日记录'}
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-[300px_minmax(0,1fr)] items-start gap-4">
          {/* 左栏：本周汇总 + 今日总结状态 */}
          <div className="space-y-3">
            <SettingsSection title="本周概览" desc={rangeText}>
              <SettingRow icon={<Icon name="pencil" size={17} />} tint={TINT.slate} label="记录条数" meta={`${logs.length} 条`} />
              <SettingRow icon={<Icon name="clock" size={17} />} tint={TINT.indigo} label="学习时长" meta={`${totalHours.toFixed(1)} h`} />
              <SettingRow icon={<Icon name="calendar" size={17} />} tint={TINT.emerald} label="打卡天数" meta={`${checkedDays} 天`} last />
            </SettingsSection>

            {todayLog && (
              <SettingsSection title="今日总结" desc={todayMissing ? '未填写' : '已完成'}>
                <SettingRow
                  icon={<Icon name={todayMissing ? 'alert' : 'check'} size={17} />}
                  tint={todayMissing ? TINT.amber : TINT.emerald}
                  label={todayMissing ? '今日总结未写' : '今日打卡完成'}
                  desc={
                    todayMissing
                      ? '记录已提交，请在今日记录中补写总结'
                      : '今天的总结已填写'
                  }
                  last
                />
              </SettingsSection>
            )}
          </div>

          {/* 右栏：本周记录列表 */}
          <div className="min-w-0 space-y-3">{recordsList}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">记录</h1>
        <Link
          to={hasTodayLog ? `/my-records/${todayLog?.id}/edit` : '/my-records/new'}
          className={`btn-primary px-4 py-2 text-xs ${
            hasTodayLog
              ? 'bg-amber-500 hover:bg-amber-400 dark:bg-amber-500 dark:hover:bg-amber-400'
              : ''
          }`}
        >
          {hasTodayLog ? '今日已提交 · 编辑' : '+ 新建今日记录'}
        </Link>
      </div>

      <div className="space-y-4">
        {/* 周次切换：把列表范围限制在一周内 */}
        <WeekSwitcher weekStart={weekStart} onChange={setWeekStart} />

        {/* 今日总结状态（仅本周视图） */}
        {todayLog && (
          <div
            className={`rounded-xl shadow-sm border px-5 py-4 ${
              todayMissing
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            }`}
          >
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">
              {todayMissing ? '今日总结未写' : '今日打卡完成 ✓'}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {todayMissing
                ? '今天的学习记录已提交，请在下方的今日记录中补写总结'
                : '今天的总结已填写'}
            </p>
          </div>
        )}

        {recordsList}
      </div>
    </div>
  )
}
