import StudyTimer from '../components/StudyTimer'
import { Icon } from '../components/Icon'
import { useWideLayout } from '../App'

export default function TimerPage() {
  const wide = useWideLayout()
  return (
    <div className={`mx-auto ${wide ? 'max-w-[1280px]' : 'max-w-2xl'} px-4 py-4`}>
      <h1 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-slate-100">
        <Icon name="clock" size={20} className="text-indigo-500" /> 计时
      </h1>
      <StudyTimer />
    </div>
  )
}