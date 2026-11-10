/**
 * 不熟本数据层：记录数学 / 408 中不熟的知识点，支持配图。
 *
 * 存储策略：
 * - 笔记正文走 localStorage 缓存 + Supabase `study_notes` 云端同步（离线也能看、能改）；
 * - 图片上传到 Supabase Storage 私有桶 `study-note-images`，笔记里只存对象路径，
 *   展示时按需换取 24 小时有效的签名 URL（换设备、重装 App 都不会丢图）。
 *
 * 云端未配置 / 表或桶尚未创建时静默降级为纯本地，页面会给出提示。
 */
import { supabase, isSupabaseConfigured } from './supabase'

export type StudySubject = 'math' | 'cs408'

export const STUDY_SUBJECTS: { key: StudySubject; label: string }[] = [
  { key: 'math', label: '数学' },
  { key: 'cs408', label: '408' },
]

export interface StudyCategory {
  /** 二级科目 key，存库用 */
  key: string
  /** 展示用简称 */
  label: string
  /** 完整名称（仅在需要时作为 title / 无障碍说明） */
  fullLabel?: string
}

/** 固定的二级科目；空字符串代表「未分类」 */
export const STUDY_CATEGORIES: Record<StudySubject, StudyCategory[]> = {
  math: [
    { key: 'calculus', label: '高数', fullLabel: '高等数学' },
    { key: 'linear_algebra', label: '线代', fullLabel: '线性代数' },
    { key: 'probability', label: '概率论', fullLabel: '概率论与数理统计' },
  ],
  cs408: [
    { key: 'ds', label: '数据结构' },
    { key: 'co', label: '计组', fullLabel: '计算机组成与体系结构' },
    { key: 'os', label: '操作系统' },
    { key: 'cn', label: '计算机网络' },
  ],
}

/** 二级科目展示名；空 key 或未知 key 都回退为「未分类」 */
export function categoryLabel(subject: StudySubject, key: string): string {
  if (!key) return '未分类'
  return STUDY_CATEGORIES[subject].find((c) => c.key === key)?.label ?? '未分类'
}

export interface StudyNote {
  id: string
  subject: StudySubject
  /** 二级科目 key，空字符串 = 未分类 */
  category: string
  /** 知识点 / 题目名称 */
  title: string
  /** 不熟在哪里、正确思路、易错点 */
  content: string
  /** 教材页码，自由文本（如「王道 P98」） */
  pageRef: string
  /** 关联真题 id；本期只做存储与保留，选择器由真题任务提供 */
  examQuestionIds: string[]
  /** Storage 对象路径（不是公网 URL），展示时换签名 URL */
  images: string[]
  /** 是否已弄懂 */
  mastered: boolean
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'kaoyan_study_notes_v1'
const IMAGE_BUCKET = 'study-note-images'
/** 单条笔记最多几张图，与页面上的提示保持一致 */
export const MAX_NOTE_IMAGES = 9
/** 压缩后的最长边（截图里的文字仍要看得清，不要压得太狠） */
const MAX_IMAGE_SIDE = 1600
/** 超过这个大小直接拒绝，避免在手机上压缩太久 */
const MAX_IMAGE_BYTES = 25 * 1024 * 1024

export function newNoteId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// ---------- 本地缓存 ----------

export function loadStudyNotes(): StudyNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(normalizeNote)
      .filter((n): n is StudyNote => n !== null)
      .sort(sortNotes)
  } catch {
    return []
  }
}

