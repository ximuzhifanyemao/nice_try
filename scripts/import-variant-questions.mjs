// 解析 docs/ 下「真题变形题-题目.pdf」→ 结构化题库
// 产出：
//   src/data/variant/<year>.json      每年一份题库（Vite 按年拆 chunk）
//   public/questions/<year>/p<N>.jpg  原题页面图（题目截图按坐标引用同一张页图）
//   docs/题目整理/<year>-变形题.md     整理后的可读文档
//
// 用法：
//   node scripts/import-variant-questions.mjs             # 处理 docs 下全部 PDF
//   node scripts/import-variant-questions.mjs --year 2024 # 只处理某一年
//
// 说明：文字层质量不足的页面会退化为 Windows OCR（scripts/ocr-win.ps1）；
// 实测 14 份 PDF 均有可用文字层，OCR 仅作兜底，失败时该页只保留截图。
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createCanvas } from '@napi-rs/canvas'

const ROOT = resolve(import.meta.dirname, '..')
const DOCS_DIR = join(ROOT, 'docs')
const DATA_DIR = join(ROOT, 'src/data/variant')
const IMAGE_DIR = join(ROOT, 'public/questions')
const MD_DIR = join(ROOT, 'docs/题目整理')
const TMP_DIR = join(tmpdir(), 'kaoyan-variant')
const OCR_SCRIPT = join(ROOT, 'scripts/ocr-win.ps1')

/** 页图统一渲染宽度（像素）：A4 约 120 DPI，中文可读且体积可控 */
const TARGET_WIDTH = 1000
const JPEG_QUALITY = 78
/** 水印图尺寸（每页都有的「图领考研」底板），检测图形时排除 */
const WATERMARK = { w: 1400, h: 611 }

const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
const { OPS } = pdfjs

const cmapUrl = pathToFileURL(join(ROOT, 'node_modules/pdfjs-dist/cmaps') + '/').href
const fontUrl = pathToFileURL(join(ROOT, 'node_modules/pdfjs-dist/standard_fonts') + '/').href

// ---------- 工具 ----------

const PUNCT_END_RE = /[。！？；：，、）】]$/
const OPTION_MARK_RE = /([A-D])[．.、]/g
const QUESTION_RE = /^\s*(\d{1,2})\s*[.．、]\s*(?=$|[\u3400-\u9fff（(A-Za-z])/
const HEADER_RE = /^【图领】/
const PAGE_NO_RE = /^[~～\s]*\d+[~～\s]*$/

/** 行内文字拼接：西文/数字之间补空格，中文直接相连 */
function joinRowText(items) {
  let out = ''
  let prevEnd = null
  for (const it of items) {
    const s = it.str
    if (!s) continue
    if (prevEnd !== null && it.x - prevEnd > 1.2 && /[A-Za-z0-9]$/.test(out) && /^[A-Za-z0-9]/.test(s)) {
      out += ' '
    }
    out += s
    prevEnd = it.x + (it.width || 0)
  }
  return out
}

/** 一行是否像代码（用于决定换行而不是直接接续） */
function looksLikeCode(text) {
  return /[;{}]$/.test(text) || /^(?:typedef|struct|int|void|char|float|double|while|for|if|else|return|\}|\{|#include)\b/.test(text)
}

/** 行首是列表/选项标记（A-D、罗马数字、小问编号），应另起一行 */
function startsListItem(text) {
  return /^(?:[A-D][．.、]|[IVX]{1,4}[．.、]|（?\d{1,2}[）)．.、])/.test(text)
}

/**
 * 把同一题的若干行拼成文本：
 * - 续行（左边界比上一行更靠左）直接接续；
 * - 上一行未以标点结束、且不是代码行，也视为折行接续；
 * - 列表项、代码块保留换行。
 */
function joinBlockLines(lines) {
  let out = ''
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const text = line.text.trim()
    if (!text) continue
    if (i === 0) {
      out = text
      continue
    }
    const prev = lines[i - 1]
    const isWrap = line.x < prev.x - 4
    const prevEnded = PUNCT_END_RE.test(prev.text.trim())
    const code = looksLikeCode(prev.text.trim()) || looksLikeCode(text)
    if (code || startsListItem(text)) out += `\n${text}`
    else if (isWrap || !prevEnded) out += text
    else out += `\n${text}`
  }
  return out
}

