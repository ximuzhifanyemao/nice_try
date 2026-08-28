// 本文件类型定义 + 懒加载入口；数据体在 englishDaily.json（按需加载，独立 chunk）
// 由 scripts/gen-english-daily.cjs / gen-ai-analysis.cjs 自动生成，请勿手改

export interface EnglishDaySentence {
  num: string
  en: string
  ref: string
  // 预生成的 AI 解析内容（句子主干/结构/搭配），由 scripts/gen-ai-analysis.cjs 批量生成，避免运行时消耗 AI token
  ai?: {
    backbone: string
    structure: string[]
    collocations: string[]
  }
}

export interface VocabItem {
  raw: string
  word: string
  meaning: string
}

export interface AnalysisItem {
  sentNum: string
  vocab: VocabItem[]
  split: string
  grammar: string[]
  ref: string
}

export interface EnglishDay {
  day: number
  type: '英一' | '英二'
  source: string
  sentences: EnglishDaySentence[]
  zh: string
  analysis?: AnalysisItem[]
}

// ---------- 懒加载（模块级缓存 + 并发去重） ----------

let cache: EnglishDay[] | null = null
let pending: Promise<EnglishDay[]> | null = null

/** 动态 import JSON（独立异步 chunk，JSON.parse 解析比巨型 JS 字面量快数倍） */
export function loadEnglishDaily(): Promise<EnglishDay[]> {
  if (cache) return Promise.resolve(cache)
  if (!pending) {
    pending = import('./englishDaily.json')
      .then((m) => {
        cache = m.default as EnglishDay[]
        return cache
      })
      .catch((e) => {
        pending = null // 失败后允许重试
        throw e
      })
  }
  return pending
}

