import { useProgressStyle } from '../hooks/useProgressStyle'
import type { ProgressStyle } from '../lib/progressStyle'

interface TimerScaleProps {
  /** 今日已打卡小时数：满 1 小时的点亮一段，最后一段按比例部分填充 */
  hours: number
  /** 今日目标线的位置（0-100，相对尺子宽度）；null / undefined 表示不显示 */
  linePct?: number | null
  /** sm：简洁模式胶囊条（11px 段）；md：全功能计时页 Hero（15px 段） */
  size?: 'sm' | 'md'
  /** 样式覆盖：设置页预览用；不传则跟随用户的全局偏好 */
  variant?: ProgressStyle
  className?: string
  /** 悬浮说明（两个界面的文案各自组织） */
  title?: string
}

/** 进度尺容量：10 格 = 10 小时 */
const MARKS = 10

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/**
 * 今日学习进度尺：10 格 = 10 小时，琥珀目标线标出「今天该学到的位置」。
 *
 * 全功能计时页与简洁模式胶囊条共用同一份实现 —— 它是两个计时界面最重要的视觉呼应点。
 * 样式由设置页的「进度条样式」偏好决定（lib/progressStyle），默认刻度尺与历史逐像素一致：
 * - ruler ：10 段高低交替（旧样式，默认）
 * - blocks：等宽等高，正在计时的那一格呼吸
 * - track ：连续轨道，超出目标的部分转绿
 * - dual  ：上轨今日已学 / 下轨周目标日均
 * - dots  ：每小时一个打卡点，进行中为空心
 *
 * sm 尺寸的总高度不超过 10px（目标线高度），以免影响简洁模式按内容测量窗口高度。
 */
export default function TimerScale({
  hours,
  linePct = null,
  size = 'sm',
  variant,
  className = '',
  title,
}: TimerScaleProps) {
  const preferred = useProgressStyle()
  const style = variant ?? preferred
  const compact = size === 'sm'
  const segment = compact ? 'w-[11px]' : 'w-[15px]'
  const segmentTall = compact ? 'h-[5px]' : 'h-[7px]'
  const segmentLow = compact ? 'h-[3px]' : 'h-[5px]'

  const fillPct = clamp01(hours / MARKS) * 100
  const goalPct = linePct === null ? null : Math.max(0, Math.min(100, linePct))
  /** 超出目标线的部分（仅轨道样式用：目标内靛蓝、超出祖母绿） */
  const overPct = goalPct !== null && fillPct > goalPct ? fillPct - goalPct : 0

  const trackBg = 'bg-slate-300/70 dark:bg-slate-600/60'
  const fillBg = 'bg-indigo-500 dark:bg-indigo-400'

  const ariaLabel = `今日已打卡 ${hours.toFixed(1)} 小时，共 ${MARKS} 小时刻度`

  /** 琥珀目标线：三种样式共用（双轨样式自带目标轨，不再画线） */
  const notch = goalPct !== null && (
    <div
      className={`pointer-events-none absolute top-1/2 -translate-y-1/2 transition-[left] duration-500 ease-out ${
        compact ? 'h-[10px]' : 'h-[16px]'
      }`}
      style={{ left: `${goalPct}%` }}
      aria-hidden="true"
    >
      <div className="h-full w-[2px] -translate-x-1/2 rounded-full bg-amber-500 shadow-[0_0_0_2px_var(--color-surface)] dark:bg-amber-400" />
    </div>
  )

  /* ── 轨道 + 目标：一条连续轨道，超出目标的部分转绿 ── */
  if (style === 'track') {
    return (
      <div className={`relative flex items-center ${className}`} role="img" aria-label={ariaLabel} title={title}>
        <div
          className={`relative overflow-hidden rounded-full ${trackBg} ${compact ? 'h-[5px] w-[170px]' : 'h-[8px] w-[300px]'}`}
        >
          <span
            className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out ${fillBg}`}
            style={{ width: `${fillPct}%` }}
          />
          {overPct > 0 && goalPct !== null && (
            <span
              className="absolute inset-y-0 rounded-full bg-emerald-500 transition-[left,width] duration-500 ease-out dark:bg-emerald-400"
              style={{ left: `${goalPct}%`, width: `${overPct}%` }}
            />
          )}
        </div>
        {notch}
      </div>
    )
  }

  /* ── 双轨对比：上轨今日已学，下轨周目标日均 ── */
  if (style === 'dual') {
    const trackSize = compact ? 'h-[2px] w-[170px]' : 'h-[3px] w-[300px]'
    return (
      <div
        className={`flex flex-col justify-center ${compact ? 'gap-[3px]' : 'gap-[4px]'} ${className}`}
        role="img"
        aria-label={ariaLabel}
        title={title}
      >
        <div className={`relative overflow-hidden rounded-full ${trackBg} ${trackSize}`}>
          <span
            className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out ${fillBg}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
        {goalPct !== null && (
          <div className={`relative overflow-hidden rounded-full ${trackBg} ${trackSize}`}>
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-amber-500 transition-[width] duration-500 ease-out dark:bg-amber-400"
              style={{ width: `${goalPct}%` }}
            />
          </div>
        )}
      </div>
    )
  }

  /* ── 打卡点阵：每小时一个点，进行中为空心 ── */
  if (style === 'dots') {
    const dotSize = compact ? 'h-[6px] w-[6px]' : 'h-[9px] w-[9px]'
    return (
      <div
        className={`relative flex items-center ${compact ? 'gap-[6px]' : 'gap-[8px]'} ${className}`}
        role="img"
        aria-label={ariaLabel}
        title={title}
      >
        {Array.from({ length: MARKS }, (_, i) => {
          const f = clamp01(hours - i)
          const full = f >= 1
          const current = !full && f > 0
          return (
            <span
              key={i}
              className={`shrink-0 rounded-full transition-colors duration-300 ${dotSize} ${
                full
                  ? fillBg
                  : current
                    ? 'border-2 border-indigo-500 bg-transparent dark:border-indigo-400'
                    : trackBg
              }`}
            />
          )
        })}
        {notch}
      </div>
    )
  }

  /* ── 刻度尺（默认）与等高胶囊：10 段逐格填充 ── */
  const equalHeight = style === 'blocks'
  return (
    <div
      className={`relative flex items-center ${compact ? 'gap-[3px]' : 'gap-[4px]'} ${className}`}
      role="img"
      aria-label={ariaLabel}
      title={title}
    >
      {Array.from({ length: MARKS }, (_, i) => {
        const f = clamp01(hours - i)
        const full = f >= 1
        return (
          <span
            key={i}
            className={`relative overflow-hidden rounded-full transition-colors duration-300 ${segment} ${
              equalHeight || i % 2 === 0 ? segmentTall : segmentLow
            } ${full ? fillBg : trackBg}`}
          >
            {!full && f > 0 && (
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-indigo-500/85 transition-[width] duration-500 ease-out dark:bg-indigo-400/85"
                style={{ width: `${f * 100}%` }}
              />
            )}
            {/* 等高胶囊：正在计入的那一格做呼吸提示 */}
            {equalHeight && !full && f > 0 && (
              <span className="absolute inset-0 animate-pulse rounded-full bg-indigo-400/60 dark:bg-indigo-300/50" />
            )}
          </span>
        )
      })}
      {notch}
    </div>
  )
}
