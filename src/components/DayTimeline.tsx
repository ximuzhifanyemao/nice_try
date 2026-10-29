import { useEffect, useMemo, useState } from 'react'
import type { DailyLogSubject } from '../lib/dailyLogs'
import { formatActivityLabel } from '../lib/subjects'
import { getRecordsChartStyle, subscribeRecordsChartStyle, type RecordsChartStyle } from '../lib/recordsChart'

/**
 * 当日每小时学习时长：纵轴「分钟」、横轴固定 0–24 点（固定 24 格，一格一小时）。
 *
 * 参照手机「屏幕使用时间 / 健康使用」的小时分布图：细柱 + 60/30 分钟网格线 +
 * 稀疏整点刻度，一眼看出「哪个时间段在学、哪个时间段断了」。
 * 用真实起止时间按时钟折算（跨整点的时段按分钟占比分摊到各整点），
 * 并扣除记录里的暂停区间——暂停的时间不算学习，否则「7:00 开始、7:40 暂停、
 * 8:00 结束」会把 7 点这一格画成满 60 分钟。
 *
 * 横轴固定 24 格而不是按当天时段自适应：每天的图可以上下直接对比——同样 10 点的
 * 数据永远落在同一个横向位置；代价是学得少时柱子细一些。
 *
 * 图形在「柱状 / 折线」之间可切换：偏好存 lib/recordsChart，由「记录」页左栏的
 * 图表类型开关设置，本组件只负责读（同页改动即时重绘）。
 * 折线把 0 分钟的点落在基线上，所以「哪几个小时是断的」照样看得出来。
 *
 * 只画有起止时间的时段：手工补录的记录没有时间段，此时不渲染。
 * 纵轴满格固定 60 分钟 —— 一个整点最多只有 60 分钟，与健康类 App 的口径一致。
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

const DAY_MINUTES = 24 * 60
/** 横轴固定格数：24 格 = 每小时一格 */
const SLOT_COUNT = 24
/** 整点刻度与分隔线间距（每 3 小时一根：00/03/…/21） */
const AXIS_STEP = 3
/** 纵轴满格：60 分钟 */
const Y_MAX_MIN = 60

/** 绘图区与横轴标签高度（px） */
const PLOT_H = 100
const AXIS_H = 18
/** 折线上下各留 1px：0 分钟的点落在基线上时不会被绘图区边界切掉一半 */
const LINE_INSET = 1

interface Block {
  start: number
  /** 距 00:00 的分钟数；跨零点的时段截到 24:00 */
  end: number
  label: string
  /** 暂停区间（距 00:00 的分钟数）：暂停不算学习时长，画图时要扣掉 */
  pauseSpans: { from: number; to: number }[]
}

/** 一段时间内实际学习的分钟数：与 [from,to) 的重叠扣除落在其中的暂停区间 */
function studiedMinutes(block: Block, from: number, to: number): number {
  let minutes = Math.max(0, Math.min(block.end, to) - Math.max(block.start, from))
  for (const p of block.pauseSpans) {
    minutes -= Math.max(0, Math.min(p.to, to) - Math.max(p.from, from))
  }
  return Math.max(0, minutes)
}

/** 四个时段：用来给「哪个时间段状态更好」一个可对比的数字 */
const BANDS = [
  { label: '凌晨', from: 0, to: 6 * 60 },
  { label: '上午', from: 6 * 60, to: 12 * 60 },
  { label: '下午', from: 12 * 60, to: 18 * 60 },
  { label: '晚上', from: 18 * 60, to: DAY_MINUTES },
]

