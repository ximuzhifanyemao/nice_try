/// <reference types="vite/client" />

declare const __APP_VERSION__: string
declare const __APP_GIT_HASH__: string
declare const __APP_GIT_MESSAGE__: string
declare const __APP_GIT_CHANGELOG__: { hash: string; date: string; message: string }[]

// 大数据 JSON（englishDaily.json / offlineDict.json）通过动态 import() 按需加载，
// 用宽松的 unknown 类型声明，避免 TS 推断巨型字面量类型拖慢类型检查
declare module '*.json' {
  const content: unknown
  export default content
}

