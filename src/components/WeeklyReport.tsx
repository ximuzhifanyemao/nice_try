import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { DailyLog } from '../lib/dailyLogs'
import { computeStreak } from '../lib/achievements'
import { fetchCommitments, getWeekStartStr, getWeekEndStr } from '../lib/commitments'
import { getSubjectById } from '../lib/subjects'
import { getBarColor } from '../lib/colors'
import { formatDateShort } from '../lib/format'
import { Icon } from './Icon'

const QUOTES = [
  '日拱一卒，功不唐捐',
  '慢慢来，比较快',
  '自律即自由',
  '路虽远，行则将至',
  '每一天的努力，都是上岸的底气',
  '你比昨天的自己强，就够了',
  '静水流深，厚积薄发',
]

interface Props {
  logs: DailyLog[]
}

/** 本周学习报告：自动汇总本周表现，生成一段小结与加油话 */
export default function WeeklyReport({ logs }: Props) {
  const { user } = useAuth()
  const [weekTarget, setWeekTarget] = useState<number | null>(null)

  const weekStart = getWeekStartStr()
  const weekEnd = getWeekEndStr()

  useEffect(() => {
    if (!user) return
    fetchCommitments(user.id)
      .then((list) => {
        const current = list.find((c) => c.week_start === weekStart)
        setWeekTarget(current && current.status === 'active' ? current.target_hours : null)
      })
      .catch(() => setWeekTarget(null))
  }, [user, weekStart])

  const weekLogs = useMemo(
    () => logs.filter((l) => l.date >= weekStart && l.date <= weekEnd && !l.deleted_at),
    [logs, weekStart, weekEnd],
  )

  const stats = useMemo(() => {
    // 本周逐日小时
    const dayHours = new Map<string, number>()
    const subjectHours = new Map<string, number>()
    for (const log of weekLogs) {
      let total = 0
      for (const s of log.subjects || []) {
        total += s.hours || 0
        subjectHours.set(s.id, (subjectHours.get(s.id) || 0) + (s.hours || 0))
      }
      if (total > 0) dayHours.set(log.date, (dayHours.get(log.date) || 0) + total)
    }
    let bestDay: { date: string; hours: number } | null = null
    for (const [date, hours] of dayHours) {
      if (!bestDay || hours > bestDay.hours) bestDay = { date, hours }
    }
    const totalHours = [...dayHours.values()].reduce((s, v) => s + v, 0)
    const checkedDays = dayHours.size
    const sortedSubjects = [...subjectHours.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, hours]) => ({ id, hours, pct: totalHours > 0 ? (hours / totalHours) * 100 : 0 }))
    return { totalHours, checkedDays, bestDay, sortedSubjects }
  }, [weekLogs])

  const streak = useMemo(() => computeStreak(logs.map((l) => l.date)), [logs])
  const dailyAvg = stats.checkedDays > 0 ? stats.totalHours / 7 : 0
  const progress = weekTarget && weekTarget > 0 ? Math.min(100, (stats.totalHours / weekTarget) * 100) : 0
  const reached = weekTarget ? stats.totalHours >= weekTarget : null

  const quote = useMemo(() => {
    const now = new Date()
    const key = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86400000)
    return QUOTES[key % QUOTES.length]
  }, [])

  const started = stats.totalHours > 0

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-4 text-white shadow-[0_8px_28px_-10px_rgba(79,70,229,0.5)] dark:shadow-none sm:p-5">
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-16 right-20 h-36 w-36 rounded-full bg-violet-300/20 blur-lg" />

      <div className="relative">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <Icon name="chart" size={17} />
            </span>
            <div>
              <p className="text-sm font-semibold leading-none">本周报告</p>
              <p className="mt-1 text-[11px] text-white/70">
                {formatDateShort(weekStart)} ~ {formatDateShort(weekEnd)}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold backdrop-blur-sm">
            {streak.current > 0 ? `🔥 连续 ${streak.current} 天` : '本周未打卡'}
          </span>
        </div>

        {started ? (
          <>
            {/* 主数字 */}
            <div className="mt-3 flex items-end gap-1.5">
              <span className="num text-4xl leading-none">{Math.round(stats.totalHours * 10) / 10}</span>
              <span className="mb-1 text-sm text-white/70">小时</span>
              {weekTarget != null && (
                <span className={`mb-1 ml-auto rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm ${
                  reached ? 'bg-emerald-400/90 text-emerald-950' : 'bg-white/15'
                }`}>
                  {reached ? '目标达成 ✓' : `目标 ${weekTarget}h`}
                </span>
              )}
            </div>

            {/* 目标进度条 */}
            {weekTarget != null && weekTarget > 0 && (
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-emerald-400 transition-all"
                  style={{ width: `${Math.max(2, progress)}%` }}
                />
              </div>
            )}

            {/* 小统计 */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Stat label="打卡天数" value={`${stats.checkedDays} 天`} />
              <Stat label="日均" value={`${dailyAvg.toFixed(1)}h`} />
              <Stat label="最佳一天" value={stats.bestDay ? `${formatDateShort(stats.bestDay.date).slice(5)}` : '--'} sub={stats.bestDay ? `${stats.bestDay.hours.toFixed(1)}h` : undefined} />
            </div>

            {/* 科目占比 */}
            {stats.sortedSubjects.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {stats.sortedSubjects.map((s) => {
                  const subject = getSubjectById(s.id)
                  const color = getBarColor(subject?.category ?? '')
                  return (
                    <div key={s.id} className="flex items-center gap-2">
                      <span className="w-16 shrink-0 truncate text-[11px] text-white/85">{subject?.name ?? s.id}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(3, s.pct)}%` }} />
                      </div>
                      <span className="w-12 shrink-0 text-right text-[11px] tabular-nums text-white/85">
                        {s.hours.toFixed(1)}h · {s.pct.toFixed(0)}%
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            <p className="mt-3 border-t border-white/15 pt-2.5 text-[11px] italic text-white/80">
              「{quote}」{weekTarget ? (reached ? ' 本周目标达成，继续保持！' : ` 还差 ${Math.max(0, Math.round((weekTarget - stats.totalHours) * 10) / 10)}h 达成目标，冲一冲！`) : ''}
            </p>
          </>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-white/85">本周还没有学习记录，从今天开始吧</p>
            <Link
              to="/my-records/new"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-indigo-700 shadow-sm transition-transform hover:scale-[1.03]"
            >
              去打卡 <Icon name="arrowRight" size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-2.5 py-2 text-center backdrop-blur-sm">
      <p className="text-[10px] text-white/65">{label}</p>
      <p className="mt-0.5 num text-base leading-none">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-white/60">{sub}</p>}
    </div>
  )
}