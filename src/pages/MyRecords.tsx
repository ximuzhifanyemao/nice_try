import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLogs } from '../contexts/LogsContext'
import { useToast } from '../lib/Toast'
import LogCard from '../components/LogCard'
import type { DailyLog } from '../lib/dailyLogs'
import { fetchMyLogsPaginated, deleteLog, todayStr } from '../lib/dailyLogs'
import { useWideLayout } from '../App'

const PAGE_SIZE = 20

export default function MyRecords() {
  const wide = useWideLayout()
  const { user } = useAuth()
  const { refetch } = useLogs()
  const toast = useToast()
  const navigate = useNavigate()
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const hasMore = page * PAGE_SIZE < totalCount

  const loadLogs = useCallback(() => {
    if (!user) return
    setLoading(true)
    setError(null)
    fetchMyLogsPaginated(user.id, 1, PAGE_SIZE)
      .then((result) => {
        setLogs(result.data)
        setTotalCount(result.total)
        setPage(1)
      })
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const loadMore = useCallback(async () => {
    if (!user || loadingMore) return
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const result = await fetchMyLogsPaginated(user.id, nextPage, PAGE_SIZE)
      setLogs((prev) => [...prev, ...result.data])
      setPage(nextPage)
      setTotalCount(result.total)
    } catch {
      toast.show('加载更多失败', { icon: '❌' })
    } finally {
      setLoadingMore(false)
    }
  }, [user, page, loadingMore])

  const today = todayStr()
  const todayLog = logs.find((l) => l.date === today) ?? null
  const hasTodayLog = !!todayLog
  const todayMissing = !!todayLog && !(todayLog.summary ?? '').trim()

  const handleDelete = useCallback(async (logId: string) => {
    try {
      await deleteLog(logId)
      setLogs((prev) => prev.filter((l) => l.id !== logId))
      setTotalCount((prev) => Math.max(0, prev - 1))
      refetch()
    } catch {
      toast.show('删除失败，请重试', { icon: '❌' })
    }
  }, [refetch])

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

      {/* 今日总结状态 */}
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
          你还没有学习记录，点击上方按钮开始记录
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

          {/* 加载更多 / 已全部加载 */}
          <div className="text-center py-4">
            {hasMore ? (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-ghost px-6 py-2 text-xs"
              >
                {loadingMore ? '加载中...' : `加载更多（${logs.length}/${totalCount}）`}
              </button>
            ) : logs.length > 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500">
                共 {totalCount} 条记录，已全部加载
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}