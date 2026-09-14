import { useState, useEffect } from 'react'
import type { Todo } from '../lib/todos'
import { fetchMyTodos, createTodo, toggleTodo, deleteTodo } from '../lib/todos'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from './Icon'

/** 首页「英语长难句打卡」下方的待办事项清单：添加 / 勾选完成 / 删除 */
export default function TodoList() {
  const { user } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!user) {
      setTodos([])
      setLoading(false)
      return
    }
    setLoading(true)
    fetchMyTodos(user.id)
      .then((list) => {
        setTodos(list)
        setError(null)
      })
      .catch((err: unknown) => setError((err as Error)?.message ?? '加载待办失败'))
      .finally(() => setLoading(false))
  }, [user])

  const handleAdd = async () => {
    const content = input.trim()
    if (!content || !user || adding) return
    setAdding(true)
    try {
      const created = await createTodo(user.id, content)
      setTodos((prev) => [...prev, created])
      setInput('')
      setError(null)
    } catch (err) {
      setError((err as Error)?.message ?? '添加失败')
    } finally {
      setAdding(false)
    }
  }

  const handleToggle = async (todo: Todo) => {
    const next = !todo.done
    try {
      await toggleTodo(todo.id, next)
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: next } : t)))
    } catch (err) {
      setError((err as Error)?.message ?? '更新失败')
    }
  }

  const handleDelete = async (todoId: string) => {
    try {
      await deleteTodo(todoId)
      setTodos((prev) => prev.filter((t) => t.id !== todoId))
    } catch (err) {
      setError((err as Error)?.message ?? '删除失败')
    }
  }

  if (!user) return null

  return (
    <div className="card p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 flex items-center justify-center">
          <Icon name="check" size={13} />
        </span>
        <h3 className="text-xs font-semibold text-gray-800 dark:text-slate-100">待办事项</h3>
        {todos.length > 0 && (
          <span className="text-[10px] text-gray-400 dark:text-slate-500">
            共 {todos.length} 项
          </span>
        )}
      </div>

      {/* 输入行 */}
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd()
          }}
          placeholder="添加待办…"
          maxLength={50}
          className="flex-1 min-w-0 h-8 px-2.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[11px] text-gray-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-300 dark:focus:ring-indigo-500/40"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!input.trim() || adding}
          aria-label="添加待办"
          className="shrink-0 h-8 w-8 inline-flex items-center justify-center rounded-lg text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Icon name="plus" size={15} strokeWidth={2.2} />
        </button>
      </div>

      {error && (
        <p className="mt-2 text-[10px] text-rose-500 dark:text-rose-400">{error}</p>
      )}

      {/* 列表 */}
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 dark:border-slate-700 border-t-indigo-600 dark:border-t-indigo-500" />
        </div>
      ) : todos.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 px-2 py-1.5"
            >
              <button
                type="button"
                onClick={() => handleToggle(todo)}
                aria-pressed={todo.done}
                aria-label={todo.done ? '标记未完成' : '标记完成'}
                className={`shrink-0 rounded-md flex items-center justify-center transition-colors ${
                  todo.done
                    ? 'bg-emerald-500 text-white border border-emerald-500'
                    : 'border border-gray-300 dark:border-slate-600 hover:border-indigo-400'
                }`}
                style={{ width: 18, height: 18 }}
              >
                {todo.done && <Icon name="check" size={11} strokeWidth={2.5} />}
              </button>
              <span
                className={`flex-1 min-w-0 text-[12px] truncate transition-colors ${
                  todo.done
                    ? 'text-gray-400 dark:text-slate-500 line-through'
                    : 'text-gray-800 dark:text-slate-200'
                }`}
              >
                {todo.content}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(todo.id)}
                aria-label="删除待办"
                className="shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full text-gray-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              >
                <Icon name="trash" size={12} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-[11px] text-gray-400 dark:text-slate-500 py-2">
          暂无待办，给自己定一个小目标吧
        </p>
      )}
    </div>
  )
}