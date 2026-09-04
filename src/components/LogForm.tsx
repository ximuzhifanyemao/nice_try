import { useState, useRef } from 'react'
import type { DailyLogInput, DailyLogSubject } from '../lib/dailyLogs'
import { todayStr, yesterdayStr } from '../lib/dailyLogs'
import type { Subject } from '../lib/subjects'
import { getActivitiesForSubject } from '../lib/subjects'
import { getCardColor } from '../lib/colors'

/** 表单中一行记录：一个科目 × 一个或多个学习内容（同一行内可勾选多个，时长相同） */
interface SubjectRow {
  key: string // 内部唯一标识（React key 用，不提交）
  subjectId: string
  activities: string[] // 可多选；空数组表示未选
  hours: number
  summary: string
}

/** 学习总结的快捷模板：label 为按钮文案，text 为填入内容，suffix 为追加时的衔接符 */
const summaryTemplates: { label: string; text: string; suffix: string }[] = [
  { label: '做了什么+收获', text: '今天学了 _ ，收获是 _ 。', suffix: ' ' },
  { label: '卡在哪里', text: '我在 _ 上遇到了困难，原因是 _ ，打算明天重点解决。', suffix: ' ' },
  { label: '状态打卡', text: '今天状态不错，超额完成了计划，继续保持。', suffix: ' ' },
]

interface LogFormProps {
  initialData?: DailyLogInput
  availableSubjects: Subject[]
  onSubmit: (data: DailyLogInput) => void
  onCancel: () => void
}

/** 初始化行：从已有记录生成（hours > 0），并为没有行的科目补空行 */
function buildInitialRows(
  initialData: DailyLogInput | undefined,
  availableSubjects: Subject[]
): SubjectRow[] {
  const rows: SubjectRow[] = []
  // 按 (科目, 时长, 总结) 分组：相同时长的多个学习内容合并为一行（可勾选多项）
  const index = new Map<string, number>() // id::hours::summary -> 行下标
  if (initialData) {
    for (const s of initialData.subjects) {
      if (!(s.hours > 0)) continue
      const keyBase = `${s.id}::${s.hours}::${s.summary ?? ''}`
      const existingIdx = index.get(keyBase)
      if (existingIdx !== undefined) {
        const row = rows[existingIdx]
        if (s.activity && !row.activities.includes(s.activity)) {
          rows[existingIdx] = { ...row, activities: [...row.activities, s.activity] }
        }
      } else {
        index.set(keyBase, rows.length)
        rows.push({
          key: `${keyBase}#${rows.length}`,
          subjectId: s.id,
          activities: s.activity ? [s.activity] : [],
          hours: s.hours,
          summary: s.summary ?? '',
        })
      }
    }
  }
  for (const subj of availableSubjects) {
    if (!rows.some((r) => r.subjectId === subj.id)) {
      rows.push({
        key: `${subj.id}::#${rows.length}`,
        subjectId: subj.id,
        activities: [],
        hours: 0,
        summary: '',
      })
    }
  }
  return rows
}

