import { Icon } from '../Icon'
import { POLITICS_STAGES, type PoliticsItem } from '../../lib/politics'

/**
 * 知识点正文。
 * 037 是原书时间轴（没有正文 HTML），091 是会议口诀长卷，其余是普通 kp-body。
 */
export default function ItemBody({
  item,
  onOpenTimeline,
}: {
  item: PoliticsItem
  onOpenTimeline?: () => void
}) {
  if (item.no === 37) {
    return (
      <div className="kp-body">
        <div className="tl-detail-intro">
          原书用一张图把 1840–1978 串起来。下面按阶段列出；点“打开时间轴”可以按阶段筛出对应考点。
        </div>
        {POLITICS_STAGES.map((stage) => (
          <div key={stage.id} className="tl-detail-row">
            <span className="tl-detail-year">
              {stage.start}–{stage.end === 2026 ? '今' : stage.end}
            </span>
            <div>
              <b>{stage.name}</b>
              <small>{stage.items.length} 个考点</small>
            </div>
          </div>
        ))}
        {onOpenTimeline && (
          <div className="tl-detail-action">
            <button type="button" className="btn-ghost" onClick={onOpenTimeline}>
              <Icon name="arrowRight" size={15} /> 打开时间轴
            </button>
          </div>
        )}
      </div>
    )
  }

  if (item.no === 91) {
    return <div className="mnemonic-detail" dangerouslySetInnerHTML={{ __html: item.html }} />
  }

  return (
    <div
      className="kp-body"
      dangerouslySetInnerHTML={{ __html: item.html || '<p class="kp-line c-gray">暂无正文</p>' }}
    />
  )
}
