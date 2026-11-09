import { Icon } from '../Icon'
import {
  POLITICS_BY_NO,
  POLITICS_CAT_META,
  POLITICS_CATEGORIES,
  POLITICS_MEETINGS,
  POLITICS_META,
  POLITICS_TOTAL,
  categoryMastered,
  computeStreak,
  dailyPicks,
  mnemonicLines,
  padNo,
  type PoliticsItem,
  type PoliticsLocalState,
  type PoliticsPageKey,
} from '../../lib/politics'
import { Ring } from './shared'

interface Props {
  state: PoliticsLocalState
  onOpenItem: (no: number) => void
  onNav: (page: PoliticsPageKey) => void
  onSelectCategory: (cat: string) => void
  onOpenSearch: () => void
  onRandomRecite: () => void
  onHistoryMeetings: () => void
}

/** 概览：进度、分类、今日三题与史纲入口 */
export default function OverviewPage({
  state,
  onOpenItem,
  onNav,
  onSelectCategory,
  onOpenSearch,
  onRandomRecite,
  onHistoryMeetings,
}: Props) {
  const mastered = state.mastered.length
  const pct = POLITICS_TOTAL ? Math.round((mastered / POLITICS_TOTAL) * 100) : 0
  const streak = computeStreak(state.visits)
  const picks = dailyPicks(state.mastered)
  const mnemonic = mnemonicLines(POLITICS_BY_NO.get(91), 8)

  const continueLearning = () => {
    if (state.last && POLITICS_BY_NO.has(state.last)) {
      onOpenItem(state.last)
      return
    }
    const first = POLITICS_BY_NO.get(1)
    if (first) onOpenItem(first.no)
  }

  return (
    <section className="page home-page">
      <div className="hero">
        <div className="hero-main">
          <div className="hero-kicker">
            <span className="seal-dot" />
            2027 · 考研政治知识点手册
          </div>
          <h1 className="hero-title">
            这就是<span className="accent">一页纸</span>
          </h1>
          <p className="hero-desc">
            把一整本政治，收进一页屏幕。翻看、熟悉、连接，<b>只记对应关系</b>。
          </p>
          <div className="hero-actions">
            <button type="button" className="btn-primary" onClick={continueLearning}>
              <Icon name="arrowRight" size={16} /> 继续学习
            </button>
            <button type="button" className="btn-ghost" onClick={onRandomRecite}>
              <Icon name="shuffle" size={16} /> 随机抽背
            </button>
          </div>
          <div className="hero-meta">
            <span>{POLITICS_TOTAL} 个考点</span>
            <i />
            <span>{POLITICS_MEETINGS.length} 场会议</span>
            <i />
            <span>马原 · 史纲 · 其他</span>
          </div>
        </div>
        <div className="hero-side">
          <Ring pct={pct} label="已掌握" />
          <div className="ring-caption">
            <b>
              {mastered} / {POLITICS_TOTAL}
            </b>
            <br />
            点开任意一张 · 标记掌握
          </div>
        </div>
      </div>

      <div className="stat-strip">
        <div className="stat-tile">
          <span>已掌握</span>
          <b>
            {mastered}
            <small>/ {POLITICS_TOTAL}</small>
          </b>
        </div>
        <div className="stat-tile">
          <span>待复习</span>
          <b>
            {state.review.length}
            <small>张</small>
          </b>
        </div>
        <div className="stat-tile">
          <span>连续学习</span>
          <b>
            {streak}
            <small>天</small>
          </b>
        </div>
        <div className="stat-tile">
          <span>已收藏</span>
          <b>
            {state.saved.length}
            <small>张</small>
          </b>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">按科目进入</h2>
          <span className="section-note">先建立框架，再填细节</span>
        </div>
        <div className="cat-grid">
          {POLITICS_CATEGORIES.map((cat) => {
            const m = categoryMastered(cat.name, state.mastered)
            const p = cat.count ? Math.round((m / cat.count) * 100) : 0
            const meta = POLITICS_CAT_META[cat.name] ?? { seal: '?', desc: '' }
            return (
              <button
                key={cat.name}
                type="button"
                className="cat-card"
                data-cat={cat.name}
                onClick={() => onSelectCategory(cat.name)}
              >
                <span className="cat-card-top">
                  <span className="cat-seal">{meta.seal}</span>
                  <span className="cat-count">{cat.count}</span>
                </span>
                <span className="cat-name">{cat.name}</span>
                <span className="cat-sub">{meta.desc}</span>
                <span className="cat-bar">
                  <i style={{ width: `${p}%` }} />
                </span>
                <span className="cat-foot">
                  <span>
                    已掌握 {m} / {cat.count}
                  </span>
                  <em>进入 →</em>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="duo-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">今日三题</h2>
              <p className="panel-sub">按日期轮换，优先挑未掌握的</p>
            </div>
            <button type="button" className="link-btn" onClick={() => onNav('library')}>
              全部考点 →
            </button>
          </div>
          <div className="daily-list">
            {picks.length ? (
              picks.map((item: PoliticsItem) => (
                <button key={item.no} type="button" className="daily-row" onClick={() => onOpenItem(item.no)}>
                  <span className="daily-no">{padNo(item.no)}</span>
                  <span className="daily-info">
                    <span className="daily-title">{item.title}</span>
                    <span className="daily-tag">
                      {item.category}
                      {item.group && item.group !== '总览' ? ` · ${item.group}` : ''}
                    </span>
                  </span>
                  <span className="daily-arrow">→</span>
                </button>
              ))
            ) : (
              <div className="me-empty">今天已经全部掌握，去抽背巩固吧。</div>
            )}
          </div>
          <div className="daily-foot">
            <button type="button" className="link-btn" onClick={onOpenSearch}>
              <Icon name="search" size={13} /> 搜一个关键词开始
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">史纲 · 一条线</h2>
              <p className="panel-sub">1840 → 1978，58 个考点挂上时间轴</p>
            </div>
          </div>
          <div className="mini-timeline">
            <div className="mini-track">
              <div className="mini-point" style={{ left: '0%' }}>
                <b>1840</b>
                <i />
                <span>鸦片战争</span>
              </div>
              <div className="mini-point" style={{ left: '42.5%' }}>
                <b>1919</b>
                <i />
                <span>五四运动</span>
              </div>
              <div className="mini-point" style={{ left: '58.6%' }}>
                <b>1949</b>
                <i />
                <span>新中国成立</span>
              </div>
              <div className="mini-point" style={{ left: '100%' }}>
                <b>1978</b>
                <i />
                <span>改革开放</span>
              </div>
            </div>
          </div>
          <div className="mini-caption">
            <span>革命 · 国情 · 历史时期，三条线一起看</span>
            <button type="button" className="link-btn" onClick={() => onNav('history')}>
              查看时间轴 →
            </button>
          </div>
        </section>
      </div>

      <section className="meeting-teaser">
        <div>
          <h3>史纲最核心的，是会议</h3>
          <p>原书把几十年真题里的会议考点，压成了一串口诀。先背口诀，再展开看每个会议的必考点。</p>
          <div className="meeting-chips">
            {mnemonic.map((line, idx) => (
              <span key={idx} className="meeting-chip" dangerouslySetInnerHTML={{ __html: line }} />
            ))}
          </div>
        </div>
        <div className="meeting-teaser-side">
          <div className="meeting-big-num">
            {POLITICS_MEETINGS.length}
            <small>场会议</small>
          </div>
          <button type="button" className="btn-ghost" onClick={onHistoryMeetings}>
            <Icon name="arrowRight" size={15} /> 打开会议速查
          </button>
        </div>
      </section>

      <footer className="pp-source-foot">
        {POLITICS_META.source} · {POLITICS_META.author} 整理
        <br />
        彩色文字为原书标注的重点，灰字为补充说明。
      </footer>
    </section>
  )
}
