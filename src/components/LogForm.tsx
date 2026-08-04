import { useState } from 'react'
import type { DailyLogInput, DailyLogSubject } from '../lib/dailyLogs'
import { todayStr, yesterdayStr } from '../lib/dailyLogs'
import type { Subject } from '../lib/subjects'

const CATEGORY_COLORS: Record<string, string> = {
  math: 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700/50',
  english: 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700/50',
  '408': 'bg-purple-50 border-purple-300 dark:bg-purple-900/20 dark:border-purple-700/50',
  politics: 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700/50',
}

interface LogFormProps {
  initialData?: DailyLogInput
  availableSubjects: Subject[]
  onSubmit: (data: DailyLogInput) => void
  onCancel: () => void
}

export default function LogForm({
  initialData,
  availableSubjects,
  onSubmit,
  onCancel,
}: LogFormProps) {
  const existingHours = new Map<string, number>()
  const existingSummaries = new Map<string, string>()
  if (initialData) {
    for (const s of initialData.subjects) {
      existingHours.set(s.id, s.hours)
      if (s.summary) {
        existingSummaries.set(s.id, s.summary)
      }
    }
  }

  const [subjectHours, setSubjectHours] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const s of availableSubjects) {
      init[s.id] = existingHours.get(s.id) ?? 0
    }
    return init
  })
  const [subjectSummaries, setSubjectSummaries] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const s of availableSubjects) {
      init[s.id] = existingSummaries.get(s.id) ?? ''
    }
    return init
  })
  const [summary, setSummary] = useState(initialData?.summary ?? '')
  const [date, setDate] = useState(initialData?.date ?? todayStr())
  const [errors, setErrors] = useState<{ subjects?: string; date?: string }>({})

  const handleHoursChange = (subjectId: string, value: string) => {
    const num = parseFloat(value)
    setSubjectHours((prev) => ({
      ...prev,
      [subjectId]: isNaN(num) ? 0 : num,
    }))
    setErrors((prev) => ({ ...prev, subjects: undefined }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: { subjects?: string; date?: string } = {}
    const hasAnyHours = Object.values(subjectHours).some((h) => h > 0)
    if (!hasAnyHours) {
      newErrors.subjects = '请至少为一个科目设置学习时长'
    }
    if (!date) {
      newErrors.date = '请选择记录日期'
    } else if (date > todayStr()) {
      newErrors.date = '记录日期不能晚于今天'
    } else if (!isEditing && date < yesterdayStr()) {
      newErrors.date = '最多补交昨天的记录'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const subjects: DailyLogSubject[] = Object.entries(subjectHours)
      .filter(([, hours]) => hours > 0)
      .map(([id, hours]) => {
        const subSummary = subjectSummaries[id]?.trim()
        return subSummary
          ? { id, hours, summary: subSummary }
          : { id, hours }
      })

    onSubmit({ date, subjects, summary: summary.trim() })
  }

  const isEditing = !!initialData

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 dark:shadow-slate-900/20 rounded-lg shadow p-5 space-y-5">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
        {isEditing ? '编辑学习记录' : '新建学习记录'}
      </h3>

      {/* 记录日期 */}
      <div>
        <label htmlFor="log-date" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          记录日期
        </label>
        <input
          id="log-date"
          type="date"
          value={date}
          min={yesterdayStr()}
          max={todayStr()}
          onChange={(e) => {
            setDate(e.target.value)
            setErrors((prev) => ({ ...prev, date: undefined }))
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
        <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
          默认今天，最多补交昨天
        </p>
        {errors.date && (
          <p className="mt-1 text-sm text-red-500">{errors.date}</p>
        )}
      </div>

      {/* 科目选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          学习科目
        </label>
        <div className="space-y-3">
          {availableSubjects.map((subject) => {
            const colorClass = CATEGORY_COLORS[subject.category] ?? 'bg-gray-50 border-gray-200 dark:bg-slate-700/30 dark:border-slate-600'

            return (
              <div
                key={subject.id}
                className={`flex flex-col gap-2 p-3 rounded-lg border ${colorClass}`}
              >
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subjectHours[subject.id] > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSubjectHours((prev) => ({ ...prev, [subject.id]: 1 }))
                        } else {
                          setSubjectHours((prev) => ({ ...prev, [subject.id]: 0 }))
                          setSubjectSummaries((prev) => ({ ...prev, [subject.id]: '' }))
                        }
                        setErrors((prev) => ({ ...prev, subjects: undefined }))
                      }}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-slate-600 dark:bg-slate-700 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                    <span className="text-sm font-medium text-gray-800 dark:text-slate-200">{subject.name}</span>
                  </label>

                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={subjectHours[subject.id] || ''}
                      onChange={(e) => handleHoursChange(subject.id, e.target.value)}
                      step={0.5}
                      min={0}
                      placeholder="0"
                      disabled={subjectHours[subject.id] <= 0}
                      className="w-20 px-2 py-1 text-sm text-center border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                    />
                    <span className="text-sm text-gray-500 dark:text-slate-400">小时</span>
                  </div>
                </div>

                {subjectHours[subject.id] > 0 && (
                  <input
                    type="text"
                    value={subjectSummaries[subject.id] || ''}
                    onChange={(e) =>
                      setSubjectSummaries((prev) => ({
                        ...prev,
                        [subject.id]: e.target.value,
                      }))
                    }
                    placeholder="该科目学习内容..."
                    className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                )}
              </div>
            )
          })}
        </div>
        {errors.subjects && (
          <p className="mt-1 text-sm text-red-500">{errors.subjects}</p>
        )}
      </div>

      {/* 学习总结 */}
      <div>
        <label htmlFor="log-summary" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          学习总结（可选）
        </label>
        <textarea
          id="log-summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          placeholder="今天学了什么？有什么收获或反思？"
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 resize-y"
        />
      </div>

      {/* 按钮 */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-lg transition-colors cursor-pointer"
        >
          {isEditing ? '保存' : '提交'}
        </button>
      </div>
    </form>
  )
}
