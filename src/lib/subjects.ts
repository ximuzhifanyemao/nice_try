import { supabase } from './supabase'

export interface Subject {
  id: string
  name: string
  category: string
}

/**
 * 历史内置科目（考研模板）。
 * 不再向可选列表提供（可选列表 = 用户自己的科目）；
 * 仅作为：老用户打卡记录中旧 id 的显示兜底 + 迁移时生成自定义科目的模板。
 */
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

/** 内置 category 编码 → 中文展示名；不在此表中的自定义分组原样返回 */
const CATEGORY_LABELS: Record<string, string> = {
  math: '数学',
  english: '英语',
  politics: '政治',
  '408': '408 计算机专业基础综合',
  custom: '', // 无分组
}

/**
 * 把 category 原始编码转成 UI 可读的中文标签。
 * - 内置编码（math/english/politics/408）→ 中文显示名
 * - 'custom' / '' → undefined（调用方据此不显示分组标题）
 * - 自定义分组名 → 原样返回
 */
export function getCategoryLabel(category: string | undefined | null): string | undefined {
  if (!category) return undefined
  if (category === 'custom') return undefined
  return CATEGORY_LABELS[category] ?? category
}

export interface SubjectWithActivities extends Subject {
  activities: string[]
  /** 迁移前的旧内置科目 id（如 'math'），让历史记录 id 仍能映射到本科目 */
  legacy_id?: string | null
}

/** 云端用户自定义科目的缓存（模块级），通过 loadUserSubjects 填充 */
let userSubjectsCache: SubjectWithActivities[] | null = null
let userSubjectsError: string | null = null
/** 当前加载过的用户 id，避免不同用户串号 */
let userSubjectsOwner: string | null = null

/** 自定义科目本地持久化 key（按用户隔离，避免串号） */
const SUBJECTS_STORAGE_KEY = (userId: string) => `kaoyan_user_subjects_${userId}`

function saveUserSubjectsToStorage(userId: string, subjects: SubjectWithActivities[]) {
  try {
    localStorage.setItem(SUBJECTS_STORAGE_KEY(userId), JSON.stringify(subjects))
  } catch {
    // 存储不可用时静默忽略，不影响内存缓存
  }
}

/**
 * 从本地存储同步恢复该用户的自定义科目缓存。
 * 冷启动时在云端数据返回前先恢复上次的科目，避免「先显示内置科目、稍后新科目才出现」；
 * 无本地数据或已加载过时不做任何事。
 */
export function hydrateUserSubjects(userId: string | null | undefined) {
  if (!userId) return
  if (userSubjectsOwner === userId && userSubjectsCache !== null) return
  try {
    const raw = localStorage.getItem(SUBJECTS_STORAGE_KEY(userId))
    if (!raw) return
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return
    const subjects = parsed.filter(
      (s): s is SubjectWithActivities =>
        !!s &&
        typeof s === 'object' &&
        typeof (s as SubjectWithActivities).id === 'string' &&
        typeof (s as SubjectWithActivities).name === 'string',
    )
    if (subjects.length === 0) return
    userSubjectsCache = subjects
    userSubjectsOwner = userId
    userSubjectsError = null
  } catch {
    // 解析失败则忽略，等待云端加载
  }
}

/** 重置缓存（登出时调用） */
export function resetSubjectCache() {
  userSubjectsCache = null
  userSubjectsError = null
  userSubjectsOwner = null
}

