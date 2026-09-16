import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { pad } from '../lib/format'
import { useAuth } from '../contexts/AuthContext'
import { fetchUserSettings, DEFAULT_COUNTDOWN_TITLE } from '../lib/settings'
import { hasTargetDate, resolveTargetDate } from '../lib/countdown'
import { Icon } from './Icon'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface CountdownProps {
  /** 由父组件传入的标题（已含云端设置）；为空时内部读取 */
  title?: string
}

const MINUTE = 60_000
const DAY = 86_400_000

export default function Countdown({ title }: CountdownProps) {
  const { user } = useAuth()
  const [settingsTitle, setSettingsTitle] = useState('')
  const [targetDate, setTargetDate] = useState<Date>(() => resolveTargetDate(null))
  /** 登录用户是否真的设置了目标日期；未设置时展示引导而非一个假日期 */
  const [configured, setConfigured] = useState(true)
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  /** 距目标不足一天时才展示秒，否则秒位是噪音 */
  const [showSeconds, setShowSeconds] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 加载云端倒计时设置（仅登录用户）
  useEffect(() => {
    let cancelled = false
    if (!user) {
      setSettingsTitle('')
      setTargetDate(resolveTargetDate(null))
      setConfigured(true) // 未登录访客按兜底日期展示，作为产品介绍的一部分
      return
    }
    fetchUserSettings(user.id)
      .then((s) => {
        if (cancelled) return
        setSettingsTitle(s.countdown_title)
        setConfigured(hasTargetDate(s.target_date))
        setTargetDate(resolveTargetDate(s.target_date))
      })
      .catch(() => {
        if (cancelled) return
        setConfigured(false)
        setTargetDate(resolveTargetDate(null))
      })
    return () => {
      cancelled = true
    }
  }, [user])

  /**
   * 倒计时走时。
   *
   * 用 setTimeout 递归而不是 setInterval(1000)：
   * - 距目标 > 1 天时按分钟刷新（「距考试还有 289 天」每秒跳动既是视觉噪音，
   *   也会让整个卡片每秒重渲染一次，低端机上是可感知的耗电源）；
   * - 进入最后 24 小时才切到秒级，并显示秒位。
   */
  useEffect(() => {
    let cancelled = false

    const tick = () => {
      if (cancelled) return
      const diff = targetDate.getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft(null)
        setShowSeconds(false)
        return
      }
      setShowSeconds(diff < DAY)
      setTimeLeft({
        days: Math.floor(diff / DAY),
        hours: Math.floor((diff / 3_600_000) % 24),
        minutes: Math.floor((diff / MINUTE) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      })
      timerRef.current = setTimeout(tick, diff < DAY ? 1000 : MINUTE)
    }

    tick()
    return () => {
      cancelled = true
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [targetDate])

  const displayTitle = title || settingsTitle
  const shownTitle = displayTitle || DEFAULT_COUNTDOWN_TITLE

  const UNITS = [
    { key: 'days' as const, label: '天', color: 'from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800' },
    { key: 'hours' as const, label: '时', color: 'from-indigo-500 to-indigo-600 dark:from-indigo-700 dark:to-indigo-800' },
    { key: 'minutes' as const, label: '分', color: 'from-violet-500 to-violet-600 dark:from-violet-700 dark:to-violet-800' },
    { key: 'seconds' as const, label: '秒', color: 'from-purple-500 to-purple-600 dark:from-purple-700 dark:to-purple-800' },
  ]
  const units = showSeconds ? UNITS : UNITS.slice(0, 3)

  /* 登录用户尚未设置目标日期：给出引导，而不是展示一个写死的假日期 */
  if (user && !configured) {
    return (
      <div className="flex flex-col items-center gap-2 py-3 text-center">
        <span className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-400 flex items-center justify-center">
          <Icon name="target" size={20} />
        </span>
        <p className="text-sm font-medium text-gray-700 dark:text-slate-200">还没有设定目标日期</p>
        <p className="text-[11px] text-gray-400 dark:text-slate-500 max-w-[16rem] leading-relaxed">
          设定考试或目标日期后，这里会显示倒计时与备考阶段提示
        </p>
        <Link
          to="/settings"
          className="mt-0.5 inline-flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 transition-colors"
        >
          去设定目标日期
          <Icon name="arrowRight" size={13} />
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1.5 py-1.5 sm:gap-2 sm:py-2">
      {shownTitle && (
        <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 font-medium">{shownTitle}</p>
      )}

      {timeLeft === null ? (
        <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">倒计时已结束！</p>
      ) : (
        <>
          {/* 移动端：横向紧凑单行，减少纵向占用 */}
          <div className="flex items-stretch sm:hidden">
            {units.map(({ key, label, color }) => (
              <div
                key={key}
                className={`flex flex-col items-center justify-center bg-gradient-to-b ${color} text-white rounded-md px-2 py-1 min-w-[46px] shadow-sm`}
              >
                <span className="text-lg font-bold tabular-nums leading-tight">{pad(timeLeft[key])}</span>
                <span className="text-[9px] text-white/70 mt-0.5 leading-none">{label}</span>
              </div>
            ))}
          </div>
          {/* 桌面端：大色块 */}
          <div className={`hidden sm:grid gap-3 ${units.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {units.map(({ key, label, color }) => (
              <div
                key={key}
                className={`flex flex-col items-center justify-center bg-gradient-to-b ${color} text-white rounded-2xl px-5 py-4 min-w-[80px] shadow-lg`}
              >
                <span className="text-4xl font-bold tabular-nums leading-tight">{pad(timeLeft[key])}</span>
                <span className="text-sm text-white/70 mt-1">{label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="text-xs sm:text-sm text-gray-400 dark:text-slate-500">
        {targetDate.getFullYear()}年{targetDate.getMonth() + 1}月{targetDate.getDate()}日
      </p>
    </div>
  )
}