/** 从题目文本中按 A/B/C/D 顺序切出选项；不足 4 个则视为综合题 */
function splitOptions(text) {
  const candidates = []
  OPTION_MARK_RE.lastIndex = 0
  let m
  while ((m = OPTION_MARK_RE.exec(text)) !== null) {
    const prevCh = text[m.index - 1] ?? ''
    // 排除英文单词/代码里的 A. B.（前面紧跟小写字母或数字）
    if (/[a-z0-9]/.test(prevCh)) continue
    candidates.push({ key: m[1], index: m.index })
  }

  // 选项在题末，从后往前找第一组能按 A→B→C→D 顺序成立的标记，
  // 避免题干中偶然出现的「A．」干扰
  for (let a = candidates.length - 1; a >= 0; a--) {
    if (candidates[a].key !== 'A') continue
    const seq = [candidates[a]]
    for (const key of ['B', 'C', 'D']) {
      const last = seq[seq.length - 1]
      const next = candidates.find((c) => c.key === key && c.index > last.index + 2)
      if (!next) break
      seq.push(next)
    }
    if (seq.length !== 4) continue
    const stem = text.slice(0, seq[0].index).trim()
    const options = seq.map((item, i) => ({
      key: item.key,
      text: text.slice(item.index + 2, i + 1 < seq.length ? seq[i + 1].index : undefined).trim(),
    }))
    return { stem, options }
  }

  return { stem: text.trim(), options: [] }
}

/** 是否默认展开原题截图：题干含图形/表格提示，或块内出现上下标堆叠（公式） */
function needsOriginal(blockLines, stem) {
  if (/如图|图所示|如下图|右图|拓扑|如下表|表中|下图/.test(stem)) return true
  // 相邻两行基线距离过小 → 上下标/公式堆叠，纯文字不可读
  for (let i = 1; i < blockLines.length; i++) {
    if (blockLines[i].page !== blockLines[i - 1].page) continue
    if (Math.abs(blockLines[i].y - blockLines[i - 1].y) < 8) return true
  }
  return false
}

// ---------- PDF 解析 ----------

async function openPdf(file) {
  const data = new Uint8Array(readFileSync(file))
  return pdfjs.getDocument({
    data,
    cMapUrl: cmapUrl,
    cMapPacked: true,
    standardFontDataUrl: fontUrl,
    disableFontFace: true,
    useWorkerFetch: false,
    isEvalSupported: false,
    verbosity: 0,
  }).promise
}

/** 提取一页的文字行（含基线、字号、左右边界），并统计页面上的图形 */
async function readPage(page) {
  const textContent = await page.getTextContent()
  const rows = []
  for (const item of textContent.items) {
    const s = item.str
    if (!s || !s.trim()) continue
    const x = item.transform[4]
    const y = item.transform[5]
    const h = item.height || Math.abs(item.transform[3]) || 10
    let row = rows.find((r) => Math.abs(r.y - y) <= 2.5)
    if (!row) {
      row = { y, h, items: [] }
      rows.push(row)
    }
    row.h = Math.max(row.h, h)
    row.items.push({ str: s, x, width: item.width || 0 })
  }

  const lines = rows
    .sort((a, b) => b.y - a.y)
    .map((row) => {
      row.items.sort((a, b) => a.x - b.x)
      const x = row.items[0].x
      const x1 = Math.max(...row.items.map((it) => it.x + it.width))
      return { y: row.y, h: row.h, x, x1, text: joinRowText(row.items) }
    })
    .filter((line) => line.text.trim())

  // 页面图形：排除水印底板；返回是否有需要截图的图形
  const opList = await page.getOperatorList()
  let hasFigure = false
  const imageOps = new Set([
    OPS.paintImageXObject,
    OPS.paintJpegXObject,
    OPS.paintInlineImageXObject,
    OPS.paintImageMaskXObject,
  ])
  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i]
    if (!imageOps.has(fn)) continue
    const args = opList.argsArray[i]
    const w = fn === OPS.paintInlineImageXObject ? args?.[0]?.width : args?.[1]
    const h = fn === OPS.paintInlineImageXObject ? args?.[0]?.height : args?.[2]
    if (!w || !h) continue
    if (w === WATERMARK.w && h === WATERMARK.h) continue
    if (w * h < 80 * 40) continue
    hasFigure = true
  }

  return { lines, hasFigure }
}

