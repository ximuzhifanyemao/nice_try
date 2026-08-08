import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import type { DailyLog } from './dailyLogs'
import { getSubjectById } from './subjects'

/** 成就分类 */
export type AchievementCategory = 'day' | 'total' | 'days' | 'streak' | 'subject' | 'timer' | 'fun'

export const ACHIEVEMENT_CATEGORIES: { key: AchievementCategory; label: string; icon: string }[] = [
  { key: 'day', label: '单日爆发', icon: '💥' },
  { key: 'total', label: '累计时长', icon: '🕒' },
  { key: 'days', label: '打卡天数', icon: '📅' },
  { key: 'streak', label: '连续打卡', icon: '🔥' },
  { key: 'subject', label: '单科深耕', icon: '📚' },
  { key: 'timer', label: '计时器', icon: '⏱️' },
  { key: 'fun', label: '趣味彩蛋', icon: '🎁' },
]

export interface AchievementDef {
  id: string
  /** 趣味名称（如「铁锭」） */
  name: string
  icon: string
  category: AchievementCategory
  /** 达成条件描述 */
  desc: string
  /** 达成阈值 */
  target: number
}

/** 成就定义（全部从学习记录本地计算，无需额外存储） */
export const ACHIEVEMENTS: AchievementDef[] = [
  // 单日爆发
  { id: 'day_3', name: '木棍', icon: '🪵', category: 'day', desc: '单日学习满 3 小时', target: 3 },
  { id: 'day_6', name: '石头', icon: '🪨', category: 'day', desc: '单日学习满 6 小时', target: 6 },
  { id: 'day_10', name: '铁锭', icon: '⛏️', category: 'day', desc: '单日学习满 10 小时', target: 10 },
  { id: 'day_14', name: '金锭', icon: '🪙', category: 'day', desc: '单日学习满 14 小时', target: 14 },
  { id: 'day_16', name: '钻石', icon: '💎', category: 'day', desc: '单日学习满 16 小时', target: 16 },
  // 累计时长
  { id: 'total_10', name: '铜锭', icon: '🥉', category: 'total', desc: '累计学习满 10 小时', target: 10 },
  { id: 'total_50', name: '铁镐', icon: '⚒️', category: 'total', desc: '累计学习满 50 小时', target: 50 },
  { id: 'total_100', name: '金镐', icon: '🏆', category: 'total', desc: '累计学习满 100 小时', target: 100 },
  { id: 'total_300', name: '钻石镐', icon: '🔱', category: 'total', desc: '累计学习满 300 小时', target: 300 },
  { id: 'total_600', name: '下界合金剑', icon: '🗡️', category: 'total', desc: '累计学习满 600 小时', target: 600 },
  { id: 'total_1000', name: '鞘翅', icon: '🪽', category: 'total', desc: '累计学习满 1000 小时', target: 1000 },
  // 打卡天数
  { id: 'days_7', name: '小麦', icon: '🌾', category: 'days', desc: '累计打卡 7 天', target: 7 },
  { id: 'days_30', name: '熟牛扒', icon: '🥩', category: 'days', desc: '累计打卡 30 天', target: 30 },
  { id: 'days_100', name: '附魔书', icon: '📖', category: 'days', desc: '累计打卡 100 天', target: 100 },
  { id: 'days_200', name: '末影之眼', icon: '👁️', category: 'days', desc: '累计打卡 200 天', target: 200 },
  { id: 'days_365', name: '不死图腾', icon: '🧿', category: 'days', desc: '累计打卡 365 天', target: 365 },
  // 连续打卡
  { id: 'streak_3', name: '药水', icon: '🧪', category: 'streak', desc: '连续打卡 3 天', target: 3 },
  { id: 'streak_7', name: '金苹果', icon: '🍎', category: 'streak', desc: '连续打卡 7 天', target: 7 },
  { id: 'streak_14', name: '附魔金苹果', icon: '✨', category: 'streak', desc: '连续打卡 14 天', target: 14 },
  { id: 'streak_30', name: '下界之星', icon: '⭐', category: 'streak', desc: '连续打卡 30 天', target: 30 },
  { id: 'streak_60', name: '龙蛋', icon: '🥚', category: 'streak', desc: '连续打卡 60 天', target: 60 },
  // 单科深耕
  { id: 'math_50', name: '数学之书', icon: '🔢', category: 'subject', desc: '数学累计学习 50 小时', target: 50 },
  { id: 'english_50', name: '英语词典', icon: '🗣️', category: 'subject', desc: '英语累计学习 50 小时', target: 50 },
  { id: 'politics_50', name: '政治年鉴', icon: '🏛️', category: 'subject', desc: '政治累计学习 50 小时', target: 50 },
  { id: '408_100', name: '408 全家桶', icon: '💻', category: 'subject', desc: '408 四科累计学习 100 小时', target: 100 },
  // 计时器
  { id: 'timer_10', name: '沙漏', icon: '⏳', category: 'timer', desc: '用计时器学习累计 10 小时', target: 10 },
  { id: 'timer_50', name: '时钟', icon: '🕰️', category: 'timer', desc: '用计时器学习累计 50 小时', target: 50 },
  // 趣味彩蛋
  { id: 'first_log', name: '初见', icon: '🎉', category: 'fun', desc: '完成第一次打卡', target: 1 },
  { id: 'late_night', name: '夜猫子', icon: '🌙', category: 'fun', desc: '在 23:00 后开始过一次学习', target: 1 },
  { id: 'weekend', name: '周末战士', icon: '🏖️', category: 'fun', desc: '某周周六、周日都打了卡', target: 1 },
]

