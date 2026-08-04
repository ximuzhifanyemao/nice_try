import { useEffect, useState } from 'react'
import Countdown from '../components/Countdown'
import Calendar from '../components/Calendar'
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
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setError('请求超时，请检查网络连接后刷新页面重试')
        } else {
          const msg = err instanceof Error ? err.message : '加载失败'
          if (msg.includes('Invalid path') || msg.includes('URL')) {
            setError('服务配置错误，请联系管理员检查 Supabase 配置')
          } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
            setError('网络连接失败，请检查网络后重试')
          } else {
            setError(msg)
          }
        }
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-8">
      {/* 顶部：倒计时 | 日历 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        <div>
          <Countdown />
        </div>
        <div className="lg:self-start">
          <Calendar logs={logs} loading={loading} />
        </div>
      </div>

      {/* 公开学习时间线 */}
      <section className="max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-4">学习动态</h2>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500" />
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-500 dark:text-red-400">加载失败: {error}</div>
        )}

        {!loading && !error && logs.length === 0 && (
          <div className="text-center py-12 text-gray-400 dark:text-slate-500">
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
