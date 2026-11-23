import { useMemo, useState } from 'react'
import { Icon } from '../Icon'
import { SOLUTION_CHAPTERS, SOLUTION_QUESTION_MAP } from '../../lib/politicsSolutions'
import type { SolutionProgress } from '../../lib/solutionProgress'
import QuestionCard from './QuestionCard'

/** 收集当前题库里答错的题号，按题号（即专题顺序）排列 */
function collectWrongNos(progress: SolutionProgress): number[] {
  return Array.from(SOLUTION_QUESTION_MAP.keys())
    .filter((no) => {
      const answer = progress[String(no)]
      return !!answer && !answer.correct
    })
    .sort((a, b) => a - b)
}

/**
 * 错题本：把答错的习题集中到一处，直接就地重做。
 *
 * 进入时对错题取一份快照，答对后卡片留在原位显示「回答正确」，
 * 避免列表当场抽走一行；真正的错题数（页头）会实时减少，
 * 离开后再次进入时答对的题已移出错题本。
 */
export default function WrongPage({
  progress,
  onAnswer,
  onClear,
}: {
  progress: SolutionProgress
  onAnswer: (no: number, picked: string[], answer: string) => void
  onClear: (no: number) => void
}) {
  const [nos] = useState<number[]>(() => collectWrongNos(progress))

  const groups = useMemo(
    () =>
      SOLUTION_CHAPTERS.map((chapter) => ({
        chapter,
        questions: nos.flatMap((no) => {
          const ref = SOLUTION_QUESTION_MAP.get(no)
          return ref && ref.chapter.id === chapter.id ? [ref.question] : []
        }),
      })).filter((group) => group.questions.length > 0),
    [nos],
  )

  const remaining = useMemo(
    () => nos.filter((no) => !progress[String(no)]?.correct).length,
    [nos, progress],
  )

  return (
    <section className="page solution-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">错题本</p>
          <h1 className="page-title">错的题，单独再过一遍</h1>
          <p className="page-desc">
            答错的题会自动收进来，按专题排好直接重做。再答一次就对，就会从错题本里移出。
          </p>
        </div>
        <div className="solution-stats">
          <b>{remaining}</b>
          <span>道错题</span>
        </div>
      </header>

      {groups.length === 0 ? (
        <div className="empty-state">
          <b>还没有错题</b>
          去「解题」里做几道题，答错的会自动收到这里。
        </div>
      ) : (
        <>
          {remaining === 0 && (
            <p className="solution-wrong-done">
              <Icon name="check" size={14} />
              本次错题都已答对，离开错题本后这些题会被清掉。
            </p>
          )}
          {groups.map(({ chapter, questions }) => (
            <section key={chapter.id} className="solution-wrong-group">
              <div className="solution-wrong-head">
                <span className="solution-wrong-chapter">专题 {chapter.id}</span>
                <b>{chapter.title}</b>
                <span className="solution-wrong-count">{questions.length} 道错题</span>
              </div>
              <div className="solution-question-list">
                {questions.map((question) => (
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
          ))}
        </>
      )}
    </section>
  )
}
