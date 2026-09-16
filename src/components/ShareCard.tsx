import type { ShareCardData } from '../lib/shareCard'

/** 分享图卡片固定尺寸（1080×1440 竖版 PNG） */
export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1440

interface BarRowProps {
  name: string
  hours: number
  color: string
  /** 百分比（0~100） */
  pct: number
}

function BarRow({ name, hours, color, pct }: BarRowProps) {
  return (
    <div style={{ marginTop: 34 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 30, color: '#e0e7ff', fontWeight: 600 }}>{name}</span>
        <span style={{ fontSize: 30, color: '#ffffff', fontWeight: 700 }}>{hours} h</span>
      </div>
      <div
        style={{
          marginTop: 12,
          height: 18,
          borderRadius: 9,
          background: 'rgba(255,255,255,0.14)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.max(2, Math.min(100, pct))}%`,
            borderRadius: 9,
            background: color,
          }}
        />
      </div>
    </div>
  )
}

/**
 * 生成分享图用的纯展示卡片（只读，不参与交互）。
 * 渲染注意：全部使用内联 style + 十六进制 / rgb / rgba 颜色，
 * 不使用 backdrop-blur、oklch、color-mix 等 html2canvas 支持不佳的 CSS，保证截图与肉眼一致。
 */
export default function ShareCard({ data }: { data: ShareCardData }) {
  const total = data.totalHours
  const maxHours = Math.max(1, ...data.subjects.map((s) => s.hours))

  return (
    <div
      data-sharecard="true"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: '76px 64px 56px',
        fontFamily: "'PingFang SC','Microsoft YaHei','Noto Sans SC',-apple-system,sans-serif",
        color: '#ffffff',
        background: 'linear-gradient(165deg, #151a5e 0%, #312e81 45%, #5b21b6 100%)',
      }}
    >
      {/* 顶部装饰光斑（半透明圆，html2canvas 兼容） */}
      <div
        style={{
          position: 'absolute',
          top: -180,
          right: -150,
          width: 460,
          height: 460,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.08)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -140,
          left: -120,
          width: 380,
          height: 380,
          borderRadius: 999,
          background: 'rgba(167,139,250,0.16)',
        }}
      />

      {/* 头部 */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: 6,
              color: '#a5b4fc',
            }}
          >
            DIVEDEEP
          </span>
        </div>
        <div style={{ marginTop: 28, fontSize: 64, fontWeight: 800, lineHeight: 1.15 }}>{data.title}</div>
        <div style={{ marginTop: 14, fontSize: 28, color: '#c7d2fe' }}>{data.dateLabel}</div>
      </div>

      {/* 核心数据 */}
      <div
        style={{
          position: 'relative',
          marginTop: 44,
          borderRadius: 28,
          background: 'rgba(255,255,255,0.10)',
          display: 'flex',
          padding: '40px 36px',
        }}
      >
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1 }}>{total}</div>
          <div style={{ marginTop: 10, fontSize: 24, color: '#c7d2fe' }}>本周总时长（h）</div>
        </div>
        <div
          style={{
            width: 2,
            margin: '8px 0',
            background: 'rgba(255,255,255,0.18)',
          }}
        />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1 }}>{data.checkedDays}</div>
          <div style={{ marginTop: 10, fontSize: 24, color: '#c7d2fe' }}>打卡天数（天）</div>
        </div>
      </div>

      {/* 科目时长分布 */}
      <div style={{ position: 'relative', marginTop: 48 }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#f5f3ff' }}>各科目学习时长</div>
        <div style={{ marginTop: 6, fontSize: 22, color: '#a5b4fc' }}>本周投入分布</div>
        {data.subjects.length === 0 ? (
          <div style={{ marginTop: 32, fontSize: 26, color: '#c7d2fe' }}>本周暂无科目记录</div>
        ) : (
          data.subjects.map((s) => <BarRow key={s.name} name={s.name} hours={s.hours} color={s.color} pct={(s.hours / maxHours) * 100} />)
        )}
      </div>

      {/* 格言脚注 + 品牌脚标 */}
      <div
        style={{
          position: 'absolute',
          left: 64,
          right: 64,
          bottom: 56,
          paddingTop: 28,
          borderTop: '2px solid rgba(255,255,255,0.18)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 28,
            color: '#e0e7ff',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontSize: 34, marginRight: 12, color: '#a5b4fc' }}>“</span>
          {data.motto}
          <span style={{ fontSize: 34, marginLeft: 12, color: '#a5b4fc' }}>”</span>
        </div>
        <div
          style={{
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 2,
            color: '#c7d2fe',
          }}
        >
          DiveDeep
        </div>
      </div>
    </div>
  )
}