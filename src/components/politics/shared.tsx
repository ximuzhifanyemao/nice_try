import { useId, type ReactNode } from 'react'

/**
 * 政治一页纸的通用展示件：进度环、搜索高亮、富文本正文。
 * 内容来自随包内置的题库 JSON，属于可信静态数据，故直接用 innerHTML 渲染。
 */

export function Ring({ pct, label }: { pct: number; label: string }) {
  const rawId = useId()
  const gradId = `pp-ring-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const r = 52
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.max(0, Math.min(100, pct)) / 100)
  return (
    <div className="ring-wrap">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--gold)" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--ring-track)" strokeWidth="5" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c.toFixed(2)}
          strokeDashoffset={offset.toFixed(2)}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="ring-center">
        <b>
          {pct}
          <small>%</small>
        </b>
        <span>{label}</span>
      </div>
    </div>
  )
}

export function Highlight({ text, q }: { text: string; q: string }): ReactNode {
  if (!q) return text
  const lower = text.toLowerCase()
  const query = q.toLowerCase()
  const parts: ReactNode[] = []
  let cursor = 0
  while (cursor <= text.length) {
    const idx = lower.indexOf(query, cursor)
    if (idx < 0) {
      parts.push(text.slice(cursor))
      break
    }
    if (idx > cursor) parts.push(text.slice(cursor, idx))
    parts.push(<mark key={`${idx}-${query}`}>{text.slice(idx, idx + query.length)}</mark>)
    cursor = idx + query.length
    if (!query) break
  }
  return <>{parts}</>
}
