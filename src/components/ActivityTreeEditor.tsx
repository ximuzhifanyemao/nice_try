import { useEffect, useRef, useState } from 'react'
import { buildActivityPath, groupActivities } from '../lib/subjects'

/** 一个分支（如「高数」）及其勾选的学习内容；id 只用于 React key 与草稿归属，不落盘 */
interface BranchRow {
  id: string
  name: string
  /** 该分支包含的学习内容名（对应上面的内容清单） */
  picks: string[]
}

let uidSeq = 0
const nextUid = () => `b${++uidSeq}`

interface ActivityTreeEditorProps {
  /** 学习内容路径列表：'高数/听课' 表示两层，'复盘' 表示不分层的顶层内容 */
  value: string[]
  onChange: (next: string[]) => void
}

/** 把路径列表拆成「分支 + 共用学习内容」两个清单（兼容旧数据：不含 '/' 的条目统统是顶层内容） */
function splitValue(value: string[]): { contents: string[]; branches: BranchRow[] } {
  const tree = groupActivities(value)
  if (tree.groups.length === 0) {
    return { contents: tree.leaves, branches: [] }
  }
  // 内容清单 = 各分支内容的并集（保序）；分支各自记住实际勾选的内容
  const contents: string[] = []
  for (const g of tree.groups) {
    for (const a of g.activities) if (!contents.includes(a)) contents.push(a)
  }
  return {
    contents,
    branches: tree.groups.map((g) => ({ id: nextUid(), name: g.name, picks: [...g.activities] })),
  }
}

/**
 * 学习内容编辑器：按「分支 × 学习内容」的方式搭建两级归类。
 * 例：科目「数学」→ 内容「听课 / 练习 / 套卷 / 复盘」→ 分支「高数」「线代」，
 * 新建的分支默认包含全部内容，所以只填两处就能得到 2×4 的完整组合。
 * 数据仍存成路径数组（'高数/听课'），不改云端表结构，历史扁平内容照旧可用。
 * 单个分支也可以取消勾选某项内容（如线代不做套卷）。
 */