export interface StudyStats {
  totalHours: number
  checkedDays: number
  maxDayHours: number
  currentStreak: number
  longestStreak: number
  subjectHours: Record<string, number>
  timerHours: number
  lateNightCount: number
  weekendPairs: number
}

export interface AchievementState {
  def: AchievementDef
  unlocked: boolean
  current: number
  progress: number // 0-100
}

/**
 * 计算连续打卡天数：
 * current — 从今天（若今天未打卡则从昨天）往回数连续打卡天数
 * longest — 历史最长连续打卡
 */
export function computeStreak(checkedDates: string[]): { current: number; longest: number } {
  const set = new Set(checkedDates)

  let longest = 0
  const sorted = [...set].sort()
  let run = 0
  let prev: Date | null = null
  for (const d of sorted) {
    const date = parseISO(d)
    if (prev && differenceInCalendarDays(date, prev) === 1) {
      run += 1
    } else {
      run = 1
    }
    longest = Math.max(longest, run)
    prev = date
  }

  let current = 0
  let cursor = new Date()
  if (!set.has(format(cursor, 'yyyy-MM-dd'))) {
    cursor = addDays(cursor, -1)
  }
  while (set.has(format(cursor, 'yyyy-MM-dd'))) {
    current += 1
    cursor = addDays(cursor, -1)
  }

  return { current, longest }
}

/** 汇总学习记录为成就计算所需的统计量 */
export function computeStudyStats(logs: DailyLog[]): StudyStats {
  const dateHoursMap = new Map<string, number>()
  const checkedDates = new Set<string>()
  const subjectHours: Record<string, number> = {}
  let totalHours = 0
  let timerHours = 0
  let lateNightCount = 0

  for (const log of logs) {
    checkedDates.add(log.date)
    for (const subj of log.subjects) {
      totalHours += subj.hours
      dateHoursMap.set(log.date, (dateHoursMap.get(log.date) ?? 0) + subj.hours)
      subjectHours[subj.id] = (subjectHours[subj.id] ?? 0) + subj.hours
      if (subj.startTime) {
        timerHours += subj.hours
        // HH:mm 零填充，字符串比较即可判断是否 23 点后开始
        if (subj.startTime >= '23:00') lateNightCount += 1
      }
    }
  }

  // 周末双打卡：存在某周六打卡且次日（周日）也打卡（或以周日为起点看前一天）
  let weekendPairs = 0
  const sorted = [...checkedDates].sort()
  for (const d of sorted) {
    const date = parseISO(d)
    const day = date.getDay()
    const next = format(addDays(date, 1), 'yyyy-MM-dd')
    const prev = format(addDays(date, -1), 'yyyy-MM-dd')
    if ((day === 6 && checkedDates.has(next)) || (day === 0 && checkedDates.has(prev))) {
      weekendPairs += 1
    }
  }

  const { current: currentStreak, longest: longestStreak } = computeStreak([...checkedDates])

  return {
    totalHours,
    checkedDays: checkedDates.size,
    maxDayHours: Math.max(0, ...dateHoursMap.values()),
    currentStreak,
    longestStreak,
    subjectHours,
    timerHours,
    lateNightCount,
    weekendPairs,
  }
}

/** 各成就当前的进度值（根据 id 映射到对应统计量） */
function currentFor(def: AchievementDef, stats: StudyStats): number {
  const subjectOf = (subjectId: string) => stats.subjectHours[subjectId] ?? 0
  switch (def.id) {
    case 'day_3':
    case 'day_6':
    case 'day_10':
    case 'day_14':
    case 'day_16':
      return stats.maxDayHours
    case 'total_10':
    case 'total_50':
    case 'total_100':
    case 'total_300':
    case 'total_600':
    case 'total_1000':
      return stats.totalHours
    case 'days_7':
    case 'days_30':
    case 'days_100':
    case 'days_200':
    case 'days_365':
      return stats.checkedDays
    case 'streak_3':
    case 'streak_7':
    case 'streak_14':
    case 'streak_30':
    case 'streak_60':
      return stats.longestStreak
    case 'math_50':
      return subjectOf('math')
    case 'english_50':
      return subjectOf('english')
    case 'politics_50':
      return subjectOf('politics')
    case '408_100':
      // 408 四科合计
      return getSubjectById('ds')?.category === '408'
        ? ['ds', 'co', 'os', 'cn'].reduce((sum, id) => sum + subjectOf(id), 0)
        : 0
    case 'timer_10':
    case 'timer_50':
      return stats.timerHours
    case 'first_log':
      return stats.checkedDays
    case 'late_night':
      return stats.lateNightCount
    case 'weekend':
      return stats.weekendPairs
    default:
      return 0
  }
}

/** 计算所有成就的解锁状态与进度 */
export function computeAchievements(logs: DailyLog[]): AchievementState[] {
  const stats = computeStudyStats(logs)
  return ACHIEVEMENTS.map((def) => {
    const current = currentFor(def, stats)
    return {
      def,
      unlocked: current >= def.target,
      current,
      progress: Math.min(100, (current / def.target) * 100),
    }
  })
}