/** 页面文字是否可用（中文过少才判定不可用，走 OCR 兜底） */
function textUsable(lines) {
  const text = lines.map((l) => l.text).join('')
  const cjk = (text.match(/[\u3400-\u9fff]/g) || []).length
  // 代码/公式页中文占比天然偏低，只看绝对量与极低占比
  return cjk >= 40 && cjk / Math.max(1, text.length) >= 0.12
}

// ---------- OCR 兜底 ----------

function runOcr(imagePath) {
  try {
    const out = execFileSync(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', OCR_SCRIPT, '-ImagePath', imagePath, '-Lang', 'zh-Hans-CN'],
      { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
    )
    const parsed = JSON.parse(out.trim())
    return parsed.lines ?? []
  } catch (err) {
    const msg = (err?.stderr || err?.message || '').toString().trim()
    console.warn(`  ! OCR 失败（${imagePath}）：${msg.split('\n')[0]}`)
    return null
  }
}

// ---------- 主流程 ----------

function* pdfFiles(onlyYear) {
  const files = readdirSync(DOCS_DIR).filter((f) => /\.pdf$/i.test(f) && /\d{4}/.test(f))
  for (const file of files) {
    const year = Number(/\d{4}/.exec(file)[0])
    if (onlyYear && year !== onlyYear) continue
    yield { year, file }
  }
}

async function importOne({ year, file }) {
  const pdfPath = join(DOCS_DIR, file)
  console.log(`\n▶ ${year}  ${file}`)
  const doc = await openPdf(pdfPath)

  const pages = []
  let ocrPages = 0
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const { lines, hasFigure } = await readPage(page)
    const usable = textUsable(lines)
    pages.push({ no: p, lines, hasFigure, ocr: !usable, page })
    if (!usable) ocrPages++
  }

  // 页面尺寸（pt）→ 统一渲染宽度后的像素尺寸
  const firstViewport = pages[0].page.getViewport({ scale: 1 })
  const pxRatio = TARGET_WIDTH / firstViewport.width
  const dims = {}
  for (const p of pages) {
    const vp = p.page.getViewport({ scale: 1 })
    dims[p.no] = { width: Math.round(vp.width * pxRatio), height: Math.round(vp.height * pxRatio), ptW: vp.width, ptH: vp.height }
  }

  // 渲染页图（先全部渲染到内存，最终只写被引用的页）
  mkdirSync(TMP_DIR, { recursive: true })
  const rendered = new Map()
  for (const p of pages) {
    const vp = p.page.getViewport({ scale: pxRatio })
    const canvas = createCanvas(Math.round(vp.width), Math.round(vp.height))
    const ctx = canvas.getContext('2d')
    // 透明像素在 JPEG 里会变黑：先铺白底
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    await p.page.render({ canvasContext: ctx, viewport: vp, canvas }).promise
    rendered.set(p.no, canvas)

    if (p.ocr) {
      const tmpFile = join(TMP_DIR, `${year}-p${p.no}.jpg`)
      writeFileSync(tmpFile, await canvas.encode('jpeg', JPEG_QUALITY))
      const ocrLines = runOcr(tmpFile)
      if (ocrLines) {
        p.lines = ocrLines
          .filter((l) => l.text && l.text.trim())
          .map((l) => ({
            y: l.y,
            h: l.h,
            x: l.x,
            x1: l.x + l.w,
            // Windows OCR 会在汉字之间插入空格，去掉以便搜索
            text: l.text.replace(/(?<=[\u3400-\u9fff])\s+(?=[\u3400-\u9fff])/g, ''),
            // OCR 坐标为页图像素（左上原点），这里换算回 PDF 基线坐标系
            ocrBox: { x: l.x, y: l.y, w: l.w, h: l.h },
          }))
        // OCR 行没有基线坐标：按 bbox 顶端换算出近似的 y（PDF 从下往上）
        for (const line of p.lines) {
          line.y = dims[p.no].ptH - line.ocrBox.y / pxRatio
          line.x = line.ocrBox.x / pxRatio
          line.x1 = (line.ocrBox.x + line.ocrBox.w) / pxRatio
          line.h = line.ocrBox.h / pxRatio
        }
      } else {
        p.lines = []
      }
    }
  }

  // 过滤页眉/页脚，串成全局行流
  const allLines = []
  for (const p of pages) {
    for (const line of p.lines) {
      const text = line.text.trim()
      if (HEADER_RE.test(text)) continue
      if (PAGE_NO_RE.test(text)) continue
      // 丢掉单个符号噪声，但保留代码里的 } { ; ) 等有意义的单字符行
      if (text.length <= 1 && !/[\u3400-\u9fff{}();]/.test(text)) continue
      allLines.push({ page: p.no, ...line, text })
    }
  }

  // 正文段首左边界：取出现次数最多的行左边界（题号行与普通段首对齐，
  // 折行续行会明显更靠左，代码/表格行则更靠右）
  const xCount = new Map()
  for (const line of allLines) {
    if (line.text.trim().length < 6) continue
    const key = Math.round(line.x)
    xCount.set(key, (xCount.get(key) ?? 0) + 1)
  }
  const paragraphLeft = [...xCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0

  // 找题目起点
  const starts = []
  let expected = 1
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i]
    const m = QUESTION_RE.exec(line.text)
    if (!m) continue
    const num = Number(m[1])
    if (num < 1 || num > 60) continue
    // 题号必须递增；回到 1 视为新一轮编号（文档可能按科目重新编号）
    const okOrder = num === expected || (num === 1 && starts.length > 0)
    if (!okOrder) continue
    // 题号行必须与正文段首左边界对齐，避免把代码/表格里缩进的数字当成新题
    if (Math.abs(line.x - paragraphLeft) > 8) continue
    starts.push({ index: i, number: num })
    expected = num + 1
  }

  if (!starts.length) {
    console.warn('  ! 未识别到题号，跳过')
    return null
  }

  const questions = []
  for (let s = 0; s < starts.length; s++) {
    const from = starts[s].index
    const to = s + 1 < starts.length ? starts[s + 1].index : allLines.length
    const block = allLines.slice(from, to)
    if (!block.length) continue

    // 去掉紧跟在页眉/页脚位置的噪声行
    const cleaned = block.filter((line) => !HEADER_RE.test(line.text.trim()))

    const rawText = joinBlockLines(cleaned)
    const { stem: rawStem, options } = splitOptions(rawText)
    // 去掉题干开头的题号（题号单独存放在 number 字段）
    const stem = rawStem.replace(/^\s*\d{1,2}\s*[.．、]\s*/, '').trim()
    if (!stem) continue

    const type = options.length === 4 ? 'single' : 'comprehensive'

    // 原题截图：按页分组生成纵向切片
    const crops = []
    const byPage = new Map()
    for (const line of cleaned) {
      const list = byPage.get(line.page) ?? []
      list.push(line)
      byPage.set(line.page, list)
    }
    const pageNos = [...byPage.keys()].sort((a, b) => a - b)
    pageNos.forEach((pageNo, idx) => {
      const lines = byPage.get(pageNo)
      const tops = lines.map((l) => (dims[pageNo].ptH - l.y - l.h) * pxRatio)
      const bottoms = lines.map((l) => (dims[pageNo].ptH - l.y + l.h * 0.35) * pxRatio)
      const top = idx === 0 ? Math.max(0, Math.min(...tops) - 8) : 0
      const bottom = idx === pageNos.length - 1 ? Math.min(dims[pageNo].height, Math.max(...bottoms) + 8) : dims[pageNo].height
      if (bottom - top < 12) return
      crops.push({
        page: pageNo,
        x: 0,
        y: Math.round(top),
        w: dims[pageNo].width,
        h: Math.round(bottom - top),
      })
    })

    const cue = needsOriginal(cleaned, stem)
    questions.push({
      id: `V-${year}-${String(starts[s].number).padStart(2, '0')}`,
      year,
      number: starts[s].number,
      type,
      stem,
      options,
      crops,
      ...(cue ? { needsOriginal: true } : {}),
      ...(pages.find((p) => p.ocr && byPage.has(p.no)) ? { ocr: true } : {}),
    })
  }

  // 题号去重（增量更新文档可能重复出现同一题号）
  const seen = new Set()
  const unique = []
  for (const q of questions) {
    if (seen.has(q.id)) continue
    seen.add(q.id)
    unique.push(q)
  }
  unique.sort((a, b) => a.number - b.number)

  // ---- 写出页图（只保留被题目引用的页） ----
  const usedPages = new Set()
  for (const q of unique) for (const c of q.crops) usedPages.add(c.page)
  const imgDir = join(IMAGE_DIR, String(year))
  mkdirSync(imgDir, { recursive: true })
  for (const file of readdirSync(imgDir)) {
    const keep = [...usedPages].some((no) => file === `p${no}.jpg`)
    if (!keep) rmSync(join(imgDir, file), { force: true })
  }
  const pageMeta = {}
  for (const pageNo of [...usedPages].sort((a, b) => a - b)) {
    const canvas = rendered.get(pageNo)
    writeFileSync(join(imgDir, `p${pageNo}.jpg`), await canvas.encode('jpeg', JPEG_QUALITY))
    pageMeta[pageNo] = { src: `/questions/${year}/p${pageNo}.jpg`, width: dims[pageNo].width, height: dims[pageNo].height }
  }

  const paper = {
    year,
    source: 'variant',
    sourceFile: file,
    pages: pageMeta,
    questions: unique,
  }

  // ---- 写出 JSON ----
  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(join(DATA_DIR, `${year}.json`), `${JSON.stringify(paper, null, 2)}\n`, 'utf8')

  // ---- 写出 docs 整理文档 ----
  mkdirSync(MD_DIR, { recursive: true })
  writeFileSync(join(MD_DIR, `${year}-变形题.md`), renderMarkdown(paper), 'utf8')

  // ---- 统计 ----
  const single = unique.filter((q) => q.type === 'single').length
  const withCrop = unique.filter((q) => q.crops?.length).length
  const suspicious = unique.filter((q) => q.stem.length < 12 || (q.type === 'single' && q.options.some((o) => !o.text)))
  console.log(`  ✓ ${unique.length} 题（单选 ${single} / 综合 ${unique.length - single}），原题截图 ${withCrop} 题，OCR 页 ${ocrPages}，页图 ${usedPages.size} 张`)
  if (suspicious.length) {
    console.log(`  ! 可疑题：${suspicious.map((q) => q.number).join(', ')}`)
  }

  await doc.cleanup?.()

  return paper
}

