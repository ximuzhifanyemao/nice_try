import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLogs } from '../contexts/LogsContext'
import { useToast } from '../lib/Toast'
import LogForm from '../components/LogForm'
import { getAvailableSubjects } from '../lib/subjects'
import type { DailyLogInput } from '../lib/dailyLogs'
import { createLog, isDuplicateDateError } from '../lib/dailyLogs'
import { useWideLayout } from '../App'

export default function NewRecord() {
  const wide = useWideLayout()
  const { user } = useAuth()
  const { refetch } = useLogs()
  const toast = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (data: DailyLogInput) => {
    if (!user) return
    try {
      await createLog(user.id, data)
      refetch()
      navigate('/my-records')
    } catch (err) {
      if (isDuplicateDateError(err)) {
        toast.show('该日期已有记录，请选择其他日期', { icon: '⚠️' })
      } else {
        toast.show(err instanceof Error ? err.message : '提交失败，请重试', { icon: '❌' })
      }
    }
  }

  const handleCancel = () => {
    navigate('/my-records')
  }

  return (
    <div className={`mx-auto ${wide ? 'max-w-[1280px]' : 'max-w-2xl'} px-4 py-6`}>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-6">新建记录</h1>
      <LogForm
        availableSubjects={getAvailableSubjects()}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}
