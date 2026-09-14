import { supabase } from './supabase'

/** 首页待办清单表 todos 的一条记录 */
export interface Todo {
  id: string
  user_id: string
  content: string
  done: boolean
  created_at: string
}

/** 查询某用户的全部待办，按创建时间升序 */
export async function fetchMyTodos(userId: string): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data as Todo[]) ?? []
}

/** 新增一条待办 */
export async function createTodo(userId: string, content: string): Promise<Todo> {
  const { data, error } = await supabase
    .from('todos')
    .insert({ user_id: userId, content })
    .select()
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