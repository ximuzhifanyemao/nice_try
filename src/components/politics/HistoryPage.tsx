import { useState } from 'react'
import { Icon } from '../Icon'
import {
  POLITICS_BY_NO,
  POLITICS_CATEGORIES,
  POLITICS_MEETINGS,
  POLITICS_STAGES,
  POLITICS_TL_ROWS,
  padNo,
  type PoliticsItem,
} from '../../lib/politics'

interface Props {
  tab: 'timeline' | 'meetings'
  onTabChange: (tab: 'timeline' | 'meetings') => void
  stage: string | null
  onStageChange: (stage: string | null) => void
  onOpenItem: (no: number) => void
  onOpenCategory: (cat: string) => void
  onOpenGroup: (cat: string, group: string) => void
}

/** 史纲专题：时间轴 + 会议速查 */
export default function HistoryPage({
  tab,
  onTabChange,
  stage,
  onStageChange,
  onOpenItem,
  onOpenCategory,
  onOpenGroup,
}: Props) {
  const [meetingQuery, setMeetingQuery] = useState('')
  const [openMeetings, setOpenMeetings] = useState<Set<number>>(() => new Set())

  const toggleMeeting = (idx: number) => {
    setOpenMeetings((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  return (
    <section className="page history-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">史纲 · 专题</p>
          <h1 className="page-title">一条时间线，一张会议表</h1>
          <p className="page-desc">
            先把 1840–1978 的骨架搭起来，再把 33 场会议挂到对应年份。史纲是原书最核心的部分，会议又是史纲里最该严肃学的一页。
          </p>
        </div>
        <div className="history-tabs">
          <button
            type="button"
            className={`history-tab${tab === 'timeline' ? ' active' : ''}`}
            onClick={() => onTabChange('timeline')}
          >
            时间轴
          </button>
          <button
            type="button"
            className={`history-tab${tab === 'meetings' ? ' active' : ''}`}
            onClick={() => onTabChange('meetings')}
          >
            会议速查
          </button>
        </div>
      </header>

      {tab === 'meetings' ? (
        <MeetingsPanel
          query={meetingQuery}
          onQueryChange={setMeetingQuery}
          openMeetings={openMeetings}
          onToggleMeeting={toggleMeeting}
        />
      ) : (
        <TimelinePanel
          stage={stage}
          onStageChange={onStageChange}
          onOpenItem={onOpenItem}
          onOpenCategory={onOpenCategory}
          onOpenGroup={onOpenGroup}
        />
      )}
    </section>
  )
}

function TimelinePanel({
  stage,
  onStageChange,
  onOpenItem,
  onOpenCategory,
  onOpenGroup,
}: Omit<Props, 'tab' | 'onTabChange'>) {
  const stageInfo = stage ? POLITICS_STAGES.find((s) => s.id === stage) : null
  const stageItems: PoliticsItem[] = stageInfo
    ? stageInfo.items.map((no) => POLITICS_BY_NO.get(no)).filter((v): v is PoliticsItem => !!v)
    : []
  const shiCategory = POLITICS_CATEGORIES.find((cat) => cat.name === '史纲')

  const toggleStage = (id: string) => {
    onStageChange(stage === id ? null : id)
    if (stage !== id && window.innerWidth < 960) {
      setTimeout(() => {
        document.getElementById('pp-stage-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
    }
  }

  return (
    <>
      <div className="timeline-wrap">
        <div className="timeline-desktop">
          <div className="tl-scroll">
            <div className="tl-inner">
              <div className="tl-stage-row">
                {POLITICS_STAGES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`tl-stage${stage === s.id ? ' active' : ''}`}
                    title={s.name}
                    onClick={() => toggleStage(s.id)}
                  >
                    <span>{s.short}</span>
                    <small>
                      {s.start}–{s.end === 2026 ? '今' : s.end}
                    </small>
                  </button>
                ))}
              </div>
              <div className="tl-rows">
                {POLITICS_TL_ROWS.map((row) => (
                  <div key={row.label} className="tl-row">
                    <div className="tl-row-label">{row.label}</div>
                    <div className="tl-track">
                      {row.segs.map((seg) => (
                        <div
                          key={seg.name}
                          className={`tl-seg ${seg.color}`}
                          style={{
                            flex: `${Math.max(1, seg.end - seg.start)} 1 0`,
                            minWidth: `${Math.max(56, seg.name.length * 10 + 14)}px`,
                          }}
                          title={`${seg.name} ${seg.start}–${seg.end}`}
                        >
                          <b>{seg.name}</b>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="tl-axis-labels">
                <span>1840</span>
                <span>1919</span>
                <span>1949</span>
                <span>1978</span>
                <span>今</span>
              </div>
            </div>
          </div>
        </div>

        <div className="tl-mobile">
          <div className="tl-mobile-list">
            {POLITICS_STAGES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`tl-mobile-item${stage === s.id ? ' active' : ''}`}
                onClick={() => toggleStage(s.id)}
              >
                <span className="tl-mobile-year">
                  {s.start}–{s.end === 2026 ? '今' : s.end}
                </span>
                <span className="tl-mobile-name">{s.name}</span>
                <span className="tl-mobile-count">{s.items.length} 个考点</span>
              </button>
            ))}
          </div>
        </div>

        <div className="tl-stage-note">
          <span>点击阶段，筛出对应考点；再点一次取消。</span>
          {stage ? (
            <button type="button" className="link-btn" onClick={() => onStageChange(null)}>
              清除阶段筛选
            </button>
          ) : (
            <span>知识点 037 · 原书时间轴</span>
          )}
        </div>
      </div>

      <div className="stage-results" id="pp-stage-results">
        {stageInfo ? (
          <>
            <div className="stage-result-head">
              <h3>{stageInfo.name}</h3>
              <span>
                {stageInfo.start}–{stageInfo.end === 2026 ? '今' : stageInfo.end} · {stageItems.length} 个考点
              </span>
            </div>
            <div className="kp-list">
              {stageItems.map((item) => (
                <button key={item.no} type="button" className="kp-row" onClick={() => onOpenItem(item.no)}>
                  <span className="kp-row-no">{padNo(item.no)}</span>
                  <span className="kp-row-title">{item.title}</span>
                  <span className="kp-row-arrow">→</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="stage-result-head">
              <h3>史纲考点分组</h3>
              <span>共 {shiCategory ? shiCategory.count : 0} 个</span>
            </div>
            <div className="group-overview">
              {(shiCategory?.groups ?? []).map((group) => (
                <button
                  key={group.name}
                  type="button"
                  className="group-card"
                  onClick={() => onOpenGroup('史纲', group.name)}
                >
                  <b>{group.name}</b>
                  <span>{group.count}</span>
                </button>
              ))}
            </div>
            <div className="stage-result-action">
              <button type="button" className="btn-ghost" onClick={() => onOpenCategory('史纲')}>
                <Icon name="arrowRight" size={15} /> 打开史纲知识库
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function MeetingsPanel({
  query,
  onQueryChange,
  openMeetings,
  onToggleMeeting,
}: {
  query: string
  onQueryChange: (q: string) => void
  openMeetings: Set<number>
  onToggleMeeting: (idx: number) => void
}) {
  const mnemonic = POLITICS_BY_NO.get(91)
  const chips = mnemonic
    ? (mnemonic.html.match(/<p class="kp-line[^"]*">[\s\S]*?<\/p>/g) || []).map((p) =>
        p.replace(/^<p[^>]*>|<\/p>$/g, ''),
      )
    : []

  const q = query.toLowerCase()
  const list = POLITICS_MEETINGS.map((meeting, index) => ({ meeting, index })).filter(
    ({ meeting }) =>
      !q ||
      meeting.name.toLowerCase().includes(q) ||
      String(meeting.year).includes(q) ||
      meeting.plain.toLowerCase().includes(q),
  )

  return (
    <>
      <div className="mnemonic-panel">
        <div className="mnemonic-panel-head">
          <h3>会议口诀长卷</h3>
          <span>
            来自知识点 091 · 先背口诀，再看考点 <i className="mnemonic-hint">· 可横向滑动</i>
          </span>
        </div>
        <div className="mnemonic-strip">
          {chips.map((chip, idx) => (
            <span key={idx} className="mnemonic-chip" dangerouslySetInnerHTML={{ __html: chip }} />
          ))}
        </div>
      </div>

      <div className="meeting-toolbar">
        <div className="meeting-search">
          <Icon name="search" size={15} />
          <input
            type="search"
            placeholder="搜会议名称或年份…"
            value={query}
            autoComplete="off"
            aria-label="搜索会议"
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>
        <span className="section-note">{POLITICS_MEETINGS.length} 场会议 · 按年份排列</span>
      </div>

      {list.length ? (
        <div className="meeting-list">
          {list.map(({ meeting, index }) => {
            const open = openMeetings.has(index)
            const yearMatch = meeting.name.match(/\s*((?:19|20)\d{2})(?:-((?:19|20)\d{2}))?\s*$/)
            const display = yearMatch ? meeting.name.slice(0, yearMatch.index).trim() : meeting.name
            const yearText =
              yearMatch && yearMatch[2]
                ? `${yearMatch[1]}–${yearMatch[2]}`
                : yearMatch
                  ? yearMatch[1]
                  : String(meeting.year)
            return (
              <div key={`${meeting.name}-${index}`} className="meeting-item">
                <div className="meeting-year">{yearText}</div>
                <div className={`meeting-card${open ? ' open' : ''}`}>
                  <button type="button" className="meeting-head" onClick={() => onToggleMeeting(index)}>
                    <span className="meeting-name">{display}</span>
                    <span className="meeting-chevron">
                      <Icon name="chevronDown" size={14} />
                    </span>
                  </button>
                  <div className="meeting-body" dangerouslySetInnerHTML={{ __html: meeting.html }} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <b>没有找到相关会议</b>换个名称或年份试试。
        </div>
      )}
    </>
  )
}