export function saveStudyNotes(notes: StudyNote[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch (err) {
    console.warn('[StudyNotes] 本地保存失败:', err instanceof Error ? err.message : err)
  }
}

function normalizeNote(value: unknown): StudyNote | null {
  if (!value || typeof value !== 'object') return null
  const n = value as Partial<StudyNote>
  if (typeof n.id !== 'string' || !n.id) return null
  const now = new Date().toISOString()
  return {
    id: n.id,
    subject: n.subject === 'cs408' ? 'cs408' : 'math',
    category: typeof n.category === 'string' ? n.category : '',
    title: typeof n.title === 'string' ? n.title : '',
    content: typeof n.content === 'string' ? n.content : '',
    pageRef: typeof n.pageRef === 'string' ? n.pageRef : '',
    examQuestionIds: Array.isArray(n.examQuestionIds)
      ? n.examQuestionIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : [],
    images: Array.isArray(n.images) ? n.images.filter((p): p is string => typeof p === 'string') : [],
    mastered: Boolean(n.mastered),
    createdAt: typeof n.createdAt === 'string' ? n.createdAt : now,
    updatedAt: typeof n.updatedAt === 'string' ? n.updatedAt : now,
  }
}

/** 未掌握的排前面，同组内按最近更新倒序 */
export function sortNotes(a: StudyNote, b: StudyNote): number {
  if (a.mastered !== b.mastered) return a.mastered ? 1 : -1
  return b.updatedAt.localeCompare(a.updatedAt)
}

// ---------- 云端同步 ----------

interface CloudStudyNoteRow {
  id: string
  user_id: string
  subject: string
  category: string | null
  title: string
  content: string
  page_ref: string | null
  exam_question_ids: string[] | null
  images: string[] | null
  mastered: boolean
  created_at: string
  updated_at: string
}

function fromRow(row: CloudStudyNoteRow): StudyNote {
  return {
    id: row.id,
    subject: row.subject === 'cs408' ? 'cs408' : 'math',
    category: typeof row.category === 'string' ? row.category : '',
    title: row.title ?? '',
    content: row.content ?? '',
    pageRef: typeof row.page_ref === 'string' ? row.page_ref : '',
    examQuestionIds: Array.isArray(row.exam_question_ids)
      ? row.exam_question_ids.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : [],
    images: Array.isArray(row.images) ? row.images.filter((p): p is string => typeof p === 'string') : [],
    mastered: Boolean(row.mastered),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toRow(userId: string, note: StudyNote) {
  return {
    id: note.id,
    user_id: userId,
    subject: note.subject,
    category: note.category,
    title: note.title,
    content: note.content,
    page_ref: note.pageRef,
    exam_question_ids: note.examQuestionIds,
    images: note.images,
    mastered: note.mastered,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  }
}

/**
 * 拉取云端笔记并与本地缓存合并：按 id 取 updatedAt 较新的一份，
 * 本地独有 / 本地更新的条目回推云端。
 * 返回 cloudOk=false 表示云端不可用（未建表、未配置、网络失败），此时保留本地数据。
 */
export async function syncStudyNotes(userId: string): Promise<{ notes: StudyNote[]; cloudOk: boolean }> {
  const local = loadStudyNotes()
  if (!isSupabaseConfigured) return { notes: local, cloudOk: false }

  let cloud: StudyNote[]
  try {
    const { data, error } = await supabase.from('study_notes').select('*').eq('user_id', userId)
    if (error) throw new Error(error.message)
    cloud = ((data ?? []) as CloudStudyNoteRow[]).map(fromRow)
  } catch (err) {
    console.warn('[StudyNotes] 云端读取失败，保留本地:', err instanceof Error ? err.message : err)
    return { notes: local, cloudOk: false }
  }

  const localById = new Map(local.map((n) => [n.id, n]))
  const cloudById = new Map(cloud.map((n) => [n.id, n]))
  const merged = new Map<string, StudyNote>(cloudById)

  for (const l of local) {
    const c = cloudById.get(l.id)
    if (!c || l.updatedAt > c.updatedAt) merged.set(l.id, l)
  }

  const result = [...merged.values()].sort(sortNotes)
  saveStudyNotes(result)

  // 本地新增 / 本地更新的条目回推云端（失败不影响本地可用）
  const toPush = [...localById.values()].filter((l) => {
    const c = cloudById.get(l.id)
    return !c || l.updatedAt > c.updatedAt
  })
  if (toPush.length > 0) {
    try {
      const { error } = await supabase
        .from('study_notes')
        .upsert(toPush.map((n) => toRow(userId, n)), { onConflict: 'id' })
      if (error) throw new Error(error.message)
    } catch (err) {
      console.warn('[StudyNotes] 本地笔记回推失败:', err instanceof Error ? err.message : err)
    }
  }

  return { notes: result, cloudOk: true }
}

/** 单条笔记写入云端（保存 / 标记掌握时调用；失败只影响跨设备同步） */
export async function pushStudyNote(userId: string, note: StudyNote): Promise<void> {
  if (!isSupabaseConfigured) return
  const { error } = await supabase.from('study_notes').upsert(toRow(userId, note), { onConflict: 'id' })
  if (error) throw new Error(error.message)
}

export async function deleteStudyNoteFromCloud(userId: string, noteId: string): Promise<void> {
  if (!isSupabaseConfigured) return
  const { error } = await supabase.from('study_notes').delete().eq('user_id', userId).eq('id', noteId)
  if (error) throw new Error(error.message)
}

// ---------- 图片 ----------

/** 签名 URL 缓存：路径 → URL / 过期时间，避免每次渲染都请求 */
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>()
/** 签名有效期 24 小时（页面重新打开时会重新签名） */
const SIGNED_URL_TTL_SEC = 60 * 60 * 24

/**
 * 把 Storage 路径换成可直接用于 <img> 的签名 URL。
 * 已缓存且未临近过期的直接复用；拿不到的路径不会出现在结果里（展示层显示占位）。
 */
export async function resolveNoteImageUrls(paths: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  if (!isSupabaseConfigured) return result

  const now = Date.now()
  const missing = new Set<string>()
  for (const path of paths) {
    if (!path || path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
      // 兼容早期误存成完整 URL 的数据
      if (path) result[path] = path
      continue
    }
    const hit = signedUrlCache.get(path)
    if (hit && hit.expiresAt > now + 60_000) result[path] = hit.url
    else missing.add(path)
  }
  if (missing.size === 0) return result

  try {
    const { data, error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .createSignedUrls([...missing], SIGNED_URL_TTL_SEC)
    if (error) throw new Error(error.message)
    for (const item of data ?? []) {
      if (!item.signedUrl || !item.path) continue
      result[item.path] = item.signedUrl
      signedUrlCache.set(item.path, {
        url: item.signedUrl,
        expiresAt: now + SIGNED_URL_TTL_SEC * 1000,
      })
    }
  } catch (err) {
    console.warn('[StudyNotes] 图片签名失败:', err instanceof Error ? err.message : err)
  }
  return result
}

/** 上传一张图片（自动压缩并转 JPEG），返回 Storage 路径 */
export async function uploadNoteImage(userId: string, file: File): Promise<string> {
  if (!isSupabaseConfigured) throw new Error('云端未配置，暂不能上传图片')
  if (!file.type.startsWith('image/')) throw new Error('只能上传图片文件')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('图片太大（超过 25MB），请先压缩再上传')

  const blob = await compressImage(file)
  const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${userId}/${newNoteId()}.${ext}`

  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) {
    throw new Error(friendlyStorageError(error.message))
  }
  return path
}

/** 删除图片对象（删除笔记 / 编辑时移除图片 / 放弃未保存的新上传） */
export async function deleteNoteImages(paths: string[]): Promise<void> {
  if (!isSupabaseConfigured || paths.length === 0) return
  try {
    const { error } = await supabase.storage.from(IMAGE_BUCKET).remove(paths)
    if (error) throw new Error(error.message)
    for (const p of paths) signedUrlCache.delete(p)
  } catch (err) {
    console.warn('[StudyNotes] 删除图片失败:', err instanceof Error ? err.message : err)
  }
}

function friendlyStorageError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('bucket not found')) return '图片存储桶未创建，请先在 Supabase 执行 004_study_notes.sql'
  if (lower.includes('row-level security') || lower.includes('unauthorized')) return '没有上传权限，请重新登录后再试'
  if (lower.includes('payload too large') || lower.includes('too large')) return '图片太大，上传失败'
  return `图片上传失败：${message}`
}

/**
 * 客户端压缩：手机原图动辄 5-10MB，直接上传又慢又费流量。
 * 最长边压到 1600px、JPEG 0.85，截图里的文字仍然清晰。
 * 解码失败（如部分 HEIC）时回退上传原文件，避免整条笔记保存被阻断。
 */
async function compressImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas unavailable')
    // PNG 透明区域转 JPEG 会变黑，先铺白底
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    return blob ?? file
  } catch (err) {
    console.warn('[StudyNotes] 图片压缩失败，改为上传原图:', err instanceof Error ? err.message : err)
    return file
  }
}
