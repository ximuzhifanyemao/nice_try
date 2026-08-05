import { memo, useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { DailyLog } from '../lib/dailyLogs'
import { updateLog } from '../lib/dailyLogs'
import { getSubjectById } from '../lib/subjects'
import { getChipColor } from '../lib/colors'

interface LogCardProps {
  log: DailyLog
  isOwner: boolean
  onEdit: () => void
  onDelete: () => void
  /** 总结保存成功后的回调（父组件刷新列表） */
  onSummarySaved?: () => void
}

function LogCard({ log, isOwner, onEdit, onDelete, onSummarySaved }: LogCardProps) {
  const [editingSummary, setEditingSummary] = useState(false)
  const [summaryDraft, setSummaryDraft] = useState('')
  const [savingSummary, setSavingSummary] = useState(false)

  const hasSummary = !!(log.summary ?? '').trim()

  const handleDelete = () => {
    if (window.confirm('确定要删除这条学习记录吗？')) {
      onDelete()
    }
  }

  const openSummaryEditor = () => {
    setSummaryDraft(log.summary ?? '')
    setEditingSummary(true)
  }

  const saveSummary = async () => {
    if (savingSummary) return
    setSavingSummary(true)
    try {
      const summary = summaryDraft.trim()
      await updateLog(log.id, {
        date: log.date,
        subjects: log.subjects,
        summary,
      })
      setEditingSummary(false)
      onSummarySaved?.()
    } catch {
      alert('保存失败，请重试')
    } finally {
      setSavingSummary(false)
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
              今日 {totalHours.toFixed(2)}h
            </span>
          )}
          {isOwner && !(log.summary ?? '').trim() && (
            <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 px-2 py-0.5 rounded-full">
              未写总结
            </span>
          )}
        </div>
      </div>

      {log.subjects && log.subjects.length > 0 ? (
        <div className="space-y-2">
          {log.subjects
            .filter((s) => s.hours > 0)
            .map((s, index) => {
              const subject = getSubjectById(s.id)
              const colorClass = subject
                ? getChipColor(subject.category)
                : getChipColor()

              return (
                <div key={`${s.id}-${s.activity ?? ''}-${index}`}>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${colorClass}`}
                  >
                    {(subject?.name ?? s.id)}
                    {s.activity ? `·${s.activity}` : ''}
                    <span className="opacity-65 text-xs">{s.hours.toFixed(2)}h</span>
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

      {isOwner && !editingSummary && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-slate-700">
          <span className="text-xs text-gray-400 dark:text-slate-500">
            {hasSummary ? '学习总结' : '未写总结'}
          </span>
          <button
            type="button"
            onClick={openSummaryEditor}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            {hasSummary ? '编辑总结' : '写总结'}
          </button>
        </div>
      )}

      {isOwner && editingSummary && (
        <div className="pt-2 border-t border-gray-50 dark:border-slate-700 space-y-2">
          <textarea
            value={summaryDraft}
            onChange={(e) => setSummaryDraft(e.target.value)}
            rows={3}
            placeholder="今天学了什么？有什么收获或反思？"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 resize-y"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingSummary(false)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={saveSummary}
              disabled={savingSummary}
              className="px-4 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {savingSummary ? '保存中...' : '保存总结'}
            </button>
          </div>
        </div>
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

// memo：父组件 state 变化时避免无谓的列表项重渲染
export default memo(LogCard)