/**
 * 从云端加载并缓存当前用户的科目。登录后调用；返回是否成功。
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
      legacy_id?: string | null
    }>).map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category ?? 'custom',
      activities: Array.isArray(s.activities)
        ? (s.activities as string[]).filter((a): a is string => typeof a === 'string')
        : [],
      legacy_id: s.legacy_id ?? null,
    }))
    // 云端结果非空才覆盖本地缓存：若科目被误删导致云端为空，本机缓存保留删除前的
    // 名称映射，供「恢复被删科目」从本机还原 UUID 自定义科目的名称/分类/学习内容。
    if (userSubjectsCache.length > 0) {
      saveUserSubjectsToStorage(userId, userSubjectsCache)
    }
    return true
  } catch (err) {
    userSubjectsError = err instanceof Error ? err.message : '未知错误'
    userSubjectsCache = []
    return false
  }
}

/**
 * 可选科目列表 = 用户自己的科目（云端自定义 + 迁移后的旧内置科目）。
 * 内置科目不再默认提供，新用户从零开始自建。
 * 显示层按名称去重：老版本 bug 产生的同名重复科目在 UI 上只保留第一个可见，
 * 管理列表仍会完整列出以便用户手动删除清理。
 */
export function getAvailableSubjects(): Subject[] {
  if (!userSubjectsCache || userSubjectsError) return []
  const seen = new Set<string>()
  const result: Subject[] = []
  for (const s of userSubjectsCache) {
    const key = s.name.trim()
    if (!key) continue
    if (seen.has(key)) continue
    seen.add(key)
    result.push(s)
  }
  return result
}

/**
 * 用户的科目是否存在按名称重复的条目（供管理面板提示用户清理用）。
 * 返回重复条目名称列表（不含首个保留项）。
 */
export function listDuplicateSubjectNames(): string[] {
  if (!userSubjectsCache) return []
  const seen = new Set<string>()
  const dups: string[] = []
  for (const s of userSubjectsCache) {
    const key = s.name.trim()
    if (!key) continue
    if (seen.has(key)) {
      if (!dups.includes(key)) dups.push(key)
    } else {
      seen.add(key)
    }
  }
  return dups
}

export function getSubjectById(id: string): Subject | undefined {
  if (!id) return undefined
  const custom = userSubjectsCache?.find((s) => s.id === id || s.legacy_id === id)
  if (custom) return custom
  // 兜底：历史记录中的旧内置科目（如 'math'）在迁移前仍可显示默认名
  return ALL_SUBJECTS.find((s) => s.id === id)
}

/** 按科目返回可选学习内容：先取用户配置，无配置回退内置默认 */
export function getActivitiesForSubject(subjectId: string): string[] {
  const custom = userSubjectsCache?.find((s) => s.id === subjectId || s.legacy_id === subjectId)
  if (custom && custom.activities.length > 0) return custom.activities
  const subject = getSubjectById(subjectId)
  if (!subject) return []
  return SUBJECT_ACTIVITIES[subject.category] ?? []
}

/* ── 云端自定义科目增删改 ── */

export interface UserSubject {
  id: string
  user_id: string
  name: string
  category: string
  activities: string[]
  /** 迁移前的旧内置科目 id（如 'math'），用于让历史记录仍能映射到本科目 */
  legacy_id?: string | null
}

export async function fetchUserSubjects(userId: string): Promise<UserSubject[]> {
  const { data, error } = await supabase
    .from('user_subjects')
    .select('*')
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return (
    data as Array<{
      id: string
      user_id: string
      name: string
      category: string
      activities: unknown
      legacy_id?: string | null
    }>
  ).map((s) => ({
    id: s.id,
    user_id: s.user_id,
    name: s.name,
    category: s.category ?? 'custom',
    activities: Array.isArray(s.activities)
      ? (s.activities as string[]).filter((a): a is string => typeof a === 'string')
      : [],
    legacy_id: s.legacy_id ?? null,
  }))
}

