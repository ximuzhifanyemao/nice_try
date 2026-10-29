// 查词兜底：AI 不可用时展示完整提示词，支持一键复制到其他模型查询
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import { buildLookupPrompt } from '../lib/aiModel'

export default function LookupPromptFallback({ word }: { word: string }) {
  const [copied, setCopied] = useState(false)
  const prompt = buildLookupPrompt(word)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt)
    } catch {
      // 部分 WebView / 非安全上下文没有 clipboard API，退回选中复制
      const textarea = document.createElement('textarea')
      textarea.value = prompt
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
      } catch {
        /* 忽略 */
      }
      textarea.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <details className="mt-3 rounded-xl border border-amber-200/70 bg-amber-50/60 px-3 py-2.5 dark:border-amber-500/20 dark:bg-amber-500/10">
      <summary className="cursor-pointer text-xs font-semibold text-amber-700 dark:text-amber-300">
        AI 查词不可用？复制下面的提示词到其他模型查询
      </summary>
      <pre className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-white/80 p-3 text-[11px] leading-relaxed text-gray-600 dark:bg-slate-900/60 dark:text-slate-300">
        {prompt}
      </pre>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
        >
          <Icon name="copy" size={12} />
          {copied ? '已复制' : '复制提示词'}
        </button>
        <Link
          to="/settings"
          className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 underline-offset-2 hover:underline dark:text-amber-300"
        >
          去设置自己的 AI 模型
        </Link>
      </div>
    </details>
  )
}
