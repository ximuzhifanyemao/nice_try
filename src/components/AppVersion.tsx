import { useState } from 'react'

export default function AppVersion() {
  const [expanded, setExpanded] = useState(false)
  const version = __APP_VERSION__
  const hash = __APP_GIT_HASH__
  const changelog = __APP_GIT_CHANGELOG__ ?? []

  return (
    <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-gray-100 dark:border-slate-700">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-200">版本信息</span>
          <span className="font-mono text-xs text-gray-400 dark:text-slate-500">
            v{version}{hash && ` (${hash})`}
          </span>
        </div>
        <span className={`text-gray-400 dark:text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {expanded && changelog.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-gray-100 dark:border-slate-700 pt-3">
          {changelog.map((item) => (
            <li key={item.hash} className="flex items-start gap-2 text-xs">
              <span className="font-mono text-gray-400 dark:text-slate-500 shrink-0">
                {item.date}
              </span>
              <span className="font-mono text-blue-500 dark:text-blue-400 shrink-0">
                {item.hash}
              </span>
              <span className="text-gray-600 dark:text-slate-300 break-all">
                {item.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
