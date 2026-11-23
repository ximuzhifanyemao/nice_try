import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Icon } from '../Icon'
import { padNo } from '../../lib/politics'
import {
  SOLUTION_CHAPTERS,
  SOLUTION_TOTAL,
  findSolutionChapter,
  type SolutionChapter,
  type SolutionKnowledge,
} from '../../lib/politicsSolutions'
import {
  loadSolutionResume,
  saveSolutionResume,
  summarizeSolution,
  type SolutionProgress,
  type SolutionResume,
} from '../../lib/solutionProgress'
import QuestionCard from './QuestionCard'

/**
 * 解题手册：按专题把「知识点」和「对应习题」接到一起。
 * 每个专题先给该专题的解题知识点（可折叠），紧接着是习题流；
 * 选项可以直接点选，提交后立即判对错。
 *
 * 作答记录由外层政治页统一持有（和考点进度一起存本机 + 同步云端），
 * 这里只负责展示与回传，保证换设备 / 重装后进度还能拿回来。
 */
export default function SolutionPage({
  progress,
  onAnswer,
  onClear,
}: {
  progress: SolutionProgress
  onAnswer: (no: number, picked: string[], answer: string) => void
  onClear: (no: number) => void
}) {
  const [chapterId, setChapterId] = useState<string | null>(null)
  /** 进入专题时要定位到的题号（从「上次做到」/错题跳转过来时） */
  const [focusNo, setFocusNo] = useState<number | null>(null)
  const [resume, setResume] = useState<SolutionResume | null>(() => loadSolutionResume())
  const pageRef = useRef<HTMLElement>(null)
  const chapter = chapterId ? findSolutionChapter(chapterId) : undefined
  const resumeChapter = resume ? findSolutionChapter(resume.chapterId) : undefined
  /** 目标题号确实在当前专题里时才跳过回顶，避免题库调整后停在旧位置 */
  const hasFocusTarget =
    !!chapter && focusNo != null && chapter.questions.some((question) => question.no === focusNo)

  const scrollTop = useCallback(() => {
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
  }, [])

  /* 进入 / 退出专题时把滚动位置带回顶部；带题号定位时交给专题内部滚到该题 */
  useEffect(() => {
    if (hasFocusTarget) return
    scrollTop()
  }, [chapterId, hasFocusTarget, scrollTop])

  /** 打开专题；同时记住「上一次做题的位置」 */
  const openChapter = useCallback(
    (id: string, targetNo: number | null = null) => {
      setChapterId(id)
      setFocusNo(targetNo)
      const next: SolutionResume = {
        chapterId: id,
        no: targetNo ?? (resume?.chapterId === id ? resume.no : null),
        at: Date.now(),
      }
      setResume(next)
      saveSolutionResume(next)
    },
    [resume],
  )

  const closeChapter = useCallback(() => {
    setChapterId(null)
    setFocusNo(null)
  }, [])

  /** 作答后同步本地位置（落盘由外层统一处理，错题本作答也会更新同一份位置） */
  const handleAnswer = useCallback(
    (no: number, picked: string[], answer: string) => {
      onAnswer(no, picked, answer)
      if (!chapterId) return
      setResume({ chapterId, no, at: Date.now() })
    },
    [chapterId, onAnswer],
  )

  const allQuestionNos = useMemo(
    () => SOLUTION_CHAPTERS.flatMap((item) => item.questions.map((question) => question.no)),
    [],
  )
  const summary = useMemo(() => summarizeSolution(progress, allQuestionNos), [progress, allQuestionNos])

  if (chapter) {
    return (
      <ChapterView
        chapter={chapter}
        onBack={closeChapter}
        sectionRef={pageRef}
        progress={progress}
        onAnswer={handleAnswer}
        onClear={onClear}
        focusNo={focusNo}
      />
    )
  }

  return (
    <section ref={pageRef} className="page solution-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">解题手册</p>
          <h1 className="page-title">知识点在前，习题在后</h1>
          <p className="page-desc">
            按专题把知识点和真题接到一起：先看这个专题该盯哪些词、怎么判断，再顺着做对应习题。
            点选项就能判对错，答案与解析做完再对。
          </p>
        </div>
        <div className="solution-stats">
          <b>{SOLUTION_TOTAL}</b>
          <span>道题 · {SOLUTION_CHAPTERS.length} 个专题</span>
        </div>
      </header>

      {resume && resumeChapter && (
        <button
          type="button"
          className="solution-resume"
          onClick={() => openChapter(resumeChapter.id, resume.no)}
        >
          <span className="solution-resume-icon">
            <Icon name="history" size={17} />
          </span>
          <span className="solution-resume-main">
            <b>
              上次{resume.no != null ? '做到' : '看到'} 专题 {resumeChapter.id}
              {resume.no != null && ` · 习题 ${padNo(resume.no)}`}
            </b>
            <small>
              {resumeChapter.title} · {resumeTimeLabel(resume.at)}
            </small>
          </span>
          <span className="solution-resume-go">
            {resume.no != null ? '继续做题' : '进入专题'}
            <Icon name="arrowRight" size={13} />
          </span>
        </button>
      )}

      <div className="solution-progress">
        <div className="solution-progress-text">
          <span>
            已做 <b>{summary.done}</b> / {SOLUTION_TOTAL} 题
          </span>
          <span>
            {summary.done > 0
              ? `答对 ${summary.correct} 题 · 正确率 ${summary.rate}%`
              : '选一个专题开始，作答会自动保存'}
          </span>
        </div>
        <div className="solution-progress-track" aria-hidden="true">
          <span style={{ width: `${SOLUTION_TOTAL > 0 ? (summary.done / SOLUTION_TOTAL) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="solution-chapters">
        {SOLUTION_CHAPTERS.map((item) => {
          const chapterSummary = summarizeSolution(
            progress,
            item.questions.map((question) => question.no),
          )
          return (
            <button
              key={item.id}
              type="button"
              className="solution-chapter-card"
              onClick={() => openChapter(item.id)}
            >
              <span className="solution-chapter-no">{item.id}</span>
              <span className="solution-chapter-main">
                <b>{item.title}</b>
                <small>{item.desc}</small>
              </span>
              <span className={`solution-chapter-count${chapterSummary.done > 0 ? ' is-done' : ''}`}>
                {chapterSummary.done > 0
                  ? `已做 ${chapterSummary.done}/${item.questions.length}`
                  : `${item.questions.length} 题`}
              </span>
              <Icon name="chevronRight" size={15} />
            </button>
          )
        })}
      </div>

      <p className="solution-footnote">
        题目与解析整理自《2027 这就是一页纸 · 考研政治解题方法手册》。知识点是解题提示，不是逐字背诵材料；
        做完题再回看知识点，效果最好。
      </p>
    </section>
  )
}

function ChapterView({
  chapter,
  onBack,
  sectionRef,
  progress,
  onAnswer,
  onClear,
  focusNo,
}: {
  chapter: SolutionChapter
  onBack: () => void
  sectionRef: RefObject<HTMLElement | null>
  progress: SolutionProgress
  onAnswer: (no: number, picked: string[], answer: string) => void
  onClear: (no: number) => void
  /** 从「上次做到」进来时定位到的题号 */
  focusNo: number | null
}) {
  const [highlightNo, setHighlightNo] = useState<number | null>(null)
  const summary = summarizeSolution(
    progress,
    chapter.questions.map((question) => question.no),
  )

  /* 恢复上次位置：等这一章渲染完成后把目标题滚到屏幕中间，并短暂高亮 */
  useEffect(() => {
    if (focusNo == null) return
    const el = document.getElementById(`solution-q-${focusNo}`)
    if (!el) return
    setHighlightNo(focusNo)
    const raf = window.requestAnimationFrame(() => {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
    const timer = window.setTimeout(() => setHighlightNo(null), 2400)
    return () => {
      window.cancelAnimationFrame(raf)
      window.clearTimeout(timer)
    }
  }, [focusNo])

  return (
    <section ref={sectionRef} className="page solution-page">
      <div className="solution-detail-top">
        <button type="button" className="solution-back" onClick={onBack}>
          <Icon name="arrowLeft" size={14} />
          <span>全部专题</span>
        </button>
        <span className="solution-detail-count">
          共 {chapter.questions.length} 题
          {summary.done > 0 && ` · 已做 ${summary.done} 题 · 正确 ${summary.correct} 题`}
        </span>
      </div>

      <header className="solution-detail-head">
        <p className="eyebrow">CHAPTER {chapter.id}</p>
        <h1 className="page-title">{chapter.title}</h1>
        <p className="page-desc">{chapter.desc}</p>
      </header>

      <div className="solution-knowledge">
        <div className="solution-knowledge-head">
          <span className="solution-knowledge-eyebrow">知识点</span>
          <h2>做题之前，先把这些词盯住</h2>
        </div>
        {chapter.knowledge.map((card, index) => (
          <KnowledgeCard key={card.title} card={card} index={index} />
        ))}
      </div>

      <div className="solution-question-head">
        <div>
          <h2>对应习题</h2>
          <p>按题号顺序，先自己做，再展开答案与解析。</p>
        </div>
        <span>{chapter.questions.length} 题</span>
      </div>

      <div className="solution-question-list">
        {chapter.questions.map((question) => (
          <div key={question.no} id={`solution-q-${question.no}`}>
            <QuestionCard
              question={question}
              saved={progress[String(question.no)]}
              onAnswer={onAnswer}
              onClear={onClear}
              highlighted={highlightNo === question.no}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

function KnowledgeCard({ card, index }: { card: SolutionKnowledge; index: number }) {
  const [open, setOpen] = useState(index === 0)

  return (
    <section className={`solution-kp${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="solution-kp-summary"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="solution-kp-index">{String(index + 1).padStart(2, '0')}</span>
        <span className="solution-kp-title">{card.title}</span>
        <Icon name="chevronDown" size={14} />
      </button>
      {open && (
        <div className="solution-kp-body">
          {card.intro && <p className="solution-kp-intro">{card.intro}</p>}
          {card.groups.map((group) => (
            <div key={group.label} className="solution-kp-group">
              <span className="solution-kp-label">{group.label}</span>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/** 上次做题时间的轻量展示：今天 / 昨天 / 月日 */
function resumeTimeLabel(at: number): string {
  if (!at) return '上次学习'
  const date = new Date(at)
  if (!Number.isFinite(date.getTime())) return '上次学习'
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  if (at >= todayStart) return `今天 ${time}`
  if (at >= todayStart - 86_400_000) return `昨天 ${time}`
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`
}
