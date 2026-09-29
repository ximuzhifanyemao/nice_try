import { useState, useEffect } from 'react'
import { getAvailableSubjects, getActivitiesForSubject, getSubjectById, getCategoryLabel, hydrateUserSubjects, loadUserSubjects, type Subject } from '../lib/subjects'
import { getDotColor } from '../lib/colors'
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
 *
 * 视觉：窗口只有 300px 高，因此刻意压低装饰——
 * 科目用「中性行 + 类别色点」而不是整块染色胶囊，避免一屏全是彩色方块；
 * 分组用细线与小标签分隔，靠留白而不是边框来划分区域。
 */
export default function SubjectPicker({ onPick, onClose }: SubjectPickerProps) {
  const { user } = useAuth()
  // 先初始恢复本地缓存的自定义科目（若有），避免先内置后自定义的闪烁
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    hydrateUserSubjects(user?.id)
    return getAvailableSubjects()
  })
  const [pendingSubject, setPendingSubject] = useState<string | null>(null)
  /** 学习内容卡片是否正在「飞回顶部」：动画结束后再真正 onPick 收起窗口，避免卡片没飞完窗口就没了 */
  const [leaving, setLeaving] = useState(false)
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
      // 卡片飞回过程中按 Esc 也直接回到科目列表
      if (pendingSubject) {
        setLeaving(false)
        setPendingSubject(null)
      } else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pendingSubject, onClose])

  /** 科目行：中性底 + 类别色点；有学习内容的科目右侧带一个箭头提示「还有下一步」 */
  const renderSubject = (subj: Subject) => {
    const activities = getActivitiesForSubject(subj.id)
    return (
      <button
        key={subj.id}
        onClick={() => (activities.length > 0 ? setPendingSubject(subj.id) : onPick(subj.id, ''))}
        className="group flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1.5 text-left text-[12px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${getDotColor(getSubjectById(subj.id)?.category)}`} aria-hidden="true" />
        <span className="truncate">{subj.name}</span>
        {activities.length > 0 && (
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-auto shrink-0 text-slate-300 transition-colors group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        )}
      </button>
    )
  }

  /** 按 category 分组：有分组的显示小标题，无分组的平铺 */
  const grouped = (() => {
    const map = new Map<string, Subject[]>()
    for (const s of subjects) {
      const list = map.get(s.category) ?? []
      list.push(s)
      map.set(s.category, list)
    }
    return Array.from(map.entries())
  })()

  return (
    <div className="relative flex h-full flex-col bg-white dark:bg-slate-950">
      {/* 科目列表视图：常驻背景，学习内容卡片弹出时退后变暗 */}
      <div
        className={`flex h-full flex-col transition-opacity duration-200 ${
          pendingSubject && !leaving ? 'opacity-40' : ''
        }`}
      >
        <div className="flex shrink-0 items-center justify-between px-3.5 pt-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
            快速开始
          </p>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-md px-1.5 py-0.5 text-[11px] text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            收起
          </button>
        </div>

        {/* 本周目标剩余时长：一条紧凑的进度摘要，不抢科目列表的注意力 */}
        {weekGoal &&
          (() => {
            const remaining = Math.max(0, weekGoal.target - weekGoal.actual)
            const done = remaining <= 0
            const pct = Math.min(100, (weekGoal.actual / weekGoal.target) * 100)
            return (
              <div className="mx-3.5 mt-2 shrink-0">
                <div className="flex items-baseline justify-between text-[11px] leading-none">
                  <span className="text-slate-400 dark:text-slate-500">本周目标</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      done ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-300'
                    }`}
                  >
                    {done ? `已达成 ${weekGoal.actual.toFixed(1)}h` : `还差 ${remaining.toFixed(1)}h`}
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${
                      done ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })()}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 pb-3 pt-2.5">
          {subjects.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-1 pb-6 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">还没有科目</p>
              <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                登录后到「全部功能 → 计时」中添加科目
              </p>
            </div>
          ) : (
            grouped.map(([cat, subs]) => {
              const label = getCategoryLabel(cat)
              const twoCol = subs.length > 3
              return (
                <div key={cat} className="pt-2.5 first:pt-0">
                  {label && (
                    <p className="mb-1.5 flex items-center gap-2 text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-500">
                      <span className="truncate">{label}</span>
                      <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800/80" aria-hidden="true" />
                    </p>
                  )}
                  <div className={twoCol ? 'grid grid-cols-2 gap-1.5' : 'flex flex-col gap-1.5'}>
                    {subs.map(renderSubject)}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 学习内容卡片：贴底滑出；选完飞回顶部后触发计时 + 窗口收回胶囊条 */}
      <div
        className={`absolute inset-x-0 bottom-0 z-10 rounded-t-xl border-t border-indigo-200/70 bg-white px-3.5 pb-3 pt-2.5 shadow-[0_-10px_28px_-16px_rgba(15,23,42,0.3)] transition-[transform,opacity] duration-200 ease-out dark:border-indigo-500/25 dark:bg-slate-900 ${
          leaving
            ? 'pointer-events-none -translate-y-[120%] opacity-0'
            : pendingSubject
              ? 'translate-y-0'
              : 'pointer-events-none translate-y-full opacity-0'
        }`}
      >
        {pendingSubject && (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${getDotColor(getSubjectById(pendingSubject)?.category)}`} aria-hidden="true" />
                <span className="truncate font-semibold text-slate-700 dark:text-slate-200">
                  {getSubjectById(pendingSubject)?.name}
                </span>
                <span className="shrink-0">· 选择学习内容</span>
              </p>
              <button
                onClick={() => {
                  setLeaving(false)
                  setPendingSubject(null)
                }}
                className="shrink-0 cursor-pointer rounded-md px-1.5 py-0.5 text-[11px] text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                返回
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {getActivitiesForSubject(pendingSubject).map((act) => (
                <button
                  key={act}
                  onClick={() => {
                    setLeaving(true)
                    // 飞回动画结束后再真正开始计时并收回窗口，避免卡片没飞完窗口就缩回去了
                    window.setTimeout(() => onPick(pendingSubject, act), 200)
                  }}
                  className="cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-300"
                >
                  {act}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
