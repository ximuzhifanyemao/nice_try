import { supabase } from './supabase'

export interface Subject {
  id: string
  name: string
  category: string
}

/** 内置默认科目 */
export const ALL_SUBJECTS: Subject[] = [
  { id: 'politics', name: '政治', category: 'politics' },
  { id: 'english', name: '英语', category: 'english' },
  { id: 'math', name: '数学', category: 'math' },
  { id: 'ds', name: '数据结构', category: '408' },
  { id: 'co', name: '计算机组成原理', category: '408' },
  { id: 'os', name: '操作系统', category: '408' },
  { id: 'cn', name: '计算机网络', category: '408' },
]

/** 各科类的可选学习内容（做了什么）（内置默认） */
export const SUBJECT_ACTIVITIES: Record<string, string[]> = {
  english: ['单词', '听课', '做题'],
  math: ['听课', '练习'],
  '408': ['听课', '练习'],
  politics: ['听课', '背诵', '刷题'],
}

export interface SubjectWithActivities extends Subject {
  activities: string[]
}

/** 云端用户自定义科目的缓存（模块级），通过 loadUserSubjects 填充 */
let userSubjectsCache: SubjectWithActivities[] | null = null
let userSubjectsError: string | null = null
/** 当前加载过的用户 id，避免不同用户串号 */
let userSubjectsOwner: string | null = null

/** 重置缓存（登出时调用） */
export function resetSubjectCache() {
  userSubjectsCache = null
  userSubjectsError = null
  userSubjectsOwner = null
}

/**
 * 从云端加载并缓存当前用户的科目。登录后调用；返回是否成功。
 * 不改变内置科目，仅在内存中追加自定义科目。
 * force=true 时忽略缓存强制重新拉取（增删改科目后调用，保证立即生效）。
 */
export async function loadUserSubjects(userId: string, force = false): Promise<boolean> {
  if (!force && userSubjectsOwner === userId && userSubjectsCache !== null) return true
  resetSubjectCache()
  userSubjectsOwner = userId
  try {
    const { data, error } = await supabase
      .from('user_subjects')
      .select('*')
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
    userSubjectsCache = (data as Array<{
      id: string
      name: string
      category?: string
      activities?: unknown
    }>).map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category ?? 'custom',
      activities: Array.isArray(s.activities)
        ? (s.activities as string[]).filter((a): a is string => typeof a === 'string')
        : [],
    }))
    return true
  } catch (err) {
    userSubjectsError = err instanceof Error ? err.message : '未知错误'
    userSubjectsCache = []
    return false
  }
}

export function getAvailableSubjects(): Subject[] {
  const builtin: Subject[] = ALL_SUBJECTS
  const custom: SubjectWithActivities[] =
    userSubjectsCache && !userSubjectsError
      ? userSubjectsCache.filter((s) => !builtin.some((b) => b.id === s.id))
      : []
  return [...builtin, ...custom]
}

export function getSubjectById(id: string): Subject | undefined {
  if (!id) return undefined
  const builtin: Subject[] = ALL_SUBJECTS
  const custom: SubjectWithActivities[] = userSubjectsCache ?? []
  return builtin.find((s) => s.id === id) ?? custom.find((s) => s.id === id)
}

/** 按科目 category 返回可选学习内容；无配置（含自定义字符串内容）原样返回 */
export function getActivitiesForSubject(subjectId: string): string[] {
  const subject = getSubjectById(subjectId)
  if (!subject) return []
  const builtin = SUBJECT_ACTIVITIES[subject.category]
  if (builtin) return builtin
  const custom = userSubjectsCache?.find((s) => s.id === subjectId)
  return custom?.activities ?? []
}

/* ── 云端自定义科目增删改 ── */

export interface UserSubject {
  id: string
  user_id: string
  name: string
  category: string
  activities: string[]
}

/** 自定义科目在当前内置科目中已存在则视为内置（避免删除/改名内置科目） */
function isBuiltinId(id: string): boolean {
  return ALL_SUBJECTS.some((s) => s.id === id)
}

export async function fetchUserSubjects(userId: string): Promise<UserSubject[]> {
  const { data, error } = await supabase
    .from('user_subjects')
    .select('*')
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return (data as Array<{ id: string; user_id: string; name: string; category: string; activities: unknown }>).map(
    (s) => ({
      id: s.id,
      user_id: s.user_id,
      name: s.name,
      category: s.category ?? 'custom',
      activities: Array.isArray(s.activities)
        ? (s.activities as string[]).filter((a): a is string => typeof a === 'string')
        : [],
    }),
  )
}

export async function createUserSubject(
  userId: string,
  input: { name: string; activities: string[] },
): Promise<UserSubject> {
  const { data, error } = await supabase
    .from('user_subjects')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      category: 'custom',
      activities: input.activities.filter((a) => a.trim()).map((a) => a.trim()),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as UserSubject
}

export async function updateUserSubject(
  subjectId: string,
  input: { name: string; activities: string[] },
): Promise<void> {
  const { error } = await supabase
    .from('user_subjects')
    .update({
      name: input.name.trim(),
      activities: input.activities.filter((a) => a.trim()).map((a) => a.trim()),
    })
    .eq('id', subjectId)

  if (error) throw new Error(error.message)
}

export async function deleteUserSubject(subjectId: string): Promise<void> {
  const { error } = await supabase
    .from('user_subjects')
    .delete()
    .eq('id', subjectId)

  if (error) throw new Error(error.message)
}

/** 判断 id 是否为内置科目（内置科目不可删改） */
export function isBuiltinSubject(subjectId: string): boolean {
  return isBuiltinId(subjectId)
}