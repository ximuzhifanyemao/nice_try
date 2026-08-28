import { useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { HomeLayoutContext } from '../App'
import Countdown from '../components/Countdown'
import Calendar from '../components/Calendar'
import type { DailyLog } from '../lib/dailyLogs'
import { fetchMyLogs, todayStr } from '../lib/dailyLogs'
import { computeStudyStats, computeStreak } from '../lib/achievements'
import { fetchCommitments, getWeekStartStr, getWeekEndStr, sumHoursInRange } from '../lib/commitments'
import { fetchMyCheckins } from '../lib/englishCheckin'
import { format, differenceInCalendarDays, parseISO } from 'date-fns'
import { fetchUserSettings } from '../lib/settings'

export default function Home() {
  const { user } = useAuth()
  const { twoCol } = useContext(HomeLayoutContext)
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [weekTarget, setWeekTarget] = useState<number | null>(null)
  const [checkinCount, setCheckinCount] = useState(0)
  const [targetDate, setTargetDate] = useState<Date>(() => new Date('2026-12-20T00:00:00'))

  const DEFAULT_TARGET = new Date('2026-12-20T00:00:00')
  function resolveTargetDate(dateStr: string | null): Date {
    if (!dateStr) return DEFAULT_TARGET
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
    if (!m) return DEFAULT_TARGET
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  }

  useEffect(() => {
    if (!user) {
      setLogs([])
      setWeekTarget(null)
      setCheckinCount(0)
      setTargetDate(DEFAULT_TARGET)
      setLoading(false)
      return
    }
    fetchMyLogs(user.id)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
    // 本周目标（承诺金）
    fetchCommitments(user.id)
      .then((list) => {
        const current = list.find((c) => c.week_start === getWeekStartStr())
        setWeekTarget(current && current.status === 'active' ? current.target_hours : null)
      })
      .catch(() => setWeekTarget(null))
    // 英语打卡进度
    fetchMyCheckins(user.id)
      .then((list) => setCheckinCount(list.length))
      .catch(() => setCheckinCount(0))
    // 目标日期（用于阶段判断）
    fetchUserSettings(user.id)
      .then((s) => setTargetDate(resolveTargetDate(s.target_date)))
      .catch(() => setTargetDate(DEFAULT_TARGET))
  }, [user])

  const streak = useMemo(() => computeStreak(logs.map((l) => l.date)), [logs])
  const stats = useMemo(() => computeStudyStats(logs), [logs])
  const weekStart = getWeekStartStr()
  const weekEnd = getWeekEndStr()
  const actualHours = useMemo(() => sumHoursInRange(logs, weekStart, weekEnd), [logs, weekStart, weekEnd])

  const hasCheckedToday = logs.some((l) => l.date === todayStr())
  const hasAnyLog = logs.length > 0
  const progress = weekTarget && weekTarget > 0 ? Math.min(100, (actualHours / weekTarget) * 100) : 0

  /** 本周每日小时分布（用于 B 版柱状图） */
  const weekHours = useMemo(() => {
    const start = parseISO(weekStart)
    const days: { label: string; date: string; hours: number; isToday: boolean }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const iso = format(d, 'yyyy-MM-dd')
      const log = logs.find((l) => l.date === iso && !l.deleted_at)
      const hours = log ? log.subjects.reduce((s, x) => s + (x.hours || 0), 0) : 0
      days.push({
        label: ['一', '二', '三', '四', '五', '六', '日'][i],
        date: iso,
        hours,
        isToday: iso === todayStr(),
      })
    }
    return days
  }, [logs, weekStart])

  /** 考试阶段：根据距考试天数给出提醒 */
  const phaseInfo = useMemo(() => {
    const days = Math.max(0, differenceInCalendarDays(targetDate, new Date()))
    if (days <= 0) return { tag: '冲刺决战', desc: '考试已至，沉着应考 🎯', tone: 'from-rose-500 to-red-600' }
    if (days <= 30) return { tag: '最后冲刺', desc: '30 天内，查漏补缺，回归真题错题', tone: 'from-rose-500 to-orange-500' }
    if (days <= 90) return { tag: '强化阶段', desc: '真题套卷 + 背诵提速，保持节奏', tone: 'from-orange-500 to-amber-500' }
    if (days <= 180) return { tag: '攻坚阶段', desc: '全面真题、形成知识体系', tone: 'from-violet-500 to-indigo-500' }
    if (days <= 300) return { tag: '基础阶段', desc: '按部就班过教材，每日一题不松懈', tone: 'from-indigo-500 to-blue-500' }
    return { tag: '长线备考', desc: '每天一点点，累积就是飞跃', tone: 'from-sky-500 to-indigo-500' }
  }, [targetDate])

  /** 每日格言（按日期伪随机，保持一天内不变） */
  const dailyQuote = useMemo(() => {
    const list = [
      '日拱一卒，功不唐捐',
      '慢慢来，比较快',
      '自律即自由',
      '种一棵树最好的时间是十年前，其次是现在',
      '每一个不曾起舞的日子，都是对生命的辜负',
      '路虽远，行则将至；事虽难，做则必成',
      '把书合上，就是另一个开始',
      '你比昨天的自己强，就够了',
      '静水流深，厚积薄发',
      '今日份的努力，是上岸的底气',
    ]
    const todayNum = parseISO(format(new Date(), 'yyyy-MM-dd')).getTime()
    return list[Math.floor(todayNum / 86400000) % list.length]
  }, [])

  return (
    <div className={`mx-auto px-4 py-3 sm:py-4 ${twoCol ? 'max-w-none h-full min-h-0 flex flex-col' : 'max-w-5xl space-y-3 sm:space-y-4'}`}>
      {twoCol ? (
        /* ===== 桌面「全部功能」模式：A1 左右分栏，一屏显示 —— 给日历更宽比例避免瘦高 ===== */
        <div className="grid grid-cols-[1.2fr_1.5fr] gap-5 h-full min-h-0 items-stretch overflow-hidden">
          {/* 左列：信息区（与右列内容垂直居中对齐，视觉平衡） */}
          <div className="flex flex-col gap-2.5 min-h-0 max-h-full justify-center overflow-y-auto overscroll-contain pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* 打卡提醒 */}
            {user && !hasCheckedToday && (
              <Link
                to="/my-records/new"
                className="block rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-300/90 transition-colors hover:bg-amber-100 dark:hover:bg-amber-500/15"
              >
                {hasAnyLog && streak.current === 0 ? '🔥 连续打卡已断签，今天重新开始吧' : '✍️ 今天还没打卡，别忘了记录学习'}
              </Link>
            )}

            {/* 连续打卡 + 本周进度（并排紧凑） */}
            {user && (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/achievements"
                  className="rounded-xl bg-white dark:bg-slate-900 p-3 border border-gray-100 dark:border-slate-800 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  <div className="flex items-baseline justify-between">
                    <p className="text-[11px] text-gray-500 dark:text-slate-500">连续打卡</p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-600">最长{streak.longest}天</p>
                  </div>
                  <p className="text-lg font-bold text-orange-500 dark:text-orange-400 mt-0.5">🔥 {streak.current} 天</p>
                </Link>

                <Link
                  to="/goal"
                  className="rounded-xl bg-white dark:bg-slate-900 p-3 border border-gray-100 dark:border-slate-800 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  <div className="flex items-baseline justify-between">
                    <p className="text-[11px] text-gray-500 dark:text-slate-500">本周进度</p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-600">
                      {weekTarget ? `${actualHours.toFixed(1)}/${weekTarget}h` : '未设定'}
                    </p>
                  </div>
                  {weekTarget ? (
                    <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-indigo-500 dark:bg-indigo-400'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1.5">去设定目标 →</p>
                  )}
                </Link>
              </div>
            )}

            {/* 倒计时 */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800 px-3 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-14px_rgba(15,23,42,0.08)] dark:shadow-none overflow-hidden">
              <Countdown title="距考试还有" />

              {/* 阶段标签 + 累计 / 格言 —— 填空白 */}
              <div className="mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${phaseInfo.tone} text-white text-[10px] font-semibold px-2 py-0.5 shadow-sm`}
                  >
                    {phaseInfo.tag}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 italic truncate">
                    「{dailyQuote}」
                  </span>
                </div>
                {user ? (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-gradient-to-b from-blue-50 to-white dark:from-blue-500/10 dark:to-slate-900 border border-blue-100 dark:border-blue-500/15 p-2 text-center">
                      <p className="text-[10px] text-blue-500/90 dark:text-blue-400/80 font-medium">累计时长</p>
                      <p className="text-[15px] font-bold tabular-nums text-blue-700 dark:text-blue-300 mt-0.5 leading-none">
                        {stats.totalHours.toFixed(0)}<span className="text-[10px] font-medium ml-0.5">h</span>
                      </p>
                    </div>
                    <div className="rounded-xl bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-500/10 dark:to-slate-900 border border-indigo-100 dark:border-indigo-500/15 p-2 text-center">
                      <p className="text-[10px] text-indigo-500/90 dark:text-indigo-400/80 font-medium">打卡天数</p>
                      <p className="text-[15px] font-bold tabular-nums text-indigo-700 dark:text-indigo-300 mt-0.5 leading-none">
                        {stats.checkedDays}<span className="text-[10px] font-medium ml-0.5">天</span>
                      </p>
                    </div>
                    <Link
                      to="/my-records/new"
                      className="group rounded-xl bg-gradient-to-b from-violet-50 to-white dark:from-violet-500/10 dark:to-slate-900 border border-violet-100 dark:border-violet-500/15 p-2 text-center transition-colors hover:from-violet-100 dark:hover:from-violet-500/20"
                    >
                      <p className="text-[10px] text-violet-500/90 dark:text-violet-400/80 font-medium">
                        {hasCheckedToday ? '今日继续' : '今日去打卡'}
                      </p>
                      <p className="text-[15px] font-bold tabular-nums text-violet-700 dark:text-violet-300 mt-0.5 leading-none group-hover:translate-y-px transition-transform">
                        {hasCheckedToday ? '继续+' : '打卡→'}
                      </p>
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-xl bg-gradient-to-br from-indigo-50 via-violet-50 to-white dark:from-indigo-500/10 dark:via-violet-500/5 dark:to-slate-900 border border-indigo-100/80 dark:border-indigo-500/20 px-3 py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">{phaseInfo.desc}</p>
                      <p className="text-[10px] text-gray-500 dark:text-slate-500 mt-0.5">登录后开始记录你的考研足迹</p>
                    </div>
                    <Link
                      to="/login"
                      className="shrink-0 inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold shadow-sm transition-colors"
                    >
                      立即登录
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* 英语长难句打卡入口 */}
            {user && (
              <Link
                to="/english-checkin"
                className="rounded-xl bg-white dark:bg-slate-900 p-3 border border-gray-100 dark:border-slate-800 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📖</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-slate-100">英语长难句打卡</p>
                      <p className="text-[11px] text-gray-500 dark:text-slate-500">150 天</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-slate-400">{checkinCount}/150 天</span>
                    <span className="text-gray-400 dark:text-slate-600">→</span>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* ===== 【B 版】日历 + 下方两小卡（本周学习分布 + 今日格言/阶段提示），垂直居中 ===== */}
          <div className="w-full h-full min-h-0 flex flex-col items-center justify-center gap-3 py-1">
            <Calendar logs={logs} loading={loading} expanded />

            {/* 日历下方：两小卡并排 */}
            <div className="grid grid-cols-2 gap-3 w-full">
              {/* 左卡：本周学习分布（迷你柱状图） */}
              <div className="rounded-2xl border border-gray-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] dark:shadow-none p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">📊</span>
                    <h3 className="text-xs font-semibold text-gray-800 dark:text-slate-100">本周分布</h3>
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-slate-600">
                    {actualHours.toFixed(1)}h
                    {weekTarget ? ` / ${weekTarget}h` : ''}
                  </span>
                </div>
                <div className="flex items-end justify-between gap-1 h-20 px-1">
                  {(() => {
                    const max = Math.max(1, ...weekHours.map((d) => d.hours))
                    return weekHours.map((d) => {
                      const ratio = d.hours / max
                      const height = Math.max(ratio * 100, d.hours > 0 ? 10 : 4)
                      return (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex flex-col items-center justify-end h-16">
                            <span className="text-[9px] leading-none text-gray-500 dark:text-slate-500 mb-1 h-3">
                              {d.hours > 0 ? `${d.hours.toFixed(1)}` : ''}
                            </span>
                            <div
                              className={`w-full rounded-t-md transition-all ${
                                d.isToday
                                  ? 'bg-gradient-to-t from-indigo-500 to-violet-400 shadow-[0_2px_8px_-2px_rgba(99,102,241,0.5)]'
                                  : d.hours > 0
                                  ? 'bg-gradient-to-t from-indigo-400/70 to-indigo-300/60 dark:from-indigo-500/60 dark:to-indigo-400/40'
                                  : 'bg-gray-200/80 dark:bg-slate-800'
                              }`}
                              style={{ height: `${height}%`, minHeight: '4px' }}
                            />
                          </div>
                          <span
                            className={`text-[10px] font-medium ${
                              d.isToday
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-gray-500 dark:text-slate-500'
                            }`}
                          >
                            {d.label}
                          </span>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>

              {/* 右卡：今日格言 + 阶段提示 */}
              <div className="rounded-2xl border border-gray-200/70 dark:border-slate-800 bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-indigo-500/10 dark:via-slate-900 dark:to-violet-500/10 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] dark:shadow-none p-3 flex flex-col">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">💬</span>
                    <h3 className="text-xs font-semibold text-gray-800 dark:text-slate-100">每日一签</h3>
                  </div>
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-gradient-to-r ${phaseInfo.tone} text-white shadow-sm`}
                  >
                    {phaseInfo.tag}
                  </span>
                </div>
                <p className="text-[12px] font-medium leading-relaxed text-gray-700 dark:text-slate-200 mb-2 italic">
                  「{dailyQuote}」
                </p>
                <div className="mt-auto rounded-lg bg-white/70 dark:bg-slate-900/60 border border-gray-100/80 dark:border-slate-800 px-2 py-1.5">
                  <p className="text-[10px] text-gray-500 dark:text-slate-500 leading-relaxed">
                    <span className="font-semibold text-gray-700 dark:text-slate-300">今日建议：</span>
                    {phaseInfo.desc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ===== 移动/网页模式：保持原有纵向流程 ===== */
        <>
          {user && (
            <>
              {/* 打卡提醒（单行紧凑） */}
              {!hasCheckedToday && (
                <Link
                  to="/my-records/new"
                  className="block rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-300/90 transition-colors hover:bg-amber-100 dark:hover:bg-amber-500/15"
                >
                  {hasAnyLog && streak.current === 0 ? '🔥 连续打卡已断签，今天重新开始吧' : '✍️ 今天还没打卡，别忘了记录学习'}
                </Link>
              )}

              {/* 连续打卡 + 本周进度（移动端并排紧凑） */}
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/achievements"
                  className="rounded-xl bg-white dark:bg-slate-900 p-3 border border-gray-100 dark:border-slate-800 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  <div className="flex items-baseline justify-between">
                    <p className="text-[11px] text-gray-500 dark:text-slate-500">连续打卡</p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-600">最长{streak.longest}天</p>
                  </div>
                  <p className="text-lg font-bold text-orange-500 dark:text-orange-400 mt-0.5">🔥 {streak.current} 天</p>
                </Link>

                <Link
                  to="/goal"
                  className="rounded-xl bg-white dark:bg-slate-900 p-3 border border-gray-100 dark:border-slate-800 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  <div className="flex items-baseline justify-between">
                    <p className="text-[11px] text-gray-500 dark:text-slate-500">本周进度</p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-600">
                      {weekTarget ? `${actualHours.toFixed(1)}/${weekTarget}h` : '未设定'}
                    </p>
                  </div>
                  {weekTarget ? (
                    <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-indigo-500 dark:bg-indigo-400'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1.5">去设定目标 →</p>
                  )}
                </Link>
              </div>
            </>
          )}

          {/* 英语长难句打卡入口 */}
          {user && (
            <Link
              to="/english-checkin"
              className="block rounded-xl bg-white dark:bg-slate-900 p-3 border border-gray-100 dark:border-slate-800 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📖</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-100">英语长难句打卡</p>
                    <p className="text-[11px] text-gray-500 dark:text-slate-500">柴荣老师 150 天 · 逐句翻译打分</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-slate-400">{checkinCount}/150 天</span>
                  <span className="text-gray-400 dark:text-slate-600">→</span>
                </div>
              </div>
              {checkinCount > 0 && (
                <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400 transition-all"
                    style={{ width: `${(checkinCount / 150) * 100}%` }}
                  />
                </div>
              )}
            </Link>
          )}

          <div className="grid gap-3 sm:gap-4 items-start grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_360px]">
            <div>
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-800 px-3 py-3 sm:px-4 sm:py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-14px_rgba(15,23,42,0.08)] dark:shadow-none overflow-hidden">
                <Countdown />
                {/* 阶段 + 累计 / 登录引导 —— 填空 */}
                <div className="mt-3 pt-2 border-t border-dashed border-gray-200 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${phaseInfo.tone} text-white text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 shadow-sm`}
                    >
                      {phaseInfo.tag}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-500 italic truncate">
                      「{dailyQuote}」
                    </span>
                  </div>
                  {user ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-gradient-to-b from-blue-50 to-white dark:from-blue-500/10 dark:to-slate-900 border border-blue-100 dark:border-blue-500/15 p-2 sm:p-2.5 text-center">
                        <p className="text-[10px] sm:text-[11px] text-blue-500/90 dark:text-blue-400/80 font-medium">累计时长</p>
                        <p className="text-base sm:text-lg font-bold tabular-nums text-blue-700 dark:text-blue-300 mt-0.5 leading-none">
                          {stats.totalHours.toFixed(0)}<span className="text-[10px] font-medium ml-0.5">h</span>
                        </p>
                      </div>
                      <div className="rounded-xl bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-500/10 dark:to-slate-900 border border-indigo-100 dark:border-indigo-500/15 p-2 sm:p-2.5 text-center">
                        <p className="text-[10px] sm:text-[11px] text-indigo-500/90 dark:text-indigo-400/80 font-medium">打卡天数</p>
                        <p className="text-base sm:text-lg font-bold tabular-nums text-indigo-700 dark:text-indigo-300 mt-0.5 leading-none">
                          {stats.checkedDays}<span className="text-[10px] font-medium ml-0.5">天</span>
                        </p>
                      </div>
                      <Link
                        to="/my-records/new"
                        className="group rounded-xl bg-gradient-to-b from-violet-50 to-white dark:from-violet-500/10 dark:to-slate-900 border border-violet-100 dark:border-violet-500/15 p-2 sm:p-2.5 text-center transition-colors hover:from-violet-100 dark:hover:from-violet-500/20"
                      >
                        <p className="text-[10px] sm:text-[11px] text-violet-500/90 dark:text-violet-400/80 font-medium">
                          {hasCheckedToday ? '今日继续' : '今日去打卡'}
                        </p>
                        <p className="text-base sm:text-lg font-bold tabular-nums text-violet-700 dark:text-violet-300 mt-0.5 leading-none group-hover:translate-y-px transition-transform">
                          {hasCheckedToday ? '继续+' : '打卡→'}
                        </p>
                      </Link>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-gradient-to-br from-indigo-50 via-violet-50 to-white dark:from-indigo-500/10 dark:via-violet-500/5 dark:to-slate-900 border border-indigo-100/80 dark:border-indigo-500/20 px-3 py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-xs font-semibold text-indigo-700 dark:text-indigo-300">{phaseInfo.desc}</p>
                        <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-slate-500 mt-0.5">登录后开始记录你的考研足迹</p>
                      </div>
                      <Link
                        to="/login"
                        className="shrink-0 inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] sm:text-xs font-semibold shadow-sm transition-colors"
                      >
                        立即登录
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="lg:self-start">
              <Calendar logs={logs} loading={loading} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
