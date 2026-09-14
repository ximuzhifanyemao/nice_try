import { useState, useEffect } from 'react'
import { getAvailableSubjects, getActivitiesForSubject, getSubjectById, hydrateUserSubjects, loadUserSubjects, type Subject } from '../lib/subjects'
import { getButtonColor } from '../lib/colors'
import { useAuth } from '../contexts/AuthContext'
import { useWeekGoal } from '../hooks/useWeekGoal'

interface SubjectPickerProps {
  /** 选中科目（含学习内容）后开始计时 */
  onPick: (subjectId: string, activity: string) => void
  /** 关闭下拉并收起胶囊条 */
  onClose: () => void
}

/**
 * 胶囊条上的快速科目下拉：点「选择科目开始」直接挑选科目开跑，
 * 有学习内容的科目先选活动再开始。Esc 逐级返回。
 * 顶部展示本周目标剩余时长，方便随时把握进度。
 */
export default function SubjectPicker({ onPick, onClose }: SubjectPickerProps) {
  const { user } = useAuth()
  // 先初始恢复本地缓存的自定义科目（若有），避免先内置后自定义的闪烁
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    hydrateUserSubjects(user?.id)
    return getAvailableSubjects()
  })
  const [pendingSubject, setPendingSubject] = useState<string | null>(null)
  // 本周目标进度：缓存秒出 + 后台刷新（与胶囊条共用同一份缓存）
  const { goal: weekGoal } = useWeekGoal(user?.id)

  // 跟随用户加载自定义科目（与精简面板一致）：
  // 先等云端加载完成再刷新列表，否则全功能模式新增的科目在简洁下拉里看不到
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (user) {
        try {
          await loadUserSubjects(user.id, true)
        } catch {
          /* 加载失败时保留内置科目 */
        }
      }
      if (!cancelled) setSubjects(getAvailableSubjects())
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  // Esc：有活动选择时先返回科目列表，否则关闭下拉
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (pendingSubject) setPendingSubject(null)
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pendingSubject, onClose])

  const renderSubject = (subj: Subject) => (
    <button
      key={subj.id}
      onClick={() => {
        const activities = getActivitiesForSubject(subj.id)
        if (activities.length > 0) setPendingSubject(subj.id)
        else onPick(subj.id, '')
      }}
      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${getButtonColor(getSubjectById(subj.id)?.category)}`}
    >
      {subj.name}
    </button>
  )

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-950">
      {pendingSubject ? (
        <>
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300/80">
              {getSubjectById(pendingSubject)?.name} · 选择学习内容
            </p>
            <button
              onClick={() => setPendingSubject(null)}
              className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
            >
              返回
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 px-4 pb-3 pt-1">
            {getActivitiesForSubject(pendingSubject).map((act) => (
              <button
                key={act}
                onClick={() => onPick(pendingSubject, act)}
                className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-600 transition-all hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300 cursor-pointer"
              >
                {act}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">快速开始 · 选择科目</p>
            <button
              onClick={onClose}
              className="px-1.5 py-0.5 rounded-md text-[11px] text-slate-500 transition-colors hover:bg-gray-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300 cursor-pointer"
            >
              收起
            </button>
          </div>
          {/* 本周目标剩余时长 */}
          {weekGoal && (() => {
            const remaining = Math.max(0, weekGoal.target - weekGoal.actual)
            const done = remaining <= 0
            const pct = Math.min(100, (weekGoal.actual / weekGoal.target) * 100)
            return (
              <div className="mx-4 mb-1 rounded-lg border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-500/5 px-2.5 py-1.5">
                <div className="flex items-center justify-between text-[11px] leading-tight">
                  <span className="text-slate-500 dark:text-slate-400">本周目标</span>
                  <span className={done ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'font-medium text-indigo-600 dark:text-indigo-300'}>
                    {done ? `已达成（${weekGoal.actual.toFixed(1)}h）` : `还差 ${remaining.toFixed(1)}h`}
                  </span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${done ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })()}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3">
            {subjects.length === 0 ? (
              <div className="pt-2 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">还没有科目</p>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  请登录后到「全部功能 → 计时科目管理」中添加科目
                </p>
              </div>
            ) : (
            <>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {subjects.filter((s) => s.category !== '408').map(renderSubject)}
            </div>
            {subjects.some((s) => s.category === '408') && (
              <div className="pt-2">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">408 综合</p>
                <div className="flex flex-wrap gap-1.5">
                  {subjects.filter((s) => s.category === '408').map(renderSubject)}
                </div>
              </div>
            )}
            </>
            )}
          </div>
        </>
      )}
    </div>
  )
}