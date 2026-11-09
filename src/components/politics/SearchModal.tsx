import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon'
import {
  POLITICS_BY_NO,
  POLITICS_ITEMS,
  catLabel,
  padNo,
  snippetFor,
  type PoliticsItem,
} from '../../lib/politics'
import { Highlight } from './shared'

interface Props {
  last: number | null
  onClose: () => void
  onOpenItem: (no: number) => void
}

/** 全局搜索：标题与正文全文检索，标题命中优先 */
export default function SearchModal({ last, onClose, onOpenItem }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const q = query.trim()
  let results: PoliticsItem[]
  if (!q) {
    const lastItem = last ? POLITICS_BY_NO.get(last) : null
    results = lastItem
      ? [lastItem, ...POLITICS_ITEMS.filter((item) => item.no !== lastItem.no).slice(0, 4)]
      : POLITICS_ITEMS.slice(0, 5)
  } else {
    const lower = q.toLowerCase()
    const matched = POLITICS_ITEMS.filter(
      (item) => item.title.toLowerCase().includes(lower) || item.plain.toLowerCase().includes(lower),
    )
    const titleFirst = matched.filter((item) => item.title.toLowerCase().includes(lower))
    const rest = matched.filter((item) => !item.title.toLowerCase().includes(lower))
    results = [...titleFirst, ...rest].slice(0, 12)
  }

  const openFirst = () => {
    if (results[0]) onOpenItem(results[0].no)
  }

  return createPortal(
    <div className="pp-root pp-layer">
      <div className="layer-backdrop" onClick={onClose} />
      <div className="search-modal" role="dialog" aria-modal="true" aria-label="搜索知识点">
        <div className="search-modal-head">
          <Icon name="search" size={18} />
          <input
            ref={inputRef}
            type="search"
            placeholder="搜考点、关键词，比如“会议”“剩余价值”…"
            value={query}
            autoComplete="off"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                openFirst()
              }
            }}
          />
          <button type="button" className="modal-close" aria-label="关闭" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="search-results">
          {!q && <div className="search-hint-label">最近 / 推荐</div>}
          {results.length ? (
            results.map((item) => (
              <button key={item.no} type="button" className="search-result" onClick={() => onOpenItem(item.no)}>
                <span className="sr-no">{padNo(item.no)}</span>
                <span className="sr-main">
                  <span className="sr-title">
                    <Highlight text={item.title} q={q} />
                  </span>
                  <span className="sr-meta">{catLabel(item)}</span>
                  <span className="sr-snippet">
                    <Highlight text={snippetFor(item, q)} q={q} />
                  </span>
                </span>
              </button>
            ))
          ) : (
            <div className="search-empty">没有找到“{q}”相关的考点。</div>
          )}
        </div>
        <div className="search-foot">Enter 打开第一条 · Esc 关闭 · 支持标题和正文全文搜索</div>
      </div>
    </div>,
    document.body,
  )
}
