import { createContext, useContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { fetchMyLogs, type DailyLog } from '../lib/dailyLogs'

interface LogsContextType {
  logs: DailyLog[]
  loading: boolean
  error: string | null
  refetch: () => void
}

const LogsContext = createContext<LogsContextType>({
  logs: [],
  loading: true,
  error: null,
  refetch: () => {},
})

export function LogsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const versionRef = useRef(0)

  const refetch = useCallback(() => {
    if (!user) return
    versionRef.current++
    setLoading(true)
    setError(null)
    const v = versionRef.current
    fetchMyLogs(user.id)
      .then((data) => {
        if (versionRef.current !== v) return
        setLogs(data)
      })
      .catch((err) => {
        if (versionRef.current !== v) return
        setError(err.message || '加载失败')
      })
      .finally(() => {
        if (versionRef.current !== v) return
        setLoading(false)
      })
  }, [user])

  useEffect(() => {
    if (!user) {
      setLogs([])
      setLoading(false)
      setError(null)
      return
    }
    refetch()
  }, [user, refetch])

  return (
    <LogsContext.Provider value={{ logs, loading, error, refetch }}>
      {children}
    </LogsContext.Provider>
  )
}

export function useLogs() {
  return useContext(LogsContext)
}
