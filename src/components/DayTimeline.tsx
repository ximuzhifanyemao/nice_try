import { useMemo } from 'react'
import type { DailyLogSubject } from '../lib/dailyLogs'
import { getSubjectById } from '../lib/subjects'
import { getBarColor } from '../lib/colors'
import { pad } from '../lib/format'

/**
 * 当日节奏时间轴：把一天的学习时段按真实起止时间画在同一条 24 小时轴上，
 * 下方再给出「凌晨 / 上午 / 下午 / 晚上」四个时段的学习时长对比。
 *
 * 目的：记录页原来只有一串科目胶囊，看不出「哪段时间在学、哪段时间在断」；
 * 时间轴把一天的形状直接摊开，配上四段时长，一眼就能对比出自己哪个时段效率最高。
 *
 * 只用计时器写入的 startTime/endTime（手工补录的记录没有时间段，此时不渲染）。
 */

/** HH:mm → 距 00:00 的分钟数；解析失败返回 null */
function parseMinutes(t?: string): number | null {
  if (!t) return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(t)
  if (!m) return null
  const hour = Number(m[1])
  const minute = Number(m[2])
  if (hour > 23 || minute > 59) return null
  return hour * 60 + minute
}

/** 分钟数 → HH:mm 标签（24:00 表示轴末尾） */
function fmtMinutes(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
}

const DAY_MINUTES = 24 * 60
/** 时间重叠的方块最多叠 3 道，避免个别极端记录把卡片撑高 */
const LANE_MAX = 3
/** 轴最少画 6 小时，只有一段学习时段时也不至于挤成一条 */
const MIN_SPAN = 6 * 60

/** 方块高度与道间距（px） */
const BAR_H = 26
const BAR_PITCH = 30
const PAD = 8

interface Block {
  key: string
  label: string
  category?: string
  start: number
  /** 距 00:00 的分钟数；跨零点的时段截到 24:00 */
  end: number
  lane: number
  hours: number
}

/** 四个时段：用来做「哪个时间段状态更好」的对比 */
const BANDS = [
  { label: '凌晨', from: 0, to: 6 * 60 },
  { label: '上午', from: 6 * 60, to: 12 * 60 },
  { label: '下午', from: 12 * 60, to: 18 * 60 },
  { label: '晚上', from: 18 * 60, to: DAY_MINUTES },
]

