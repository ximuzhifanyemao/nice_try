import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '../Icon'
import { useToast } from '../../lib/Toast'
import {
  POLITICS_BY_NO,
  POLITICS_SCOPE_LABEL,
  catCls,
  catLabel,
  padNo,
  scopeItems,
  shuffleItems,
  type PoliticsItem,
  type PoliticsLocalState,
  type PoliticsPageKey,
  type PoliticsRecitePrefs,
} from '../../lib/politics'
import ItemBody from './ItemBody'

export interface ReciteRequest {
  scope: string
  nonce: number
  shuffle?: boolean
}

interface Session {
  queue: number[]
  index: number
  revealed: boolean
  known: number[]
  forgot: number[]
  scope: string
  finished: boolean
}

interface Props {
  state: PoliticsLocalState
  request: ReciteRequest | null
  onRate: (no: number, known: boolean) => void
  onPrefs: (patch: Partial<PoliticsRecitePrefs>) => void
  onNav: (page: PoliticsPageKey) => void
}

const SCOPES = [
  { id: 'all', name: '全部考点', hint: '100 张一起翻' },
  { id: 'ma', name: '马原', hint: '基本知识 · 政经' },
  { id: 'shi', name: '史纲', hint: '时间轴 · 会议' },
  { id: 'qi', name: '其他', hint: '高质量发展 · 法治' },
  { id: 'unmastered', name: '未掌握', hint: '专挑没标记的' },
  { id: 'review', name: '待复习', hint: '上次没记住的' },
  { id: 'saved', name: '已收藏', hint: '你标星的那些' },
]

