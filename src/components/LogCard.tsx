import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { DailyLog } from '../lib/dailyLogs'
import { getSubjectById } from '../lib/subjects'

const CATEGORY_COLORS: Record<string, string> = {
  math: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  english: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  '408': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  politics: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
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
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{formattedDate}</h3>
        <div className="flex items-center gap-2">
          {totalHours > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">
              今日 {totalHours}h
            </span>
          )}
          <span className="text-xs text-gray-300 dark:text-slate-600 font-mono" title={log.user_id}>
            {log.user_id.slice(0, 8)}
          </span>
        </div>
      </div>

      {log.subjects && log.subjects.length > 0 ? (
        <div className="space-y-2">
          {log.subjects
            .filter((s) => s.hours > 0)
            .map((s, index) => {
              const subject = getSubjectById(s.id)
              const colorClass = subject
                ? CATEGORY_COLORS[subject.category] ?? 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
                : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'

              return (
                <div key={`${s.id}-${s.activity ?? ''}-${index}`}>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${colorClass}`}
                  >
                    {(subject?.name ?? s.id)}
                    {s.activity ? `·${s.activity}` : ''}
                    <span className="opacity-65 text-xs">{s.hours}h</span>
                  </span>
                  {s.summary && (
                    <p className="mt-1 ml-1 text-xs text-gray-500 dark:text-slate-400">{s.summary}</p>
                  )}
                </div>
              )
            })}
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-slate-500">暂无科目记录</p>
      )}

      {log.summary && (
        <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap line-clamp-6">
          {log.summary}
        </p>
      )}

      {isOwner && (
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-50 dark:border-slate-700">
          <button
            type="button"
            onClick={onEdit}
            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
          >
            编辑
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
          >
            删除
          </button>
        </div>
      )}
    </div>
  )
}
