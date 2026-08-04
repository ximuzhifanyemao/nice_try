import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LogForm from '../components/LogForm'
import { getAvailableSubjects } from '../lib/subjects'
import type { DailyLog, DailyLogInput } from '../lib/dailyLogs'
import { fetchMyLogs, updateLog } from '../lib/dailyLogs'

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
    fetchMyLogs(user.id)
      .then((logs) => {
        const found = logs.find((l) => l.id === id)
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
    if (!id) return
    try {
      await updateLog(id, data)
      navigate('/my-records')
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败，请重试')
    }
  }

  const handleCancel = () => {
    navigate('/my-records')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    )
  }

  if (error || !log) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-red-500 mb-4">{error || '记录不存在'}</p>
        <button
          onClick={() => navigate('/my-records')}
          className="text-blue-600 hover:underline"
        >
          返回我的记录
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">编辑学习记录</h1>
      <LogForm
        initialData={{ subjects: log.subjects, summary: log.summary }}
        availableSubjects={getAvailableSubjects()}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}
