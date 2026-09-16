import { supabase } from './supabase'

/** 首页待办清单表 todos 的一条记录 */
export interface Todo {
  id: string
  user_id: string
  content: string
  done: boolean
  created_at: string
}

const COLUMNS = 'id, user_id, content, done, created_at'

/**
 * 统一的展示顺序：未完成在前，同组内按创建时间正序（先进先出）。
 *
 * 之前只按 created_at 升序排，已完成和未完成混在一起，用户得用眼睛扫才能
 * 找到"还没做的事"。这里既在查询层排序，也导出给客户端做乐观更新后的重排，
 * 保证勾选/新增后列表位置立刻正确。
 */
export function sortTodos(list: Todo[]): Todo[] {
  return [...list].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return a.created_at.localeCompare(b.created_at)
  })
}

/** 查询某用户的全部待办 */
export async function fetchMyTodos(userId: string): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select(COLUMNS)
    .eq('user_id', userId)
    .order('done', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return sortTodos((data as Todo[]) ?? [])
}

/** 新增一条待办 */
export async function createTodo(userId: string, content: string): Promise<Todo> {
  const { data, error } = await supabase
    .from('todos')
    .insert({ user_id: userId, content })
    .select(COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Todo
}

/** 勾选 / 取消勾选待办 */
export async function toggleTodo(todoId: string, done: boolean): Promise<void> {
  const { error } = await supabase.from('todos').update({ done }).eq('id', todoId)

  if (error) {
    throw new Error(error.message)
  }
}

/** 删除一条待办 */
export async function deleteTodo(todoId: string): Promise<void> {
  const { error } = await supabase.from('todos').delete().eq('id', todoId)

  if (error) {
    throw new Error(error.message)
  }
}