function renderMarkdown(paper) {
  const single = paper.questions.filter((q) => q.type === 'single').length
  const lines = []
  lines.push(`# ${paper.year} 年真题变形题`)
  lines.push('')
  lines.push(`- 来源：\`docs/${paper.sourceFile}\``)
  lines.push(`- 题数：${paper.questions.length}（单选 ${single} / 综合 ${paper.questions.length - single}）`)
  lines.push('- 整理方式：PDF 文字层自动提取；含图形、表格、公式的题保留原题截图（页图 + 裁剪坐标）')
  lines.push('')
  for (const q of paper.questions) {
    lines.push('---')
    lines.push('')
    lines.push(`## ${q.number}. （${q.type === 'single' ? '单选' : '综合'}）`)
    lines.push('')
    lines.push(q.stem)
    lines.push('')
    if (q.options.length) {
      for (const o of q.options) lines.push(`- ${o.key}．${o.text}`)
      lines.push('')
    }
    if (q.crops?.length) {
      for (const c of q.crops) {
        const meta = paper.pages?.[c.page]
        lines.push(
          `> 原题截图：\`public/questions/${paper.year}/p${c.page}.jpg\` ${meta ? `（${meta.width}×${meta.height}）` : ''} crop x=${c.x} y=${c.y} w=${c.w} h=${c.h}`,
        )
      }
      lines.push('')
    }
  }
  return `${lines.join('\n')}\n`
}

// ---------- 入口 ----------

const yearArgIndex = process.argv.indexOf('--year')
const onlyYear = yearArgIndex >= 0 ? Number(process.argv[yearArgIndex + 1]) : null

const results = []
for (const item of pdfFiles(onlyYear)) {
  const paper = await importOne(item)
  if (paper) results.push(paper)
}

console.log('\n──────── 汇总 ────────')
for (const paper of results) {
  console.log(`  ${paper.year}  ${paper.questions.length} 题`)
}
console.log(`  共 ${results.length} 年 ${results.reduce((s, p) => s + p.questions.length, 0)} 题`)
