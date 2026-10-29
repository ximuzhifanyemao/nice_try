// 英语长难句「意群切分」生成：
// 优先使用 PDF 解析出的 analysis.split；没有时从 ai.structure 的英文片段反推意群边界，
// 并为每个意群提取语法角色与中文释义，供打卡页点击查看。
import type { AnalysisItem, EnglishDaySentence } from '../data/englishDaily'
import { parseCollocation } from './englishReading'

const STOP_WORDS = new Set(
  (
    'a an the and or but if while when as of to in on at for from by with without into onto about over ' +
    'under between among through during before after above below up down out off than that this these ' +
    'those it its they them their there here we us our you your he him his she her i me my mine not no ' +
    'nor so such very too also only just even still yet ever never all any both each few more most other ' +
    'some own same can could may might must shall should will would be am is are was were been being ' +
    'have has had having do does did done doing'
  ).split(/\s+/),
)

/** 允许作为意群起点的单个虚词（从句引导词 / 关系词） */
const BOUNDARY_WORDS = new Set([
  'if', 'when', 'while', 'until', 'unless', 'because', 'although', 'though', 'as', 'than', 'that',
  'which', 'who', 'whom', 'whose', 'what', 'how', 'why', 'where', 'whether', 'whereas', 'since',
])

const EN_RUN_RE = /[A-Za-z][A-Za-z0-9'’-]*(?:(?:\s+|[–—-])+[A-Za-z0-9][A-Za-z0-9'’-]*)*/g

export interface SentenceChunk {
  text: string
  /** 这一部分的中文意思（提取不到时为空） */
  zh: string
  /** 语法角色：方式状语 / 同位语从句 / 并列短语 / 介词短语作后置定语 ... */
  grammar: string
  /** 对应的完整语法说明 */
  explanation: string
  start: number
  end: number
}

interface Span {
  start: number
  end: number
}

interface LocatedSpan extends Span {
  text: string
  item: string
  label: string
}

interface NormalizedContext {
  norm: string
  map: number[]
}

// ---------- 归一化定位 ----------

/** 把原句归一化成仅保留字母数字的字符串，并记录每个字符在原句中的下标 */
function buildContext(text: string): NormalizedContext {
  let norm = ''
  const map: number[] = []
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (/[A-Za-z0-9]/.test(c)) {
      norm += c.toLowerCase()
      map.push(i)
    }
  }
  return { norm, map }
}

function normalize(text: string): string {
  return text.replace(/[^A-Za-z0-9]/g, '').toLowerCase()
}

/** 在原句中定位一个英文片段（忽略空格、标点、引号差异） */
function locateSpan(fragment: string, ctx: NormalizedContext, text: string): Span | null {
  const raw = String(fragment || '').trim()
  if (!raw) return null

  const candidates = [raw, raw.replace(/\.{2,}|…/g, ' '), raw.replace(/[()]/g, ''), raw.replace(/\([^()]*\)/g, '')]
  for (const candidate of candidates) {
    const needle = normalize(candidate)
    if (needle.length < 2) continue
    let from = 0
    while (from < ctx.norm.length) {
      const idx = ctx.norm.indexOf(needle, from)
      if (idx === -1) break
      const start = ctx.map[idx]
      const end = ctx.map[idx + needle.length - 1] + 1
      const before = start > 0 ? text[start - 1] : ''
      const after = end < text.length ? text[end] : ''
      // 避免把匹配落在某个单词中间
      if (!/[A-Za-z0-9]/.test(before) && !/[A-Za-z0-9]/.test(after)) {
        return { start, end }
      }
      from = idx + 1
    }
  }
  return null
}

// ---------- 片段解析 ----------

function wordCount(text: string): number {
  const words = text.match(EN_RUN_RE) ?? []
  return words.length
}

