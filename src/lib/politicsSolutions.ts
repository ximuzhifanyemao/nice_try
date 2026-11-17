import rawData from '../data/politics-solutions.json'

/**
 * 「解题手册」的静态数据与类型。
 *
 * 内容整理自《2027 这就是一页纸 · 考研政治解题方法手册》：
 * 每个专题先放该专题的知识点，再紧接着放对应习题（题目为主体，答案与解析默认收起）。
 * 当前收录专题 01–09（习题 001–133）。
 */

export type SolutionQuestionType = 'single' | 'multi'

export interface SolutionOption {
  label: 'A' | 'B' | 'C' | 'D'
  text: string
}

export interface SolutionQuestion {
  no: number
  type: SolutionQuestionType
  source: string
  stem: string
  options: SolutionOption[]
  answer: string
  explanation: string
}

export interface SolutionKnowledgeGroup {
  label: string
  items: string[]
}

export interface SolutionKnowledge {
  title: string
  intro?: string
  groups: SolutionKnowledgeGroup[]
}

export interface SolutionChapter {
  id: string
  title: string
  desc: string
  total: number
  knowledge: SolutionKnowledge[]
  questions: SolutionQuestion[]
}

interface SolutionRawData {
  meta: {
    title: string
    subtitle: string
    author: string
    source: string
    usage: string
  }
  chapters: SolutionChapter[]
}

export const SOLUTION_DATA = rawData as SolutionRawData
export const SOLUTION_CHAPTERS = SOLUTION_DATA.chapters
export const SOLUTION_META = SOLUTION_DATA.meta
export const SOLUTION_TOTAL = SOLUTION_CHAPTERS.reduce((sum, chapter) => sum + chapter.questions.length, 0)

export const SOLUTION_TYPE_LABEL: Record<SolutionQuestionType, string> = {
  single: '单选',
  multi: '多选',
}

export function findSolutionChapter(id: string): SolutionChapter | undefined {
  return SOLUTION_CHAPTERS.find((chapter) => chapter.id === id)
}
