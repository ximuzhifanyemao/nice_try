import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Countdown from '../components/Countdown'
import Calendar from '../components/Calendar'
import type { DailyLog } from '../lib/dailyLogs'
import { fetchMyLogs } from '../lib/dailyLogs'

export default function Home() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLogs([])
      setLoading(false)
      return
    }
    fetchMyLogs(user.id)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">
        <div>
          <Countdown />
        </div>
        <div className="lg:self-start">
          <Calendar logs={logs} loading={loading} />
        </div>
      </div>
    </div>
  )
}