export async function createUserSubject(
  userId: string,
  input: { name: string; activities: string[]; category?: string },
): Promise<UserSubject> {
  const name = input.name.trim()
  if (!name) throw new Error('科目名称不能为空')

  // 写入前显式查重：避免同用户反复创建同名科目
  const { data: existingRows, error: checkErr } = await supabase
    .from('user_subjects')
    .select('id, name')
    .eq('user_id', userId)
  if (checkErr) throw new Error(checkErr.message)
  const duplicate = existingRows?.find((r) => r.name?.trim() === name)
  if (duplicate) {
    throw new Error(`已存在同名科目「${name}」，请修改名称或先删除已有的同名科目`)
  }

  const { data, error } = await supabase
    .from('user_subjects')
    .insert({
      user_id: userId,
      name,
      // 分组：传入的 category 优先，默认 'custom'（无分组）；'408' 会像内置一样折叠展示
      category: input.category?.trim() || 'custom',
      activities: input.activities.filter((a) => a.trim()).map((a) => a.trim()),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as UserSubject
}

export async function updateUserSubject(
  subjectId: string,
  input: { name: string; activities: string[]; category?: string },
): Promise<void> {
  const name = input.name.trim()
  if (!name) throw new Error('科目名称不能为空')

  // 先查出该科目的 user_id（避免把 name/owner 交给客户端做校验）
  const { data: self, error: selfErr } = await supabase
    .from('user_subjects')
    .select('user_id')
    .eq('id', subjectId)
    .limit(1)
    .maybeSingle()
  if (selfErr) throw new Error(selfErr.message)
  const userId = (self as { user_id: string } | null)?.user_id
  if (userId) {
    // 服务端重名检查：同用户下除自身外，不能有同名科目
    const { data: others, error: checkErr } = await supabase
      .from('user_subjects')
      .select('id, name')
      .eq('user_id', userId)
      .neq('id', subjectId)
    if (!checkErr) {
      const conflict = others?.find((r) => r.name?.trim() === name)
      if (conflict) {
        throw new Error(`已存在同名科目「${name}」，请修改名称或先删除已有的同名科目`)
      }
    }
  }

  const { error } = await supabase
    .from('user_subjects')
    .update({
      name,
      category: input.category?.trim() || 'custom',
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

/* ── 内置科目迁移（去考研化：老用户的历史科目转成自定义科目） ── */

/**
 * 分页拉取该用户全部打卡记录（不含回收站）中的科目 id 列表（去重、保序）。
 * 迁移/恢复时全量扫描，避免 `limit` 截断导致旧记录里的科目漏找回。
 */
async function fetchAllLogSubjectIds(userId: string): Promise<string[]> {
  const ids: string[] = []
  const seen = new Set<string>()
  const PAGE = 500
  for (let from = 0; ; from += PAGE) {
    const to = from + PAGE - 1
    const { data, error } = await supabase
      .from('daily_logs')
      .select('subjects')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    for (const log of data ?? []) {
      for (const s of (log as { subjects?: Array<{ id?: string }> }).subjects ?? []) {
        if (s?.id && !seen.has(s.id)) {
          seen.add(s.id)
          ids.push(s.id)
        }
      }
    }
    if ((data?.length ?? 0) < PAGE) break
  }
  return ids
}

/** 读取本机持久化的科目缓存（删除后若某端缓存还未被刷新，可借此还原科目名） */
function readCachedSubjects(userId: string): SubjectWithActivities[] {
  try {
    const raw = localStorage.getItem(SUBJECTS_STORAGE_KEY(userId))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (s): s is SubjectWithActivities =>
        !!s &&
        typeof s === 'object' &&
        typeof (s as SubjectWithActivities).id === 'string' &&
        typeof (s as SubjectWithActivities).name === 'string',
    )
  } catch {
    return []
  }
}

/**
 * 把该用户历史打卡中用过的内置科目（政治/英语/数学/408）迁移为自定义科目：
 * - 只迁移「日志中出现过」的内置科目，不出现在列表里打扰新用户
 * - legacy_id 记录旧 id，历史记录仍能映射到迁移后的科目（改名后历史显示新名）
 * - 幂等：已有同名科目或已有对应 legacy_id 的科目视为已迁移，重复登录重跑不会重复插入；
 *   不依赖本地一次性标记，早期迁移失败（表结构未就绪/网络异常）或用户误删科目后，
 *   下次登录会从打卡记录自动找回，避免「内置科目没了又无法修改」。
 * - 若 legacy_id 被全局唯一约束（历史数据库形态）占用，降级为不带 legacy_id 插入，
 *   保证每个用户都能拥有并修改自己的内置科目。
 */
export async function ensureBuiltinMigration(userId: string): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('user_subjects')
      .select('id, legacy_id, name')
      .eq('user_id', userId)
    const haveLegacy = new Set<string>()
    // 同名视作已迁移：降级插入（无 legacy_id）或用户手建的同名科目都不再重复补插
    const haveName = new Set<string>()
    for (const row of existing ?? []) {
      if (row.legacy_id) haveLegacy.add(row.legacy_id)
      if (typeof row.name === 'string') haveName.add(row.name)
    }

    // 全量扫描打卡记录里出现过的内置科目 id
    const ids = await fetchAllLogSubjectIds(userId)
    const toMigrate: Subject[] = []
    for (const id of ids) {
      if (haveLegacy.has(id)) continue
      const builtin = ALL_SUBJECTS.find((b) => b.id === id)
      if (!builtin || haveName.has(builtin.name)) continue
      toMigrate.push(builtin)
      haveLegacy.add(id)
      haveName.add(builtin.name)
    }

    if (toMigrate.length > 0) {
      // 逐条插入：单条撞 legacy_id 全局唯一索引时不影响其他科目，并降级重试
      for (const b of toMigrate) {
        const base = {
          user_id: userId,
          name: b.name,
          category: b.category,
          activities: SUBJECT_ACTIVITIES[b.category] ?? [],
        }
        // ── TOCTOU 二次防护：写入前立即查一次该科目名或该 legacy_id 是否已被其他端写入 ──
        try {
          const { data: justAdded } = await supabase
            .from('user_subjects')
            .select('name, legacy_id')
            .eq('user_id', userId)
            .or(`name.eq.${b.name},legacy_id.eq.${b.id}`)
            .limit(1)
          if (justAdded && justAdded.length > 0) continue // 其他端已创建，跳过避免重复
        } catch {
          /* 查询失败保守继续（插入层仍会出错即停） */
        }
        try {
          const { error } = await supabase.from('user_subjects').insert({ ...base, legacy_id: b.id })
          if (error) throw error
          continue
        } catch {
          /* legacy_id 已被其他用户占用（旧全局唯一索引）或网络异常 → 降级/忽略 */
        }
        // 降级插入前再查一次 name（上面查过，但 legacy_id 路径失败后再兜底一次）
        try {
          const { data: nameExists } = await supabase
            .from('user_subjects')
            .select('id')
            .eq('user_id', userId)
            .eq('name', b.name)
            .limit(1)
          if (nameExists && nameExists.length > 0) continue
        } catch { /* 忽略 */ }
        try {
          await supabase.from('user_subjects').insert(base)
        } catch {
          /* 单条失败静默，不影响其他科目 */
        }
      }
    }
  } catch {
    // 迁移失败静默忽略（下次登录重试），不影响主流程
  }
  // 强制刷新内存缓存，让迁移后的科目立即出现
  await loadUserSubjects(userId, true)
}

export interface SubjectRecoveryResult {
  /** 本次恢复成功的科目名（内置科目默认名或缓存里还原的自定义名） */
  recovered: string[]
  /** 打卡记录中存在、但名称无法还原的科目 id（常见：自定义科目删除后本机缓存也被刷新） */
  unknownIds: string[]
}

/**
 * 主动恢复被误删的科目（从打卡记录 + 本机缓存还原，不回滚用户日后删掉不想要的科目）。
 * - 内置科目（英语/数学/408…）：按默认名重建，历史 id 仍映射；
 * - 自定义科目（随机 UUID）：尝试从本机缓存还原原名/分类/学习内容，命中则用原 id 重建，
 *   历史记录直接映射回名称；缓存也没有的科目，只返回 id，提示用户手动重建。
 * 幂等：已有同名/id/legacy_id 的科目不会重复创建。
 */
export async function recoverDeletedSubjects(userId: string): Promise<SubjectRecoveryResult> {
  const result: SubjectRecoveryResult = { recovered: [], unknownIds: [] }

  const { data: existing } = await supabase
    .from('user_subjects')
    .select('id, legacy_id, name')
    .eq('user_id', userId)
  const haveIds = new Set<string>()
  const haveLegacy = new Set<string>()
  const haveName = new Set<string>()
  for (const row of existing ?? []) {
    if (row.id) haveIds.add(row.id)
    if (row.legacy_id) haveLegacy.add(row.legacy_id)
    if (typeof row.name === 'string') haveName.add(row.name)
  }

  // id → 科目（合并内存缓存与本机持久化缓存，保证拿到最全的名称映射）
  const cacheMap = new Map<string, SubjectWithActivities>()
  for (const s of [...(userSubjectsCache ?? []), ...readCachedSubjects(userId)]) {
    if (s?.id && typeof s.name === 'string') cacheMap.set(s.id, s)
  }

  const ids = await fetchAllLogSubjectIds(userId)
  for (const id of ids) {
    if (haveIds.has(id) || haveLegacy.has(id)) continue

    // 内置科目：按默认模板重建
    const builtin = ALL_SUBJECTS.find((b) => b.id === id)
    if (builtin) {
      if (haveName.has(builtin.name)) continue
      const base = {
        user_id: userId,
        name: builtin.name,
        category: builtin.category,
        activities: SUBJECT_ACTIVITIES[builtin.category] ?? [],
      }
      // ── TOCTOU 二次防护：写入前立即查一次该科目名 / legacy_id 是否已被其他端重建 ──
      try {
        const { data: justAdded } = await supabase
          .from('user_subjects')
          .select('name, legacy_id')
          .eq('user_id', userId)
          .or(`name.eq.${builtin.name},legacy_id.eq.${builtin.id}`)
          .limit(1)
        if (justAdded && justAdded.length > 0) continue
      } catch { /* 忽略，继续 */ }
      try {
        const { error } = await supabase.from('user_subjects').insert({ ...base, legacy_id: builtin.id })
        if (error) throw error
      } catch {
        // 降级：先确认 name 未被写入，再不带 legacy_id 插入
        try {
          const { data: nameExists } = await supabase
            .from('user_subjects')
            .select('id')
            .eq('user_id', userId)
            .eq('name', builtin.name)
            .limit(1)
          if (nameExists && nameExists.length > 0) continue
        } catch { /* 忽略 */ }
        try {
          await supabase.from('user_subjects').insert(base)
        } catch {
          continue
        }
      }
      haveLegacy.add(builtin.id)
      haveName.add(builtin.name)
      result.recovered.push(builtin.name)
      continue
    }

    // 自定义科目（UUID）：尝试用原 id 从缓存还原，让历史记录 id 直接映射回名称
    const c = cacheMap.get(id)
    if (c) {
      if (haveName.has(c.name)) continue
      const payload: Record<string, unknown> = {
        user_id: userId,
        name: c.name,
        category: c.category ?? 'custom',
        activities: Array.isArray(c.activities) ? c.activities : [],
      }
      const preserveId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      if (preserveId) payload.id = id
      // ── TOCTOU 二次防护：写入前立即查一次该 id / 名称 是否已被其他端重建 ──
      try {
        const conds: string[] = [`name.eq.${c.name}`]
        if (preserveId) conds.push(`id.eq.${id}`)
        const { data: justAdded } = await supabase
          .from('user_subjects')
          .select('id, name')
          .eq('user_id', userId)
          .or(conds.join(','))
          .limit(1)
        if (justAdded && justAdded.length > 0) continue
      } catch { /* 忽略，继续 */ }
      try {
        await supabase.from('user_subjects').insert(payload)
        haveIds.add(id)
        haveName.add(c.name)
        result.recovered.push(c.name)
      } catch {
        /* 单条重建失败（如重名）→ 不阻塞其他科目 */
      }
      continue
    }

    result.unknownIds.push(id)
  }

  await loadUserSubjects(userId, true)
  return result
}