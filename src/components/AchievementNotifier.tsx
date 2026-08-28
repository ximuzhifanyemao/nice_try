// 成就解锁通知：监听共享日志数据，计算成就解锁状态，
// 与 localStorage 中已通知过的成就对比，新解锁的通过 Toast 提示。
import { useEffect, useRef } from 'react'
import { useLogs } from '../contexts/LogsContext'
import { computeAchievements } from '../lib/achievements'
import { useToast } from '../lib/Toast'

const NOTIFIED_KEY = 'achievement_notified_v1'

/** 读取本地已通知过的成就 id 集合 */
function loadNotified(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

/** 写入已通知成就 id 集合 */
function saveNotified(ids: string[]): void {
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(ids))
}

export default function AchievementNotifier() {
  const { logs, loading } = useLogs()
  const { show } = useToast()
  const checkedRef = useRef(false)

  useEffect(() => {
    if (loading || checkedRef.current) return
    checkedRef.current = true

    const states = computeAchievements(logs)
    const newlyUnlocked = states.filter((s) => s.unlocked && !loadNotified().has(s.def.id))
    if (newlyUnlocked.length === 0) return
    const notified = loadNotified()
    newlyUnlocked.forEach((s) => notified.add(s.def.id))
    saveNotified([...notified])
    newlyUnlocked.forEach((s) => {
      show(`解锁成就「${s.def.name}」${s.def.icon}`, { icon: s.def.icon, duration: 3200 })
    })
  }, [logs, loading, show])

  return null
}