import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../lib/Toast'
import { Icon } from '../components/Icon'
import OverviewPage from '../components/politics/OverviewPage'
import LibraryPage from '../components/politics/LibraryPage'
import RecitePage, { type ReciteRequest } from '../components/politics/RecitePage'
import HistoryPage from '../components/politics/HistoryPage'
import MePage from '../components/politics/MePage'
import ItemDrawer from '../components/politics/ItemDrawer'
import SearchModal from '../components/politics/SearchModal'
import {
  DEFAULT_FILTERS,
  POLITICS_BY_NO,
  POLITICS_ITEMS,
  POLITICS_NAV,
  POLITICS_PAGE_NAME,
  POLITICS_STAGES,
  catLabel,
  dateKey,
  filterItems,
  loadPoliticsState,
  savePoliticsState,
  type PoliticsFilters,
  type PoliticsFontSize,
  type PoliticsItem,
  type PoliticsLocalState,
  type PoliticsPageKey,
  type PoliticsRecitePrefs,
} from '../lib/politics'
import {
  fetchPoliticsProgress,
  mergePoliticsProgress,
  savePoliticsProgress,
} from '../lib/politicsProgress'
import './politics.css'

/** 阅读字号 → 正文字号缩放（只作用于知识点正文） */
const FONT_SCALE: Record<PoliticsFontSize, number> = { sm: 0.92, md: 1, lg: 1.12 }

/** 进度落库防抖：连续勾选合并成一次请求 */
const CLOUD_SAVE_DEBOUNCE_MS = 800

/**
 * 考研政治「一页纸」。
 *
 * 原单文件版（public/politics）已完整原生化：
 * - 100 个考点 / 33 场会议的数据在 src/data/politics.json；
 * - 概览、知识库、背诵、史纲、我的都是应用内的正常 React 页面，
 *   使用应用自身的侧边栏 / 底部 Tab，不再是全屏 iframe；
 * - 页头「返回」永远直接回首页，而不是退回上一页；
 * - 学习进度沿用本机 localStorage（onepaper.state.v1），登录后与 Supabase 取并集同步。
 */
