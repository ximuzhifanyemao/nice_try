import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LogCard from '../components/LogCard'
import type { DailyLog } from '../lib/dailyLogs'
import { fetchMyLogs, fetchTodayLog, deleteLog } from '../lib/dailyLogs'

export default function MyRecords() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasTodayLog, setHasTodayLog] = useState(false)

  const loadLogs = useCallback(() => {
    if (!user) return
    setLoading(true)
    setError(null)

    Promise.all([
      fetchMyLogs(user.id),
      fetchTodayLog(user.id),
    ])
      .then(([myLogs, todayLog]) => {
        setLogs(myLogs)
        setHasTodayLog(!!todayLog)
      })
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const handleDelete = async (logId: string) => {
    try {
      await deleteLog(logId)
      setLogs((prev) => prev.filter((l) => l.id !== logId))
      // Re-check today
      if (user) {
        fetchTodayLog(user.id).then((tl) => setHasTodayLog(!!tl))
      }
    } catch {
      alert('删除失败，请重试')
    }
  }

  const handleEdit = (logId: string) => {
    navigate(`/my-records/${logId}/edit`)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">我的记录</h1>
        <Link
          to={hasTodayLog ? `/my-records/${logs.find(l => {
            const today = new Date().toISOString().slice(0, 10)
            return l.date === today
          })?.id}/edit` : '/my-records/new'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            hasTodayLog
              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {hasTodayLog ? '今日已提交，编辑' : '新建今日记录'}
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-500">加载失败: {error}</div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="text-center py-12 text-gray-400">
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
            />
          ))}
        </div>
      )}
    </div>
  )
}
