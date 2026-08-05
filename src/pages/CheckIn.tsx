import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { DailyLog } from '../lib/dailyLogs'
import { fetchMyLogs, updateLog, todayStr } from '../lib/dailyLogs'
import { formatDateCn } from '../lib/format'

/** 某天学习总时长（小时） */
function totalHours(log: DailyLog): number {
  return log.subjects?.reduce((sum, s) => sum + (s.hours || 0), 0) ?? 0
}

/** 每日总结打卡页：有学习记录的当天必须写总结，支持补交 */
export default function CheckIn() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /* 正在编辑总结的日期 */
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const today = todayStr()

  useEffect(() => {
    if (!user) return
    setLoading(true)
    setError(null)
    fetchMyLogs(user.id)
      .then(setLogs)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [user])

  const todayLog = logs.find((l) => l.date === today) ?? null
  const todayMissing = !!todayLog && !(todayLog.summary ?? '').trim()
  const missingCount = logs.filter((l) => !(l.summary ?? '').trim()).length

  const handleOpenEditor = (log: DailyLog) => {
    setEditingDate(log.date)
    setDraft(log.summary ?? '')
  }

  const handleSaveSummary = async () => {
    if (!editingDate || !user) return
    const log = logs.find((l) => l.date === editingDate)
    if (!log) return
    setSaving(true)
    try {
      const summary = draft.trim()
      await updateLog(log.id, {
        date: log.date,
        subjects: log.subjects,
        summary,
      })
      setLogs((prev) => prev.map((l) => (l.date === editingDate ? { ...l, summary } : l)))
      setEditingDate(null)
    } catch (err) {
      alert('保存失败：' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">打卡</h1>

      {/* 今日总结状态 */}
      <div
        className={`rounded-xl shadow-sm border p-5 ${
          !todayLog
            ? 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700'
            : todayMissing
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-slate-400">今日总结</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-slate-100 mt-1">
              {!todayLog
                ? '今天还没有学习记录'
                : todayMissing
                  ? '今日总结未写，记得补上哦'
                  : '今日打卡完成 ✓'}
            </p>
          </div>
          {todayLog && (
            <button
              type="button"
              onClick={() => handleOpenEditor(todayLog)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                todayMissing
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {todayMissing ? '立即补写' : '查看/修改'}
            </button>
          )}
        </div>
      </div>

      {missingCount > 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          还有 {missingCount} 天有学习记录但未写总结，补写后才能提交新的今日记录
        </p>
      )}

      {/* 每日总结列表 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="px-5 py-3 text-sm font-semibold text-gray-700 dark:text-slate-300 border-b border-gray-100 dark:border-slate-700">
          每日总结
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500" />
          </div>
        )}

        {error && !loading && (
          <p className="px-5 py-8 text-center text-red-500 dark:text-red-400">加载失败: {error}</p>
        )}

        {!loading && !error && logs.length === 0 && (
          <p className="px-5 py-8 text-center text-gray-400 dark:text-slate-500">暂无学习记录</p>
        )}

        {!loading && !error &&
          logs.map((log) => {
            const isToday = log.date === today
            const missing = !(log.summary ?? '').trim()
            const editing = editingDate === log.date
            return (
              <div key={log.id} className="px-5 py-3 border-b border-gray-50 dark:border-slate-700 last:border-b-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-100">
                      {isToday ? '今天' : formatDateCn(log.date)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                      学习 {totalHours(log).toFixed(2)}h
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {missing ? (
                      <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 px-2 py-0.5 rounded-full">
                        未写总结
                      </span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 rounded-full">
                        已写总结
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => (editing ? setEditingDate(null) : handleOpenEditor(log))}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {editing ? '收起' : missing ? '补写' : '修改'}
                    </button>
                  </div>
                </div>

                {editing && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={4}
                      placeholder="今天学了什么？有什么收获或反思？"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 resize-y"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingDate(null)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveSummary}
                        disabled={saving}
                        className="px-4 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        {saving ? '保存中...' : '保存总结'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}
