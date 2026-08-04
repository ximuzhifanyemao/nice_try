import { useState } from 'react'

interface QuickLink {
  name: string
  initial: string
  url: string
  colorClass: string
}

const LINKS: QuickLink[] = [
  {
    name: '哔哩哔哩',
    initial: 'B',
    url: 'https://www.bilibili.com/',
    colorClass: 'bg-[#fb7299]',
  },
  {
    name: 'DeepSeek',
    initial: 'D',
    url: 'https://www.deepseek.com/',
    colorClass: 'bg-[#4d6bfe]',
  },
]

export default function QuickLinks() {
  const [collapsed, setCollapsed] = useState(true)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-3 space-y-1.5">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-1.5 py-1 sm:cursor-default sm:pointer-events-none"
      >
        <span className="text-xs font-medium text-gray-500 dark:text-slate-400">常用网站</span>
        <span className="sm:hidden text-xs text-gray-400 dark:text-slate-500 transition-transform duration-200">
          {collapsed ? '展开 ▾' : '收起 ▴'}
        </span>
      </button>
      <div className={`${collapsed ? 'hidden' : 'block'} sm:block space-y-1.5`}>
        {LINKS.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-1.5 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-sm text-gray-700 dark:text-slate-300 transition-colors"
          >
            <span
              className={`w-7 h-7 rounded-lg text-white text-sm font-bold flex items-center justify-center ${link.colorClass}`}
            >
              {link.initial}
            </span>
            <span>{link.name}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