export default function DayTimeline({ subjects }: { subjects: DailyLogSubject[] }) {
  /* 有起止时间的时段 → 方块；无时间段的条目不参与画图 */
  const blocks = useMemo(() => {
    const out: Block[] = []
    for (const s of subjects ?? []) {
      if (!(s.hours > 0)) continue
      const start = parseMinutes(s.startTime)
      const end = parseMinutes(s.endTime)
      if (start === null || end === null) continue
      const subject = getSubjectById(s.id)
      out.push({
        key: `${s.id}-${s.activity ?? ''}-${start}`,
        label: `${subject ? subject.name : '已删除科目'}${s.activity ? `·${s.activity}` : ''}`,
        category: subject?.category,
        start,
        // 结束早于开始视为跨零点，画到轴末尾（时长仍以记录里的 hours 为准）
        end: end > start ? end : DAY_MINUTES,
        lane: 0,
        hours: s.hours,
      })
    }
    out.sort((a, b) => a.start - b.start)
    // 贪心分道：时间重叠的方块依次叠到下一道
    const laneEnds: number[] = []
    for (const blk of out) {
      let lane = laneEnds.findIndex((e) => e <= blk.start)
      if (lane === -1) lane = laneEnds.length
      laneEnds[lane] = blk.end
      blk.lane = Math.min(lane, LANE_MAX - 1)
    }
    return out
  }, [subjects])

  /* 轴范围（按当天实际时段自适应，两端各留 1 小时余量）与刻度 */
  const axis = useMemo(() => {
    if (blocks.length === 0) return null
    const minStart = Math.min(...blocks.map((b) => b.start))
    const maxEnd = Math.max(...blocks.map((b) => b.end))
    let from = Math.max(0, Math.floor(minStart / 60) - 1) * 60
    let to = Math.min(DAY_MINUTES, Math.ceil(maxEnd / 60) + 1) * 60
    if (to - from < MIN_SPAN) {
      to = Math.min(DAY_MINUTES, from + MIN_SPAN)
      from = Math.max(0, to - MIN_SPAN)
    }
    const span = to - from
    const stepHour = span <= 8 * 60 ? 2 : span <= 14 * 60 ? 3 : 4
    const ticks: number[] = []
    for (let h = Math.ceil(from / 60 / stepHour) * stepHour; h * 60 < to; h += stepHour) ticks.push(h)
    return { from, to, span, ticks }
  }, [blocks])

  /* 各时段时长：跨时段的方块按时钟占比折算，合计仍等于当天总时长 */
  const bands = useMemo(() => {
    return BANDS.map((band) => {
      let hours = 0
      for (const blk of blocks) {
        const wall = blk.end - blk.start
        if (wall <= 0) continue
        const overlap = Math.max(0, Math.min(blk.end, band.to) - Math.max(blk.start, band.from))
        if (overlap > 0) hours += blk.hours * (overlap / wall)
      }
      return { ...band, hours }
    })
  }, [blocks])

  if (!axis || blocks.length === 0) return null

  const laneCount = Math.min(LANE_MAX, Math.max(...blocks.map((b) => b.lane)) + 1)
  const stripHeight = laneCount * BAR_PITCH - (BAR_PITCH - BAR_H) + PAD * 2
  const maxBand = Math.max(...bands.map((b) => b.hours))
  const bestBand = maxBand > 0 ? bands.find((b) => b.hours === maxBand) : undefined
  const pct = (min: number) => ((min - axis.from) / axis.span) * 100

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-xs font-medium text-gray-500 dark:text-slate-400">当日节奏</p>
        <p className="text-[11px] text-gray-400 dark:text-slate-500">
          {bestBand ? `状态最佳：${bestBand.label} ${bestBand.hours.toFixed(1)}h` : '按真实时间段绘制'}
        </p>
      </div>

      {/* 时间轴：刻度网格 + 各时段方块 */}
      <div>
        <div className="rounded-xl bg-gray-50/80 dark:bg-slate-800/40">
          <div className="relative" style={{ height: stripHeight }}>
            {axis.ticks.map((h) => (
              <span
                key={h}
                aria-hidden="true"
                className="absolute inset-y-2 w-px bg-gray-200/80 dark:bg-slate-700/70"
                style={{ left: `${pct(h * 60)}%` }}
              />
            ))}
            {blocks.map((blk) => {
              const width = pct(blk.end) - pct(blk.start)
              return (
                <div
                  key={blk.key}
                  title={`${blk.label} ${fmtMinutes(blk.start)}-${fmtMinutes(blk.end)} · ${blk.hours.toFixed(2)}h`}
                  className={`absolute flex items-center overflow-hidden rounded-md px-1 text-[11px] font-medium text-white shadow-sm ${getBarColor(blk.category)}`}
                  style={{
                    left: `calc(${pct(blk.start)}% + 1px)`,
                    width: `calc(${width}% - 2px)`,
                    minWidth: 3,
                    top: PAD + blk.lane * BAR_PITCH,
                    height: BAR_H,
                  }}
                >
                  {/* 窄条不塞文字（手机端一律不塞，科目名由上方胶囊给出），悬浮提示里始终有完整信息 */}
                  {width >= 12 && <span className="hidden truncate sm:block">{blk.label}</span>}
                </div>
              )
            })}
          </div>
        </div>
        {/* 整点刻度标签（放在色块区之外，避免和方块挤在一起） */}
        <div className="relative mt-1 h-3">
          {axis.ticks.map((h) => (
            <span
              key={h}
              className="absolute -translate-x-1/2 text-[10px] leading-none tabular-nums text-gray-400 dark:text-slate-500"
              style={{ left: `${pct(h * 60)}%` }}
            >
              {String(h).padStart(2, '0')}
            </span>
          ))}
        </div>
      </div>

      {/* 四时段时长对比 */}
      <div className="grid grid-cols-4 gap-x-3 gap-y-1">
        {bands.map((b) => (
          <div key={b.label} className="min-w-0">
            <div className="flex items-baseline justify-between gap-1">
              <span
                className={`text-[11px] ${
                  b === bestBand
                    ? 'font-semibold text-indigo-600 dark:text-indigo-300'
                    : 'text-gray-500 dark:text-slate-400'
                }`}
              >
                {b.label}
              </span>
              <span
                className={`text-[11px] font-semibold tabular-nums ${
                  b.hours > 0 ? 'text-gray-700 dark:text-slate-200' : 'text-gray-300 dark:text-slate-600'
                }`}
              >
                {b.hours.toFixed(1)}h
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700/60">
              <span
                className="block h-full rounded-full bg-indigo-500 transition-[width] duration-500 dark:bg-indigo-400"
                style={{ width: `${maxBand > 0 ? (b.hours / maxBand) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
