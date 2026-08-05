import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LogForm from '../components/LogForm'
import { getAvailableSubjects } from '../lib/subjects'
import type { DailyLogInput } from '../lib/dailyLogs'
import { createLog, isDuplicateDateError } from '../lib/dailyLogs'

export default function NewRecord() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (data: DailyLogInput) => {
    if (!user) return
    try {
      await createLog(user.id, data)
      navigate('/my-records')
    } catch (err) {
      if (isDuplicateDateError(err)) {
        alert('该日期已有记录，请选择其他日期')
      } else {
        alert(err instanceof Error ? err.message : '提交失败，请重试')
      }
    }
  }

  const handleCancel = () => {
    navigate('/my-records')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-6">新建记录</h1>
      <LogForm
        availableSubjects={getAvailableSubjects()}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}
