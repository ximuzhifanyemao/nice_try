import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { toggleTheme } from '../lib/theme'
import { fetchUserSettings, saveUserSettings } from '../lib/settings'
import {
  createUserSubject,
  deleteUserSubject,
  fetchUserSubjects,
  isBuiltinSubject,
  updateUserSubject,
  loadUserSubjects,
  type UserSubject,
} from '../lib/subjects'

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

  /* ── 科目管理 ── */
  const [subjects, setSubjects] = useState<UserSubject[]>([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [newActivities, setNewActivities] = useState('')
  const [creating, setCreating] = useState(false)

  /* 当前正在编辑的科目 */
  const [editing, setEditing] = useState<UserSubject | null>(null)
  const [editActivities, setEditActivities] = useState('')

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

  const loadSubjects = useCallback(async () => {
    if (!userId) return
    setSubjectsLoading(true)
    try {
      const list = await fetchUserSubjects(userId)
      setSubjects(list)
    } catch {
      /* 忽略读取失败 */
    } finally {
      setSubjectsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    loadSettings()
    loadSubjects()
  }, [userId, loadSettings, loadSubjects])

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

  const handleCreate = async () => {
    if (!userId || !newName.trim()) return
    setCreating(true)
    try {
      const activities = newActivities
        .split(/[，,、\n]/)
        .map((a) => a.trim())
        .filter(Boolean)
      await createUserSubject(userId, { name: newName, activities })
      setNewName('')
      setNewActivities('')
      await loadSubjects()
      await loadUserSubjects(userId)
    } catch (err) {
      alert('添加失败：' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setCreating(false)
    }
  }

  const handleUpdate = async () => {
    if (!editing) return
    try {
      const activities = editActivities
        .split(/[，,、\n]/)
        .map((a) => a.trim())
        .filter(Boolean)
      await updateUserSubject(editing.id, { name: editing.name, activities })
      setEditing(null)
      if (userId) {
        await loadSubjects()
        await loadUserSubjects(userId)
      }
    } catch (err) {
      alert('保存失败：' + (err instanceof Error ? err.message : '未知错误'))
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定删除该科目？已记录的历史数据不受影响。')) return
    try {
      await deleteUserSubject(id)
      if (userId) {
        await loadSubjects()
        await loadUserSubjects(userId)
      }
    } catch (err) {
      alert('删除失败：' + (err instanceof Error ? err.message : '未知错误'))
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

      {/* 计时科目管理 */}
      <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100 mb-1">计时科目</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
          可添加自定义科目及学习内容，会同步到手机与网页。
        </p>

        {/* 新增科目 */}
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-slate-600 p-3 space-y-2 mb-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="科目名称，如：专业课、工作、健身"
            className="w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-800 dark:text-slate-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
          />
          <input
            value={newActivities}
            onChange={(e) => setNewActivities(e.target.value)}
            placeholder="学习内容（用逗号分隔），如：阅读，练习，复盘"
            className="w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-800 dark:text-slate-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="px-4 py-2 bg-white dark:bg-slate-600 border border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-slate-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? '添加中...' : '+ 添加科目'}
          </button>
        </div>

        {/* 科目列表 */}
        {subjectsLoading ? (
          <p className="text-xs text-gray-400 dark:text-slate-500">加载中...</p>
        ) : subjects.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-slate-500">暂无自定义科目，内置科目（政治/英语/数学/408）始终可用。</p>
        ) : (
          <ul className="space-y-2">
            {subjects.map((s) => (
              <li key={s.id} className="rounded-lg border border-gray-100 dark:border-slate-700 p-3">
                {editing?.id === s.id ? (
                  <div className="space-y-2">
                    <input
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-800 dark:text-slate-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                    />
                    <input
                      value={editActivities}
                      onChange={(e) => setEditActivities(e.target.value)}
                      placeholder="学习内容（逗号分隔）"
                      className="w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-800 dark:text-slate-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdate}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-slate-300 cursor-pointer"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-slate-100">{s.name}</p>
                      {s.activities.length > 0 ? (
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                          内容：{s.activities.join('、')}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">无学习内容</p>
                      )}
                    </div>
                    {!isBuiltinSubject(s.id) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditing(s)
                            setEditActivities(s.activities.join('、'))
                          }}
                          className="px-3 py-1 text-xs text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="px-3 py-1 text-xs text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}