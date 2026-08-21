// 成就解锁通知：登录后加载学习记录，计算成就解锁状态，
// 与 localStorage 中已通知过的成就对比，新解锁的通过 Toast 提示。
import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchMyLogs } from '../lib/dailyLogs'
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
  const { user } = useAuth()
  const { show } = useToast()
  // 防止重复触发（严格模式或多次路由挂载）
  const checkedRef = useRef(false)

  useEffect(() => {
    if (!user || checkedRef.current) return
    checkedRef.current = true

    let cancelled = false
    fetchMyLogs(user.id)
      .then((logs) => {
        if (cancelled) return
        const states = computeAchievements(logs)
        const newlyUnlocked = states.filter((s) => s.unlocked && !loadNotified().has(s.def.id))
        if (newlyUnlocked.length === 0) return
        // 更新已通知集合，逐条弹出提示
        const notified = loadNotified()
        newlyUnlocked.forEach((s) => notified.add(s.def.id))
        saveNotified([...notified])
        // 依次弹出（视觉上去重：同名提示图标）
        newlyUnlocked.forEach((s) => {
          show(`解锁成就「${s.def.name}」${s.def.icon}`, { icon: s.def.icon, duration: 3200 })
        })
      })
      .catch(() => {
        // 静默失败，不打扰用户
      })
    return () => {
      cancelled = true
    }
  }, [user, show])

  return null
}