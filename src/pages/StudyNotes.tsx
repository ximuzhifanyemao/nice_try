import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../lib/Toast'
import { useWideLayout } from '../App'
import { Icon } from '../components/Icon'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import ImageCropDialog from '../components/ImageCropDialog'
import VocabularyPanel, { type VocabularyStats } from '../components/VocabularyPanel'
import ExamQuestionPicker, {
  ExamQuestionList,
  SECTION_LABELS,
} from '../components/ExamQuestionPicker'
import { getQuestionsByIds, type ExamQuestion } from '../lib/exam408'
import { loadVocabulary } from '../lib/vocabulary'
import {
  MAX_NOTE_IMAGES,
  STUDY_CATEGORIES,
  categoryLabel,
  newNoteId,
  loadStudyNotes,
  saveStudyNotes,
  sortNotes,
  syncStudyNotes,
  pushStudyNote,
  deleteStudyNoteFromCloud,
  uploadNoteImage,
  deleteNoteImages,
  resolveNoteImageUrls,
  type StudyNote,
  type StudySubject,
} from '../lib/studyNotes'

/** 两个科目沿用全站「数学=蓝、408=紫」的类别色，避免和计时/统计页的科目颜色打架 */
const SUBJECT_META: Record<
  StudySubject,
  { label: string; dot: string; badge: string; active: string }
> = {
  math: {
    label: '数学',
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    active: 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-500/15 dark:text-blue-300',
  },
  cs408: {
    label: '408',
    dot: 'bg-violet-500',
    badge: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    active:
      'border-violet-500 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-500/15 dark:text-violet-300',
  },
}

const SUBJECT_KEYS: StudySubject[] = ['math', 'cs408']

/** 二级科目 chip 的通用样式（编辑器与筛选栏共用） */
const CHIP_BASE = 'cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors'
const CHIP_ACTIVE =
  'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-300'
const CHIP_IDLE =
  'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800/60'

/** 列表卡片的日期展示：数据异常时不抛错 */
function formatNoteDate(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return format(d, 'M月d日 HH:mm')
  } catch {
    return ''
  }
}