export default function DayTimeline({ subjects }: { subjects: DailyLogSubject[] }) {
  /** 有时段的条目 → 归一化的时间块 */
  const blocks = useMemo(() => {
    const out: Block[] = []
    for (const s of subjects ?? []) {
      if (!(s.hours > 0)) continue
      const start = parseMinutes(s.startTime)
      const end = parseMinutes(s.endTime)
      if (start === null || end === null) continue
      // 结束早于开始视为跨零点，画到轴末尾（时长仍以记录里的 hours 为准）
      const endMin = end > start ? end : DAY_MINUTES
      // 暂停明细只有起点和时长，换算成区间后从中扣除
      const pauseSpans = (s.pauses ?? [])
        .map((p) => {
          const at = parseMinutes(p.at)
          if (at === null || !(p.ms > 0)) return null
          return { from: at, to: Math.min(DAY_MINUTES, at + p.ms / 60000) }
        })
        .filter((p): p is { from: number; to: number } => p !== null)
      out.push({
        start,
        end: endMin,
        label: s.activity ? `${formatActivityLabel(s.activity)}` : '学习',
        pauseSpans,
      })
    }
    return out.sort((a, b) => a.start - b.start)
  }, [subjects])

  /** 图表类型偏好（柱状 / 折线）：由「记录」页左栏设置，改动即时同步到已挂载的卡片 */
  const [chartStyle, setChartStyle] = useState<RecordsChartStyle>(() => getRecordsChartStyle())
  useEffect(() => subscribeRecordsChartStyle(setChartStyle), [])

  /** 固定 24 个整点的学习分钟数：跨整点的时段按重叠分钟数分摊（扣除暂停），单格封顶 60 */
  const slots = useMemo(
    () =>
      Array.from({ length: SLOT_COUNT }, (_, hour) => {
        const from = hour * 60
        const to = from + 60
        let minutes = 0
        const parts: string[] = []
        for (const b of blocks) {
          const learned = Math.round(studiedMinutes(b, from, to))
          if (learned <= 0) continue
          minutes += learned
          parts.push(`${b.label} ${learned} 分钟`)
        }
        return { hour, minutes: Math.min(Y_MAX_MIN, minutes), parts }
      }),
    [blocks],
  )

  /** 各时段合计（凌晨 / 上午 / 下午 / 晚上），用于一眼对比哪个时间段效率高 */
  const bands = useMemo(() => {
    return BANDS.map((band) => {
      let minutes = 0
      for (const b of blocks) {
        minutes += studiedMinutes(b, band.from, band.to)
      }
      return { label: band.label, hours: minutes / 60 }
    }).filter((b) => b.hours > 0)
  }, [blocks])

  if (blocks.length === 0) return null

  const peak = slots.reduce((best, s) => (s.minutes > best.minutes ? s : best), slots[0])
  const bestBand = bands.reduce((best, b) => (b.hours > best.hours ? b : best), bands[0])

  /** 折线各点坐标：x 用百分比（0–100，对应 24 格中心），y 用像素（与绘图区同单位） */
  const linePoints = slots
    .map((s, i) => {
      const x = ((i + 0.5) / SLOT_COUNT) * 100
      const y = PLOT_H - LINE_INSET - (s.minutes / Y_MAX_MIN) * (PLOT_H - LINE_INSET * 2)
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  /** 折线点的纵向位置（距绘图区底部的像素）：与 SVG 里的 y 同一套算法 */
  const dotBottom = (minutes: number) => LINE_INSET + (minutes / Y_MAX_MIN) * (PLOT_H - LINE_INSET * 2)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <p className="text-xs font-medium text-gray-500 dark:text-slate-400">每小时学习时长</p>
        <p className="text-[11px] text-gray-400 dark:text-slate-500">
          峰值 {String(peak.hour).padStart(2, '0')}:00 · {peak.minutes} 分钟
        </p>
      </div>

      <div className="mt-3 flex gap-2">
        {/* 绘图区 */}
        <div className="relative min-w-0 flex-1" style={{ height: PLOT_H + AXIS_H }}>
          {/* 分钟网格线（实线，与手机健康使用一致） */}
          {[Y_MAX_MIN, 30].map((m) => (
            <div
              key={m}
              aria-hidden="true"
              className="absolute inset-x-0 border-t border-gray-200/90 dark:border-slate-700/60"
              style={{ bottom: AXIS_H + (m / Y_MAX_MIN) * PLOT_H }}
            />
          ))}
          {/* 整点分隔虚线（与下方刻度标签同一位置） */}
          {slots.map((s, i) =>
            i > 0 && i % AXIS_STEP === 0 ? (
              <div
                key={`sep-${s.hour}`}
                aria-hidden="true"
                className="absolute border-l border-dashed border-gray-200/70 dark:border-slate-700/50"
                style={{ left: `${(i / SLOT_COUNT) * 100}%`, bottom: AXIS_H, height: PLOT_H }}
              />
            ) : null,
          )}
          {/* 折线：24 个整点各一个点，连成一条线。
              viewBox 横向 0–100、纵向与绘图区同像素；preserveAspectRatio=none 只横向拉伸，
              配合 non-scaling-stroke 保证线宽不被压扁。
              （SVG 是替换元素，绝对定位下 width:auto 会用 100px 的内在宽度，
              所以必须显式 w-full 才能铺满绘图区。） */}
          {chartStyle === 'line' && (
            <svg
              aria-hidden="true"
              className="absolute inset-x-0 w-full text-indigo-500 dark:text-indigo-400"
              style={{ bottom: AXIS_H, height: PLOT_H }}
              viewBox={`0 0 100 ${PLOT_H}`}
              preserveAspectRatio="none"
            >
              <polyline
                points={linePoints}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}
          {/* 柱状：每小时一根细柱；折线：每小时一个数据点（0 分钟的点不画） */}
          <div className="absolute inset-x-0 flex items-end" style={{ bottom: AXIS_H, height: PLOT_H }}>
            {slots.map((s) => (
              <div
                key={s.hour}
                className="relative flex h-full flex-1 items-end justify-center"
                title={
                  s.minutes > 0
                    ? `${String(s.hour).padStart(2, '0')}:00–${String((s.hour + 1) % 24).padStart(2, '0')}:00 · ${s.minutes} 分钟\n${s.parts.join('，')}`
                    : `${String(s.hour).padStart(2, '0')}:00–${String((s.hour + 1) % 24).padStart(2, '0')}:00 · 无记录`
                }
              >
                {chartStyle === 'bar' ? (
                  <span
                    className="w-[34%] max-w-[13px] rounded-full bg-indigo-500 transition-[height] duration-500 ease-out dark:bg-indigo-400"
                    style={{ height: `${(s.minutes / Y_MAX_MIN) * 100}%`, minHeight: s.minutes > 0 ? 3 : 0 }}
                  />
                ) : (
                  s.minutes > 0 && (
                    <span
                      className="absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500 ring-2 ring-white dark:bg-indigo-400 dark:ring-slate-900"
                      style={{ bottom: dotBottom(s.minutes) }}
                    />
                  )
                )}
              </div>
            ))}
          </div>
          {/* 横轴整点标签（稀疏显示） */}
          <div className="absolute inset-x-0 flex items-end" style={{ bottom: 0, height: AXIS_H }}>
            {slots.map((s, i) => (
              <div key={s.hour} className="flex-1 text-center">
                {i % AXIS_STEP === 0 && (
                  <span className="text-[10px] leading-none tabular-nums text-gray-400 dark:text-slate-500">
                    {String(s.hour).padStart(2, '0')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* 纵轴刻度（分钟） */}
        <div className="relative w-12 shrink-0" style={{ height: PLOT_H + AXIS_H }}>
          {[Y_MAX_MIN, 30].map((m) => (
            <span
              key={m}
              className="absolute right-0 -translate-y-1/2 whitespace-nowrap text-[10px] leading-none tabular-nums text-gray-400 dark:text-slate-500"
              style={{ bottom: AXIS_H + (m / Y_MAX_MIN) * PLOT_H }}
            >
              {m} 分钟
            </span>
          ))}
        </div>
      </div>

      {/* 时段合计：哪个时间段状态更好，直接给数字 */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[11px]">
        {bands.map((b) => (
          <span key={b.label} className="inline-flex items-baseline gap-1">
            <span
              className={
                b === bestBand
                  ? 'font-semibold text-indigo-600 dark:text-indigo-300'
                  : 'text-gray-500 dark:text-slate-400'
              }
            >
              {b.label}
            </span>
            <span className="font-semibold tabular-nums text-gray-700 dark:text-slate-200">
              {b.hours.toFixed(1)}h
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
