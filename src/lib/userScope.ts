/**
 * 用户内容的本地缓存隔离。
 *
 * 记一记（笔记 / 生词）、政治进度、周目标缓存等都属于账号数据，
 * 本地缓存键必须带上当前登录用户 id：否则 A 账号登出后 B 账号登录，
 * B 会读到 A 留在本机的内容，甚至把 A 的本地数据合并进 B 的云端记录。
 *
 * 注意：旧版的全局键（如 kaoyan_study_notes_v1）不再读取。
 * 它们可能混有多个账号写过的数据，无法判断归属；各模块登录后都会从云端拉回自己的数据。
 */
let activeUserId: string | null = null

/** 由 AuthContext 在会话变化时同步维护（只影响后续存取，不触发渲染） */
export function setActiveUserId(userId: string | null): void {
  activeUserId = userId
}

export function getActiveUserId(): string | null {
  return activeUserId
}

function resolveUserId(userId?: string | null): string | null {
  // 未显式传入时跟随当前登录用户；显式传 null 表示按「未登录」分区
  return userId === undefined ? activeUserId : userId
}

/** 按账号分区的本地缓存键（未登录时用 anon 分区，不与任何账号共享） */
export function userCacheKey(base: string, userId?: string | null): string {
  return `${base}::${resolveUserId(userId) ?? 'anon'}`
}

export function readUserCache(base: string, userId?: string | null): string | null {
  try {
    return localStorage.getItem(userCacheKey(base, userId))
  } catch {
    return null
  }
}

export function writeUserCache(base: string, value: string, userId?: string | null): void {
  try {
    localStorage.setItem(userCacheKey(base, userId), value)
  } catch {
    /* 隐私模式 / 配额不足时忽略 */
  }
}

export function removeUserCache(base: string, userId?: string | null): void {
  try {
    localStorage.removeItem(userCacheKey(base, userId))
  } catch {
    /* 忽略 */
  }
}
