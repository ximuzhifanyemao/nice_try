import { useEffect, useState } from 'react'
import Countdown from '../components/Countdown'
import LogCard from '../components/LogCard'
import type { DailyLog } from '../lib/dailyLogs'
import { fetchAllLogs } from '../lib/dailyLogs'

export default function Home() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllLogs()
      .then(setLogs)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-8">
      {/* 考研倒计时 */}
      <section>
        <Countdown />
      </section>

      {/* 公开学习时间线 */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4">学习动态</h2>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-500">加载失败: {error}</div>
        )}

        {!loading && !error && logs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            暂无学习记录
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {logs.map((log) => (
              <LogCard
                key={log.id}
                log={log}
                isOwner={false}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
