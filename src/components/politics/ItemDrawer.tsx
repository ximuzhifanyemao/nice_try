import { createPortal } from 'react-dom'
import { Icon } from '../Icon'
import {
  POLITICS_BY_NO,
  catCls,
  catLabel,
  padNo,
  type PoliticsItem,
  type PoliticsLocalState,
} from '../../lib/politics'
import ItemBody from './ItemBody'

interface Props {
  no: number | null
  state: PoliticsLocalState
  order: PoliticsItem[]
  onClose: () => void
  onOpenItem: (no: number) => void
  onToggleMastered: (no: number) => void
  onToggleSave: (no: number) => void
  onCopy: (item: PoliticsItem) => void
  onOpenTimeline: () => void
}

/** 知识点详情抽屉：右侧滑出（桌面）/ 底部上滑（手机） */
export default function ItemDrawer({
  no,
  state,
  order,
  onClose,
  onOpenItem,
  onToggleMastered,
  onToggleSave,
  onCopy,
  onOpenTimeline,
}: Props) {
  if (no == null) return null
  const item = POLITICS_BY_NO.get(no)
  if (!item) return null

  const idx = order.findIndex((entry) => entry.no === item.no)
  const mastered = state.mastered.includes(item.no)
  const saved = state.saved.includes(item.no)

  return createPortal(
    <div className="pp-root pp-layer">
      <div className="layer-backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="知识点详情">
        <div className="drawer-head">
          <div className="drawer-meta">
            <span className="kp-no">{padNo(item.no)}</span>
            <span className={`pill tag-${catCls(item.category)}`}>{catLabel(item)}</span>
          </div>
          <h2>{item.title}</h2>
          <button type="button" className="drawer-close" aria-label="关闭" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="drawer-body">
          <div className="drawer-legend">
            <i />
            <span>彩色文字是原书标注的重点，灰字是补充说明。按自己的节奏翻，不用逐字背。</span>
          </div>
          <ItemBody item={item} onOpenTimeline={onOpenTimeline} />
        </div>
        <div className="drawer-foot">
          <button
            type="button"
            className={`drawer-mastery${mastered ? '' : ' off'}`}
            onClick={() => onToggleMastered(item.no)}
          >
            <Icon name="check" size={14} /> {mastered ? '已掌握' : '标记已掌握'}
          </button>
          <button
            type="button"
            className={`foot-icon${saved ? ' active' : ''}`}
            aria-label="收藏"
            onClick={() => onToggleSave(item.no)}
          >
            <Icon name="star" size={16} />
          </button>
          <button type="button" className="foot-icon" aria-label="复制内容" onClick={() => onCopy(item)}>
            <Icon name="copy" size={16} />
          </button>
          <div className="foot-spacer" />
          <div className="drawer-nav">
            <button
              type="button"
              className="foot-icon"
              aria-label="上一条"
              disabled={idx <= 0}
              onClick={() => idx > 0 && onOpenItem(order[idx - 1].no)}
            >
              <Icon name="arrowLeft" size={16} />
            </button>
            <button
              type="button"
              className="foot-icon"
              aria-label="下一条"
              disabled={idx < 0 || idx >= order.length - 1}
              onClick={() => idx >= 0 && idx < order.length - 1 && onOpenItem(order[idx + 1].no)}
            >
              <Icon name="arrowRight" size={16} />
            </button>
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  )
}
