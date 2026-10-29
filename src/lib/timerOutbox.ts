import { supabase } from './supabase'
import {
  fetchLogByDate,
  sortSubjectsByStartTime,
  todayStr,
  upsertLogSafely,
  type DailyLogPause,
  type DailyLogSubject,
} from './dailyLogs'
import type { AccumMap, TimerSession } from './timerAccum'

/**
 * 计时链路的「待入库队列」（未入库时长的唯一落盘处）。
 *
 * 背景：以前未入库的计时只存在「今日累计」一个对象里，并会被登出/换号、
 * token 刷新失败、多窗口交替写入整份覆盖等路径成批抹掉，用户看到的就是「时长没记上」。
 * 现在每结束一段计时都先落成一条独立的待入库条目（可容纳任意多段，互不覆盖），
 * 再尝试写云端；写成功的条目才从队列里出队。
 *
 * 队列条目是「今日累计」的数据来源（见 timerAccum.accumFromOutbox），
 * 因此队列里有什么，计时页的「今日累计」就显示什么，两者不会再各自为政。
 *
 * 入队时记录当时的登录用户 id：
 * - 已登录：联网/回前台/定时器会自动补传入该用户的当日记录
 * - 未登录：只作为本地待入库，登录后在计时页手动「保存到今日记录」时才归入当前用户（避免串号）
 */

/** 待入库队列存储键 */
const OUTBOX_KEY = 'kaoyan_timer_outbox'
/** 旧版单槽位待补记（仅迁移用，迁移后删除） */
const LEGACY_PENDING_KEY = 'kaoyan_pending_timer'
/** 旧版「今日累计」（仅迁移用，迁移后删除） */
const LEGACY_ACCUM_KEY = 'kaoyan_timer_accum'
const LEGACY_ACCUM_DATE_KEY = 'kaoyan_timer_accum_date'
/**
 * 队列软上限：只兜底 localStorage 无限膨胀，正常情况下队列会被补传清空。
 * 超出时丢弃最早的少量条目（同时告警），并且只在手动入队时裁剪，不在补传过程中裁剪。
 */
const MAX_ITEMS = 500

/** 一条待入库的计时会话 */
export interface OutboxItem {
  /** 队列内部唯一 id（去重靠 identityKey，不靠它） */
  id: string
  /** 入队时的登录用户 id（null = 当时未登录，不会被自动补传） */
  userId: string | null
  subjectId: string
  activity: string
  seconds: number
  /** 归属日期 yyyy-MM-dd（本段所在的自然日；跨零点的计时会拆成多段，各归各天） */
  date: string
  /** 时间段 HH:mm（旧数据可能为空 → 写入时不带时间段） */
  start: string
  end: string
  /** 本段计时内的暂停明细 */
  pauses?: DailyLogPause[]
  /**
   * 今天以前、但刚结束的计时段（跨零点拆出来的前一日段，或整段都在昨天/更早的会话）。
   * 这类条目是刚刚发生的计时，后台自动补传时会一并入账；
   * 更早遗留的历史条目则仍需用户在计时页确认后补交。
   */
  carry?: boolean
  /**
   * 是否由旧版本地数据迁移而来。
   * 旧数据没有用户归属信息，且是在本机产生的，因此允许自动补传时归入当前登录用户
   * （见 FlushOptions.adoptLegacy），避免升级后这批时长只能靠手动保存。
   */
  legacy?: boolean
  createdAt: number
}

/** 待入库的计时会话输入（TimerSession + 可选暂停明细） */
export interface TimerStashInput extends TimerSession {
  pauses?: DailyLogPause[]
}

export interface FlushResult {
  /** 本次出队（已入库或云端本就有）的段数 */
  flushed: number
  /** 补传后仍在队列里的段数 */
  remaining: number
  /** 本次写入失败的段数 */
  failed: number
}

/* ── 内部状态：内存缓存 + 变更订阅 ── */

let cache: OutboxItem[] | null = null
let writeDepth = 0
const listeners = new Set<(items: OutboxItem[]) => void>()
let storageBound = false