export default function LogForm({
  initialData,
  availableSubjects,
  onSubmit,
  onCancel,
}: LogFormProps) {
  const [rows, setRows] = useState<SubjectRow[]>(() => buildInitialRows(initialData, availableSubjects))
  const keySeq = useRef(rows.length)
  const [summary, setSummary] = useState(initialData?.summary ?? '')
  const [date, setDate] = useState(initialData?.date ?? todayStr())
  const [errors, setErrors] = useState<{ subjects?: string; date?: string }>({})

  const isEditing = !!initialData

  const nextKey = () => `row#${keySeq.current++}`

  const updateRow = (key: string, patch: Partial<SubjectRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
    setErrors((prev) => ({ ...prev, subjects: undefined }))
  }

  const addRow = (subjectId: string) => {
    setRows((prev) => [...prev, { key: nextKey(), subjectId, activities: [], hours: 0, summary: '' }])
  }

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key))
  }

  const handleHoursChange = (row: SubjectRow, value: string) => {
    const num = parseFloat(value)
    updateRow(row.key, { hours: isNaN(num) ? 0 : num })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: { subjects?: string; date?: string } = {}
    const hasAnyHours = rows.some((r) => r.hours > 0)
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

    // 每行可勾选多个学习内容：每个勾选内容展开为一条记录（时长取该行填写的值）
    const subjects: DailyLogSubject[] = []
    for (const r of rows) {
      if (!(r.hours > 0)) continue
      const acts = r.activities.length > 0 ? r.activities : ['']
      for (const act of acts) {
        const entry: DailyLogSubject = { id: r.subjectId, hours: r.hours }
        if (act) entry.activity = act
        if (r.summary.trim()) entry.summary = r.summary.trim()
        subjects.push(entry)
      }
    }

    onSubmit({ date, subjects, summary: summary.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 dark:shadow-slate-900/20 rounded-lg shadow p-5 space-y-5">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
        {isEditing ? '编辑记录' : '新建记录'}
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
          min={isEditing ? undefined : yesterdayStr()}
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
          {availableSubjects.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500">
              还没有科目，请先到「计时」页添加科目后再来记录。
            </p>
          ) : (
          availableSubjects.map((subject) => {
            const colorClass = getCardColor(subject.category)
            const subjectRows = rows.filter((r) => r.subjectId === subject.id)
            const activities = getActivitiesForSubject(subject.id)

            return (
              <div
                key={subject.id}
                className={`flex flex-col gap-2 p-3 rounded-lg border ${colorClass}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800 dark:text-slate-200">{subject.name}</span>
                  <button
                    type="button"
                    onClick={() => addRow(subject.id)}
                    className="text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    + 添加学习内容
                  </button>
                </div>

                {subjectRows.map((row) => (
                  <div
                    key={row.key}
                    className="space-y-2 rounded-lg bg-white/70 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700 p-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {activities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {activities.map((act) => (
                            <button
                              key={act}
                              type="button"
                              onClick={() =>
                                updateRow(row.key, {
                                  activities: row.activities.includes(act)
                                    ? row.activities.filter((a) => a !== act)
                                    : [...row.activities, act],
                                })
                              }
                              className={`px-2.5 py-0.5 text-xs rounded-full border transition-colors cursor-pointer ${
                                row.activities.includes(act)
                                  ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                                  : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-300'
                              }`}
                            >
                              {act}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-1 ml-auto">
                        <input
                          type="number"
                          value={row.hours || ''}
                          onChange={(e) => handleHoursChange(row, e.target.value)}
                          step={0.01}
                          min={0}
                          placeholder="0"
                          className="w-20 px-2 py-1 text-sm text-center border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                        />
                        <span className="text-sm text-gray-500 dark:text-slate-400">小时</span>
                      </div>

                      {subjectRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(row.key)}
                          className="text-xs text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 px-1.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          删除
                        </button>
                      )}
                    </div>

                    {row.activities.length > 1 && row.hours > 0 && (
                      <p className="text-[11px] text-blue-500 dark:text-blue-400">
                        已选 {row.activities.length} 项学习内容，每项各记 {row.hours} 小时
                      </p>
                    )}

                    {row.hours > 0 && (
                      <input
                        type="text"
                        value={row.summary}
                        onChange={(e) => updateRow(row.key, { summary: e.target.value })}
                        placeholder="该科目学习内容备注（可选）..."
                        className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    )}
                  </div>
                ))}
              </div>
            )
          })
          )}
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
          placeholder="例：今天学了 X，卡在 Y，收获是 Z，明天打算改进……"
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 resize-y"
        />
        <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">不会写？点下面的模板一键填入：</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {summaryTemplates.map((tpl) => (
            <button
              key={tpl.label}
              type="button"
              onClick={() =>
                setSummary((prev) => {
                  const text = prev.trim()
                  return text ? text + tpl.suffix + tpl.text : tpl.text
                })
              }
              className="px-2.5 py-1 text-xs rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
            >
              {tpl.label}
            </button>
          ))}
        </div>
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
