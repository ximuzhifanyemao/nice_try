import { useEffect, useRef, useState } from 'react'
import { pad } from '../lib/format'
import { useAuth } from '../contexts/AuthContext'
import { fetchUserSettings, DEFAULT_COUNTDOWN_TITLE } from '../lib/settings'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const DEFAULT_TARGET = new Date('2026-12-20T00:00:00')

/** 解析用户设置的目标日期（yyyy-mm-dd）为本地时区零点 */
function resolveTargetDate(dateStr: string | null): Date {
  if (!dateStr) return DEFAULT_TARGET
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  if (!m) return DEFAULT_TARGET
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

interface CountdownProps {
  /** 由父组件传入的标题（已含云端设置）；为空时内部读取 */
  title?: string
}

export default function Countdown({ title }: CountdownProps) {
  const { user } = useAuth()
  const [settingsTitle, setSettingsTitle] = useState('')
  const [targetDate, setTargetDate] = useState<Date>(DEFAULT_TARGET)
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 加载云端倒计时设置（仅登录用户）
  useEffect(() => {
    let cancelled = false
    if (!user) {
      setSettingsTitle('')
      setTargetDate(DEFAULT_TARGET)
      return
    }
    fetchUserSettings(user.id)
      .then((s) => {
        if (cancelled) return
        setSettingsTitle(s.countdown_title)
        setTargetDate(resolveTargetDate(s.target_date))
      })
      .catch(() => {
        /* 读失败用默认值 */
      })
    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    const calc = () => {
      const now = new Date()
      const diff = targetDate.getTime() - now.getTime()
      if (diff <= 0) {
        setTimeLeft(null)
        return
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      })
    }
    calc()
    intervalRef.current = setInterval(calc, 1000)
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
      }
    }
  }, [targetDate])

  const TIME_UNITS = [
    { key: 'days' as const, label: '天', color: 'from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800' },
    { key: 'hours' as const, label: '时', color: 'from-indigo-500 to-indigo-600 dark:from-indigo-700 dark:to-indigo-800' },
    { key: 'minutes' as const, label: '分', color: 'from-violet-500 to-violet-600 dark:from-violet-700 dark:to-violet-800' },
    { key: 'seconds' as const, label: '秒', color: 'from-purple-500 to-purple-600 dark:from-purple-700 dark:to-purple-800' },
  ]

  const displayTitle = title || settingsTitle
  const shownTitle = displayTitle || DEFAULT_COUNTDOWN_TITLE

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
            {TIME_UNITS.map(({ key, label, color }) => (
              <div
                key={key}
                className={`flex flex-col items-center justify-center bg-gradient-to-b ${color} text-white rounded-md px-2 py-1 min-w-[46px] shadow-sm`}
              >
                <span className="text-lg font-bold tabular-nums leading-tight">
                  {pad(timeLeft[key])}
                </span>
                <span className="text-[9px] text-white/70 mt-0.5 leading-none">{label}</span>
              </div>
            ))}
          </div>
          {/* 桌面端：四格大色块 */}
          <div className="hidden sm:grid grid-cols-4 gap-3">
            {TIME_UNITS.map(({ key, label, color }) => (
              <div
                key={key}
                className={`flex flex-col items-center justify-center bg-gradient-to-b ${color} text-white rounded-2xl px-5 py-4 min-w-[80px] shadow-lg`}
              >
                <span className="text-4xl font-bold tabular-nums leading-tight">
                  {pad(timeLeft[key])}
                </span>
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