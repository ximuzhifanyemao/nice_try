import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../Icon'
import { padNo } from '../../lib/politics'
import { SOLUTION_TYPE_LABEL, type SolutionQuestion } from '../../lib/politicsSolutions'
import { isSolutionCorrect, type SolutionAnswer } from '../../lib/solutionProgress'

/**
 * 单道习题卡片：选题 → 立即判对错 → 展开答案与解析。
 * 专题页与错题本共用同一张卡片，保证两处作答体验一致。
 */
export default function QuestionCard({
  question,
  saved,
  onAnswer,
  onClear,
  highlighted = false,
}: {
  question: SolutionQuestion
  saved?: SolutionAnswer
  onAnswer: (no: number, picked: string[], answer: string) => void
  onClear: (no: number) => void
  /** 从「上次做到」定位进来时的短暂高亮 */
  highlighted?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<string[]>(() => saved?.picked ?? [])
  const [submitted, setSubmitted] = useState(Boolean(saved))
  const answerLetters = useMemo(() => new Set(question.answer.split('')), [question.answer])

  /* 外部进度变化（另一个窗口作答 / 重做 / 错题本重做）时同步本卡片 */
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
    <article
      className={`solution-question${open ? ' is-open' : ''}${submitted ? ' is-submitted' : ''}${
        highlighted ? ' is-focus' : ''
      }`}
    >
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
