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
import { formatCategorySubjectName, getSubjectById } from '../lib/subjects'
import { getSubjectHex } from '../lib/colors'
import { getWeekStartStr } from '../lib/commitments'
import { getRecordsChartStyle, setRecordsChartStyle, type RecordsChartStyle } from '../lib/recordsChart'
import { useWideLayout } from '../App'

/** 图表类型切换：柱状 / 折线（左栏设置项与窄屏页头共用同一个控件） */
function ChartStyleSwitch({
  value,
  onChange,
}: {
  value: RecordsChartStyle
  onChange: (style: RecordsChartStyle) => void
}) {
  const options: { key: RecordsChartStyle; label: string }[] = [
    { key: 'bar', label: '柱状' },
    { key: 'line', label: '折线' },
  ]
  return (
    <div className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-slate-700 dark:bg-slate-800/60">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          aria-pressed={value === o.key}
          className={`cursor-pointer rounded-md px-2 py-1 text-[11px] transition-colors ${
            value === o.key
              ? 'bg-white font-semibold text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300'
              : 'font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

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
  /* 学习时长可视化图的类型（柱状 / 折线）：左栏设置一次，右栏各日卡片的图同步变化 */
  const [chartStyle, setChartStyle] = useState<RecordsChartStyle>(() => getRecordsChartStyle())
  const changeChartStyle = (style: RecordsChartStyle) => setChartStyle(setRecordsChartStyle(style))

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

    /* 本栏顶部的「每日学习时长」柱状图数据（周一~周日，今天高亮） */
    const weekBars = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(parseISO(weekStart), i)
      const date = format(day, 'yyyy-MM-dd')
      const hours = logs
        .filter((l) => l.date === date)
        .reduce((sum, l) => sum + (l.subjects ?? []).reduce((a, s) => a + (s.hours ?? 0), 0), 0)
      return { date, hours, isToday: date === today, weekday: ['日', '一', '二', '三', '四', '五', '六'][day.getDay()] }
    })
    const maxDayHours = Math.max(0.5, ...weekBars.map((d) => d.hours))
    // 日均按「已过去的天数」算：本周还没走完时不至于被空着的未来几天拉低
    const elapsedDays = isCurrentWeek ? Number(format(new Date(), 'i')) : 7

    /* 本周各科目占比：按科目汇总（同一科目的不同学习内容合并），用于「科目占比」分类条 */
    const subjectTotals = (() => {
      const map = new Map<string, { id: string; name: string; category?: string; hours: number }>()
      for (const log of logs) {
        for (const s of log.subjects ?? []) {
          if (!(s.hours > 0)) continue
          const entry = map.get(s.id)
          if (entry) {
            entry.hours += s.hours
            continue
          }
          const subject = getSubjectById(s.id)
          map.set(s.id, {
            id: s.id,
            name: subject ? subject.name : '已删除科目',
            category: subject?.category,
            hours: s.hours,
          })
        }
      }
      return [...map.values()].sort((a, b) => b.hours - a.hours)
    })()

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
              {/* 图表类型：左栏设置，右栏每日「每小时学习时长」图的画法 */}
              <SettingRow
                icon={<Icon name="chart" size={17} />}
                tint={TINT.indigo}
                label="图表类型"
                desc="每日每小时学习时长图"
                control={<ChartStyleSwitch value={chartStyle} onChange={changeChartStyle} />}
              />
              {/* 每日学习时长：7 根柱，今天高亮 —— 像手机「健康使用」的周视图 */}
              <div className="border-b border-gray-100 px-4 pb-3.5 pt-3.5 dark:border-slate-800">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-[11px] text-gray-400 dark:text-slate-500">每日学习时长</span>
                  <span className="text-[11px] text-gray-400 dark:text-slate-500">
                    日均 <span className="font-semibold text-gray-600 dark:text-slate-300">{(totalHours / elapsedDays).toFixed(1)}h</span>
                  </span>
                </div>
                <div className="flex items-end gap-1.5" style={{ height: 76 }}>
                  {weekBars.map((d) => (
                    <div
                      key={d.date}
                      className="flex h-full flex-1 flex-col justify-end"
                      title={`周${d.weekday} ${d.hours.toFixed(1)}h`}
                    >
                      <span
                        className={`w-full rounded-md transition-[height] duration-500 ease-out ${
                          d.isToday ? 'bg-indigo-500 dark:bg-indigo-400' : 'bg-indigo-200 dark:bg-indigo-500/35'
                        }`}
                        style={{ height: d.hours > 0 ? `${(d.hours / maxDayHours) * 100}%` : '2px' }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 flex gap-1.5">
                  {weekBars.map((d) => (
                    <span
                      key={d.date}
                      className={`flex-1 text-center text-[10px] leading-none ${
                        d.isToday
                          ? 'font-semibold text-indigo-600 dark:text-indigo-300'
                          : 'text-gray-400 dark:text-slate-500'
                      }`}
                    >
                      {d.weekday}
                    </span>
                  ))}
                </div>
              </div>

              {/* 科目占比：横向堆叠条 + 图例（像屏幕使用时间的「分类」） */}
              {subjectTotals.length > 0 && (
                <div className="border-b border-gray-100 px-4 pb-3.5 pt-3 dark:border-slate-800">
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-[11px] text-gray-400 dark:text-slate-500">科目占比</span>
                    <span className="text-[11px] text-gray-400 dark:text-slate-500">
                      {subjectTotals.length} 个科目
                    </span>
                  </div>
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700/60">
                    {subjectTotals.map((s) => (
                      <span
                        key={s.id}
                        className="h-full"
                        style={{
                          width: `${(s.hours / totalHours) * 100}%`,
                          backgroundColor: getSubjectHex(s.id, s.category),
                        }}
                        title={`${s.name} ${s.hours.toFixed(1)}h`}
                      />
                    ))}
                  </div>
                  <div className="mt-2.5 space-y-1.5">
                    {subjectTotals.slice(0, 5).map((s) => (
                      <div key={s.id} className="flex items-center gap-2 text-[11px]">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: getSubjectHex(s.id, s.category) }}
                        />
                        <span className="min-w-0 flex-1 truncate text-gray-600 dark:text-slate-300">
                          {formatCategorySubjectName(s.name, s.category)}
                        </span>
                        <span className="shrink-0 tabular-nums text-gray-400 dark:text-slate-500">
                          {s.hours.toFixed(1)}h · {Math.round((s.hours / totalHours) * 100)}%
                        </span>
                      </div>
                    ))}
                    {subjectTotals.length > 5 && (
                      <p className="text-[11px] text-gray-400 dark:text-slate-500">
                        其余 {subjectTotals.length - 5} 个科目合计{' '}
                        {subjectTotals
                          .slice(5)
                          .reduce((sum, s) => sum + s.hours, 0)
                          .toFixed(1)}
                        h
                      </p>
                    )}
                  </div>
                </div>
              )}

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
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">记录</h1>
        <div className="flex shrink-0 items-center gap-2">
          {/* 窄屏没有左栏概览列，图表类型切换收到页头（与左栏同一份偏好） */}
          <ChartStyleSwitch value={chartStyle} onChange={changeChartStyle} />
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
