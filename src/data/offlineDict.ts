// 自动生成离线考研词典（合并 初中/高中/四级/六级/考研 词表）
// 数据源：https://github.com/KyleBing/english-vocabulary (MIT)
// 数据体在 offlineDict.json（按需加载，独立 chunk）
// 仅供本地离线查词，勿手动编辑（重新生成：node scripts/build-offline-dict.cjs）

// ---------- 懒加载（模块级缓存 + 并发去重） ----------

let cache: Record<string, string> | null = null
let pending: Promise<Record<string, string>> | null = null

/** 动态 import JSON（独立异步 chunk，只在真正查词时加载） */
export function loadOfflineDict(): Promise<Record<string, string>> {
  if (cache) return Promise.resolve(cache)
  if (!pending) {
    pending = import('./offlineDict.json')
      .then((m) => {
        cache = m.default as Record<string, string>
        return cache
      })
      .catch((e) => {
        pending = null // 失败后允许重试
        throw e
      })
  }
  return pending
}
