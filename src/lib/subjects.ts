export interface Subject {
  id: string
  name: string
  category: string
}

export const ALL_SUBJECTS: Subject[] = [
  { id: 'politics', name: '政治', category: 'politics' },
  { id: 'english', name: '英语', category: 'english' },
  { id: 'math', name: '数学', category: 'math' },
  { id: 'ds', name: '数据结构', category: '408' },
  { id: 'co', name: '计算机组成原理', category: '408' },
  { id: 'os', name: '操作系统', category: '408' },
  { id: 'cn', name: '计算机网络', category: '408' },
]

export function getAvailableSubjects(): Subject[] {
  return ALL_SUBJECTS
}

/** 各科类的可选学习内容（做了什么） */
export const SUBJECT_ACTIVITIES: Record<string, string[]> = {
  english: ['单词', '听课', '做题'],
  math: ['听课', '练习'],
  '408': ['听课', '练习'],
  politics: ['听课', '背诵', '刷题'],
}

/** 按科目 category 返回可选学习内容；无配置返回 [] */
export function getActivitiesForSubject(subjectId: string): string[] {
  const category = getSubjectById(subjectId)?.category
  return category ? SUBJECT_ACTIVITIES[category] ?? [] : []
}

export function getSubjectById(id: string): Subject | undefined {
  return ALL_SUBJECTS.find((s) => s.id === id)
}
