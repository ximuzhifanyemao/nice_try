import { useEffect, useRef, useState, type RefObject } from 'react'
import { Icon } from '../Icon'
import { padNo } from '../../lib/politics'
import {
  SOLUTION_CHAPTERS,
  SOLUTION_TOTAL,
  SOLUTION_TYPE_LABEL,
  SOLUTION_UPCOMING,
  findSolutionChapter,
  type SolutionChapter,
  type SolutionKnowledge,
  type SolutionQuestion,
} from '../../lib/politicsSolutions'

/**
 * 解题手册：按专题把「知识点」和「对应习题」接到一起。
 * 每个专题先给该专题的解题知识点（可折叠），紧接着是习题流；
 * 题目为主体，答案与解析默认收起，做完再对。
 */
export default function SolutionPage() {
  const [chapterId, setChapterId] = useState<string | null>(null)
  const pageRef = useRef<HTMLElement>(null)
  const chapter = chapterId ? findSolutionChapter(chapterId) : undefined

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

  if (chapter) {
    return <ChapterView chapter={chapter} onBack={() => setChapterId(null)} sectionRef={pageRef} />
  }

  return (
    <section ref={pageRef} className="page solution-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">解题手册</p>
          <h1 className="page-title">知识点在前，习题在后</h1>
          <p className="page-desc">
            按专题把知识点和真题接到一起：先看这个专题该盯哪些词、怎么判断，再顺着做对应习题。
            题目为主体，答案与解析默认收起，做完再对。
          </p>
        </div>
        <div className="solution-stats">
          <b>{SOLUTION_TOTAL}</b>
          <span>道题 · {SOLUTION_CHAPTERS.length} 个专题</span>
        </div>
      </header>

      <div className="solution-chapters">
        {SOLUTION_CHAPTERS.map((item) => (
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
            <span className="solution-chapter-count">{item.questions.length} 题</span>
            <Icon name="chevronRight" size={15} />
          </button>
        ))}

        {SOLUTION_UPCOMING.map((item) => (
          <div key={item.id} className="solution-chapter-card is-upcoming" aria-disabled="true">
            <span className="solution-chapter-no">{item.id}</span>
            <span className="solution-chapter-main">
              <b>{item.title}</b>
              <small>整理中，随后补齐</small>
            </span>
            <span className="solution-chapter-count">{item.count} 题</span>
          </div>
        ))}
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
}: {
  chapter: SolutionChapter
  onBack: () => void
  sectionRef: RefObject<HTMLElement | null>
}) {
  return (
    <section ref={sectionRef} className="page solution-page">
      <div className="solution-detail-top">
        <button type="button" className="solution-back" onClick={onBack}>
          <Icon name="arrowLeft" size={14} />
          <span>全部专题</span>
        </button>
        <span className="solution-detail-count">共 {chapter.questions.length} 题</span>
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
          <QuestionCard key={question.no} question={question} />
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

function QuestionCard({ question }: { question: SolutionQuestion }) {
  const [open, setOpen] = useState(false)
  const answerLetters = new Set(question.answer.split(''))

  return (
    <article className={`solution-question${open ? ' is-open' : ''}`}>
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
          const right = open && answerLetters.has(option.label)
          return (
            <li key={option.label} className={right ? 'is-answer' : ''}>
              <span className="solution-option-label">{option.label}</span>
              <span className="solution-option-text">{option.text}</span>
            </li>
          )
        })}
      </ul>

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
