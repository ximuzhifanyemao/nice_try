import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLogs } from '../contexts/LogsContext'
import { useToast } from '../lib/Toast'
import { Icon } from '../components/Icon'
import LogCard from '../components/LogCard'
import ConfirmDialog from '../components/ConfirmDialog'
import type { DailyLog } from '../lib/dailyLogs'
import { fetchTrashedLogs, restoreLog, purgeLog, isDuplicateDateError } from '../lib/dailyLogs'
import { formatDateShort } from '../lib/format'

/** ISO 时间 → "8月7日 14:32" */
function formatDeletedAt(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const NOOP = () => {}

export default function Trash() {
  const { user } = useAuth()
  const { refetch } = useLogs()
  const toast = useToast()
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [purgeTarget, setPurgeTarget] = useState<DailyLog | null>(null)

  const loadLogs = useCallback(() => {
    if (!user) return
    setLoading(true)
    setError(null)
    fetchTrashedLogs(user.id)
      .then(setLogs)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const handleRestore = async (logId: string) => {
    try {
      await restoreLog(logId)
      loadLogs()
      refetch()
    } catch (err) {
      if (isDuplicateDateError(err)) {
        toast.show('恢复失败：该日期已有正常记录，请先处理当天记录后再试', { icon: '⚠️' })
      } else {
        toast.show('恢复失败，请重试', { icon: '❌' })
      }
    }
  }

  const handlePurge = async (logId: string) => {
    setPurgeTarget(null)
    try {
      await purgeLog(logId)
      loadLogs()
      refetch()
    } catch {
      toast.show('删除失败，请重试', { icon: '❌' })
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-slate-100">
          <Icon name="trash" size={20} className="text-gray-400" /> 回收站
        </h1>
        <Link
          to="/my-records"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          ← 返回记录
        </Link>
      </div>

      <p className="text-xs text-gray-400 dark:text-slate-500">
        删除的学习记录会保留在这里，可随时恢复；彻底删除后无法找回。
      </p>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500" />
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-500 dark:text-red-400">加载失败: {error}</div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="text-center py-12 text-gray-400 dark:text-slate-500">回收站是空的</div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="space-y-2">
              <LogCard log={log} isOwner={false} onEdit={NOOP} onDelete={NOOP} />
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  {log.deleted_at ? `删除于 ${formatDeletedAt(log.deleted_at)}` : '已删除'}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleRestore(log.id)}
                    className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                  >
                    恢复
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurgeTarget(log)}
                    className="px-3 py-1.5 text-sm text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
                  >
                    彻底删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!purgeTarget}
        title="彻底删除记录？"
        message={
          purgeTarget
            ? `「${formatDateShort(purgeTarget.date)}」的记录将被永久删除，无法恢复。确定要删除吗？`
            : ''
        }
        confirmText="彻底删除"
        danger
        onConfirm={() => purgeTarget && handlePurge(purgeTarget.id)}
        onCancel={() => setPurgeTarget(null)}
      />
    </div>
  )
}