function isEnglishRunUsable(run: string): boolean {
  const words = (run.match(/[A-Za-z][A-Za-z0-9'’-]*/g) ?? []).map((w) => w.toLowerCase())
  if (words.length === 0) return false
  if (words.length >= 2) return true
  const only = words[0]
  if (BOUNDARY_WORDS.has(only)) return true
  if (only.length >= 4 && !STOP_WORDS.has(only)) return true
  return false
}

/** 找一段文本里最适合作为意群片段的英文 run（优先多词、就近原句） */
function pickRun(text: string, ctx: NormalizedContext, sentence: string): { run: string; span: Span } | null {
  const runs = [...text.matchAll(EN_RUN_RE)].map((m) => m[0].trim()).filter(Boolean)
  let best: { run: string; span: Span; score: number } | null = null
  for (const run of runs) {
    if (!isEnglishRunUsable(run)) continue
    const span = locateSpan(run, ctx, sentence)
    if (!span) continue
    const words = wordCount(run)
    const score = words * 100 + run.length
    if (!best || score > best.score) best = { run, span, score }
  }
  return best ? { run: best.run, span: best.span } : null
}

function chinesePart(text: string): string {
  const stripped = text
    .replace(EN_RUN_RE, ' ')
    .replace(/^成分解析\s*\d+\s*[：:]?\s*/, '')
    .replace(/[A-Za-z0-9]/g, '')
    .replace(/[（）()]/g, ' ')
    .replace(/^[\s，,。.；;：:、\-—–]+|[\s，,。.；;：:、\-—–]+$/g, '')
  const cut = stripped.split(/[，,。.；;：:]/)[0] ?? ''
  return cut.trim().slice(0, 18)
}

/** 解析一条语法说明，得到它对应的英文片段与语法标签 */
function parseStructureItem(item: string, ctx: NormalizedContext, sentence: string): LocatedSpan | null {
  const text = String(item || '').trim()
  if (!text) return null
  if (/无其他修饰|结构简单|无明显修饰/.test(text)) return null

  const cleaned = text.replace(/^成分解析\s*\d+\s*[：:]\s*/, '').trim()
  const colon = cleaned.search(/[：:]/)
  const left = colon >= 0 ? cleaned.slice(0, colon) : cleaned
  const right = colon >= 0 ? cleaned.slice(colon + 1) : ''

  const leftPick = pickRun(left, ctx, sentence)
  const rightPick = right ? pickRun(right, ctx, sentence) : null
  const picked = leftPick ?? rightPick
  if (!picked) return null

  const leftLabel = chinesePart(left)
  const rightLabel = chinesePart(right)
  const label = (leftLabel || rightLabel || '').trim()

  return {
    start: picked.span.start,
    end: picked.span.end,
    text: sentence.slice(picked.span.start, picked.span.end),
    item: text,
    label,
  }
}

// ---------- 边界切分 ----------

function splitByPunctuation(span: Span, sentence: string): Span[] {
  const text = sentence.slice(span.start, span.end)
  if (text.length < 24) return [span]

  const cuts: number[] = []
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (/[,;:—–]/.test(c)) {
      if (i + 1 < text.length && /\s/.test(text[i + 1])) cuts.push(i + 1)
    }
  }

  const clauseRe =
    /\s(?=(?:while|whereas|although|though|because|since|if|when|until|unless|whether|that|which|who|whom|whose|how|what|why|where)\b)/gi
  let m: RegExpExecArray | null
  while ((m = clauseRe.exec(text)) !== null) {
    if (m.index > 0) cuts.push(m.index)
  }

  if (cuts.length === 0) return [span]
  const uniq = [...new Set(cuts)].sort((a, b) => a - b)
  const parts: Span[] = []
  let prev = 0
  for (const cut of uniq) {
    if (cut <= prev) continue
    const leftText = text.slice(prev, cut).trim()
    const rightText = text.slice(cut).trim()
    if (wordCount(leftText) < 1 || wordCount(rightText) < 1) continue
    if (wordCount(leftText) < 2 && wordCount(rightText) < 2) continue
    parts.push({ start: span.start + prev, end: span.start + cut })
    prev = cut
  }
  if (prev === 0) return [span]
  parts.push({ start: span.start + prev, end: span.end })
  return parts.filter((p) => sentence.slice(p.start, p.end).trim().length > 0)
}

function mergeTinySpans(spans: Span[], sentence: string): Span[] {
  const merged: Span[] = []
  for (const span of spans) {
    const text = sentence.slice(span.start, span.end).trim()
    if (!text) continue
    const words = wordCount(text)
    if (words === 0 && merged.length > 0) {
      const prev = merged[merged.length - 1]
      prev.end = span.end
      continue
    }
    if (text.length < 3 && merged.length > 0) {
      const prev = merged[merged.length - 1]
      prev.end = span.end
      continue
    }
    merged.push({ ...span })
  }
  return merged
}

function buildSpansFromSplit(split: string, ctx: NormalizedContext, sentence: string): Span[] {
  const found: Span[] = []
  for (const part of split.split('//')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const span = locateSpan(trimmed, ctx, sentence)
    if (span) found.push(span)
  }
  if (found.length === 0) return []

  const sorted = [...found].sort((a, b) => a.start - b.start)
  const spans: Span[] = []
  let cursor = 0
  for (const span of sorted) {
    if (span.start > cursor) spans.push({ start: cursor, end: span.start })
    if (span.end > cursor) {
      spans.push({ start: Math.max(cursor, span.start), end: span.end })
      cursor = span.end
    }
  }
  if (cursor < sentence.length) spans.push({ start: cursor, end: sentence.length })
  return spans
}

function buildSpansFromStructure(structure: string[], ctx: NormalizedContext, sentence: string): Span[] {
  const candidates = structure
    .map((item) => parseStructureItem(item, ctx, sentence))
    .filter((x): x is LocatedSpan => x != null)
    .sort((a, b) => a.start - b.start)

  const starts = new Set<number>([0])
  for (const c of candidates) {
    if (c.start > 0 && c.start < sentence.length) starts.add(c.start)
  }
  const startList = [...starts].sort((a, b) => a - b)
  const baseSpans: Span[] = []
  for (let i = 0; i < startList.length; i++) {
    const end = i + 1 < startList.length ? startList[i + 1] : sentence.length
    if (end > startList[i]) baseSpans.push({ start: startList[i], end })
  }

  const refined = baseSpans.flatMap((span) => splitByPunctuation(span, sentence))
  return refined.length > 0 ? refined : [{ start: 0, end: sentence.length }]
}

function buildSpansByPunctuation(sentence: string): Span[] {
  const whole: Span = { start: 0, end: sentence.length }
  return splitByPunctuation(whole, sentence)
}

// ---------- 释义提取 ----------

function stripQuotes(text: string): string {
  return text
    .replace(/^[“"‘'\s]+|[”"’'\s]+$/g, '')
    .replace(/[“”"‘’]/g, '')
    .trim()
}

function extractMeaning(
  item: string,
  chunkText: string,
  sentence: EnglishDaySentence,
  analysisItem: AnalysisItem | undefined,
  isSingleChunk: boolean,
): string {
  const text = String(item || '')
  /** 语法解析里的“第几个观点 / 具体内容 / 来源 / 特征”等描述不是这一部分的中文意思 */
  const isMetaDescription = (value: string) =>
    /第[一二三四五六七八九十\d]+个?观点|具体内容|核心内容|具体行为|具体说明|具体观点|具体对象|具体状态|时间背景|发生时间|执行者|所属机构|所修饰|修饰对象|作用|特征|来源|成分/.test(
      value,
    )

  if (text) {
    // 1) “意为/即/指的是/说明”后面的短语
    const patterns = [
      /(?:说明|明确|表示|即|指的是|意为|意思是|解释为|也就是)[：:]?\s*([^，。；、\n]+)/g,
    ]
    let best = ''
    for (const re of patterns) {
      for (const m of text.matchAll(re)) {
        const value = stripQuotes(m[1] ?? '')
        if (!value || !/[\u4e00-\u9fff]/.test(value)) continue
        if (/^(修饰|作|由|引导|限定|从句|短语)/.test(value)) continue
        if (isMetaDescription(value)) continue
        if (value.length > best.length) best = value
      }
    }
    if (best) return best.slice(0, 80)

    // 2) 中文引号内容
    const quotes = [...text.matchAll(/[“"‘]([^”"’]*[\u4e00-\u9fff][^”"’]*)[”"’]/g)]
      .map((m) => stripQuotes(m[1] ?? ''))
      .filter((q) => q.length > 0 && !isMetaDescription(q))
    if (quotes.length > 0) {
      return quotes.sort((a, b) => b.length - a.length)[0].slice(0, 80)
    }
  }

  // 3) 命中意群的搭配释义
  const collocations = (sentence.ai?.collocations ?? []).map((raw) => parseCollocation(raw))
  for (const c of collocations) {
    if (!c.meaning) continue
    const words = (c.term.match(/[A-Za-z][A-Za-z0-9'’-]*/g) ?? [])
      .map((w) => w.toLowerCase())
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    if (words.length === 0) continue
    const normalizedChunk = normalize(chunkText)
    if (words.some((w) => normalizedChunk.includes(w))) return c.meaning.slice(0, 80)
  }

  // 4) 命中意群的单词释义
  const vocab = analysisItem?.vocab ?? []
  const glosses: string[] = []
  for (const v of vocab) {
    const word = (v.word || '').trim()
    if (!word) continue
    if (!new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(chunkText)) continue
    glosses.push(`${word} ${v.meaning}`.trim())
    if (glosses.length >= 3) break
  }
  if (glosses.length > 0) return glosses.join('；')

  // 5) 单意群直接用整句参考译文
  if (isSingleChunk && sentence.ref) return sentence.ref
  return ''
}

function matchGrammarHint(chunkText: string, analysisItem: AnalysisItem | undefined): { label: string; explanation: string } {
  const hints = analysisItem?.grammar ?? []
  const firstWord = (chunkText.match(/[A-Za-z][A-Za-z0-9'’-]*/)?.[0] ?? '').toLowerCase()
  for (const hint of hints) {
    if (!hint) continue
    if (/^(主干|结构提炼)/.test(hint)) continue
    const hintWord = (hint.match(/^[A-Za-z][A-Za-z0-9'’-]*/)?.[0] ?? '').toLowerCase()
    if (firstWord && hintWord && (firstWord === hintWord || chunkText.toLowerCase().includes(hintWord))) {
      return { label: hint.slice(0, 24), explanation: hint }
    }
  }
  return { label: '', explanation: '' }
}

// ---------- 对外入口 ----------

/** 生成一句英文的意群切分（至少返回一个意群） */
export function buildSentenceChunks(
  sentence: EnglishDaySentence,
  analysisItem?: AnalysisItem | null,
): SentenceChunk[] {
  const en = sentence.en
  if (!en) return []

  const ctx = buildContext(en)
  const structure = sentence.ai?.structure ?? []
  const candidates = structure
    .map((item) => parseStructureItem(item, ctx, en))
    .filter((x): x is LocatedSpan => x != null)

  let spans: Span[] = []
  if (analysisItem?.split) {
    spans = buildSpansFromSplit(analysisItem.split, ctx, en)
  }
  if (spans.length === 0 && structure.length > 0) {
    spans = buildSpansFromStructure(structure, ctx, en)
  }
  if (spans.length === 0) {
    spans = buildSpansByPunctuation(en)
  }
  spans = mergeTinySpans(spans, en)
  if (spans.length === 0) spans = [{ start: 0, end: en.length }]

  const chunks: SentenceChunk[] = []
  for (const span of spans) {
    const text = en.slice(span.start, span.end).trim()
    if (!text) continue
    const start = en.indexOf(text, span.start)
    const end = start >= 0 ? start + text.length : span.end
    const actual: Span = { start: start >= 0 ? start : span.start, end }

    let best: LocatedSpan | null = null
    let bestScore = 0
    for (const c of candidates) {
      const overlap = Math.max(0, Math.min(actual.end, c.end) - Math.max(actual.start, c.start))
      const contains = text.includes(c.text) || c.text.includes(text)
      const score = overlap + (contains ? 1000 : 0)
      if (score > bestScore) {
        bestScore = score
        best = c
      }
    }

    const hint = best ? { label: '', explanation: '' } : matchGrammarHint(text, analysisItem ?? undefined)
    const grammar = (best?.label || hint.label || '').trim()
    const explanation = best?.item || hint.explanation || ''
    const isSingle = spans.length === 1
    const zh = extractMeaning(best?.item || '', text, sentence, analysisItem ?? undefined, isSingle)

    chunks.push({
      text,
      zh,
      grammar: grammar || (isSingle ? '整句' : '意群'),
      explanation: explanation || (isSingle ? sentence.ai?.backbone ?? '' : ''),
      start: actual.start,
      end: actual.end,
    })
  }

  return chunks.length > 0
    ? chunks
    : [
        {
          text: en,
          zh: sentence.ref,
          grammar: '整句',
          explanation: sentence.ai?.backbone ?? '',
          start: 0,
          end: en.length,
        },
      ]
}
