import { useEffect, useState } from 'react'
import { getProgressStyle, subscribeProgressStyle, type ProgressStyle } from '../lib/progressStyle'

/** 当前生效的今日进度尺样式（设置页改动后自动同步到胶囊条与全功能计时页） */
export function useProgressStyle(): ProgressStyle {
  const [style, setStyle] = useState<ProgressStyle>(() => getProgressStyle())
  useEffect(() => subscribeProgressStyle(setStyle), [])
  return style
}
