// 生成软著申请资料：源程序文档（txt + HTML）
// 规范：无行号纯代码；按功能主次排序；前30页+后30页共60页，每页50行；页眉标注名称/版本/页码
// 用法: node scripts/gen-soft-copyright.mjs
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, relative, extname, dirname } from 'node:path'

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')
const OUT_DIR = join(ROOT, '软著申请资料')
const SOFTWARE_NAME = 'DiveDeep学习打卡追踪系统'
const VERSION = 'V1.0'
const LINES_PER_PAGE = 55 // 每页 55 个显示行（含空行），保证去空行后代码行仍 ≥50
const MAX_PAGES = 60

const EXCLUDE_FILES = new Set(['vite-env.d.ts'])
const EXCLUDE_EXT = new Set(['.json', '.svg', '.png', '.ico'])
const EXCLUDE_DIRS = new Set(['node_modules'])

function collectFiles(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (!EXCLUDE_DIRS.has(name)) out.push(...collectFiles(full))
    } else if (!EXCLUDE_FILES.has(name) && !EXCLUDE_EXT.has(extname(name))) {
      const ext = extname(name)
      if (['.ts', '.tsx', '.css'].includes(ext)) out.push(full)
    }
  }
  return out
}

// 功能主次排序：入口 > 上下文 > 核心页面 > 组件 > 挂件 > hooks > 工具库 > 数据 > 插件 > 样式
const GROUP_ORDER = ['entry', 'contexts', 'pages', 'components', 'widget', 'hooks', 'lib', 'data', 'plugins', 'styles']
function fileGroup(rel) {
  if (rel === 'entry' || /^main\.tsx$/.test(rel) || /^App\.tsx$/.test(rel)) return 'entry'
  const parts = rel.split('/')
  const seg = parts[0]
  if (['contexts', 'pages', 'components', 'widget', 'hooks', 'lib', 'data', 'plugins'].includes(seg)) return seg
  if (rel.endsWith('.css')) return 'styles'
  return 'lib'
}

let files = collectFiles(SRC)
files = files.sort((a, b) => {
  const ra = fileGroup(relative(SRC, a).split('\\').join('/'))
  const rb = fileGroup(relative(SRC, b).split('\\').join('/'))
  const ga = GROUP_ORDER.indexOf(ra)
  const gb = GROUP_ORDER.indexOf(rb)
  if (ga !== gb) return ga - gb
  const pa = relative(SRC, dirname(a))
  const pb = relative(SRC, dirname(b))
  if (pa !== pb) return pa.localeCompare(pb, 'zh-CN') || a.localeCompare(b, 'zh-CN')
  return a.localeCompare(b, 'zh-CN')
})

let totalLines = 0
for (const f of files) totalLines += readFileSync(f, 'utf8').split(/\r?\n/).length

// 合并源码：纯代码（不带行号）
const blocks = []
for (const f of files) {
  const rel = relative(ROOT, f).split('\\').join('/')
  const content = readFileSync(f, 'utf8').replace(/\r?\n/g, '\n').split('\n')
  while (content.length > 0 && content[content.length - 1].trim() === '') content.pop()
  blocks.push(`// ==================== 文件: ${rel} ====================`)
  blocks.push(...content)
  blocks.push('')
}

// 显示宽度软换行（HTML 打印用，避免长行溢出致分页不准）：ASCII 计 1，非 ASCII 计 2
function softWrap(line, maxAsciiWidth) {
  const parts = []
  let cur = ''
  let w = 0
  for (const ch of line) {
    const cw = ch.codePointAt(0) > 0xff ? 2 : 1
    if (w + cw > maxAsciiWidth) {
      parts.push(cur)
      cur = ''
      w = 0
    }
    cur += ch
    w += cw
  }
  if (cur || parts.length === 0) parts.push(cur)
  return parts
}

// 全局连续行号（含空行也有行号，保证 PDF 中每行都可有形可数）
const numbered = blocks.map((l, i) => String(i + 1).padStart(5) + ' ' + l)

const displayLines = []
for (const line of numbered) {
  const wrapped = softWrap(line, 100)
  displayLines.push(wrapped[0])
  for (let i = 1; i < wrapped.length; i++) displayLines.push('      ' + wrapped[i])
}

