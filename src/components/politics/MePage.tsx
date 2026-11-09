import { Icon } from '../Icon'
import {
  POLITICS_BY_NO,
  POLITICS_CATEGORIES,
  POLITICS_META,
  POLITICS_TOTAL,
  categoryMastered,
  computeStreak,
  padNo,
  type PoliticsFontSize,
  type PoliticsFilters,
  type PoliticsItem,
  type PoliticsLocalState,
} from '../../lib/politics'
import { Ring } from './shared'

interface Props {
  state: PoliticsLocalState
  onOpenItem: (no: number) => void
  onOpenStatus: (status: PoliticsFilters['status']) => void
  onStartReview: () => void
  onSetFont: (font: PoliticsFontSize) => void
  onRequestReset: () => void
}

/** 我的：总进度、收藏 / 待复习清单、阅读字号与数据清理 */
export default function MePage({
  state,
  onOpenItem,
  onOpenStatus,
  onStartReview,
  onSetFont,
  onRequestReset,
}: Props) {
  const mastered = state.mastered.length
  const pct = POLITICS_TOTAL ? Math.round((mastered / POLITICS_TOTAL) * 100) : 0
  const saved = state.saved
    .map((no) => POLITICS_BY_NO.get(no))
    .filter((v): v is PoliticsItem => !!v)
  const review = state.review
    .map((no) => POLITICS_BY_NO.get(no))
    .filter((v): v is PoliticsItem => !!v)
  const streak = computeStreak(state.visits)

  return (
    <section className="page me-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">我的学习</p>
          <h1 className="page-title">把进度留在这里</h1>
          <p className="page-desc">
            掌握、收藏、待复习会先保存在本机，登录后自动与云端合并同步；换设备也不会丢。
          </p>
        </div>
      </header>

      <div className="me-hero">
        <div className="me-hero-main">
          <h1>
            {mastered} <span className="me-hero-total">/ {POLITICS_TOTAL} 已掌握</span>
          </h1>
          <p>
            连续学习 {streak} 天 · 收藏 {saved.length} 张 · 待复习 {review.length} 张
          </p>
          <div className="me-progress-list">
            {POLITICS_CATEGORIES.map((cat) => {
              const m = categoryMastered(cat.name, state.mastered)
              const p = cat.count ? Math.round((m / cat.count) * 100) : 0
              return (
                <div key={cat.name} className="me-progress-row">
                  <b>{cat.name}</b>
                  <div className="mini-bar">
                    <i style={{ width: `${p}%` }} />
                  </div>
                  <span>
                    {m} / {cat.count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="me-hero-side">
          <Ring pct={pct} label="总进度" />
        </div>
      </div>

      <div className="me-grid">
        <section className="me-panel">
          <h3>我的收藏</h3>
          {saved.length ? (
            <>
              <div className="me-list">
                {saved.slice(0, 8).map((item) => (
                  <button key={item.no} type="button" className="me-list-row" onClick={() => onOpenItem(item.no)}>
                    <span className="me-list-no">{padNo(item.no)}</span>
                    <span className="me-list-title">{item.title}</span>
                    <span className="me-list-arrow">→</span>
                  </button>
                ))}
              </div>
              <div className="me-list-more">
                <button type="button" className="link-btn" onClick={() => onOpenStatus('saved')}>
                  查看全部 {saved.length} 张收藏 →
                </button>
              </div>
            </>
          ) : (
            <div className="me-empty">还没有收藏。在知识点卡片右上角点星标。</div>
          )}
        </section>

        <section className="me-panel">
          <h3>待复习</h3>
          {review.length ? (
            <>
              <div className="me-list">
                {review.slice(0, 8).map((item) => (
                  <button key={item.no} type="button" className="me-list-row" onClick={() => onOpenItem(item.no)}>
                    <span className="me-list-no">{padNo(item.no)}</span>
                    <span className="me-list-title">{item.title}</span>
                    <span className="me-list-arrow">→</span>
                  </button>
                ))}
              </div>
              <div className="me-list-more me-list-more-inline">
                <button type="button" className="link-btn" onClick={() => onOpenStatus('review')}>
                  查看全部 {review.length} 张待复习 →
                </button>
                <button type="button" className="link-btn" onClick={onStartReview}>
                  开始复习 →
                </button>
              </div>
            </>
          ) : (
            <div className="me-empty">还没有待复习的卡片。背诵时点“没记住”会进这里。</div>
          )}
        </section>
      </div>

      <div className="settings-card">
        <div className="settings-row">
          <div className="settings-row-info">
            <b>阅读字号</b>
            <span>只影响知识点正文，不影响版式</span>
          </div>
          <div className="segmented">
            <button
              type="button"
              className={`seg-btn${state.font === 'sm' ? ' active' : ''}`}
              onClick={() => onSetFont('sm')}
            >
              小
            </button>
            <button
              type="button"
              className={`seg-btn${state.font === 'md' ? ' active' : ''}`}
              onClick={() => onSetFont('md')}
            >
              标准
            </button>
            <button
              type="button"
              className={`seg-btn${state.font === 'lg' ? ' active' : ''}`}
              onClick={() => onSetFont('lg')}
            >
              大
            </button>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-row-info">
            <b>学习数据</b>
            <span>掌握、收藏、待复习、连续天数</span>
          </div>
          <button type="button" className="danger-btn" onClick={onRequestReset}>
            <Icon name="trash" size={13} /> 清空学习数据
          </button>
        </div>
      </div>

      <div className="about-card">
        <b>关于这一页</b>
        {POLITICS_META.source}，{POLITICS_META.author} 整理。
        <br />
        本页面是个人学习用的交互版，原书版权归原作者所有，请勿用于商业传播。
        <br />
        交互灵感：抖音「第七秒心动」用 AI 学政治一页纸。
      </div>
    </section>
  )
}
