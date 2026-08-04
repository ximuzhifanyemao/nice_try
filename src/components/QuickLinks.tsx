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
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-3 space-y-1.5">
      <p className="text-xs font-medium text-gray-500 dark:text-slate-400 px-1.5">常用网站</p>
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
  )
}
