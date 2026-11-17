import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Icon } from '../Icon'
import { padNo } from '../../lib/politics'
import {
  SOLUTION_CHAPTERS,
  SOLUTION_TOTAL,
  SOLUTION_TYPE_LABEL,
  findSolutionChapter,
  type SolutionChapter,
  type SolutionKnowledge,
  type SolutionQuestion,
} from '../../lib/politicsSolutions'
import {
  clearSolutionAnswer,
  isSolutionCorrect,
  loadSolutionProgress,
  recordSolutionAnswer,
  saveSolutionProgress,
  summarizeSolution,
  type SolutionAnswer,
  type SolutionProgress,
} from '../../lib/solutionProgress'

const STORAGE_KEY = 'kaoyan_solution_progress_v1'

/**
 * 解题手册：按专题把「知识点」和「对应习题」接到一起。
 * 每个专题先给该专题的解题知识点（可折叠），紧接着是习题流；
 * 选项可以直接点选，提交后立即判对错，作答进度保存在本机。
 */
export default function SolutionPage() {
  const [chapterId, setChapterId] = useState<string | null>(null)
  const [progress, setProgress] = useState<SolutionProgress>(() => loadSolutionProgress())
  const pageRef = useRef<HTMLElement>(null)
  const chapter = chapterId ? findSolutionChapter(chapterId) : undefined

  /* 本机持久化：每次作答 / 重做后自动落盘 */
  useEffect(() => {
    saveSolutionProgress(progress)
  }, [progress])

  /* 多标签页 / 多窗口同步：另一个窗口答完题，这边也立即更新 */
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setProgress(loadSolutionProgress())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  /* 进入 / 退出专题时把滚动位置带回顶部（兼容桌面端内容列自身的滚动容器） */
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
  }, [chapterId])

  const allQuestionNos = useMemo(
    () => SOLUTION_CHAPTERS.flatMap((item) => item.questions.map((question) => question.no)),
    [],
  )
  const summary = useMemo(() => summarizeSolution(progress, allQuestionNos), [progress, allQuestionNos])

  const handleAnswer = useCallback((no: number, picked: string[], answer: string) => {
    setProgress((prev) => recordSolutionAnswer(prev, no, picked, answer))
  }, [])

  const handleClear = useCallback((no: number) => {
    setProgress((prev) => clearSolutionAnswer(prev, no))
  }, [])

  if (chapter) {
    return (
      <ChapterView
        chapter={chapter}
        onBack={() => setChapterId(null)}
        sectionRef={pageRef}
        progress={progress}
        onAnswer={handleAnswer}
        onClear={handleClear}
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
              onClick={() => setChapterId(item.id)}
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
}: {
  chapter: SolutionChapter
  onBack: () => void
  sectionRef: RefObject<HTMLElement | null>
  progress: SolutionProgress
  onAnswer: (no: number, picked: string[], answer: string) => void
  onClear: (no: number) => void
}) {
  const summary = summarizeSolution(
    progress,
    chapter.questions.map((question) => question.no),
  )

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
          <QuestionCard
            key={question.no}
            question={question}
            saved={progress[String(question.no)]}
            onAnswer={onAnswer}
            onClear={onClear}
          />
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

function QuestionCard({
  question,
  saved,
  onAnswer,
  onClear,
}: {
  question: SolutionQuestion
  saved?: SolutionAnswer
  onAnswer: (no: number, picked: string[], answer: string) => void
  onClear: (no: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<string[]>(() => saved?.picked ?? [])
  const [submitted, setSubmitted] = useState(Boolean(saved))
  const answerLetters = useMemo(() => new Set(question.answer.split('')), [question.answer])

  /* 外部进度变化（另一个窗口作答 / 重做）时同步本卡片 */
  useEffect(() => {
    setPicked(saved?.picked ?? [])
    setSubmitted(Boolean(saved))
  }, [saved])

  const correct = isSolutionCorrect(picked, question.answer)

  const submit = (nextPicked: string[]) => {
    if (!nextPicked.length) return
    setPicked(nextPicked)
    setSubmitted(true)
    setOpen(true)
    onAnswer(question.no, nextPicked, question.answer)
  }

  const choose = (label: string) => {
    if (submitted) return
    if (question.type === 'single') {
      submit([label])
      return
    }
    setPicked((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label].sort(),
    )
  }

  const reset = () => {
    setPicked([])
    setSubmitted(false)
    setOpen(false)
    onClear(question.no)
  }

  return (
    <article className={`solution-question${open ? ' is-open' : ''}${submitted ? ' is-submitted' : ''}`}>
      <header className="solution-question-top">
        <span className="solution-question-no">习题 {padNo(question.no)}</span>
        <span className={`solution-question-type ${question.type}`}>
          {SOLUTION_TYPE_LABEL[question.type]}
        </span>
        <span className="solution-question-source">{question.source}</span>
        <button
          type="button"
          className="solution-question-toggle"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? '收起答案' : '答案 / 解析'}
          <Icon name="chevronDown" size={13} />
        </button>
      </header>

      <p className="solution-question-stem">{question.stem}</p>

      <ul className="solution-question-options">
        {question.options.map((option) => {
          const right = (open || submitted) && answerLetters.has(option.label)
          const wrong = submitted && picked.includes(option.label) && !answerLetters.has(option.label)
          const active = !submitted && picked.includes(option.label)
          return (
            <li key={option.label}>
              <button
                type="button"
                className={`solution-option${right ? ' is-answer' : ''}${wrong ? ' is-wrong' : ''}${
                  active ? ' is-pick' : ''
                }`}
                aria-pressed={picked.includes(option.label)}
                disabled={submitted}
                onClick={() => choose(option.label)}
              >
                <span className="solution-option-label">{option.label}</span>
                <span className="solution-option-text">{option.text}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="solution-question-actions">
        {submitted ? (
          <>
            <span className={`solution-result${correct ? ' is-right' : ' is-wrong'}`}>
              {correct
                ? `回答正确 · 答案 ${question.answer}`
                : `回答错误 · 你的答案 ${picked.join('') || '—'}，正确答案 ${question.answer}`}
            </span>
            <button type="button" className="solution-retry" onClick={reset}>
              重做
            </button>
          </>
        ) : (
          <>
            {question.type === 'multi' && (
              <button
                type="button"
                className="solution-submit"
                disabled={picked.length === 0}
                onClick={() => submit(picked)}
              >
                提交答案
              </button>
            )}
            <span className="solution-question-hint">
              {question.type === 'single' ? '点选项直接判对错' : '可多选，选好后提交'}
            </span>
          </>
        )}
      </div>

      {open && (
        <div className="solution-answer">
          <div className="solution-answer-line">
            <span>答案</span>
            <b>{question.answer}</b>
          </div>
          {question.explanation && <p className="solution-explanation">{question.explanation}</p>}
        </div>
      )}
    </article>
  )
}
