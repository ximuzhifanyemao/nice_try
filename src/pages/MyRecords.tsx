import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { format, parseISO, addDays } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import { useLogs } from '../contexts/LogsContext'
import { useToast } from '../lib/Toast'
import LogCard from '../components/LogCard'
import WeekSwitcher from '../components/WeekSwitcher'
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

  return (
    <div className={`mx-auto ${wide ? 'max-w-[1280px]' : 'max-w-3xl'} px-4 py-4 space-y-4`}>
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

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500" />
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-500 dark:text-red-400">加载失败: {error}</div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="text-center py-12 text-gray-400 dark:text-slate-500">
          {isCurrentWeek ? '本周还没有学习记录' : '这一周没有学习记录'}
        </div>
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
    </div>
  )
}