/** 背诵：范围设置 → 翻卡自评 → 本轮小结 */
export default function RecitePage({ state, request, onRate, onPrefs, onNav }: Props) {
  const { show } = useToast()
  const [scope, setScope] = useState(state.recite.scope || 'all')
  const [session, setSession] = useState<Session | null>(null)
  const consumedNonce = useRef(0)

  const start = useCallback(
    (targetScope: string, forceShuffle?: boolean) => {
      const pool = scopeItems(targetScope, state)
      if (!pool.length) {
        show('这个范围还没有卡片')
        return
      }
      if (forceShuffle !== undefined) onPrefs({ shuffle: forceShuffle })
      const shuffle = forceShuffle ?? state.recite.shuffle
      let queue = shuffle ? shuffleItems(pool) : pool.slice()
      const limit =
        state.recite.limit === 'all'
          ? queue.length
          : Math.min(parseInt(state.recite.limit, 10) || 20, queue.length)
      queue = queue.slice(0, limit)
      onPrefs({ scope: targetScope })
      setScope(targetScope)
      setSession({
        queue: queue.map((item) => item.no),
        index: 0,
        revealed: false,
        known: [],
        forgot: [],
        scope: targetScope,
        finished: false,
      })
    },
    [onPrefs, show, state],
  )

  /** 首页「随机抽背」/「我的」里的「开始复习」通过 request 触发 */
  useEffect(() => {
    if (!request || request.nonce === consumedNonce.current) return
    consumedNonce.current = request.nonce
    start(request.scope, request.shuffle)
  }, [request, start])

  const reveal = useCallback(() => {
    setSession((prev) => (prev && !prev.finished && !prev.revealed ? { ...prev, revealed: true } : prev))
  }, [])

  const rate = useCallback(
    (known: boolean) => {
      if (!session || session.finished || !session.revealed) return
      const no = session.queue[session.index]
      onRate(no, known)
      const knownList = known ? [...session.known, no] : session.known
      const forgotList = known ? session.forgot : [...session.forgot, no]
      const index = session.index + 1
      if (index >= session.queue.length) {
        show(`这一轮结束：记住 ${knownList.length} 张`)
        setSession({ ...session, known: knownList, forgot: forgotList, index, revealed: false, finished: true })
        return
      }
      setSession({ ...session, known: knownList, forgot: forgotList, index, revealed: false })
    },
    [onRate, session, show],
  )

  /** 键盘快捷键：Space 翻开 · 1 没记住 · 2 记住了 · Esc 退出 */
  useEffect(() => {
    if (!session) return
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }
      if (e.key === 'Escape') {
        setSession(null)
        return
      }
      if (session.finished) return
      if (e.key === ' ' && !session.revealed) {
        e.preventDefault()
        reveal()
      } else if (session.revealed && e.key === '1') {
        rate(false)
      } else if (session.revealed && e.key === '2') {
        rate(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [session, reveal, rate])

  const pool = scopeItems(scope, state)
  const limit =
    state.recite.limit === 'all' ? pool.length : Math.min(parseInt(state.recite.limit, 10) || 20, pool.length)

  if (session) {
    if (session.finished) {
      return (
        <section className="page recite-page">
          <div className="session-summary">
            <div className="summary-mark">✓</div>
            <h2>这一轮结束了</h2>
            <p>
              {POLITICS_SCOPE_LABEL[session.scope] ?? '全部考点'} · 共 {session.queue.length} 张
            </p>
            <div className="summary-stats">
              <div className="summary-stat">
                <b>{session.known.length}</b>
                <span>记住了</span>
              </div>
              <div className="summary-stat">
                <b>{session.forgot.length}</b>
                <span>进了待复习</span>
              </div>
            </div>
            <div className="summary-actions">
              <button type="button" className="btn-primary" onClick={() => start(session.scope)}>
                <Icon name="shuffle" size={15} /> 再来一轮
              </button>
              {session.forgot.length > 0 && (
                <button type="button" className="btn-ghost" onClick={() => start('review')}>
                  复习没记住的
                </button>
              )}
              <button type="button" className="btn-ghost" onClick={() => onNav('home')}>
                回到概览
              </button>
            </div>
          </div>
        </section>
      )
    }

    const item: PoliticsItem | undefined = POLITICS_BY_NO.get(session.queue[session.index])
    if (!item) {
      return (
        <section className="page recite-page">
          <div className="session-summary">
            <h2>这张卡片已不在题库里</h2>
            <div className="summary-actions">
              <button type="button" className="btn-ghost" onClick={() => setSession(null)}>
                返回背诵设置
              </button>
            </div>
          </div>
        </section>
      )
    }
    const pct = Math.round((session.index / session.queue.length) * 100)
    return (
      <section className="page recite-page">
        <div className="session-wrap">
          <div className="session-top">
            <button type="button" className="session-exit" onClick={() => setSession(null)}>
              ← 退出
            </button>
            <span className="session-counter">
              {session.index + 1} / {session.queue.length}
            </span>
            <div className="session-progress">
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="flashcard">
            <div className="flash-meta">
              <span className={`pill tag-${catCls(item.category)}`}>{catLabel(item)}</span>
              <span className="flash-no">知识点 {padNo(item.no)}</span>
            </div>
            <h2 className="flash-title">{item.title}</h2>
            <p className="flash-hint">
              {session.revealed ? '答案已翻开，自己判断记住没有。' : '先回忆：这个考点讲了几层意思？'}
            </p>
            {session.revealed ? (
              <>
                <div className="flash-answer">
                  <ItemBody item={item} />
                </div>
                <div className="rate-row">
                  <button type="button" className="rate forgot" onClick={() => rate(false)}>
                    没记住<small>进待复习</small>
                  </button>
                  <button type="button" className="rate known" onClick={() => rate(true)}>
                    记住了<small>下一张</small>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flash-cover">
                  <div className="blur-line" />
                  <div className="blur-line" />
                  <div className="blur-line" />
                  <div className="cover-text">答案藏在这里 · 先在脑子里过一遍</div>
                </div>
                <button type="button" className="reveal-btn" onClick={reveal}>
                  翻开答案 <kbd>Space</kbd>
                </button>
              </>
            )}
          </div>
          <div className="session-foot">
            <span>
              记住 {session.known.length} · 没记住 {session.forgot.length}
            </span>
            <span>
              {POLITICS_SCOPE_LABEL[session.scope] ?? '全部考点'} · {state.recite.shuffle ? '乱序' : '顺序'}
            </span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="page recite-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">背诵模式</p>
          <h1 className="page-title">先回忆，再翻开</h1>
          <p className="page-desc">
            看标题先在脑子里过一遍，再翻开答案。记住了就标记掌握，没记住就进待复习。不用追求逐字复述，记住对应关系就够了。
          </p>
        </div>
      </header>

      <div className="recite-setup">
        <div className="scope-grid">
          {SCOPES.map((option) => {
            const count = scopeItems(option.id, state).length
            return (
              <button
                key={option.id}
                type="button"
                className={`scope-card${scope === option.id ? ' selected' : ''}`}
                onClick={() => setScope(option.id)}
              >
                <b>{option.name}</b>
                <span>{option.hint}</span>
                <em>{count}</em>
              </button>
            )
          })}
        </div>

        <div className="recite-options">
          <div className="switch-row">
            <button
              type="button"
              className={`switch${state.recite.shuffle ? ' on' : ''}`}
              aria-label="乱序"
              aria-pressed={state.recite.shuffle}
              onClick={() => onPrefs({ shuffle: !state.recite.shuffle })}
            />
            <span>乱序抽卡</span>
          </div>
          <div className="limit-row">
            <span>每轮</span>
            <div className="select-wrap">
              <select
                aria-label="每轮张数"
                value={state.recite.limit}
                onChange={(e) => onPrefs({ limit: e.target.value })}
              >
                <option value="10">10 张</option>
                <option value="20">20 张</option>
                <option value="all">全部</option>
              </select>
            </div>
          </div>
          <div className="recite-start-row">
            <button type="button" className="btn-primary" disabled={!pool.length} onClick={() => start(scope)}>
              {pool.length ? `开始背诵 · ${limit} 张` : '这个范围还没有卡片'} <Icon name="arrowRight" size={15} />
            </button>
          </div>
        </div>

        <div className="recite-tip">
          快捷键：<kbd>Space</kbd> 翻开答案 · <kbd>1</kbd> 没记住 · <kbd>2</kbd> 记住了 · <kbd>Esc</kbd> 退出
          <br />
          “没记住”会自动进入「待复习」，下次可以单独抽这一组。
        </div>
      </div>
    </section>
  )
}
