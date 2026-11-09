import { Icon } from '../Icon'
import {
  POLITICS_CATEGORIES,
  POLITICS_TOTAL,
  catCls,
  catLabel,
  filterItems,
  padNo,
  previewHtml,
  type PoliticsFilters,
  type PoliticsItem,
  type PoliticsLocalState,
} from '../../lib/politics'

interface Props {
  state: PoliticsLocalState
  filters: PoliticsFilters
  onFiltersChange: (patch: Partial<PoliticsFilters>) => void
  onOpenItem: (no: number) => void
  onToggleMastered: (no: number) => void
  onToggleSave: (no: number) => void
}

const STATUS_OPTIONS: { value: PoliticsFilters['status']; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'unmastered', label: '未掌握' },
  { value: 'mastered', label: '已掌握' },
  { value: 'review', label: '待复习' },
  { value: 'saved', label: '已收藏' },
]

/** 知识库：搜索 + 科目/分组/状态筛选 + 卡片网格 */
export default function LibraryPage({
  state,
  filters,
  onFiltersChange,
  onOpenItem,
  onToggleMastered,
  onToggleSave,
}: Props) {
  const list = filterItems(filters, state)
  const groupOptions =
    filters.cat === '全部'
      ? []
      : (POLITICS_CATEGORIES.find((cat) => cat.name === filters.cat)?.groups ?? [])

  const hasFilter =
    filters.cat !== '全部' || filters.group !== '全部' || filters.status !== 'all' || !!filters.q
  const statusName =
    STATUS_OPTIONS.find((s) => s.value === filters.status)?.label ?? '当前范围'
  const resultLabel = filters.q ? `“${filters.q}” 的结果` : statusName

  const mastered = new Set(state.mastered)
  const saved = new Set(state.saved)

  return (
    <section className="page library-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">知识点库</p>
          <h1 className="page-title">100 个考点，按编号翻</h1>
          <p className="page-desc">
            支持搜索、按科目/分组筛选，标记已掌握和收藏。彩色文字是原书重点，灰字是补充说明。
          </p>
        </div>
        <div className="library-search">
          <Icon name="search" size={17} />
          <input
            type="search"
            placeholder="搜标题或正文关键词…"
            value={filters.q}
            autoComplete="off"
            aria-label="搜索知识点"
            onChange={(e) => onFiltersChange({ q: e.target.value.trim() })}
          />
          {filters.q && (
            <button type="button" className="clear-q" aria-label="清空搜索" onClick={() => onFiltersChange({ q: '' })}>
              ×
            </button>
          )}
        </div>
      </header>

      <div className="filterbar">
        <div className="chips">
          {[{ name: '全部', count: POLITICS_TOTAL }, ...POLITICS_CATEGORIES].map((cat) => (
            <button
              key={cat.name}
              type="button"
              className={`chip${filters.cat === cat.name ? ' active' : ''}`}
              onClick={() => onFiltersChange({ cat: cat.name, group: '全部' })}
            >
              {cat.name}
              <span className="n">{cat.count}</span>
            </button>
          ))}
        </div>
        <div className="filter-spacer" />
        {filters.cat !== '全部' && (
          <div className="select-wrap">
            <select
              aria-label="按分组筛选"
              value={filters.group}
              onChange={(e) => onFiltersChange({ group: e.target.value })}
            >
              <option value="全部">全部分组</option>
              {groupOptions.map((group) => (
                <option key={group.name} value={group.name}>
                  {group.name} · {group.count}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="select-wrap">
          <select
            aria-label="按掌握状态筛选"
            value={filters.status}
            onChange={(e) => onFiltersChange({ status: e.target.value as PoliticsFilters['status'] })}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="library-meta">
        <span>
          {resultLabel} · <b>{list.length}</b> 个考点
        </span>
        {hasFilter ? (
          <button
            type="button"
            className="link-btn"
            onClick={() => onFiltersChange({ cat: '全部', group: '全部', status: 'all', q: '' })}
          >
            清空筛选
          </button>
        ) : (
          <span>按编号排序</span>
        )}
      </div>

      <div className="kp-grid">
        {list.length ? (
          list.map((item: PoliticsItem) => {
            const isMastered = mastered.has(item.no)
            const isSaved = saved.has(item.no)
            return (
              <article
                key={item.no}
                className={`kp-card cat-${catCls(item.category)}${isMastered ? ' is-mastered' : ''}`}
              >
                <div className="kp-card-top">
                  <span className="kp-no">{padNo(item.no)}</span>
                  <span className="kp-tag">{catLabel(item)}</span>
                  <button
                    type="button"
                    className={`save-btn${isSaved ? ' active' : ''}`}
                    aria-label={isSaved ? '取消收藏' : '收藏'}
                    onClick={() => onToggleSave(item.no)}
                  >
                    <Icon name="star" size={15} />
                  </button>
                </div>
                <h3 className="kp-title">{item.title}</h3>
                <div className="kp-preview" dangerouslySetInnerHTML={{ __html: previewHtml(item) }} />
                <div className="kp-card-bottom">
                  <button
                    type="button"
                    className={`mastery-chip${isMastered ? ' on' : ''}`}
                    onClick={() => onToggleMastered(item.no)}
                  >
                    <Icon name="check" size={12} /> {isMastered ? '已掌握' : '标记掌握'}
                  </button>
                  <button type="button" className="kp-open" onClick={() => onOpenItem(item.no)}>
                    查看全文 <Icon name="arrowRight" size={12} />
                  </button>
                </div>
                {isMastered && <span className="mastered-seal">已掌握</span>}
              </article>
            )
          })
        ) : (
          <div className="empty-state kp-empty">
            <b>没有找到相关考点</b>
            换个关键词，或者清空筛选条件试试。
            <small>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => onFiltersChange({ cat: '全部', group: '全部', status: 'all', q: '' })}
              >
                清空筛选
              </button>
            </small>
          </div>
        )}
      </div>
    </section>
  )
}