export default function ActivityTreeEditor({ value, onChange }: ActivityTreeEditorProps) {
  const initial = useRef(splitValue(value))
  /** 学习内容（列）：各分支共用的内容清单 */
  const [contents, setContents] = useState<string[]>(initial.current.contents)
  /** 分支（行）：名称为空的分支在保存时自动退化为顶层内容 */
  const [branches, setBranches] = useState<BranchRow[]>(initial.current.branches)
  /** 输入框草稿：'content' 为内容输入，'b:<id>' 为分支名输入 */
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  /** 最近一次对外发出的值；与外部 value 相同说明是本组件自己改的，不必重置内部结构 */
  const emittedRef = useRef<string[]>(value)

  // 外部换了另一份学习内容（如切换到别的科目编辑）时，重建内部结构
  useEffect(() => {
    const same = value.length === emittedRef.current.length && value.every((v, i) => v === emittedRef.current[i])
    if (same) return
    const next = splitValue(value)
    setContents(next.contents)
    setBranches(next.branches)
    setDrafts({})
    emittedRef.current = value
  }, [value])

  const emit = (nextContents: string[], nextBranches: BranchRow[]) => {
    const next: string[] = []
    const used = new Set<string>()
    for (const b of nextBranches) {
      const name = b.name.trim()
      for (const c of b.picks) {
        if (name) used.add(c)
        next.push(buildActivityPath(name, c))
      }
    }
    // 未被任何分支用到的内容（含未命名分支里的内容）作为顶层内容保留，避免丢失
    for (const c of nextContents) if (!used.has(c)) next.push(c)
    emittedRef.current = next
    onChange(next)
  }

  const setDraft = (key: string, text: string) => setDrafts((d) => ({ ...d, [key]: text }))
  const draftOf = (key: string) => drafts[key] ?? ''

  /** 新增学习内容：自动加入所有分支（矩阵里的新一列默认每行都勾选） */
  const addContent = () => {
    const text = draftOf('content').trim()
    setDraft('content', '')
    if (!text || contents.includes(text)) return
    const nextContents = [...contents, text]
    const nextBranches = branches.map((b) => ({ ...b, picks: [...b.picks, text] }))
    setContents(nextContents)
    setBranches(nextBranches)
    emit(nextContents, nextBranches)
  }

  /** 删除学习内容：同时从所有分支里移除 */
  const removeContent = (content: string) => {
    const nextContents = contents.filter((c) => c !== content)
    const nextBranches = branches.map((b) => ({ ...b, picks: b.picks.filter((c) => c !== content) }))
    setContents(nextContents)
    setBranches(nextBranches)
    emit(nextContents, nextBranches)
  }

  /** 勾选/取消勾选某分支的某项内容 */
  const togglePick = (rowId: string, content: string) => {
    const nextBranches = branches.map((b) =>
      b.id === rowId
        ? { ...b, picks: b.picks.includes(content) ? b.picks.filter((c) => c !== content) : [...b.picks, content] }
        : b,
    )
    setBranches(nextBranches)
    emit(contents, nextBranches)
  }

  const renameBranch = (rowId: string, name: string) => {
    const nextBranches = branches.map((b) => (b.id === rowId ? { ...b, name } : b))
    setBranches(nextBranches)
    emit(contents, nextBranches)
  }

  /** 新增分支：默认勾选全部学习内容 */
  const addBranch = () => {
    const nextBranches = [...branches, { id: nextUid(), name: '', picks: [...contents] }]
    setBranches(nextBranches)
    emit(contents, nextBranches)
  }

  const removeBranch = (rowId: string) => {
    const nextBranches = branches.filter((b) => b.id !== rowId)
    setBranches(nextBranches)
    emit(contents, nextBranches)
  }

  const draftInputClass =
    'h-6 shrink-0 rounded-md border border-dashed border-gray-300 bg-white px-2 text-[11px] text-gray-700 outline-none transition-colors focus:border-solid focus:border-indigo-400 placeholder:text-gray-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500'
  const chipClass =
    'inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-700 dark:text-slate-300'
  const sectionLabel = 'shrink-0 text-[11px] font-medium text-gray-500 dark:text-slate-400'
  const hint = 'text-[11px] leading-relaxed text-gray-400 dark:text-slate-500'

  return (
    <div className="space-y-2">
      {/* ① 学习内容：各分支共用的清单 */}
      <div className="rounded-lg border border-gray-200 bg-white p-2 dark:border-slate-600 dark:bg-slate-700/30">
        <div className="flex flex-wrap items-start gap-x-2 gap-y-1.5">
          <span className={`${sectionLabel} h-6 leading-6`}>学习内容</span>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            {contents.map((c) => (
              <span key={c} className={chipClass}>
                {c}
                <button
                  type="button"
                  onClick={() => removeContent(c)}
                  aria-label={`删除 ${c}`}
                  className="cursor-pointer text-gray-400 transition-colors hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              value={draftOf('content')}
              onChange={(e) => setDraft('content', e.target.value)}
              onBlur={addContent}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addContent()
                }
              }}
              placeholder="+ 听课、练习、套卷…"
              className={`${draftInputClass} w-[132px]`}
            />
          </div>
        </div>
        <p className={`${hint} mt-1`}>
          先在这里列清单（如 听课、练习、套卷、复盘），下面每个分支默认都会包含它们。
        </p>
      </div>

      {/* ② 分支：每行一个分支，勾选它包含的学习内容 */}
      {branches.map((b) => (
        <div
          key={b.id}
          className="rounded-lg border border-gray-200 bg-white p-2 dark:border-slate-600 dark:bg-slate-700/30"
        >
          <div className="flex flex-wrap items-start gap-x-2 gap-y-1.5">
            <input
              value={b.name}
              onChange={(e) => renameBranch(b.id, e.target.value)}
              placeholder="分支名，如：高数"
              className={`${draftInputClass} w-[96px] border-solid`}
            />
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
              {contents.length === 0 ? (
                <span className="text-[11px] text-gray-400 dark:text-slate-500">先在上面添加学习内容</span>
              ) : (
                contents.map((c) => {
                  const on = b.picks.includes(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => togglePick(b.id, c)}
                      aria-pressed={on}
                      className={`cursor-pointer rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                        on
                          ? 'border-indigo-300 bg-indigo-50 font-medium text-indigo-600 dark:border-indigo-500/50 dark:bg-indigo-500/15 dark:text-indigo-300'
                          : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-500 dark:hover:text-slate-300'
                      }`}
                    >
                      {c}
                    </button>
                  )
                })
              )}
            </div>
            <button
              type="button"
              onClick={() => removeBranch(b.id)}
              className="h-6 shrink-0 cursor-pointer rounded-md px-1.5 text-[11px] text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:text-slate-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            >
              删除分支
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addBranch}
        className="w-full cursor-pointer rounded-lg border border-dashed border-indigo-300 bg-white px-3 py-1.5 text-[12px] font-medium text-indigo-600 transition-colors hover:bg-indigo-50 dark:border-indigo-500/50 dark:bg-slate-800/40 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
      >
        + 添加分支
      </button>

      <p className={hint}>
        分支可以是「高数」「线代」，也可以是「套卷」；每个分支自己勾选包含的内容。
        计时时先看到分支名，点进去才看到该分支的内容；不在任何分支里的内容会直接出现在首层，点了立即开始。
      </p>
    </div>
  )
}
