import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLogs } from '../contexts/LogsContext'
import { useToast } from '../lib/Toast'
import LogForm from '../components/LogForm'
import ConfirmDialog from '../components/ConfirmDialog'
import { getAvailableSubjects } from '../lib/subjects'
import type { DailyLog, DailyLogInput } from '../lib/dailyLogs'
import { fetchLogById, fetchLogByDate, updateLog, purgeLog, mergeSubjects, isDuplicateDateError } from '../lib/dailyLogs'
import { useWideLayout } from '../App'

/** 合并两段总结：都非空时换行拼接 */
function combineSummary(a: string, b: string): string {
  if (!a.trim()) return b
  if (!b.trim()) return a
  return `${a.trim()}\n${b.trim()}`
}

export default function EditRecord() {
  const wide = useWideLayout()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { refetch } = useLogs()
  const toast = useToast()
  const navigate = useNavigate()
  const [log, setLog] = useState<DailyLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mergeConfirm, setMergeConfirm] = useState<{ open: boolean; data?: DailyLogInput; target?: DailyLog }>({ open: false })
  const pendingRef = useRef<{ data: DailyLogInput; target: DailyLog } | null>(null)

  useEffect(() => {
    if (!user || !id) return
    setLoading(true)
    fetchLogById(id)
      .then((found) => {
        if (!found) {
          setError('记录不存在')
        } else if (found.user_id !== user.id) {
          setError('无权编辑此记录')
        } else {
          setLog(found)
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [user, id])

  const doMerge = async (data: DailyLogInput, target: DailyLog) => {
    if (!id) return
    try {
      await updateLog(target.id, {
        date: data.date,
        subjects: mergeSubjects(target.subjects, data.subjects),
        summary: combineSummary(target.summary, data.summary),
      })
      await purgeLog(id)
      refetch()
      navigate('/my-records')
    } catch (err) {
      toast.show(err instanceof Error ? err.message : '保存失败，请重试', { icon: '❌' })
    }
  }

  const handleSubmit = async (data: DailyLogInput) => {
    if (!id || !user) return
    try {
      if (log && data.date !== log.date) {
        const target = await fetchLogByDate(user.id, data.date)
        if (target) {
          pendingRef.current = { data, target }
          setMergeConfirm({ open: true, data, target })
          return
        }
      }
      await updateLog(id, data)
      refetch()
      navigate('/my-records')
    } catch (err) {
      if (isDuplicateDateError(err)) {
        toast.show('该日期已有记录，请选择其他日期', { icon: '⚠️' })
      } else {
        toast.show(err instanceof Error ? err.message : '保存失败，请重试', { icon: '❌' })
      }
    }
  }

  const handleMergeConfirm = () => {
    setMergeConfirm({ open: false })
    if (pendingRef.current) {
      doMerge(pendingRef.current.data, pendingRef.current.target)
      pendingRef.current = null
    }
  }

  const handleCancel = () => {
    navigate('/my-records')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500" />
      </div>
    )
  }

  if (error || !log) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-red-500 dark:text-red-400 mb-4">{error || '记录不存在'}</p>
        <button
          onClick={() => navigate('/my-records')}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          返回记录
        </button>
      </div>
    )
  }

  return (
    <div className={`mx-auto ${wide ? 'max-w-[1280px]' : 'max-w-2xl'} px-4 py-6`}>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-6">编辑记录</h1>
      <LogForm
        initialData={{ date: log.date, subjects: log.subjects, summary: log.summary }}
        availableSubjects={getAvailableSubjects()}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
      <ConfirmDialog
        open={mergeConfirm.open}
        title="合并并删除原记录"
        message={`该日期（${mergeConfirm.target?.date}）已有记录。确认后将把当前编辑内容合并进该记录，并永久删除原记录（不可恢复）。`}
        confirmText="确认合并"
        danger
        onConfirm={handleMergeConfirm}
        onCancel={() => setMergeConfirm({ open: false })}
      />
    </div>
  )
}
