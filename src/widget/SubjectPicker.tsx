import { useState, useEffect, forwardRef } from 'react'
import { buildActivityPath, getActivitiesForSubject, getActivityTreeForSubject, getAvailableSubjects, getSubjectById, getCategoryLabel, hydrateUserSubjects, loadUserSubjects, type Subject } from '../lib/subjects'
import { getDotColor } from '../lib/colors'
import { useAuth } from '../contexts/AuthContext'
import { useWeekGoal } from '../hooks/useWeekGoal'
import {
  loadPomoFocusMin,
  loadPomoFocusPresets,
  loadPomoRestMin,
  loadPomoState,
  loadTimerMode,
  savePomoFocusMin,
  savePomoFocusPresets,
  savePomoRestMin,
  saveTimerMode,
  type TimerMode,
} from '../lib/pomodoro'

interface SubjectPickerProps {
  /** 选中科目（含学习内容）后按当前模式开始计时：正计时 / 番茄钟 */
  onPick: (subjectId: string, activity: string, mode: TimerMode) => void
  /** 关闭下拉并收起胶囊条 */
  onClose: () => void
}

/**
 * 胶囊条上的快速科目下拉：点「选择科目开始」直接挑选科目开跑，
 * 有学习内容的科目先选活动再开始。Esc 逐级返回。
 * 顶部可切换「正计时 / 番茄钟」并设置番茄钟的专注/休息时长（与全功能计时页同一偏好），
 * 番茄钟模式下选科目即开始一轮专注倒计时。
 * 顶部展示本周目标剩余时长，方便随时把握进度。
 *
 * 视觉：窗口只有 300px 高起步，因此刻意压低装饰——
 * 科目用「中性行 + 类别色点」而不是整块染色胶囊，避免一屏全是彩色方块；
 * 分组用细线与小标签分隔，靠留白而不是边框来划分区域。
 *
 * contentRef：把「科目列表内容块」暴露给调用方（WidgetApp）。
 * 它是内容自然高度，不含头部与本周目标行；窗口据此在放不下时按需加高。
 */
