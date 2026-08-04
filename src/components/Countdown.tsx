import { useEffect, useRef, useState } from 'react'

const TARGET_DATE = new Date('2026-12-20T00:00:00')

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calcTimeLeft(): TimeLeft | null {
  const now = new Date()
  const diff = TARGET_DATE.getTime() - now.getTime()

  if (diff <= 0) return null

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

const TIME_UNITS = [
  { key: 'days' as const, label: '天', color: 'from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800' },
  { key: 'hours' as const, label: '时', color: 'from-indigo-500 to-indigo-600 dark:from-indigo-700 dark:to-indigo-800' },
  { key: 'minutes' as const, label: '分', color: 'from-violet-500 to-violet-600 dark:from-violet-700 dark:to-violet-800' },
  { key: 'seconds' as const, label: '秒', color: 'from-purple-500 to-purple-600 dark:from-purple-700 dark:to-purple-800' },
]

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calcTimeLeft)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(calcTimeLeft())
    }, 1000)

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-3 py-4">

      {timeLeft === null ? (
        <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">考研已经结束！</p>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {TIME_UNITS.map(({ key, label, color }) => (
            <div
              key={key}
              className={`flex flex-col items-center justify-center bg-gradient-to-b ${color} text-white rounded-xl sm:rounded-2xl px-3 sm:px-5 py-3 sm:py-4 min-w-[60px] sm:min-w-[80px] shadow-lg`}
            >
              <span className="text-2xl sm:text-4xl font-bold tabular-nums">
                {pad(timeLeft[key])}
              </span>
              <span className="text-xs sm:text-sm text-white/70 mt-1">{label}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-400 dark:text-slate-500">2026年12月20日</p>
    </div>
  )
}
