export interface Subject {
  id: string
  name: string
  category: string
}

export const ALL_SUBJECTS: Subject[] = [
  { id: 'math', name: '数学', category: 'math' },
  { id: 'english', name: '英语', category: 'english' },
  { id: 'ds', name: '数据结构', category: '408' },
  { id: 'co', name: '计算机组成原理', category: '408' },
  { id: 'os', name: '操作系统', category: '408' },
  { id: 'cn', name: '计算机网络', category: '408' },
  { id: 'politics', name: '政治', category: 'politics' },
]

export function getAvailableSubjects(): Subject[] {
  const now = new Date()
  // 9月1日起显示政治
  if (now.getMonth() >= 8) {
    return ALL_SUBJECTS
  }
  // 8月及之前：不显示政治
  return ALL_SUBJECTS.filter((s) => s.id !== 'politics')
}

export function getSubjectById(id: string): Subject | undefined {
  return ALL_SUBJECTS.find((s) => s.id === id)
}
