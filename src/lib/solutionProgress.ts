/**
 * 「解题手册」的作答进度：本机保存每一题选过哪些选项、是否答对、作答时间。
 *
 * 只存选项字母，不存题目内容：题库更新后旧记录仍然可用，
 * 题号不存在的记录在读取时保留，但页面统计只按当前题库计算。
 */

export interface SolutionAnswer {
  /** 用户选择的选项字母，按 A→D 排序 */
  picked: string[]
  /** 提交时是否与标准答案一致 */
  correct: boolean
  /** 提交时间戳（毫秒） */
  at: number
}

export type SolutionProgress = Record<string, SolutionAnswer>

const STORAGE_KEY = 'kaoyan_solution_progress_v1'
const LETTERS = ['A', 'B', 'C', 'D']

/** 把任意来源的选择收敛成 A–D 的去重升序数组 */
export function normalizePicked(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const picked = new Set<string>()
  for (const item of value) {
    if (typeof item !== 'string') continue
    const letter = item.trim().toUpperCase()
    if (LETTERS.includes(letter)) picked.add(letter)
  }
  return LETTERS.filter((letter) => picked.has(letter))
}

/** 判断一组选择是否与标准答案完全一致（多选必须不多不少） */
export function isSolutionCorrect(picked: string[], answer: string): boolean {
  const right = normalizePicked(answer.split(''))
  const mine = normalizePicked(picked)
  return mine.length === right.length && mine.every((letter, index) => letter === right[index])
}

/** 把任意来源（本机旧键 / 云端 JSON）的作答记录收敛成合法形状 */
export function sanitizeSolutionProgress(value: unknown): SolutionProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const result: SolutionProgress = {}
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!/^\d+$/.test(key)) continue
    if (!entry || typeof entry !== 'object') continue
    const item = entry as Partial<SolutionAnswer>
    const picked = normalizePicked(item.picked)
    if (!picked.length) continue
    result[key] = {
      picked,
      correct: item.correct === true,
      at: typeof item.at === 'number' && Number.isFinite(item.at) ? item.at : 0,
    }
  }
  return result
}

/**
 * 合并两端的作答记录：同一题按作答时间取较新的一份。
 * 用来处理「手机做一半、电脑做一半」以及重做后换设备的情况。
 */
export function mergeSolutionProgress(
  a: SolutionProgress,
  b: SolutionProgress,
): SolutionProgress {
  const merged: SolutionProgress = { ...a }
  for (const [key, answer] of Object.entries(b)) {
    const current = merged[key]
    if (!current || answer.at >= current.at) merged[key] = answer
  }
  return merged
}

/**
 * 读取本机旧键里的作答记录。
 * 现在作答记录并入政治学习状态（onepaper.state.v1）统一保存 / 同步，
 * 这里只用于把老版本的 kaoyan_solution_progress_v1 迁移过来。
 */
export function loadSolutionProgress(): SolutionProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return sanitizeSolutionProgress(JSON.parse(raw) as unknown)
  } catch {
    return {}
  }
}

/** 记录一道题的作答结果，返回新的进度对象 */
export function recordSolutionAnswer(
  progress: SolutionProgress,
  no: number,
  picked: string[],
  answer: string,
): SolutionProgress {
  const normalized = normalizePicked(picked)
  if (!normalized.length) return progress
  return {
    ...progress,
    [String(no)]: {
      picked: normalized,
      correct: isSolutionCorrect(normalized, answer),
      at: Date.now(),
    },
  }
}

/** 清除一道题的作答（重做），返回新的进度对象 */
export function clearSolutionAnswer(progress: SolutionProgress, no: number): SolutionProgress {
  if (!(String(no) in progress)) return progress
  const next = { ...progress }
  delete next[String(no)]
  return next
}

export interface SolutionSummary {
  done: number
  correct: number
  rate: number
}

/** 按一组题号统计已做 / 正确 / 正确率（0–100 的整数） */
export function summarizeSolution(progress: SolutionProgress, questionNos: number[]): SolutionSummary {
  let done = 0
  let correct = 0
  for (const no of questionNos) {
    const item = progress[String(no)]
    if (!item) continue
    done += 1
    if (item.correct) correct += 1
  }
  return {
    done,
    correct,
    rate: done > 0 ? Math.round((correct / done) * 100) : 0,
  }
}
