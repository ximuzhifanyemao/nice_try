import { useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLogs } from '../contexts/LogsContext'
import { HomeLayoutContext } from '../App'
import Calendar from '../components/Calendar'
import TodoList from '../components/TodoList'
import { Icon } from '../components/Icon'
import CheckinReminderCard from '../components/CheckinReminderCard'
import StreakCard from '../components/StreakCard'
import WeekProgressCard from '../components/WeekProgressCard'
import CountdownPanel from '../components/CountdownPanel'
import EnglishCheckinEntry from '../components/EnglishCheckinEntry'
import QuickLinksRow from '../components/QuickLinksRow'
import { todayStr } from '../lib/dailyLogs'
import { computeStudyStats, computeStreak } from '../lib/achievements'
import { fetchCommitments, getWeekStartStr, getWeekEndStr, sumHoursInRange } from '../lib/commitments'
import { fetchMyCheckins } from '../lib/englishCheckin'
import { format, differenceInCalendarDays, parseISO } from 'date-fns'
import { fetchUserSettings } from '../lib/settings'
import { resolveTargetDate, hasTargetDate } from '../lib/countdown'

export default function Home() {
  const { user } = useAuth()
  const { twoCol } = useContext(HomeLayoutContext)
  const { logs, loading } = useLogs()
  const [weekTarget, setWeekTarget] = useState<number | null>(null)
  const [checkinCount, setCheckinCount] = useState(0)
  const [targetDate, setTargetDate] = useState<Date>(() => resolveTargetDate(null))
  /** 登录用户是否真的设置了目标日期：未设置时不给基于兜底日期的备考阶段判断（会误导） */
  const [hasTarget, setHasTarget] = useState(false)

  // 目标日期的解析统一走 src/lib/countdown.ts，避免与 Countdown 组件各写一份导致不一致
  const DEFAULT_TARGET = resolveTargetDate(null)

  useEffect(() => {
    if (!user) {
      setWeekTarget(null)
      setCheckinCount(0)
      setTargetDate(DEFAULT_TARGET)
      return
    }
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
      .then((s) => {
        setTargetDate(resolveTargetDate(s.target_date))
        setHasTarget(hasTargetDate(s.target_date))
      })
      .catch(() => {
        setTargetDate(DEFAULT_TARGET)
        setHasTarget(false)
      })
  }, [user])

  const streak = useMemo(() => computeStreak(logs.map((l) => l.date)), [logs])
  const stats = useMemo(() => computeStudyStats(logs), [logs])
  const weekStart = getWeekStartStr()
  const weekEnd = getWeekEndStr()
  const actualHours = useMemo(() => sumHoursInRange(logs, weekStart, weekEnd), [logs, weekStart, weekEnd])

  /** 今日已学时长：打卡类应用里用户一天最想看的数字，此前首页只展示了累计与本周 */
  const todayHours = useMemo(() => {
    const todayLog = logs.find((l) => l.date === todayStr() && !l.deleted_at)
    if (!todayLog) return 0
    return todayLog.subjects.reduce((s, x) => s + (x.hours || 0), 0)
  }, [logs])

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
    if (user && !hasTarget) {
      return { tag: '未设定目标', desc: '去设置里填上目标日期，开启备考阶段提示', tone: 'from-slate-400 to-slate-500' }
    }
    const days = Math.max(0, differenceInCalendarDays(targetDate, new Date()))
    if (days <= 0) return { tag: '冲刺决战', desc: '考试已至，沉着应考 🎯', tone: 'from-rose-500 to-red-600' }
    if (days <= 30) return { tag: '最后冲刺', desc: '30 天内，查漏补缺，回归真题错题', tone: 'from-rose-500 to-orange-500' }
    if (days <= 90) return { tag: '强化阶段', desc: '真题套卷 + 背诵提速，保持节奏', tone: 'from-orange-500 to-amber-500' }
    if (days <= 180) return { tag: '攻坚阶段', desc: '全面真题、形成知识体系', tone: 'from-violet-500 to-indigo-500' }
    if (days <= 300) return { tag: '基础阶段', desc: '按部就班过教材，每日一题不松懈', tone: 'from-indigo-500 to-blue-500' }
    return { tag: '长线备考', desc: '每天一点点，累积就是飞跃', tone: 'from-sky-500 to-indigo-500' }
  }, [targetDate, user, hasTarget])

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

  /** 打卡提醒条通用 props：已登录 + 今天未打卡时展示 */
  const reminderProps = {
    hasCheckedToday,
    showBreak: hasAnyLog && streak.current === 0,
  }
  /** 顶部「连续打卡 + 本周进度」并排区（桌面 gap-3 / 移动 gap-2，loading 期给骨架屏） */
  const streakRow = (gap: string) => (
    <div className={`grid grid-cols-2 ${gap}`}>
      <StreakCard streak={streak} loading={loading} />
      <WeekProgressCard weekTarget={weekTarget} actualHours={actualHours} progress={progress} loading={loading} />
    </div>
  )
  /** 倒计时 + 阶段 + 三格统计面板通用 props */
  const countdownProps = {
    phaseInfo,
    dailyQuote,
    user: !!user,
    stats,
    todayHours,
    hasCheckedToday,
    loading,
  }

  return (
    <div className={`mx-auto px-4 py-3 sm:py-4 ${twoCol ? 'max-w-none h-full min-h-0 flex flex-col' : 'max-w-5xl space-y-3 sm:space-y-4'}`}>
      {twoCol ? (
        /* ===== 桌面「全部功能」模式：A1 左右分栏，一屏显示 —— 给日历更宽比例避免瘦高 ===== */
        <div className="grid grid-cols-[1.2fr_1.5fr] gap-5 h-full min-h-0 items-stretch overflow-hidden">
          {/* 左列：信息区（与右列内容垂直居中对齐，视觉平衡） */}
          <div className="flex flex-col gap-2.5 min-h-0 max-h-full justify-center overflow-y-auto overscroll-contain pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* 打卡提醒 */}
            {user && <CheckinReminderCard {...reminderProps} />}

            {/* 连续打卡 + 本周进度（并排紧凑） */}
            {user && streakRow('gap-3')}

            {/* 倒计时 + 阶段 + 今日时长/打卡天数/去打卡 */}
            <CountdownPanel size="compact" {...countdownProps} />

            {/* 英语长难句打卡入口 */}
            {user && <EnglishCheckinEntry size="compact" checkinCount={checkinCount} />}

            {/* 待办事项清单 */}
            <TodoList />
          </div>

          {/* ===== 【B 版】日历 + 下方两小卡（本周学习分布 + 今日格言/阶段提示） =====
              日历用 flex-1 吸收剩余高度（min-h-0 允许收缩），两张小卡按内容固定高度，
              这样窗口高度变化时底部小卡不会被裁掉 */}
          <div className="w-full h-full min-h-0 flex flex-col gap-3 py-1">
            <div className="flex min-h-0 flex-1 flex-col">
              <Calendar logs={logs} loading={loading} expanded />
            </div>

            {/* 日历下方：两小卡并排 */}
            <div className="grid grid-cols-2 gap-3 w-full shrink-0">
              {/* 左卡：本周学习分布（迷你柱状图） */}
              <div className="card p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 flex items-center justify-center">
                      <Icon name="chart" size={13} />
                    </span>
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
              <div className="card p-3 flex flex-col bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-indigo-500/10 dark:via-slate-900 dark:to-violet-500/10">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-lg bg-violet-100/80 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300 flex items-center justify-center">
                      <Icon name="quote" size={13} />
                    </span>
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
        /* ===== 移动/网页模式：按「每天第一眼最想看的」重排 —— 今日状态 → 倒计时 → 待办 → 日历 → 英语/快捷置底 ===== */
        <>
          {/* ① 今日状态：打卡提醒 + 连续打卡 / 本周进度（并排紧凑） */}
          {user && <CheckinReminderCard {...reminderProps} />}
          {user && streakRow('gap-2')}

          {/* ② 倒计时 + 阶段 + 今日时长 / 打卡天数 / 去打卡 */}
          <CountdownPanel size="normal" {...countdownProps} />

          {/* ③ 待办事项清单（未完成任务） */}
          <TodoList />

          {/* ④ 日历 */}
          <Calendar logs={logs} loading={loading} />

          {/* ⑤ 英语打卡 / 生词本 / 每周总结（次要，置底） */}
          {user && <EnglishCheckinEntry size="normal" checkinCount={checkinCount} />}
          {user && <QuickLinksRow />}
        </>
      )}
    </div>
  )
}