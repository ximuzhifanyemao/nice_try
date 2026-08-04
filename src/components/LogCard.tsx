import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { DailyLog } from '../lib/dailyLogs'
import { getSubjectById } from '../lib/subjects'

const CATEGORY_COLORS: Record<string, string> = {
  math: 'bg-blue-100 text-blue-800',
  english: 'bg-green-100 text-green-800',
  '408': 'bg-purple-100 text-purple-800',
  politics: 'bg-red-100 text-red-800',
}

interface LogCardProps {
  log: DailyLog
  isOwner: boolean
  onEdit: () => void
  onDelete: () => void
}

export default function LogCard({ log, isOwner, onEdit, onDelete }: LogCardProps) {
  const handleDelete = () => {
    if (window.confirm('确定要删除这条学习记录吗？')) {
      onDelete()
    }
  }

  const formattedDate = (() => {
    try {
      return format(new Date(log.date + 'T00:00:00'), 'yyyy年MM月dd日 EEEE', { locale: zhCN })
    } catch {
      return log.date
    }
  })()

  const totalHours = log.subjects?.reduce((sum, s) => sum + (s.hours || 0), 0) ?? 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{formattedDate}</h3>
        <div className="flex items-center gap-2">
          {totalHours > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              今日 {totalHours}h
            </span>
          )}
          <span className="text-xs text-gray-300 font-mono" title={log.user_id}>
            {log.user_id.slice(0, 8)}
          </span>
        </div>
      </div>

      {log.subjects && log.subjects.length > 0 ? (
        <div className="space-y-2">
          {log.subjects
            .filter((s) => s.hours > 0)
            .map((s) => {
              const subject = getSubjectById(s.id)
              const colorClass = subject
                ? CATEGORY_COLORS[subject.category] ?? 'bg-gray-100 text-gray-700'
                : 'bg-gray-100 text-gray-700'

              return (
                <div key={s.id}>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${colorClass}`}
                  >
                    {subject?.name ?? s.id}
                    <span className="opacity-65 text-xs">{s.hours}h</span>
                  </span>
                  {s.summary && (
                    <p className="mt-1 ml-1 text-xs text-gray-500">{s.summary}</p>
                  )}
                </div>
              )
            })}
        </div>
      ) : (
        <p className="text-sm text-gray-400">暂无科目记录</p>
      )}

      {log.summary && (
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-6">
          {log.summary}
        </p>
      )}

      {isOwner && (
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-50">
          <button
            type="button"
            onClick={onEdit}
            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
          >
            编辑
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm text-red-400 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            删除
          </button>
        </div>
      )}
    </div>
  )
}