const SubjectPicker = forwardRef<HTMLDivElement, SubjectPickerProps>(function SubjectPicker(
  { onPick, onClose },
  contentRef,
) {
  const { user } = useAuth()
  // 先初始恢复本地缓存的自定义科目（若有），避免先内置后自定义的闪烁
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    hydrateUserSubjects(user?.id)
    return getAvailableSubjects()
  })
  const [pendingSubject, setPendingSubject] = useState<string | null>(null)
  /** 已展开的学习内容分支（如「高数」）；null = 还停在首层的分支列表 */
  const [pendingGroup, setPendingGroup] = useState<string | null>(null)
  /** 学习内容卡片是否正在「飞回顶部」：动画结束后再真正 onPick 收起窗口，避免卡片没飞完窗口就没了 */
  const [leaving, setLeaving] = useState(false)
  // 本周目标进度：缓存秒出 + 后台刷新（与胶囊条共用同一份缓存）
  const { goal: weekGoal } = useWeekGoal(user?.id)
  /* 计时模式与番茄钟时长：与全功能计时页共用同一偏好（进行中的番茄钟优先显示为番茄钟） */
  const [mode, setMode] = useState<TimerMode>(() => (loadPomoState() ? 'pomodoro' : loadTimerMode()))
  const [focusMin, setFocusMin] = useState<number>(loadPomoFocusMin)
  const [restMin, setRestMin] = useState<number>(loadPomoRestMin)
  /* 专注时长预设：几格可改数字的「自设预设」。上次用的时长一定占一格，
     这样面板打开时总有一格处于选中态，不会出现「没有任何一格是当前时长」。 */
  const [focusPresets, setFocusPresets] = useState<number[]>(() => {
    const list = loadPomoFocusPresets()
    const cur = loadPomoFocusMin()
    if (list.includes(cur)) return list
    const next = [cur, ...list.slice(0, list.length - 1)]
    savePomoFocusPresets(next)
    return next
  })

  /** 改某一格的专注时长：既存成预设，也立即设为当前时长（下一步开始即用它） */
  const updateFocusPreset = (index: number, value: number) => {
    setFocusPresets((prev) => {
      const next = [...prev]
      next[index] = value
      savePomoFocusPresets(next)
      return next
    })
    setFocusMin(value)
    savePomoFocusMin(value)
  }

  /** 点中某格即选中该时长（把数字全选，直接键入就是改预设） */
  const selectFocusPreset = (value: number) => {
    if (focusMin === value) return
    setFocusMin(value)
    savePomoFocusMin(value)
  }

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

  // Esc 三级返回：分支 → 科目列表 → 关闭下拉
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // 卡片飞回过程中按 Esc 也直接回到科目列表
      if (pendingGroup) {
        setPendingGroup(null)
      } else if (pendingSubject) {
        setLeaving(false)
        setPendingSubject(null)
      } else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pendingGroup, pendingSubject, onClose])

  /** 进入某科目：从首层分支列表开始，不沿用上一个科目的展开状态 */
  const openSubject = (subjectId: string) => {
    setPendingGroup(null)
    setPendingSubject(subjectId)
  }

  /** 科目行：中性底 + 类别色点；有学习内容的科目右侧带一个箭头提示「还有下一步」 */
  const renderSubject = (subj: Subject) => {
    const activities = getActivitiesForSubject(subj.id)
    return (
      <button
        key={subj.id}
        onClick={() => (activities.length > 0 ? openSubject(subj.id) : onPick(subj.id, '', mode))}
        className="group flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-left text-[12px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
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
    <div data-widget-dropdown className="relative flex h-full flex-col bg-white dark:bg-slate-950">
      {/* 科目列表视图：常驻背景，学习内容卡片弹出时退后变暗 */}
      <div
        className={`flex h-full flex-col transition-opacity duration-200 ${
          pendingSubject && !leaving ? 'opacity-40' : ''
        }`}
      >
        {/* 快速开始一行：左侧标签 + 「正计时/番茄钟」切换 + 专注预设格 + 右侧收起。
            番茄钟时长用「可改数字的预设格」承载：点中一格即选中该时长，
            想自设就直接改格子里的数字——改完即存为预设，下次打开还是它。
            胶囊条只有 500 宽：这行放不下时让中间控件自己换行（flex-wrap），
            绝不裁切、也绝不把窗口横向撑宽——面板始终是与胶囊条同宽的下拉框。 */}
        <div className="mx-3.5 mt-2 shrink-0 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-start gap-1.5">
            <p className="h-7 shrink-0 text-[10px] font-semibold leading-7 tracking-[0.12em] text-slate-400 dark:text-slate-500">
              快速开始
            </p>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1">
              <div className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800/60">
                {(['stopwatch', 'pomodoro'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMode(m)
                      saveTimerMode(m)
                    }}
                    aria-pressed={mode === m}
                    className={`cursor-pointer rounded-md px-1.5 py-0.5 text-[11px] transition-colors ${
                      mode === m
                        ? 'bg-indigo-50 font-semibold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300'
                        : 'font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {m === 'stopwatch' ? '正计时' : '番茄钟'}
                  </button>
                ))}
              </div>
              {mode === 'pomodoro' && (
                <>
                  <span className="shrink-0">专注</span>
                  {focusPresets.map((m, i) => (
                    <label
                      key={i}
                      title={`专注 ${m} 分钟 · 点中即选中，数字可直接改成你的预设`}
                      className={`inline-flex shrink-0 cursor-text items-center rounded-full border px-1 py-0.5 transition-colors ${
                        focusMin === m
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-600 dark:border-indigo-500/60 dark:bg-indigo-500/15 dark:text-indigo-300'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {/* 用文本型输入框（自带数字键盘）而不是 number：既没有数字微调器占位、
                          能把格子压得更窄，又支持选区 API，点一下就能全选后直接键入 */}
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={3}
                        value={m}
                        aria-label={`专注时长预设 ${i + 1}（分钟）`}
                        onFocus={(e) => {
                          e.currentTarget.select()
                          selectFocusPreset(m)
                        }}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '')
                          if (digits === '') return
                          updateFocusPreset(i, Math.min(240, Math.max(1, Number(digits))))
                        }}
                        className="w-6 bg-transparent text-right text-[11px] font-medium tabular-nums text-inherit outline-none"
                      />
                      <span>分</span>
                    </label>
                  ))}
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="h-7 shrink-0 cursor-pointer rounded-md px-1.5 text-[11px] text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              收起
            </button>
          </div>
          {/* 番茄钟第二行：休息时长 + 跳过（这一行放第一行会挤掉专注预设格，故独立成行） */}
          {mode === 'pomodoro' && (
            <div className="mt-1 flex h-7 items-center gap-x-1.5 gap-y-1">
              <span className="shrink-0">休息</span>
              <span
                className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-1 py-0.5 dark:border-slate-700 dark:bg-slate-800/40"
                title="休息时长（分钟）· 填 0 即专注结束直接回空闲"
              >
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  value={restMin}
                  aria-label="休息时长（分钟）"
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '')
                    if (digits === '') return
                    const m = Math.min(120, Number(digits))
                    setRestMin(m)
                    savePomoRestMin(m)
                  }}
                  className="w-6 bg-transparent text-right text-[11px] font-medium tabular-nums text-slate-700 outline-none dark:text-slate-200"
                />
                <span>分</span>
              </span>
              <button
                onClick={() => {
                  setRestMin(0)
                  savePomoRestMin(0)
                }}
                title="休息设为 0 分钟：专注结束直接回空闲"
                className="shrink-0 cursor-pointer rounded-md px-1 py-0.5 text-[11px] text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                跳过
              </button>
            </div>
          )}
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

        {/* 科目列表滚动容器：窗口加高到上限后仍放不下时，这里内部滚动 */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {/* 内容块（被 WidgetApp 观测，用于按需加高窗口）：
              只包科目分组列表，不含头部与本周目标行。
              不能拿滚动容器自身的高度当内容高度，所以这里单独圈一层。 */}
          <div ref={contentRef} className="px-3.5 pb-3 pt-2">
            {subjects.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">还没有科目</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                  登录后到「全部功能 → 计时」中添加科目
                </p>
              </div>
            ) : (
              grouped.map(([cat, subs]) => {
                const label = getCategoryLabel(cat)
                return (
                  <div key={cat} className="pt-2 first:pt-0">
                    {label && (
                      <p className="mb-1.5 flex items-center gap-2 text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-500">
                        <span className="truncate">{label}</span>
                        <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800/80" aria-hidden="true" />
                      </p>
                    )}
                    {/* 统一两列网格：分组只有 1–2 个科目时也并排，避免小组独占整行把列表拉长 */}
                    <div className="grid grid-cols-2 gap-1">{subs.map(renderSubject)}</div>
                  </div>
                )
              })
            )}
          </div>
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
        {pendingSubject && (() => {
          const tree = getActivityTreeForSubject(pendingSubject)
          /** 已展开的分支；分支被删掉时自动落回首层 */
          const openGroup = tree.groups.find((g) => g.name === pendingGroup) ?? null
          const pick = (path: string) => {
            setLeaving(true)
            // 飞回动画结束后再真正开始计时并收回窗口，避免卡片没飞完窗口就缩回去了
            window.setTimeout(() => onPick(pendingSubject, path, mode), 200)
          }
          const chip = (path: string, label: string) => (
            <button
              key={path}
              onClick={() => pick(path)}
              className="cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-300"
            >
              {label}
            </button>
          )
          return (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${getDotColor(getSubjectById(pendingSubject)?.category)}`} aria-hidden="true" />
                  <span className="truncate font-semibold text-slate-700 dark:text-slate-200">
                    {getSubjectById(pendingSubject)?.name}
                  </span>
                  {openGroup && (
                    <>
                      <span className="shrink-0 opacity-50">·</span>
                      <span className="truncate font-semibold text-slate-700 dark:text-slate-200">{openGroup.name}</span>
                    </>
                  )}
                  <span className="shrink-0">· 选择学习内容</span>
                </p>
                <button
                  onClick={() => {
                    if (openGroup) setPendingGroup(null)
                    else {
                      setLeaving(false)
                      setPendingSubject(null)
                    }
                  }}
                  className="shrink-0 cursor-pointer rounded-md px-1.5 py-0.5 text-[11px] text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                  返回
                </button>
              </div>
              {/* 第二层：只显示该分支的学习内容 */}
              {openGroup ? (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {openGroup.activities.map((a) => chip(buildActivityPath(openGroup.name, a), a))}
                </div>
              ) : tree.groups.length === 0 ? (
                /* 没有分支的科目（如英语）：沿用平铺内容，点击即开始 */
                <div className="flex flex-wrap gap-1.5 pt-2">{tree.leaves.map((a) => chip(a, a))}</div>
              ) : (
                /* 第一层：只看分支名 + 未分层的顶层内容，点分支才展开它的内容 */
                <div className="grid grid-cols-2 gap-1 pt-2">
                  {tree.groups.map((g) => (
                    <button
                      key={g.name}
                      onClick={() => setPendingGroup(g.name)}
                      className="group flex w-full cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-left text-[11px] font-medium text-slate-600 transition-colors hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:border-indigo-500/50 dark:hover:bg-slate-800"
                    >
                      <span className="truncate">{g.name}</span>
                      <span className="ml-auto shrink-0 text-[10px] font-normal tabular-nums opacity-50">
                        {g.activities.length} 项
                      </span>
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 text-slate-300 transition-colors group-hover:text-indigo-400 dark:text-slate-600 dark:group-hover:text-indigo-400"
                        aria-hidden="true"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  ))}
                  {tree.leaves.map((a) => (
                    <button
                      key={a}
                      onClick={() => pick(a)}
                      title="不分层的学习内容：点击直接开始计时"
                      className="flex w-full cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-slate-200 bg-white/60 px-2.5 py-1 text-left text-[11px] font-medium text-slate-500 transition-colors hover:border-indigo-300 hover:bg-slate-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800/20 dark:text-slate-400 dark:hover:border-indigo-500/50 dark:hover:text-indigo-300"
                    >
                      <span className="truncate">{a}</span>
                      <span className="ml-auto shrink-0 text-[10px] font-normal opacity-50">直接开始</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )
        })()}
      </div>
    </div>
  )
})

export default SubjectPicker
