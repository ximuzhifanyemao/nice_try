import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LogForm from '../components/LogForm'
import { getAvailableSubjects } from '../lib/subjects'
import type { DailyLog, DailyLogInput } from '../lib/dailyLogs'
import { fetchLogById, fetchLogByDate, updateLog, deleteLog, mergeSubjects, isDuplicateDateError } from '../lib/dailyLogs'

/** 合并两段总结：都非空时换行拼接 */
function combineSummary(a: string, b: string): string {
  if (!a.trim()) return b
  if (!b.trim()) return a
  return `${a.trim()}\n${b.trim()}`
}

export default function EditRecord() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [log, setLog] = useState<DailyLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const handleSubmit = async (data: DailyLogInput) => {
    if (!id || !user) return
    try {
      // 改到已有记录的日期时，将编辑内容合并进该日记录，并删除原记录
      if (log && data.date !== log.date) {
        const target = await fetchLogByDate(user.id, data.date)
        if (target) {
          await updateLog(target.id, {
            date: data.date,
            subjects: mergeSubjects(target.subjects, data.subjects),
            summary: combineSummary(target.summary, data.summary),
          })
          await deleteLog(id)
          navigate('/my-records')
          return
        }
      }
      await updateLog(id, data)
      navigate('/my-records')
    } catch (err) {
      if (isDuplicateDateError(err)) {
        alert('该日期已有记录，请选择其他日期')
      } else {
        alert(err instanceof Error ? err.message : '保存失败，请重试')
      }
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
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-6">编辑记录</h1>
      <LogForm
        initialData={{ date: log.date, subjects: log.subjects, summary: log.summary }}
        availableSubjects={getAvailableSubjects()}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}
