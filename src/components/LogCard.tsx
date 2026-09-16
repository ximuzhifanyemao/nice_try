import { memo, useRef, useState } from 'react'
import type { DailyLog } from '../lib/dailyLogs'
import { sortSubjectsByStartTime, updateLog, updateLogVersioned, isVersionConflict } from '../lib/dailyLogs'
import { getSubjectById } from '../lib/subjects'
import { getChipColor } from '../lib/colors'
import { formatDateShort, formatTimeRange } from '../lib/format'
import { useToast } from '../lib/Toast'
import ConfirmDialog from './ConfirmDialog'

interface LogCardProps {
  log: DailyLog
  isOwner: boolean
  onEdit: () => void
  onDelete: () => void
  /** 总结保存成功后的回调（父组件刷新列表） */
  onSummarySaved?: () => void
}

function LogCard({ log, isOwner, onEdit, onDelete, onSummarySaved }: LogCardProps) {
  const toast = useToast()
  const [editingSummary, setEditingSummary] = useState(false)
  const [summaryDraft, setSummaryDraft] = useState('')
  const [savingSummary, setSavingSummary] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  // 进入编辑时读取的服务端版本（updated_at 时间戳）。
  // 保存时用它做版本校验：若该时间戳已被他端改动 → 命中并发冲突 → 弹覆盖确认弹窗。
  const loadedUpdatedAtRef = useRef<string | null>(null)
  const [confirmOverwrite, setConfirmOverwrite] = useState(false)

  const hasSummary = !!(log.summary ?? '').trim()

  const handleDelete = () => {
    setConfirmDelete(false)
    onDelete()
  }

  const openSummaryEditor = () => {
    setSummaryDraft(log.summary ?? '')
    // 记录本次编辑对着的服务端版本；若他端在编辑期间改过，updated_at 变化即可检出
    loadedUpdatedAtRef.current = log.updated_at ?? null
    setEditingSummary(true)
  }

  /**
   * 编辑保存（含并发覆盖）。
   * - overwrite=false：走带版本校验的写入，updated_at 已被他端改动时抛版本冲突 → 弹「是否覆盖」确认
   * - overwrite=true：忽略版本冲突，直接用当前编辑内容覆盖写入
   */
  const doSave = async (overwrite: boolean) => {
    if (savingSummary) return
    setSavingSummary(true)
    try {
      const summary = summaryDraft.trim()
      if (overwrite) {
        // 覆盖写入：不比对版本，直接以当前编辑内容写最新
        await updateLog(log.id, { date: log.date, subjects: log.subjects, summary })
      } else {
        // 带版本校验写入：updated_at 与他端读取值不一致时（0 行命中）→ 抛版本冲突
        await updateLogVersioned(
          log.id,
          { date: log.date, subjects: log.subjects, summary },
          loadedUpdatedAtRef.current,
        )
      }
      setEditingSummary(false)
      onSummarySaved?.()
    } catch (err) {
      // 发现「该记录在其他设备上已被修改」→ 弹确认，由用户决定是否覆盖
      if (!overwrite && isVersionConflict(err)) {
        setConfirmOverwrite(true)
        return // 不弹失败 toast，待用户决策
      }
      toast.show('保存失败，请重试', { icon: '❌' })
    } finally {
      setSavingSummary(false)
    }
  }

  const saveSummary = () => doSave(false)

  const formattedDate = formatDateShort(log.date)

  const totalHours = log.subjects?.reduce((sum, s) => sum + (s.hours || 0), 0) ?? 0

  return (
    <div className="card-hover p-5 space-y-3">
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
          {sortSubjectsByStartTime(log.subjects.filter((s) => s.hours > 0))
            .map((s, index) => {
              const subject = getSubjectById(s.id)
              const colorClass = subject
                ? getChipColor(subject.category)
                : getChipColor()

              return (
                <div key={`${s.id}-${s.activity ?? ''}-${index}`}>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${colorClass}`}
                    title={subject ? undefined : `已删除科目 ID：${s.id}`}
                  >
                    {subject ? subject.name : '已删除科目'}
                    {s.activity ? `·${s.activity}` : ''}
                    <span className="opacity-65 text-xs">
                      {s.hours.toFixed(2)}h
                      {s.startTime && s.endTime ? ` · ${formatTimeRange(s.startTime, s.endTime)}` : ''}
                    </span>
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
            onClick={() => setConfirmDelete(true)}
            className="px-3 py-1.5 text-sm text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
          >
            删除
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="删除学习记录？"
        message="删除后该记录将移入回收站，可在「我的 - 回收站」中随时恢复。确定要删除吗？"
        confirmText="确认删除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      {/* 多端并发编辑冲突：他端已修改同一条记录，询问是否以当前编辑为准覆盖 */}
      <ConfirmDialog
        open={confirmOverwrite}
        title="该记录在其他设备上已被修改"
        message="你可能在另一台设备上也保存过这条记录。以你当前编辑的内容为准覆盖保存吗？覆盖后其他设备上的改动将被替换。"
        confirmText="覆盖保存"
        danger
        onConfirm={() => {
          setConfirmOverwrite(false)
          void doSave(true)
        }}
        onCancel={() => setConfirmOverwrite(false)}
      />
    </div>
  )
}

// memo：父组件 state 变化时避免无谓的列表项重渲染
export default memo(LogCard)