function pickPages(lines) {
  const totalPages = Math.ceil(lines.length / LINES_PER_PAGE)
  if (totalPages <= MAX_PAGES) return { pages: lines, usedPages: totalPages }
  const front = lines.slice(0, LINES_PER_PAGE * 30)
  const back = lines.slice(lines.length - LINES_PER_PAGE * 30)
  return { pages: front.concat(back), usedPages: MAX_PAGES }
}

function renderTxt(lines) {
  let out = ''
  let idx = 0
  let page = 0
  while (idx < lines.length) {
    page += 1
    const slice = lines.slice(idx, idx + LINES_PER_PAGE)
    out += `${SOFTWARE_NAME} ${VERSION}　　源程序　　第${page}页（共${Math.max(Math.ceil(lines.length / LINES_PER_PAGE), page)}页）\n`
    out += slice.join('\n') + '\n\n'
    idx += LINES_PER_PAGE
  }
  return out
}

mkdirSync(OUT_DIR, { recursive: true })
const txtSel = pickPages(displayLines)
let txtContent = renderTxt(txtSel.pages)
if (Math.ceil(displayLines.length / LINES_PER_PAGE) > MAX_PAGES) {
  txtContent += '\n// ==================== （中间内容省略，仅提交前后各 30 页） ====================\n'
}
writeFileSync(join(OUT_DIR, '01_源程序_DiveDeep学习打卡追踪系统.txt'), txtContent, 'utf8')

// HTML（每页固定 50 行，可直接打印/无头浏览器转 PDF）
const htmlSel = pickPages(displayLines)
const htmlTotal = htmlSel.usedPages
const pageDivs = []
let hIdx = 0
let hPage = 0
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
while (hIdx < htmlSel.pages.length) {
  hPage += 1
  const slice = htmlSel.pages.slice(hIdx, hIdx + LINES_PER_PAGE)
  pageDivs.push(
    `<section class="page">\n` +
    `<header>${esc(SOFTWARE_NAME)} ${VERSION}　　源程序　　第${hPage}页（共${Math.max(htmlTotal, hPage)}页）</header>\n` +
    `<pre class="code">${slice.map((l) => esc(l)).join('\n')}</pre>\n` +
    `</section>`
  )
  hIdx += LINES_PER_PAGE
}

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>${SOFTWARE_NAME} ${VERSION} 源程序</title>
<style>
  @page { size: A4; margin: 14mm 12mm 14mm 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #fff; color: #000; }
  body { font-family: Consolas, 'Courier New', 'NSimSun', monospace; font-size: 7.8pt; line-height: 12.8pt; }
  .page { page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  header { font-family: 'Microsoft YaHei', 'SimSun', sans-serif; font-size: 10.5pt; text-align: center;
           font-weight: bold; border-bottom: 0.6pt solid #000; padding-bottom: 3pt; margin-bottom: 6pt; }
  pre.code { font-family: inherit; font-size: inherit; line-height: inherit;
             white-space: pre-wrap; overflow-wrap: normal; }
</style>
</head>
<body>
${pageDivs.join('\n')}
</body>
</html>`
writeFileSync(join(OUT_DIR, '01_源程序_DiveDeep学习打卡追踪系统（打印版）.html'), html, 'utf8')

console.log('=== 源程序统计 ===')
console.log(`文件数: ${files.length}  总行数: ${totalLines}`)
console.log(`原始分页: ${Math.ceil(blocks.length / LINES_PER_PAGE)} 页 → 提交 ${txtSel.usedPages} 页`)
for (const g of GROUP_ORDER) {
  const n = files.filter((f) => fileGroup(relative(SRC, f).split('\\').join('/')) === g).length
  if (n) console.log(`  [${g}] ${n} 个文件`)
}
console.log('输出:')
console.log('  ' + join(OUT_DIR, '01_源程序_DiveDeep学习打卡追踪系统.txt'))
console.log('  ' + join(OUT_DIR, '01_源程序_DiveDeep学习打卡追踪系统（打印版）.html'))