/** 生成一个条目 id（无需全局唯一语义，仅用于出队定位） */
function newId(): string {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${Date.now().toString(36)}-${rand}`
}

/** 归属日期 yyyy-MM-dd（本地时区） */
function dateOf(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 时间段 HH:mm（本地时区） */
function timeHm(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 会话身份：同一天、同科目、同学习内容、同时间段、同时长视为同一段（重复入队会被合并） */
function identityKey(item: OutboxItem): string {
  return [item.date, item.subjectId, item.activity, item.start, item.end, item.seconds].join('|')
}

/** 本地时区的次日 00:00 时间戳 */
function nextMidnight(ts: number): number {
  const d = new Date(ts)
  d.setHours(24, 0, 0, 0)
  return d.getTime()
}

/** HH:mm 是否落在 [start, end) 内（end < start 表示这一段跨过零点） */
function timeInRange(at: string, start: string, end: string): boolean {
  if (!at || !start || !end) return false
  return start <= end ? at >= start && at < end : at >= start || at < end
}

/** 拆分后的一天之内的计时片段 */
interface SessionSegment {
  date: string
  start: string
  end: string
  seconds: number
  pauses?: DailyLogPause[]
  carry?: boolean
}

/**
 * 把一段计时按自然日拆开：跨零点时零点前归前一天、零点后归当天，各记各的时长。
 * 同一天内结束的计时原样返回一段，不产生任何额外行为。
 * 每段秒数按「墙钟减去暂停」的比例分摊，最后一段吃掉取整误差，保证合计等于原始时长。
 */
function splitSessionByDay(session: TimerStashInput): SessionSegment[] {
  const { startAt, endAt, seconds } = session
  if (!(seconds >= 1) || !(endAt > startAt)) return []

  const startDate = dateOf(startAt)
  // endAt 恰好是零点时，整段仍属于前一天
  const endDate = dateOf(Math.max(startAt, endAt - 1))
  if (startDate === endDate) {
    return [
      {
        date: startDate,
        start: timeHm(startAt),
        end: timeHm(endAt),
        seconds,
        pauses: session.pauses,
        // 整段都在今天以前（如停在零点整、或补存昨天遗留的计时）：同样要自动入账
        ...(startDate !== todayStr() ? { carry: true } : {}),
      },
    ]
  }

  // 逐自然日切出墙钟区间
  const bounds: Array<{ start: number; end: number }> = []
  for (let cursor = startAt; cursor < endAt; ) {
    const boundary = Math.min(nextMidnight(cursor), endAt)
    bounds.push({ start: cursor, end: boundary })
    cursor = boundary
  }

  // 暂停明细归到它开始那天的片段；跨零点的暂停按区间重叠扣到各段
  const pausedBySeg = bounds.map(() => 0)
  const pausesBySeg: DailyLogPause[][] = bounds.map(() => [])
  for (const pause of session.pauses ?? []) {
    const [h, m] = (pause.at || '').split(':').map(Number)
    if ([h, m].some((n) => Number.isNaN(n))) continue
    let idx = bounds.findIndex((b) => timeInRange(pause.at, timeHm(b.start), timeHm(b.end)))
    if (idx < 0) idx = bounds.length - 1
    pausesBySeg[idx].push(pause)
    const from = new Date(bounds[idx].start)
    from.setHours(h, m, 0, 0)
    const fromTs = from.getTime()
    const toTs = fromTs + Math.max(0, pause.ms || 0)
    bounds.forEach((b, i) => {
      const overlap = Math.min(toTs, b.end) - Math.max(fromTs, b.start)
      if (overlap > 0) pausedBySeg[i] += overlap
    })
  }

  const activeMs = bounds.map((b, i) => Math.max(0, b.end - b.start - pausedBySeg[i]))
  const activeTotal = activeMs.reduce((a, b) => a + b, 0)
  const wallTotal = endAt - startAt
  const segments: SessionSegment[] = []
  let assigned = 0
  bounds.forEach((b, i) => {
    const share = activeTotal > 0 ? activeMs[i] / activeTotal : (b.end - b.start) / wallTotal
    const segSeconds = i === bounds.length - 1 ? seconds - assigned : Math.max(0, Math.round(seconds * share))
    assigned += segSeconds
    if (segSeconds < 1) return
    const date = dateOf(b.start)
    segments.push({
      date,
      start: timeHm(b.start),
      end: timeHm(b.end),
      seconds: segSeconds,
      ...(pausesBySeg[i].length > 0 ? { pauses: pausesBySeg[i] } : {}),
      ...(date !== todayStr() ? { carry: true } : {}),
    })
  })
  return segments
}

/** HH:mm 时间段 → 秒数（跨零点按 +24h 处理；同分钟按 0 处理，不制造 24 小时） */
function rangeSeconds(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0
  let minutes = eh * 60 + em - (sh * 60 + sm)
  if (minutes < 0) minutes += 24 * 60
  return minutes * 60
}

function makeItem(
  userId: string | null,
  data: {
    subjectId: string
    activity: string
    seconds: number
    date: string
    start: string
    end: string
    pauses?: DailyLogPause[]
    carry?: boolean
    legacy?: boolean
  },
): OutboxItem {
  return {
    id: newId(),
    userId,
    subjectId: data.subjectId,
    activity: data.activity,
    seconds: data.seconds,
    date: data.date,
    start: data.start,
    end: data.end,
    ...(data.pauses && data.pauses.length > 0 ? { pauses: data.pauses } : {}),
    ...(data.carry ? { carry: true } : {}),
    ...(data.legacy ? { legacy: true } : {}),
    createdAt: Date.now(),
  }
}

/** 解析存储里的队列：逐条校验字段，坏数据直接丢弃（避免一处脏数据卡住补传） */
function parseOutbox(raw: string | null): OutboxItem[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const items: OutboxItem[] = []
    for (const value of parsed) {
      const v = value as Partial<OutboxItem>
      if (
        typeof v?.subjectId !== 'string' ||
        typeof v.seconds !== 'number' ||
        !(v.seconds >= 1) ||
        typeof v.date !== 'string' ||
        !v.date
      ) {
        continue
      }
      items.push({
        id: typeof v.id === 'string' && v.id ? v.id : newId(),
        userId: typeof v.userId === 'string' && v.userId ? v.userId : null,
        subjectId: v.subjectId,
        activity: typeof v.activity === 'string' ? v.activity : '',
        seconds: v.seconds,
        date: v.date,
        start: typeof v.start === 'string' ? v.start : '',
        end: typeof v.end === 'string' ? v.end : '',
        ...(Array.isArray(v.pauses) ? { pauses: v.pauses } : {}),
        ...(v.carry === true ? { carry: true } : {}),
        ...(v.legacy === true ? { legacy: true } : {}),
        createdAt: typeof v.createdAt === 'number' ? v.createdAt : Date.now(),
      })
    }
    return items
  } catch {
    return []
  }
}

/**
 * 迁移旧版本地数据（单槽位待补记 + 「今日累计」）为新队列条目。
 * 只读不删：读取到的旧键一并返回，由调用方在新数据成功落盘之后再删除，
 * 这样即使新数据写盘失败，旧数据也不会先一步被抹掉。
 * 换算出的秒数偏小时把差额补到最后一段，保证旧数据一点不丢。
 */
function migrateLegacy(): { items: OutboxItem[]; keys: string[] } {
  const items: OutboxItem[] = []
  const keys: string[] = []
  try {
    const raw = localStorage.getItem(LEGACY_PENDING_KEY)
    if (raw) {
      keys.push(LEGACY_PENDING_KEY)
      const p = JSON.parse(raw) as Partial<{
        subjectId: string
        activity: string
        seconds: number
        start: string
        end: string
        date: string
        pauses: DailyLogPause[]
      }>
      if (typeof p.subjectId === 'string' && p.subjectId && typeof p.seconds === 'number' && p.seconds >= 1) {
        items.push(
          makeItem(null, {
            subjectId: p.subjectId,
            activity: typeof p.activity === 'string' ? p.activity : '',
            seconds: p.seconds,
            date: typeof p.date === 'string' && p.date ? p.date : todayStr(),
            start: typeof p.start === 'string' ? p.start : '',
            end: typeof p.end === 'string' ? p.end : '',
            pauses: Array.isArray(p.pauses) ? p.pauses : undefined,
            legacy: true,
          }),
        )
      }
    }
  } catch {
    /* 旧数据损坏时忽略 */
  }

  try {
    const raw = localStorage.getItem(LEGACY_ACCUM_KEY)
    if (raw) {
      keys.push(LEGACY_ACCUM_KEY, LEGACY_ACCUM_DATE_KEY)
      const date = localStorage.getItem(LEGACY_ACCUM_DATE_KEY) || todayStr()
      const map = JSON.parse(raw) as AccumMap
      for (const [key, entry] of Object.entries(map ?? {})) {
        const [subjectId, activity = ''] = key.split('::')
        if (!subjectId || !entry || typeof entry.seconds !== 'number' || entry.seconds < 1) continue
        const ranges = Array.isArray(entry.ranges) ? entry.ranges : []
        if (ranges.length === 0) {
          items.push(
            makeItem(null, { subjectId, activity, seconds: entry.seconds, date, start: '', end: '', legacy: true }),
          )
          continue
        }
        const computed = ranges.map((r) => rangeSeconds(r.start, r.end))
        const total = computed.reduce((a, b) => a + b, 0)
        if (total < entry.seconds && computed.length > 0) {
          computed[computed.length - 1] = computed[computed.length - 1] ?? 0
          computed[computed.length - 1] += entry.seconds - total
        }
        ranges.forEach((r, i) => {
          const seconds = computed[i] ?? 0
          if (seconds < 1) return
          items.push(
            makeItem(null, {
              subjectId,
              activity,
              seconds,
              date,
              start: r.start,
              end: r.end,
              pauses: r.pauses,
              legacy: true,
            }),
          )
        })
      }
    }
  } catch {
    /* 旧数据损坏时忽略 */
  }

  return { items, keys }
}

/** 读取队列（带内存缓存）：首次读盘时顺带迁移旧数据 */
export function loadOutbox(): OutboxItem[] {
  if (cache) return cache
  const items = parseOutbox(localStorage.getItem(OUTBOX_KEY))
  const legacy = migrateLegacy()
  if (legacy.items.length > 0) {
    const seen = new Set(items.map(identityKey))
    for (const item of legacy.items) {
      const key = identityKey(item)
      if (seen.has(key)) continue
      seen.add(key)
      items.push(item)
    }
    try {
      localStorage.setItem(OUTBOX_KEY, JSON.stringify(items))
      // 新数据已落盘，这时才删旧键
      for (const key of legacy.keys) localStorage.removeItem(key)
    } catch {
      // 写盘失败：旧键保留，下次启动再迁移一次（identityKey 去重保证不会重复入队）
      console.warn('[TimerOutbox] 待入库队列落盘失败，暂不改动旧数据')
    }
  }
  cache = items
  return items
}

function writeOutbox(list: OutboxItem[]): void {
  const next = list.length > MAX_ITEMS ? list.slice(list.length - MAX_ITEMS) : list
  if (list.length > MAX_ITEMS) {
    console.warn(`[TimerOutbox] 待入库队列超过 ${MAX_ITEMS} 条，已丢弃最早的 ${list.length - MAX_ITEMS} 条`)
  }
  cache = next
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(next))
  } catch {
    /* 写入失败（配额/隐私模式）：内存里仍保留，至少本次会话不丢 */
  }
  notify()
}

function notify(): void {
  if (writeDepth > 0) return
  const items = loadOutbox()
  for (const listener of listeners) listener(items)
}

/** 监听队列变化（同窗口写入立即回调；其他窗口/页面写入通过 storage 事件同步） */
export function subscribeOutbox(listener: (items: OutboxItem[]) => void): () => void {
  if (!storageBound && typeof window !== 'undefined') {
    storageBound = true
    window.addEventListener('storage', (e) => {
      if (e.key && e.key !== OUTBOX_KEY) return
      cache = null
      loadOutbox()
      notify()
    })
  }
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 用于批量写的临界区：期间不逐个回调，结束后统一通知一次 */
function withBatch<T>(fn: () => T): T {
  writeDepth++
  try {
    return fn()
  } finally {
    writeDepth--
    if (writeDepth === 0) notify()
  }
}

/** 入队一段计时：同身份（同日/科目/内容/时间段/时长）已存在时直接复用，避免重复入账 */
function enqueueOutboxItem(item: OutboxItem): OutboxItem {
  const list = loadOutbox()
  const key = identityKey(item)
  const existing = list.find((i) => identityKey(i) === key)
  if (existing) {
    autoFlushSoon()
    return existing
  }
  writeOutbox([...list, item])
  autoFlushSoon()
  return item
}

/**
 * 把一段会话落进待入库队列（计时链路唯一的「先落盘」入口）。
 * 跨零点时会按自然日拆成多段：23:00–01:00 拆成「昨天 23:00–00:00 1 小时」+
 * 「今天 00:00–01:00 1 小时」，两天各记各的，不会被整天压到前一天。
 */
export function stashTimerSession(userId: string | null, session: TimerStashInput): OutboxItem[] {
  return splitSessionByDay(session).map((seg) =>
    enqueueOutboxItem(
      makeItem(userId, {
        subjectId: session.subjectId,
        activity: session.activity ?? '',
        seconds: seg.seconds,
        date: seg.date,
        start: seg.start,
        end: seg.end,
        pauses: seg.pauses,
        carry: seg.carry,
      }),
    ),
  )
}

/** 按 id 出队 */
function removeOutboxItems(ids: string[]): void {
  if (ids.length === 0) return
  const remove = new Set(ids)
  withBatch(() => {
    writeOutbox(loadOutbox().filter((i) => !remove.has(i.id)))
  })
}

/** 清空待入库条目：oldUserId 为 null 时只清「未登录」的条目 */
export function clearOutboxEntries(userId: string | null): void {
  withBatch(() => {
    writeOutbox(loadOutbox().filter((i) => (userId === null ? i.userId !== null : i.userId !== userId)))
  })
}

/** 该条目是否已存在于云端该日记录里（含别的设备写过的同一段），用于补传前防重复入账 */
function isItemInLog(subjects: DailyLogSubject[], item: OutboxItem): boolean {
  return subjects.some((s) => {
    if (s.id !== item.subjectId) return false
    if ((s.activity ?? '') !== (item.activity ?? '')) return false
    if (!item.start || !item.end) return !s.startTime
    return (s.startTime ?? '') === item.start && (s.endTime ?? '') === item.end
  })
}

/** 队列条目 → 入库条目（小时数由秒数换算，避免 HH:mm 差值在跨零点/同分钟时算错） */
function buildEntryFromItem(item: OutboxItem): DailyLogSubject {
  const hours = Math.round((item.seconds / 3600) * 100) / 100
  return {
    id: item.subjectId,
    hours: Math.max(hours, 0),
    ...(item.activity ? { activity: item.activity } : {}),
    ...(item.start && item.end ? { startTime: item.start, endTime: item.end } : {}),
    ...(item.pauses && item.pauses.length > 0 ? { pauses: item.pauses } : {}),
  }
}

let flushing = false

export interface FlushOptions {
  /**
   * 只补传「今天」以及「跨零点拆出来的今天以前段」（后台自动补传、刚结束会话时用）。
   * 更早遗留的历史条目仍交给用户在计时页确认后补交。
   */
  onlyRecent?: boolean
  /** 把「未登录时暂存」的条目也归入当前用户（仅手动「保存到今日记录」时开启） */
  adoptOrphans?: boolean
  /**
   * 把「旧版本地数据迁移而来」的条目归入当前用户（后台自动补传时开启）。
   * 这类条目是本机旧数据、无归属信息，而本机当前登录的用户通常就是它的产生者，
   * 因此允许直接补传，避免升级后这批时长只能靠用户手动点保存。
   */
  adoptLegacy?: boolean
}

/**
 * 补传待入库条目：按归属日期分组，先查云端当天记录，
 * 云端已有的条目直接出队（别的设备/上次写入成功），其余合并写入后出队。
 * 单个日期写入失败只影响该组，其余组照常补传，失败的条目留在队列里等下次重试。
 */
export async function flushTimerOutbox(user: { id: string }, opts: FlushOptions = {}): Promise<FlushResult> {
  const all = loadOutbox()
  const targets = all.filter(
    (item) =>
      (item.userId === user.id ||
        (opts.adoptOrphans === true && item.userId === null) ||
        (opts.adoptLegacy === true && item.userId === null && item.legacy === true)) &&
      (opts.onlyRecent !== true || item.date === todayStr() || item.carry === true),
  )
  if (targets.length === 0 || flushing) {
    return { flushed: 0, remaining: all.length, failed: 0 }
  }
  flushing = true
  let flushed = 0
  let failed = 0
  try {
    const byDate = new Map<string, OutboxItem[]>()
    for (const item of targets) {
      const group = byDate.get(item.date)
      if (group) group.push(item)
      else byDate.set(item.date, [item])
    }
    for (const [date, group] of byDate) {
      try {
        const log = await fetchLogByDate(user.id, date)
        const existing = log?.subjects ?? []
        const done: OutboxItem[] = []
        const toWrite: OutboxItem[] = []
        for (const item of group) {
          if (isItemInLog(existing, item)) done.push(item)
          else toWrite.push(item)
        }
        if (toWrite.length > 0) {
          const entries = toWrite.map(buildEntryFromItem)
          sortSubjectsByStartTime(entries)
          await upsertLogSafely({ userId: user.id, date, subjects: entries, summary: '' })
          done.push(...toWrite)
        }
        if (done.length > 0) {
          removeOutboxItems(done.map((i) => i.id))
          flushed += done.length
        }
      } catch {
        failed += group.length
      }
    }
  } finally {
    flushing = false
  }
  const remaining = loadOutbox().length
  if (flushed > 0) {
    // 通知记录/进度等页面刷新（后台静默补传后，界面上的今日时长要跟上）
    try {
      window.dispatchEvent(new Event('kaoyan-timer-flushed'))
    } catch {
      /* 非浏览器环境忽略 */
    }
  }
  return { flushed, remaining, failed }
}

/* ── 后台自动补传 ── */

let autoTimer: ReturnType<typeof setTimeout> | null = null
let autoInstalled = false

/** 触发一次自动补传：未登录/队列为空时什么都不做 */
export async function runAutoFlush(): Promise<void> {
  if (loadOutbox().length === 0) return
  try {
    const { data } = await supabase.auth.getSession()
    const uid = data.session?.user?.id
    if (!uid) return
    await flushTimerOutbox({ id: uid }, { onlyRecent: true, adoptLegacy: true })
  } catch {
    /* 静默失败：下次联网/回前台/定时器再试 */
  }
}

/** 入队后稍等片刻再补传：合并连续入队，避免每次停止计时都打一次请求 */
function autoFlushSoon(): void {
  if (autoTimer !== null) return
  autoTimer = setTimeout(() => {
    autoTimer = null
    void runAutoFlush()
  }, 1200)
}

/**
 * 安装自动补传：联网、窗口重新聚焦、页面回到前台、以及每 60 秒各试一次。
 * 幂等，可在应用入口直接调用（挂件窗口与完整应用各装一次，互不影响）。
 */
export function startTimerOutboxAutoFlush(): void {
  if (autoInstalled || typeof window === 'undefined') return
  autoInstalled = true
  window.addEventListener('online', () => void runAutoFlush())
  window.addEventListener('focus', () => void runAutoFlush())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void runAutoFlush()
  })
  window.setInterval(() => void runAutoFlush(), 60000)
}
