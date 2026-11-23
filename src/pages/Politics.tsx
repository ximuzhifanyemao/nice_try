import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../lib/Toast'
import { Icon } from '../components/Icon'
import LibraryPage from '../components/politics/LibraryPage'
import SolutionPage from '../components/politics/SolutionPage'
import WrongPage from '../components/politics/WrongPage'
import HistoryPage from '../components/politics/HistoryPage'
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
} from '../lib/politics'
import {
  fetchPoliticsProgress,
  mergePoliticsProgress,
  savePoliticsProgress,
} from '../lib/politicsProgress'
import {
  clearSolutionAnswer,
  recordSolutionAnswer,
  saveSolutionResume,
} from '../lib/solutionProgress'
import { SOLUTION_QUESTION_MAP, countWrongSolutions } from '../lib/politicsSolutions'
import './politics.css'

/** 阅读字号 → 正文字号缩放（只作用于知识点正文） */
const FONT_SCALE: Record<PoliticsFontSize, number> = { sm: 0.92, md: 1, lg: 1.12 }

/** 进度落库防抖：连续勾选合并成一次请求 */
const CLOUD_SAVE_DEBOUNCE_MS = 800

/**
 * 考研政治「一页纸」。
 *
 * 只保留三个分区：知识库（100 个考点）、解题（知识点 + 对应习题）、史纲（时间轴 + 33 场会议）。
 * - 数据在 src/data/politics.json 与 politics-solutions.json；
 * - 页头「返回」永远直接回首页，而不是退回上一页；
 * - 学习进度与解题作答记录一起存本机（onepaper.state.v1），登录后与 Supabase 合并同步。
 */
export default function Politics() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { show } = useToast()
  const userId = user?.id ?? null
  const pageRef = useRef<HTMLDivElement>(null)

  const [page, setPage] = useState<PoliticsPageKey>(() => {
    const target = new URLSearchParams(location.search).get('page')
    return POLITICS_NAV.find((item) => item.page === target)?.page ?? 'library'
  })
  const [state, setState] = useState<PoliticsLocalState>(() => loadPoliticsState(userId))
  /** state 当前所属账号：切换账号的瞬间 state 还停留在上一账号，禁止把它写进新账号 */
  const [stateOwner, setStateOwner] = useState<string | null>(userId)
  const [filters, setFilters] = useState<PoliticsFilters>(DEFAULT_FILTERS)
  const [drawerNo, setDrawerNo] = useState<number | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [historyTab, setHistoryTab] = useState<'timeline' | 'meetings'>('timeline')
  const [stage, setStage] = useState<string | null>(null)
  /** 云端首轮合并完成前不写云，避免用本机旧数据覆盖另一台设备的进度 */
  const [cloudReady, setCloudReady] = useState(!userId)

  /* 支持从侧边栏 / 首页直达某个分区：/politics?page=solution */
  useEffect(() => {
    const target = new URLSearchParams(location.search).get('page')
    const matched = POLITICS_NAV.find((item) => item.page === target)
    setPage(matched ? matched.page : 'library')
  }, [location.search])

  /* 首次进入记一次访问（连续学习天数） */
  useEffect(() => {
    setState((prev) => {
      const today = dateKey()
      if (prev.visits.includes(today)) return prev
      return { ...prev, visits: [...prev.visits, today].slice(-180) }
    })
  }, [])

  /* 切换账号 / 登出：先切到本账号（或空）的本机进度，避免把上一账号的数据带过去 */
  useEffect(() => {
    setStateOwner(userId)
    setState(loadPoliticsState(userId))
  }, [userId])

  /* 本机持久化：只写 state 自己所属的账号 */
  useEffect(() => {
    if (stateOwner !== userId) return
    savePoliticsState(state, userId)
  }, [state, stateOwner, userId])

  /* 登录用户：先把云端进度与本机取并集，再回写云端 */
  useEffect(() => {
    if (!userId || stateOwner !== userId) {
      setCloudReady(!userId)
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
          visits: merged.visits,
          last: merged.last != null && POLITICS_BY_NO.has(merged.last) ? merged.last : null,
          answers: merged.answers,
        }
      })
      setCloudReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [userId, stateOwner])

  /* 进度变化后防抖落库（考点进度 + 解题作答记录一起写） */
  useEffect(() => {
    // stateOwner 校验：切换账号的首帧 state 仍属于上一账号，绝不能写进新账号的云端
    if (!userId || !cloudReady || stateOwner !== userId) return
    const timer = setTimeout(() => {
      void savePoliticsProgress(userId, {
        mastered: state.mastered,
        saved: state.saved,
        visits: state.visits,
        last: state.last,
        answers: state.answers,
      })
    }, CLOUD_SAVE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [state, userId, cloudReady, stateOwner])

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

  /* 解题作答：记录并入同一份本机状态，登录后随考点进度一起同步；
     同时记住「上一次做到哪一题」，下次进解题可以直接续上 */
  const handleSolutionAnswer = useCallback((no: number, picked: string[], answer: string) => {
    setState((prev) => ({
      ...prev,
      answers: recordSolutionAnswer(prev.answers, no, picked, answer),
    }))
    const ref = SOLUTION_QUESTION_MAP.get(no)
    if (ref) saveSolutionResume({ chapterId: ref.chapter.id, no, at: Date.now() })
  }, [])

  const handleSolutionClear = useCallback((no: number) => {
    setState((prev) => ({ ...prev, answers: clearSolutionAnswer(prev.answers, no) }))
  }, [])

  const openItem = useCallback((no: number) => {
    if (!POLITICS_BY_NO.has(no)) return
    setDrawerNo(no)
    setSearchOpen(false)
    setState((prev) => (prev.last === no ? prev : { ...prev, last: no }))
  }, [])

  const closeLayers = useCallback(() => {
    setDrawerNo(null)
    setSearchOpen(false)
  }, [])

  const goPage = useCallback(
    (target: PoliticsPageKey) => {
      setPage(target)
      closeLayers()
      /* 让地址栏跟上当前分区：刷新后仍停在原分区，桌面侧边栏也能正确高亮 */
      navigate(target === 'library' ? '/politics' : `/politics?page=${target}`, { replace: true })
    },
    [closeLayers, navigate],
  )

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

  /** 错题本角标：当前题库里答错的题数 */
  const wrongCount = useMemo(() => countWrongSolutions(state.answers), [state.answers])

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
        if (searchOpen) setSearchOpen(false)
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
  }, [drawerNo, drawerOrder, openItem, searchOpen])

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
              {item.page === 'wrong' && wrongCount > 0 && (
                <span className="pp-tab-badge">{wrongCount}</span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="pp-main">
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
        {page === 'solution' && (
          <SolutionPage
            progress={state.answers}
            onAnswer={handleSolutionAnswer}
            onClear={handleSolutionClear}
          />
        )}
        {page === 'wrong' && (
          <WrongPage
            progress={state.answers}
            onAnswer={handleSolutionAnswer}
            onClear={handleSolutionClear}
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
    </div>
  )
}