export default function Politics() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { show } = useToast()
  const userId = user?.id ?? null
  const pageRef = useRef<HTMLDivElement>(null)

  const [page, setPage] = useState<PoliticsPageKey>('home')
  const [state, setState] = useState<PoliticsLocalState>(() => loadPoliticsState())
  const [filters, setFilters] = useState<PoliticsFilters>(DEFAULT_FILTERS)
  const [drawerNo, setDrawerNo] = useState<number | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [historyTab, setHistoryTab] = useState<'timeline' | 'meetings'>('timeline')
  const [stage, setStage] = useState<string | null>(null)
  const [reciteRequest, setReciteRequest] = useState<ReciteRequest | null>(null)
  /** 云端首轮合并完成前不写云，避免用本机旧数据覆盖另一台设备的进度 */
  const [cloudReady, setCloudReady] = useState(!userId)

  /* 首次进入记一次访问（连续学习天数） */
  useEffect(() => {
    setState((prev) => {
      const today = dateKey()
      if (prev.visits.includes(today)) return prev
      return { ...prev, visits: [...prev.visits, today].slice(-180) }
    })
  }, [])

  /* 本机持久化 */
  useEffect(() => {
    savePoliticsState(state)
  }, [state])

  /* 登录用户：先把云端进度与本机取并集，再回写云端 */
  useEffect(() => {
    if (!userId) {
      setCloudReady(true)
      return
    }
    let cancelled = false
    setCloudReady(false)
    void (async () => {
      const remote = await fetchPoliticsProgress(userId)
      if (cancelled) return
      setState((prev) => {
        const merged = mergePoliticsProgress(remote, prev)
        return {
          ...prev,
          mastered: merged.mastered.filter((no) => POLITICS_BY_NO.has(no)),
          saved: merged.saved.filter((no) => POLITICS_BY_NO.has(no)),
          review: merged.review.filter((no) => POLITICS_BY_NO.has(no)),
          visits: merged.visits,
          last: merged.last != null && POLITICS_BY_NO.has(merged.last) ? merged.last : null,
        }
      })
      setCloudReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  /* 进度变化后防抖落库 */
  useEffect(() => {
    if (!userId || !cloudReady) return
    const timer = setTimeout(() => {
      void savePoliticsProgress(userId, state)
    }, CLOUD_SAVE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [state, userId, cloudReady])

  /* 切页时把内容滚回顶部（兼容桌面端内容列自身的滚动容器） */
  useEffect(() => {
    let el: HTMLElement | null = pageRef.current?.parentElement ?? null
    while (el) {
      const style = window.getComputedStyle(el)
      if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight) {
        el.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      el = el.parentElement
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  /* 离开背诵页就清掉一次性的开局请求，避免下次回到背诵页又自动开一轮 */
  useEffect(() => {
    if (page !== 'recite' && reciteRequest) setReciteRequest(null)
  }, [page, reciteRequest])

  const toggleMastered = useCallback(
    (no: number) => {
      const mastered = state.mastered.includes(no)
      show(mastered ? '已取消掌握' : '已标记掌握')
      setState((prev) =>
        mastered
          ? { ...prev, mastered: prev.mastered.filter((n) => n !== no) }
          : {
              ...prev,
              mastered: Array.from(new Set([...prev.mastered, no])).sort((a, b) => a - b),
              review: prev.review.filter((n) => n !== no),
            },
      )
    },
    [show, state.mastered],
  )

  const toggleSave = useCallback(
    (no: number) => {
      const saved = state.saved.includes(no)
      show(saved ? '已取消收藏' : '已收藏')
      setState((prev) =>
        saved
          ? { ...prev, saved: prev.saved.filter((n) => n !== no) }
          : { ...prev, saved: Array.from(new Set([...prev.saved, no])).sort((a, b) => a - b) },
      )
    },
    [show, state.saved],
  )

  /** 背诵自评：记住 → 掌握并移出待复习；没记住 → 进待复习并取消掌握 */
  const rateCard = useCallback((no: number, known: boolean) => {
    setState((prev) => {
      if (known) {
        return {
          ...prev,
          mastered: Array.from(new Set([...prev.mastered, no])).sort((a, b) => a - b),
          review: prev.review.filter((n) => n !== no),
          last: no,
        }
      }
      return {
        ...prev,
        mastered: prev.mastered.filter((n) => n !== no),
        review: Array.from(new Set([...prev.review, no])).sort((a, b) => a - b),
        last: no,
      }
    })
  }, [])

  const openItem = useCallback((no: number) => {
    if (!POLITICS_BY_NO.has(no)) return
    setDrawerNo(no)
    setSearchOpen(false)
    setConfirmReset(false)
    setState((prev) => (prev.last === no ? prev : { ...prev, last: no }))
  }, [])

  const closeLayers = useCallback(() => {
    setDrawerNo(null)
    setSearchOpen(false)
    setConfirmReset(false)
  }, [])

  const goPage = useCallback((target: PoliticsPageKey) => {
    setPage(target)
    closeLayers()
  }, [closeLayers])

  const requestRecite = useCallback((scope: string, shuffle?: boolean) => {
    setReciteRequest({ scope, nonce: Date.now(), shuffle })
    setPage('recite')
    setDrawerNo(null)
    setSearchOpen(false)
  }, [])

  const openCategory = useCallback((cat: string) => {
    setFilters({ cat, group: '全部', status: 'all', q: '' })
    setPage('library')
    closeLayers()
  }, [closeLayers])

  const openGroup = useCallback((cat: string, group: string) => {
    setFilters({ cat, group, status: 'all', q: '' })
    setPage('library')
    closeLayers()
  }, [closeLayers])

  const openStatus = useCallback((status: PoliticsFilters['status']) => {
    setFilters({ cat: '全部', group: '全部', status, q: '' })
    setPage('library')
    closeLayers()
  }, [closeLayers])

  const setPrefs = useCallback((patch: Partial<PoliticsRecitePrefs>) => {
    setState((prev) => ({ ...prev, recite: { ...prev.recite, ...patch } }))
  }, [])

  const resetLearning = useCallback(() => {
    setState((prev) => ({
      ...prev,
      mastered: [],
      saved: [],
      review: [],
      last: null,
      visits: [dateKey()],
    }))
    setConfirmReset(false)
    show('学习数据已清空')
  }, [show])

  const copyItem = useCallback(
    async (item: PoliticsItem) => {
      const text = `${item.title}\n${catLabel(item)}\n\n${item.plain}`
      try {
        await navigator.clipboard.writeText(text)
        show('已复制考点内容')
      } catch {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        try {
          document.execCommand('copy')
          show('已复制考点内容')
        } catch {
          show('复制失败，请手动选择')
        }
        ta.remove()
      }
    },
    [show],
  )

  /** 详情抽屉的上一条 / 下一条范围：知识库跟随筛选，史纲跟随阶段，其余按全量 */
  const drawerOrder = useMemo(() => {
    if (page === 'library') return filterItems(filters, state)
    if (page === 'history' && stage) {
      const stageInfo = POLITICS_STAGES.find((s) => s.id === stage)
      if (stageInfo) {
        return stageInfo.items
          .map((no) => POLITICS_BY_NO.get(no))
          .filter((v): v is PoliticsItem => !!v)
      }
    }
    return POLITICS_ITEMS
  }, [filters, page, stage, state])

  /* 键盘：/ 打开搜索，Esc 关闭弹层，左右键在详情里翻页 */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)

      if (e.key === '/' && !typing) {
        e.preventDefault()
        setDrawerNo(null)
        setSearchOpen(true)
        return
      }
      if (e.key === 'Escape') {
        if (confirmReset) setConfirmReset(false)
        else if (searchOpen) setSearchOpen(false)
        else if (drawerNo != null) setDrawerNo(null)
        return
      }
      if (drawerNo != null && !searchOpen && !typing && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        const idx = drawerOrder.findIndex((item) => item.no === drawerNo)
        if (idx < 0) return
        const next = e.key === 'ArrowLeft' ? idx - 1 : idx + 1
        if (next >= 0 && next < drawerOrder.length) openItem(drawerOrder[next].no)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [confirmReset, drawerNo, drawerOrder, openItem, searchOpen])

  const pageStyle = { '--read-scale': String(FONT_SCALE[state.font]) } as CSSProperties

  return (
    <div ref={pageRef} className="pp-root pp-page" style={pageStyle}>
      <header className="pp-head">
        <div className="pp-head-inner">
          <button type="button" className="back-app" onClick={() => navigate('/')} aria-label="返回首页">
            <Icon name="arrowLeft" size={15} />
            <span>返回</span>
          </button>
          <div className="pp-brand">
            <span className="brand-seal">一页</span>
            <div className="pp-brand-text">
              <b>一页纸</b>
              <small>2027 · 考研政治</small>
            </div>
          </div>
          <div className="pp-head-actions">
            <button
              type="button"
              className="search-trigger"
              aria-label="搜索知识点"
              onClick={() => {
                setDrawerNo(null)
                setSearchOpen(true)
              }}
            >
              <Icon name="search" size={16} />
              <span>搜索考点、关键词</span>
              <kbd>/</kbd>
            </button>
            <button
              type="button"
              className="icon-btn mobile-search"
              aria-label="搜索知识点"
              onClick={() => {
                setDrawerNo(null)
                setSearchOpen(true)
              }}
            >
              <Icon name="search" size={17} />
            </button>
          </div>
        </div>
        <nav className="pp-tabs" aria-label="一页纸分区">
          {POLITICS_NAV.map((item) => (
            <button
              key={item.page}
              type="button"
              className={`pp-tab${page === item.page ? ' active' : ''}`}
              aria-current={page === item.page ? 'page' : undefined}
              title={POLITICS_PAGE_NAME[item.page]}
              onClick={() => goPage(item.page)}
            >
              <Icon name={item.icon} size={15} />
              <span>{item.label}</span>
              {item.page === 'recite' && state.review.length > 0 && (
                <span className="pp-tab-badge">{state.review.length > 99 ? '99+' : state.review.length}</span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="pp-main">
        {page === 'home' && (
          <OverviewPage
            state={state}
            onOpenItem={openItem}
            onNav={goPage}
            onSelectCategory={openCategory}
            onOpenSearch={() => setSearchOpen(true)}
            onRandomRecite={() => requestRecite('all', true)}
            onHistoryMeetings={() => {
              setHistoryTab('meetings')
              goPage('history')
            }}
          />
        )}
        {page === 'library' && (
          <LibraryPage
            state={state}
            filters={filters}
            onFiltersChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
            onOpenItem={openItem}
            onToggleMastered={toggleMastered}
            onToggleSave={toggleSave}
          />
        )}
        {page === 'recite' && (
          <RecitePage
            state={state}
            request={reciteRequest}
            onRate={rateCard}
            onPrefs={setPrefs}
            onNav={goPage}
          />
        )}
        {page === 'history' && (
          <HistoryPage
            tab={historyTab}
            onTabChange={setHistoryTab}
            stage={stage}
            onStageChange={setStage}
            onOpenItem={openItem}
            onOpenCategory={openCategory}
            onOpenGroup={openGroup}
          />
        )}
        {page === 'me' && (
          <MePage
            state={state}
            onOpenItem={openItem}
            onOpenStatus={openStatus}
            onStartReview={() => requestRecite('review')}
            onSetFont={(font) => setState((prev) => ({ ...prev, font }))}
            onRequestReset={() => setConfirmReset(true)}
          />
        )}
      </main>

      <ItemDrawer
        no={drawerNo}
        state={state}
        order={drawerOrder}
        onClose={() => setDrawerNo(null)}
        onOpenItem={openItem}
        onToggleMastered={toggleMastered}
        onToggleSave={toggleSave}
        onCopy={(item) => void copyItem(item)}
        onOpenTimeline={() => {
          setDrawerNo(null)
          setHistoryTab('timeline')
          setPage('history')
        }}
      />

      {searchOpen && (
        <SearchModal
          last={state.last}
          onClose={() => setSearchOpen(false)}
          onOpenItem={(no) => {
            setSearchOpen(false)
            openItem(no)
          }}
        />
      )}

      {confirmReset &&
        createPortal(
          <div className="pp-root pp-layer">
            <div className="layer-backdrop" onClick={() => setConfirmReset(false)} />
            <div className="confirm-modal" role="dialog" aria-modal="true" aria-label="确认清空">
              <h2>清空学习数据？</h2>
              <p>
                会清除已掌握、收藏、待复习、最近浏览和连续学习记录。字号设置会保留。这个操作不能撤销。
              </p>
              <div className="confirm-actions">
                <button type="button" className="btn-ghost" onClick={() => setConfirmReset(false)}>
                  取消
                </button>
                <button type="button" className="btn-primary confirm-danger" onClick={resetLearning}>
                  确认清空
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
