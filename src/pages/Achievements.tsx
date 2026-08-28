import { useMemo } from 'react'
import { useLogs } from '../contexts/LogsContext'
import {
  ACHIEVEMENT_CATEGORIES,
  computeAchievements,
  computeStudyStats,
  type AchievementState,
  type AchievementCategory,
} from '../lib/achievements'

/** 单个成就徽章 */
function Badge({ state }: { state: AchievementState }) {
  const { def, unlocked, current, progress } = state
  const displayCurrent = Math.min(current, def.target)
  const fmtNum = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-colors ${
        unlocked
          ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/50'
          : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 opacity-60'
      }`}
      title={`${def.name}：${def.desc}（${fmtNum(displayCurrent)} / ${def.target}）`}
    >
      <span className={`text-2xl leading-none ${unlocked ? '' : 'grayscale'}`}>{def.icon}</span>
      <span className={`text-sm font-semibold ${unlocked ? 'text-amber-700 dark:text-amber-300' : 'text-gray-600 dark:text-slate-300'}`}>
        {def.name}
      </span>
      <span className="text-[11px] leading-tight text-gray-400 dark:text-slate-400 min-h-[2rem]">{def.desc}</span>
      <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
        <div
          className={`h-full rounded-full transition-all ${unlocked ? 'bg-amber-400 dark:bg-amber-500' : 'bg-gray-300 dark:bg-slate-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className={`text-[11px] tabular-nums ${unlocked ? 'text-amber-600 dark:text-amber-300 font-medium' : 'text-gray-400 dark:text-slate-500'}`}>
        {unlocked ? '已解锁' : `${fmtNum(displayCurrent)} / ${def.target}`}
      </span>
    </div>
  )
}

export default function Achievements() {
  const { logs, loading, error, refetch } = useLogs()

  const states = useMemo(() => computeAchievements(logs), [logs])
  const stats = useMemo(() => computeStudyStats(logs), [logs])
  const unlockedCount = states.filter((s) => s.unlocked).length

  const grouped = useMemo(() => {
    const map = new Map<AchievementCategory, AchievementState[]>()
    for (const state of states) {
      const list = map.get(state.def.category) ?? []
      list.push(state)
      map.set(state.def.category, list)
    }
    return map
  }, [states])

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">🏅 成就</h1>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500" />
        </div>
      )}

      {error && !loading && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 text-center">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg mt-3 transition-colors cursor-pointer"
          >
            重试
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* 总览卡片 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700">
              <p className="text-xs text-gray-500 dark:text-slate-400">已解锁</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 mt-1">
                {unlockedCount}<span className="text-sm text-gray-400 font-normal"> / {states.length}</span>
              </p>
            </div>
            <div className="rounded-xl bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700/50 border p-4">
              <p className="text-xs text-orange-600 dark:text-orange-300">当前连续</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-300 mt-1">🔥 {stats.currentStreak} 天</p>
            </div>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50 border p-4">
              <p className="text-xs text-blue-600 dark:text-blue-300">最长连续</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-300 mt-1">{stats.longestStreak} 天</p>
            </div>
            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50 border p-4">
              <p className="text-xs text-green-600 dark:text-green-300">累计学习</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-300 mt-1">
                {stats.totalHours.toFixed(1)}<span className="text-sm font-normal"> h</span>
              </p>
            </div>
          </div>

          {/* 分类徽章 */}
          {ACHIEVEMENT_CATEGORIES.map((cat) => {
            const list = grouped.get(cat.key) ?? []
            if (list.length === 0) return null
            const catUnlocked = list.filter((s) => s.unlocked).length
            return (
              <div key={cat.key} className="space-y-2">
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-base">{cat.icon}</span>
                  <h2 className="text-base font-semibold text-gray-700 dark:text-slate-200">{cat.label}</h2>
                  <span className="text-xs text-gray-400 dark:text-slate-500">{catUnlocked} / {list.length}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {list.map((state) => (
                    <Badge key={state.def.id} state={state} />
                  ))}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
