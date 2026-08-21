import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { toggleTheme } from '../lib/theme'
import { fetchUserSettings, saveUserSettings } from '../lib/settings'

export default function Settings() {
  const { user } = useAuth()
  const userId = user?.id

  /* ── 倒计时设置 ── */
  const [title, setTitle] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  /* ── 所属页面内暗色主题状态 ── */
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  const loadSettings = useCallback(async () => {
    if (!userId) return
    try {
      const s = await fetchUserSettings(userId)
      setTitle(s.countdown_title)
      setTargetDate(s.target_date ?? '')
    } catch {
      /* 忽略读取失败 */
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    loadSettings()
  }, [userId, loadSettings])

  const handleSaveSettings = async () => {
    if (!userId) return
    setSettingsSaving(true)
    setSettingsSaved(false)
    try {
      await saveUserSettings(userId, { countdown_title: title, target_date: targetDate || null })
      setSettingsSaved(true)
    } catch (err) {
      alert('保存失败：' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setSettingsSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">⚙️ 设置</h1>

      {/* 显示偏好 */}
      <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-slate-100">显示模式</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">切换网站与 App 的亮 / 暗外观</p>
          </div>
          <button
            onClick={() => setIsDark(toggleTheme() === 'dark')}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-600 hover:border-blue-400 transition-colors cursor-pointer"
          >
            {isDark ? '🌙 暗色' : '☀️ 亮色'}
          </button>
        </div>
      </div>

      {/* 首页倒计时 */}
      <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100 mb-3">首页倒计时</h3>
        <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">倒计时标题（显示在数字上方）</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="如：距离目标还有 / 距离考试还有"
          className="w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-800 dark:text-slate-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none mb-3"
        />
        <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">目标日期</label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-800 dark:text-slate-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none mb-3"
        />
        <button
          onClick={handleSaveSettings}
          disabled={settingsSaving}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {settingsSaving ? '保存中...' : settingsSaved ? '✓ 已保存' : '保存设置'}
        </button>
      </div>
    </div>
  )
}