/** 题干摘要：编辑器里只展示前若干字 */
function truncateText(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

type PendingUpload = { id: string; preview: string }
type PendingImageEdit = { id: string; file: File }

/** 页面内的两个分区：知识点（数学 / 408）与英语生词 */
type NotesTab = 'notes' | 'vocab'

export default function StudyNotes() {
  const wide = useWideLayout()
  const { user } = useAuth()
  const toast = useToast()

  // 分区走 URL：/study-notes?tab=vocab 可以直接打开生词，旧的 /vocabulary 也能跳过来
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab: NotesTab = searchParams.get('tab') === 'vocab' ? 'vocab' : 'notes'
  const [vocabStats, setVocabStats] = useState<VocabularyStats>(() => {
    const cached = loadVocabulary()
    return { days: cached.length, words: cached.reduce((sum, d) => sum + d.words.length, 0) }
  })

  const [notes, setNotes] = useState<StudyNote[]>(() => loadStudyNotes())
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [cloudOk, setCloudOk] = useState(true)

  // —— 筛选 ——
  const [filter, setFilter] = useState<'all' | StudySubject>('all')
  /** 二级科目筛选，空字符串 = 全部二级科目 */
  const [filterCategory, setFilterCategory] = useState('')
  const [query, setQuery] = useState('')
  /** 默认只看未掌握：记一记的核心用法是「反复看自己还没弄懂的」 */
  const [onlyUnmastered, setOnlyUnmastered] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // —— 编辑器 ——
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [subject, setSubject] = useState<StudySubject>('math')
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [pageRef, setPageRef] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [pending, setPending] = useState<PendingUpload[]>([])
  /** 选好但还没裁剪 / 上传的图片：一次只处理队首那张 */
  const [cropQueue, setCropQueue] = useState<PendingImageEdit[]>([])
  const [saving, setSaving] = useState(false)

  // —— 关联真题 ——
  const [examPickerOpen, setExamPickerOpen] = useState(false)
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([])
  /** 编辑器里展示题目摘要用；题库未收录的 id 不在 Map 里 */
  const [selectedExamDetail, setSelectedExamDetail] = useState<Map<string, ExamQuestion>>(new Map())
  const [selectedExamLoading, setSelectedExamLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  /** 本次编辑中新上传的图片：取消/删除表单时要一并清理，避免留下孤儿文件 */
  const uploadedThisSession = useRef<Set<string>>(new Set())
  /** 上传会话令牌：取消编辑后到达的上传结果直接丢弃并删除 */
  const uploadSession = useRef(0)
  const pendingCount = useRef(0)

  // —— 图片签名 URL / 大图预览 ——
  const [imgUrls, setImgUrls] = useState<Record<string, string>>({})
  const [lightbox, setLightbox] = useState<string | null>(null)

  // —— 删除确认 ——
  const [deleteTarget, setDeleteTarget] = useState<StudyNote | null>(null)

  // 首次进入：先展示本地缓存，再与云端合并
  useEffect(() => {
    setNotes(loadStudyNotes())
    if (!user) {
      setLoading(false)
      return
    }
    let cancelled = false
    setSyncing(true)
    syncStudyNotes(user.id)
      .then(({ notes: merged, cloudOk: ok }) => {
        if (cancelled) return
        setNotes(merged)
        setCloudOk(ok)
      })
      .catch(() => {
        if (!cancelled) setCloudOk(false)
      })
      .finally(() => {
        if (cancelled) return
        setSyncing(false)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  // 笔记 / 编辑器里出现的图片路径统一换成签名 URL
  useEffect(() => {
    const paths = new Set<string>()
    for (const n of notes) for (const p of n.images) paths.add(p)
    for (const p of images) paths.add(p)
    if (paths.size === 0) return
    let cancelled = false
    resolveNoteImageUrls([...paths])
      .then((map) => {
        if (!cancelled && Object.keys(map).length > 0) {
          setImgUrls((prev) => ({ ...prev, ...map }))
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [notes, images])

  // Esc 关闭大图
  useEffect(() => {
    if (!lightbox) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [lightbox])

  // 编辑器已选真题的摘要：按 id 批量取，只加载涉及到的年份
  const selectedExamKey = selectedExamIds.join(',')
  useEffect(() => {
    if (!selectedExamKey) {
      setSelectedExamDetail(new Map())
      setSelectedExamLoading(false)
      return
    }
    let cancelled = false
    setSelectedExamLoading(true)
    getQuestionsByIds(selectedExamKey.split(','))
      .then((map) => {
        if (!cancelled) setSelectedExamDetail(map)
      })
      .catch(() => {
        if (!cancelled) setSelectedExamDetail(new Map())
      })
      .finally(() => {
        if (!cancelled) setSelectedExamLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedExamKey])

  const unmasteredCount = useMemo(() => notes.filter((n) => !n.mastered).length, [notes])
  const masteredCount = notes.length - unmasteredCount

  /** 云端恢复后手动重试同步（执行完建表 SQL / 网络恢复后不必刷新页面） */
  const handleSyncNow = useCallback(async () => {
    if (!user || syncing) return
    setSyncing(true)
    try {
      const { notes: merged, cloudOk: ok } = await syncStudyNotes(user.id)
      setNotes(merged)
      setCloudOk(ok)
    } catch {
      setCloudOk(false)
    } finally {
      setSyncing(false)
    }
  }, [syncing, user])

  const visibleNotes = useMemo(() => {
    const q = query.trim().toLowerCase()
    return notes.filter((n) => {
      if (filter !== 'all' && n.subject !== filter) return false
      if (filterCategory && n.category !== filterCategory) return false
      if (onlyUnmastered && n.mastered) return false
      if (!q) return true
      return `${n.title}\n${n.content}`.toLowerCase().includes(q)
    })
  }, [notes, filter, filterCategory, onlyUnmastered, query])

  // ---------- 编辑器操作 ----------

  const releasePending = useCallback(() => {
    setPending((prev) => {
      for (const p of prev) URL.revokeObjectURL(p.preview)
      return []
    })
    pendingCount.current = 0
  }, [])

  /**
   * 重置编辑器。
   * discardUploads=true 时把本次新上传、尚未保存进笔记的图片从存储里删掉。
   */
  const resetComposer = useCallback(
    (discardUploads: boolean) => {
      uploadSession.current += 1
      if (discardUploads) {
        const paths = [...uploadedThisSession.current]
        uploadedThisSession.current.clear()
        if (paths.length > 0) void deleteNoteImages(paths)
      }
      releasePending()
      setCropQueue([])
      setEditingId(null)
      setSubject('math')
      setCategory('')
      setTitle('')
      setContent('')
      setPageRef('')
      setImages([])
      setExamPickerOpen(false)
      setSelectedExamIds([])
      setSaving(false)
    },
    [releasePending],
  )

  const focusTitle = useCallback(() => {
    requestAnimationFrame(() => titleInputRef.current?.focus())
  }, [])

  const openComposer = useCallback(() => {
    resetComposer(true)
    setFormOpen(true)
    focusTitle()
  }, [focusTitle, resetComposer])

  const cancelComposer = useCallback(() => {
    resetComposer(true)
    setFormOpen(false)
  }, [resetComposer])

  const startEdit = useCallback(
    (note: StudyNote) => {
      resetComposer(true)
      setEditingId(note.id)
      setSubject(note.subject)
      setCategory(note.category)
      setTitle(note.title)
      setContent(note.content)
      setPageRef(note.pageRef)
      setSelectedExamIds(note.examQuestionIds)
      setImages(note.images)
      setFormOpen(true)
      if (!wide) {
        requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
      } else {
        focusTitle()
      }
    },
    [focusTitle, resetComposer, wide],
  )

  /** 上传一张已经裁剪好的图片：立即开始，保存时不用再等 */
  const uploadImageFile = useCallback(
    async (file: File) => {
      if (!user) return
      const session = uploadSession.current
      const id = newNoteId()
      const preview = URL.createObjectURL(file)
      pendingCount.current += 1
      setPending((prev) => [...prev, { id, preview }])

      try {
        const path = await uploadNoteImage(user.id, file)
        if (session !== uploadSession.current) {
          // 上传期间用户取消了编辑 / 保存了笔记：这张图已不属于当前表单
          void deleteNoteImages([path])
          return
        }
        uploadedThisSession.current.add(path)
        setImages((prev) => (prev.includes(path) ? prev : [...prev, path]))
      } catch (err) {
        toast.show(err instanceof Error ? err.message : '图片上传失败，请重试', { icon: '🖼️' })
      } finally {
        pendingCount.current = Math.max(0, pendingCount.current - 1)
        setPending((prev) => prev.filter((p) => p.id !== id))
        URL.revokeObjectURL(preview)
      }
    },
    [toast, user],
  )

  /** 选图后先进入旋转 / 裁剪编辑器，处理完一张再处理下一张 */
  const handlePickFiles = useCallback(
    (picked: File[]) => {
      if (!user) {
        toast.show('登录后才能上传图片', { icon: '🔑' })
        return
      }
      const valid = picked.filter((f) => f.type.startsWith('image/'))
      if (valid.length !== picked.length) toast.show('已忽略非图片文件', { icon: '🖼️' })
      if (valid.length === 0) return

      const room = MAX_NOTE_IMAGES - images.length - pending.length - cropQueue.length
      if (room <= 0) {
        toast.show(`每条最多 ${MAX_NOTE_IMAGES} 张图片`, { icon: '🖼️' })
        return
      }
      const accepted = valid.slice(0, room)
      if (valid.length > accepted.length) {
        toast.show(`每条最多 ${MAX_NOTE_IMAGES} 张图片，多余的已忽略`, { icon: '🖼️' })
      }

      setCropQueue((prev) => [...prev, ...accepted.map((file) => ({ id: newNoteId(), file }))])
    },
    [cropQueue.length, images.length, pending.length, toast, user],
  )

  /** 裁剪完成：把输出的 JPEG 交给上传队列 */
  const handleCropConfirm = useCallback(
    (blob: Blob) => {
      const item = cropQueue[0]
      if (!item) return
      setCropQueue((prev) => prev.slice(1))
      const type = blob.type || 'image/jpeg'
      const file =
        blob instanceof File
          ? blob
          : new File([blob], `note-${item.id}.${type === 'image/png' ? 'png' : 'jpg'}`, { type })
      void uploadImageFile(file)
    },
    [cropQueue, uploadImageFile],
  )

  const handleCropSkip = useCallback(() => {
    setCropQueue((prev) => prev.slice(1))
  }, [])

  const handleCropCancel = useCallback(() => {
    setCropQueue([])
  }, [])

  /** 移除编辑器里的图片：本次新上传的立即从存储删除，原有图片等保存时再删 */
  const removeImage = useCallback((path: string) => {
    setImages((prev) => prev.filter((p) => p !== path))
    if (uploadedThisSession.current.has(path)) {
      uploadedThisSession.current.delete(path)
      void deleteNoteImages([path])
    }
  }, [])

  const removeExamQuestion = useCallback((id: string) => {
    setSelectedExamIds((prev) => prev.filter((x) => x !== id))
  }, [])

  const handleSave = useCallback(async () => {
    if (!user || saving || pendingCount.current > 0) return
    const t = title.trim()
    const c = content.trim()
    const p = pageRef.trim()
    if (!t && !c && images.length === 0) {
      toast.show('先写点内容或加张图吧', { icon: '✍️' })
      return
    }

    setSaving(true)
    const now = new Date().toISOString()
    const existing = editingId ? notes.find((n) => n.id === editingId) : null
    const note: StudyNote = existing
      ? {
          ...existing,
          subject,
          category,
          title: t,
          content: c,
          pageRef: p,
          examQuestionIds: selectedExamIds,
          images,
          updatedAt: now,
        }
      : {
          id: newNoteId(),
          subject,
          category,
          title: t,
          content: c,
          pageRef: p,
          examQuestionIds: selectedExamIds,
          images,
          mastered: false,
          createdAt: now,
          updatedAt: now,
        }

    const removedImages = existing ? existing.images.filter((p) => !images.includes(p)) : []
    const next = (existing ? notes.map((n) => (n.id === existing.id ? note : n)) : [note, ...notes]) as StudyNote[]
    const ordered = [...next].sort(sortNotes)
    setNotes(ordered)
    saveStudyNotes(ordered)

    uploadedThisSession.current.clear()
    resetComposer(false)
    setFormOpen(false)
    if (removedImages.length > 0) void deleteNoteImages(removedImages)

    try {
      await pushStudyNote(user.id, note)
      setCloudOk(true)
      toast.show(existing ? '已更新' : '已记下', { icon: '✅' })
    } catch {
      setCloudOk(false)
      toast.show('已保存到本机，云端同步失败', { icon: '⚠️' })
    } finally {
      setSaving(false)
    }
  }, [
    category,
    content,
    editingId,
    images,
    notes,
    pageRef,
    resetComposer,
    saving,
    selectedExamIds,
    subject,
    title,
    toast,
    user,
  ])

  // ---------- 卡片操作 ----------

  const toggleMastered = useCallback(
    (note: StudyNote) => {
      const updated: StudyNote = {
        ...note,
        mastered: !note.mastered,
        updatedAt: new Date().toISOString(),
      }
      const ordered = notes.map((n) => (n.id === note.id ? updated : n)).sort(sortNotes)
      setNotes(ordered)
      saveStudyNotes(ordered)
      if (user) {
        pushStudyNote(user.id, updated).catch(() => toast.show('云端同步失败，稍后会自动补上', { icon: '⚠️' }))
      }
      toast.show(updated.mastered ? '已标记为掌握' : '已移回未掌握', { icon: updated.mastered ? '✅' : '📌' })
    },
    [notes, toast, user],
  )

  const confirmDelete = useCallback(() => {
    const note = deleteTarget
    if (!note) return
    if (editingId === note.id) resetComposer(true)
    const next = notes.filter((n) => n.id !== note.id)
    setNotes(next)
    saveStudyNotes(next)
    setDeleteTarget(null)
    toast.show('已删除', { icon: '🗑️' })
    if (user) deleteStudyNoteFromCloud(user.id, note.id).catch(() => {})
    if (note.images.length > 0) void deleteNoteImages(note.images)
  }, [deleteTarget, editingId, notes, resetComposer, toast, user])

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ---------- 编辑器 DOM ----------

  const composer = (
    <div ref={formRef} className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5 dark:border-slate-800">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
          <Icon name="bulb" size={16} />
        </span>
        <h2 className="min-w-0 flex-1 text-sm font-semibold text-gray-800 dark:text-slate-100">
          {editingId ? '编辑知识点' : '记一条'}
        </h2>
        {editingId && (
          <button
            type="button"
            onClick={cancelComposer}
            className="shrink-0 cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            取消编辑
          </button>
        )}
      </div>

      <div className="space-y-3 p-4">
        {/* 科目：二选一，颜色与统计页的类别色一致 */}
        <div className="grid grid-cols-2 gap-2">
          {SUBJECT_KEYS.map((key) => {
            const meta = SUBJECT_META[key]
            const active = subject === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSubject(key)
                  setCategory('')
                }}
                aria-pressed={active}
                className={`flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl border text-sm font-medium transition-colors ${
                  active
                    ? meta.active
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                {meta.label}
              </button>
            )
          })}
        </div>

        {/* 二级科目 chips：切换一级科目时由上方按钮重置为「未分类」 */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="二级科目">
          {[{ key: '', label: '未分类', fullLabel: undefined }, ...STUDY_CATEGORIES[subject]].map((c) => {
            const active = category === c.key
            return (
              <button
                key={c.key || 'none'}
                type="button"
                onClick={() => setCategory(c.key)}
                aria-pressed={active}
                title={c.fullLabel}
                className={`${CHIP_BASE} ${active ? CHIP_ACTIVE : CHIP_IDLE}`}
              >
                {c.label}
              </button>
            )
          })}
        </div>

        <div>
          <label htmlFor="note-title" className="sr-only">
            知识点
          </label>
          <input
            id="note-title"
            ref={titleInputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="知识点 / 题目，如：拉格朗日中值定理构造辅助函数"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="note-content" className="sr-only">
            不熟的具体内容
          </label>
          <textarea
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={(e) => {
              const files: File[] = []
              const items = e.clipboardData.items
              for (let i = 0; i < items.length; i++) {
                const item = items[i]
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                  const file = item.getAsFile()
                  if (file) files.push(file)
                }
              }
              if (files.length > 0) {
                e.preventDefault()
                void handlePickFiles(files)
              }
            }}
            rows={5}
            maxLength={4000}
            placeholder="哪里不熟？易错点、正确思路、要记住的结论…（可直接粘贴截图）"
            className="input min-h-[120px] resize-y leading-relaxed"
          />
        </div>

        <div>
          <label htmlFor="note-page-ref" className="sr-only">
            教材页码
          </label>
          <input
            id="note-page-ref"
            value={pageRef}
            onChange={(e) => setPageRef(e.target.value)}
            maxLength={40}
            placeholder="教材页码，如：王道 P98"
            className="input"
          />
        </div>

        {/* 关联真题：点开选择器多选，已选题以摘要卡片回显 */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
              <Icon name="cards" size={13} />
            </span>
            <span className="text-xs font-medium text-gray-700 dark:text-slate-300">关联真题</span>
            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-slate-800 dark:text-slate-400">
              {selectedExamIds.length}
            </span>
            <button
              type="button"
              onClick={() => setExamPickerOpen(true)}
              className="btn-ghost ml-auto h-8 px-2.5 py-0 text-[11px]"
            >
              <Icon name="plus" size={12} />
              选择真题
            </button>
          </div>

          {selectedExamLoading && selectedExamIds.length > 0 && (
            <p className="text-[10.5px] text-gray-400 dark:text-slate-500">题目信息加载中…</p>
          )}

          {selectedExamIds.length > 0 && (
            <div className="space-y-1.5">
              {selectedExamIds.map((id) => {
                const q = selectedExamDetail.get(id)
                return (
                  <div
                    key={id}
                    className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50/60 p-2 dark:border-slate-700 dark:bg-slate-800/40"
                  >
                    <div className="min-w-0 flex-1">
                      {q ? (
                        <>
                          <p className="text-[11px] font-semibold text-gray-700 dark:text-slate-200">
                            {q.year} · 第 {q.number} 题 ·{' '}
                            <span className="font-normal text-gray-500 dark:text-slate-400">
                              {SECTION_LABELS[q.section]}
                            </span>
                          </p>
                          <p className="mt-0.5 break-words text-[11.5px] leading-relaxed text-gray-600 dark:text-slate-300">
                            {truncateText(q.stem, 60)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="break-all font-mono text-[11px] text-gray-600 dark:text-slate-300">{id}</p>
                          {!selectedExamLoading && (
                            <p className="mt-0.5 text-[10.5px] text-amber-600 dark:text-amber-400">题库未收录</p>
                          )}
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExamQuestion(id)}
                      title="移除关联"
                      aria-label="移除关联"
                      className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    >
                      <Icon name="x" size={12} strokeWidth={2.2} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 图片：已上传的缩略图 + 正在上传的占位 */}
        {(images.length > 0 || pending.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {images.map((path) => (
              <div
                key={path}
                className="group relative h-20 w-20 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-slate-700 dark:bg-slate-800"
              >
                {imgUrls[path] ? (
                  <img src={imgUrls[path]} alt="知识点配图" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-gray-400 dark:text-slate-500">
                    <Icon name="globe" size={18} />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(path)}
                  title="移除图片"
                  aria-label="移除图片"
                  className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75"
                >
                  <Icon name="x" size={11} strokeWidth={2.4} />
                </button>
              </div>
            ))}
            {pending.map((p) => (
              <div
                key={p.id}
                className="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-slate-700 dark:bg-slate-800"
              >
                <img src={p.preview} alt="正在上传" className="h-full w-full object-cover opacity-45" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length + pending.length + cropQueue.length >= MAX_NOTE_IMAGES}
            className="btn-ghost h-9 px-3 py-0 text-xs"
          >
            <Icon name="plus" size={14} />
            添加图片
          </button>
          <p className="min-w-0 text-[11px] leading-relaxed text-gray-400 dark:text-slate-500">
            可拍照 / 选图 / 直接粘贴截图，上传前可旋转裁剪，最多 {MAX_NOTE_IMAGES} 张
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || pending.length > 0}
            className="btn-primary h-10 flex-1 py-0 text-sm"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                保存中
              </>
            ) : pending.length > 0 ? (
              '图片上传中…'
            ) : editingId ? (
              '保存修改'
            ) : (
              '保存到记一记'
            )}
          </button>
          {formOpen && !wide && (
            <button type="button" onClick={cancelComposer} className="btn-ghost h-10 px-4 py-0 text-sm">
              取消
            </button>
          )}
        </div>
      </div>
    </div>
  )

  // ---------- 列表 ----------

  const list = (
    <>
      {/* 筛选栏：科目 / 搜索 / 未掌握开关 */}
      <div className="card flex flex-wrap items-center gap-2 px-3 py-2.5">
        <div className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-slate-700 dark:bg-slate-800/60">
          {([['all', '全部'], ['math', '数学'], ['cs408', '408']] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setFilter(key)
                setFilterCategory('')
              }}
              aria-pressed={filter === key}
              className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] transition-colors ${
                filter === key
                  ? 'bg-white font-semibold text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300'
                  : 'font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOnlyUnmastered((v) => !v)}
          aria-pressed={onlyUnmastered}
          className={`shrink-0 cursor-pointer rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
            onlyUnmastered
              ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/60'
          }`}
        >
          只看未掌握
        </button>

        <div className="relative ml-auto min-w-[140px] flex-1 sm:max-w-[220px]">
          <Icon
            name="search"
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索知识点…"
            aria-label="搜索知识点"
            className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-2.5 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:ring-indigo-500/40"
          />
        </div>

        {/* 选择数学 / 408 后追加二级科目筛选，与关键词、只看未掌握叠加 */}
        {filter !== 'all' && (
          <div className="flex w-full flex-wrap items-center gap-1.5 border-t border-gray-100 pt-2 dark:border-slate-800">
            <span className="mr-0.5 shrink-0 text-[10px] font-semibold text-gray-400 dark:text-slate-500">二级科目</span>
            <button
              type="button"
              onClick={() => setFilterCategory('')}
              aria-pressed={filterCategory === ''}
              className={`${CHIP_BASE} ${filterCategory === '' ? CHIP_ACTIVE : CHIP_IDLE}`}
            >
              全部二级科目
            </button>
            {STUDY_CATEGORIES[filter].map((c) => {
              const active = filterCategory === c.key
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setFilterCategory(c.key)}
                  aria-pressed={active}
                  title={c.fullLabel}
                  className={`${CHIP_BASE} ${active ? CHIP_ACTIVE : CHIP_IDLE}`}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {!cloudOk && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <span className="min-w-0 flex-1">
            云端暂不可用：内容已保存在本机，图片上传也会失败。网络恢复后会自动重试。
          </span>
          <button
            type="button"
            onClick={() => void handleSyncNow()}
            disabled={syncing}
            className="shrink-0 cursor-pointer rounded-md border border-amber-300 px-2 py-0.5 font-medium transition-colors hover:bg-amber-100 disabled:opacity-60 dark:border-amber-500/40 dark:hover:bg-amber-500/15"
          >
            {syncing ? '同步中…' : '重试'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="card flex items-center justify-center py-14">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
        </div>
      ) : visibleNotes.length === 0 ? (
        <EmptyState
          icon="bulb"
          title={notes.length === 0 ? '记一记还是空的' : onlyUnmastered ? '没有未掌握的知识点' : '没有匹配的知识点'}
          desc={
            notes.length === 0
              ? '把数学、408 里不熟的知识点记下来，配张截图，复习时只看这一本。'
              : onlyUnmastered
                ? `已掌握 ${masteredCount} 条，关掉「只看未掌握」可以回看。`
                : '换个关键词或切换科目试试。'
          }
          action={notes.length === 0 ? { label: '记第一条', onClick: openComposer } : undefined}
        />
      ) : (
        <div className="space-y-2.5">
          {visibleNotes.map((note) => {
            const meta = SUBJECT_META[note.subject]
            const isLong = note.content.length > 140
            const isExpanded = expanded.has(note.id)
            return (
              <article
                key={note.id}
                className={`card p-4 transition-opacity ${note.mastered ? 'opacity-70' : ''}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${meta.badge}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                    {meta.label} · {categoryLabel(note.subject, note.category)}
                  </span>
                  {note.mastered && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      <Icon name="check" size={10} strokeWidth={2.4} />
                      已掌握
                    </span>
                  )}
                  {note.pageRef && (
                    <span className="inline-flex max-w-[180px] shrink-0 items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                      <Icon name="book" size={10} strokeWidth={2} />
                      <span className="min-w-0 truncate">{note.pageRef}</span>
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-[10px] tabular-nums text-gray-400 dark:text-slate-500">
                    {formatNoteDate(note.updatedAt)}
                  </span>
                </div>

                {note.title && (
                  <h3 className="mt-2 break-words text-[15px] font-semibold leading-snug text-gray-900 dark:text-slate-50">
                    {note.title}
                  </h3>
                )}

                {note.content && (
                  <div className="mt-1.5">
                    <p
                      className={`whitespace-pre-wrap break-words text-[13px] leading-relaxed text-gray-600 dark:text-slate-300 ${
                        isLong && !isExpanded ? 'line-clamp-4' : ''
                      }`}
                    >
                      {note.content}
                    </p>
                    {isLong && (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(note.id)}
                        className="mt-1 cursor-pointer text-[11px] font-medium text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        {isExpanded ? '收起' : '展开全部'}
                      </button>
                    )}
                  </div>
                )}

                {note.examQuestionIds.length > 0 && (
                  <div className="mt-2.5">
                    <ExamQuestionList ids={note.examQuestionIds} />
                  </div>
                )}

                {note.images.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {note.images.map((path) => (
                      <button
                        key={path}
                        type="button"
                        onClick={() => {
                          const url = imgUrls[path]
                          if (url) setLightbox(url)
                        }}
                        disabled={!imgUrls[path]}
                        title="查看大图"
                        className="group h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-100 transition-colors hover:border-indigo-300 disabled:cursor-default dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500/40"
                      >
                        {imgUrls[path] ? (
                          <img
                            src={imgUrls[path]}
                            alt="知识点配图"
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-gray-400 dark:text-slate-500">
                            <Icon name="globe" size={16} />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-1 border-t border-gray-100 pt-2.5 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => toggleMastered(note)}
                    className={`inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                      note.mastered
                        ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10'
                        : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
                    }`}
                  >
                    <Icon name="check" size={13} strokeWidth={2.2} />
                    {note.mastered ? '移回未掌握' : '标记已掌握'}
                  </button>
                  <span className="ml-auto" />
                  <button
                    type="button"
                    onClick={() => startEdit(note)}
                    title="编辑"
                    aria-label="编辑"
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <Icon name="pencil" size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(note)}
                    title="删除"
                    aria-label="删除"
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )

  const switchTab = (tab: NotesTab) => {
    setSearchParams(tab === 'vocab' ? { tab: 'vocab' } : {}, { replace: true })
  }

  const header = (
    <header className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[0_8px_20px_-10px_rgba(79,70,229,0.7)]">
          <Icon name="bulb" size={19} />
        </span>
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-slate-50">
            记一记
            {syncing && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
            )}
          </h1>
          <p className="truncate text-xs text-gray-500 dark:text-slate-400">
            数学 / 408 知识点与真题，加上英语生词，都收在这一本里
          </p>
        </div>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {activeTab === 'notes' ? (
          <>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              未掌握 {unmasteredCount}
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              已掌握 {masteredCount}
            </span>
            {!wide && (
              <button type="button" onClick={openComposer} className="btn-primary h-9 px-3 py-0 text-xs">
                <Icon name="plus" size={14} />
                记一条
              </button>
            )}
          </>
        ) : (
          <>
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
              生词 {vocabStats.words} 个 · {vocabStats.days} 天
            </span>
            {!wide && (
              <Link to="/english-checkin" className="btn-ghost h-9 px-3 py-0 text-xs">
                <Icon name="book" size={14} />
                去打卡
              </Link>
            )}
          </>
        )}
      </div>
    </header>
  )

  const tabs = (
    <div
      className="mb-3 flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-100/70 p-1 sm:w-fit dark:border-slate-700 dark:bg-slate-800/60"
      role="tablist"
      aria-label="记一记分区"
    >
      {(
        [
          { key: 'notes', label: '知识点', icon: 'bulb', count: notes.length, suffix: '条' },
          { key: 'vocab', label: '生词', icon: 'vocab', count: vocabStats.words, suffix: '个' },
        ] as const
      ).map((tab) => {
        const active = activeTab === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => switchTab(tab.key)}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors sm:flex-none ${
              active
                ? 'bg-white font-semibold text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300'
                : 'font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Icon name={tab.icon} size={14} />
            {tab.label}
            <span
              className={`rounded-full px-1.5 text-[10px] font-semibold tabular-nums ${
                active
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300'
                  : 'bg-gray-200/70 text-gray-500 dark:bg-slate-700 dark:text-slate-400'
              }`}
            >
              {tab.count}
              {tab.suffix}
            </span>
          </button>
        )
      })}
    </div>
  )

  return (
    <div className={wide ? 'mx-auto max-w-[1280px] px-5 py-4 pb-6' : 'mx-auto max-w-3xl px-4 py-4 pb-6'}>
      {header}
      {tabs}

      {activeTab === 'vocab' ? (
        <VocabularyPanel onStatsChange={setVocabStats} />
      ) : wide ? (
        <div className="grid grid-cols-[380px_minmax(0,1fr)] items-start gap-4">
          <div className="sticky top-4 space-y-3">{composer}</div>
          <div className="min-w-0 space-y-3">{list}</div>
        </div>
      ) : formOpen ? (
        <div className="space-y-4">
          {composer}
          {list}
        </div>
      ) : (
        <div className="space-y-3">{list}</div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files: File[] = []
          const list = e.target.files
          if (list) {
            for (let i = 0; i < list.length; i++) {
              const file = list.item(i)
              if (file) files.push(file)
            }
          }
          e.target.value = ''
          if (files.length > 0) handlePickFiles(files)
        }}
      />

      <ImageCropDialog
        file={cropQueue[0]?.file ?? null}
        remaining={cropQueue.length}
        onCancel={handleCropCancel}
        onSkip={handleCropSkip}
        onConfirm={handleCropConfirm}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除这条知识点？"
        message={`${deleteTarget?.title || deleteTarget?.content.slice(0, 40) || '这条记录'} 会被移除，配图也会一并删除，无法恢复。`}
        confirmText="删除"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ExamQuestionPicker
        open={examPickerOpen}
        value={selectedExamIds}
        onCancel={() => setExamPickerOpen(false)}
        onConfirm={(ids) => {
          setSelectedExamIds(ids)
          setExamPickerOpen(false)
        }}
      />

      {lightbox && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label="查看大图"
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="关闭"
            className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
          >
            <Icon name="x" size={18} strokeWidth={2.2} />
          </button>
          <img
            src={lightbox}
            alt="知识点大图"
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  )
}
