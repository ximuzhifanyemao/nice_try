import StudyTimer from '../components/StudyTimer'

export default function TimerPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-4">⏱ 计时</h1>
      <StudyTimer />
    </div>
  )
}