/**
 * 软著源程序材料生成脚本
 * 生成「源程序前30页 + 后30页，每页50行」的 HTML，并用 Chrome headless 转为 PDF。
 * 用法: node scripts/export-copyright-source.mjs [输出目录]
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const LINES_PER_PAGE = 50
const HEAD_PAGES = 30
const TAIL_PAGES = 30

// ---- 1. 收集自研代码文件（排除提取数据文件） ----
const EXCLUDE = new Set(['englishDaily.ts'])
const EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.java'])

// 逻辑顺序：入口 → 上下文 → hooks → 基础库 → 组件 → 页面 → 插件 → 样式 → Android 原生
const SRC_ORDER = ['main.tsx', 'App.tsx', 'index.css']
function orderWeight(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/')
  if (rel.startsWith('src/main')) return 0
  if (rel.startsWith('src/App')) return 1
  if (rel.startsWith('src/index')) return 100
  if (rel.startsWith('src/contexts')) return 2
  if (rel.startsWith('src/hooks')) return 3
  if (rel.startsWith('src/lib')) return 4
  if (rel.startsWith('src/components')) return 5
  if (rel.startsWith('src/pages')) return 6
  if (rel.startsWith('src/plugins')) return 7
  if (rel.startsWith('android/')) return 8
  return 9
}
function subOrder(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/')
  if (rel.startsWith('src/main')) return rel
  if (rel.startsWith('src/App')) return rel
  if (rel.startsWith('src/contexts')) return rel
  if (rel.startsWith('src/hooks')) return rel
  if (rel.startsWith('src/lib')) return rel
  if (rel.startsWith('src/components')) return rel
  if (rel.startsWith('src/pages')) return rel
  if (rel.startsWith('src/plugins')) return rel
  if (rel.startsWith('android/')) return rel
  return rel
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      walk(full, out)
    } else if (EXTENSIONS.has(path.extname(entry.name).toLowerCase()) && !EXCLUDE.has(entry.name)) {
      out.push(full)
    }
  }
  return out
}

const files = [
  ...walk(path.join(ROOT, 'src')),
  ...walk(path.join(ROOT, 'android', 'app', 'src', 'main', 'java')),
].sort((a, b) => orderWeight(a) - orderWeight(b) || subOrder(a).localeCompare(subOrder(b)))

// ---- 2. 拼接全部代码行 ----
const allLines = []
for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/')
  const raw = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
  const lines = raw.split('\n')
  allLines.push(`// ===== 文件: ${rel} =====`)
  for (const line of lines) allLines.push(line)
}
// 去掉末尾空行噪声
while (allLines.length && allLines[allLines.length - 1].trim() === '') allLines.pop()

const totalPages = Math.ceil(allLines.length / LINES_PER_PAGE)
// 不足60页则全部提交；否则前30页 + 后30页
const headCount = Math.min(HEAD_PAGES, totalPages) * LINES_PER_PAGE
const usedLines =
  totalPages <= HEAD_PAGES + TAIL_PAGES
    ? allLines
    : [...allLines.slice(0, headCount), ...allLines.slice(-TAIL_PAGES * LINES_PER_PAGE)]
const usedPages = Math.ceil(usedLines.length / LINES_PER_PAGE)

// ---- 3. 生成 HTML（每页50行，带页眉：软件名 + 版本 + 页码） ----
const SOFTWARE_NAME = '考研追踪学习管理系统'
const VERSION = 'V1.2.0'

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const pageDivs = []
for (let p = 0; p < usedPages; p++) {
  const start = p * LINES_PER_PAGE
  const pageLines = usedLines.slice(start, start + LINES_PER_PAGE)
  const linesHtml = pageLines
    .map((l) => `<div class="line">${escapeHtml(l) || '&nbsp;'}</div>`)
    .join('')
  pageDivs.push(`
  <div class="page">
    <div class="header">${SOFTWARE_NAME} ${VERSION}&nbsp;&nbsp;第 ${p + 1} 页 / 共 ${usedPages} 页</div>
    <div class="code">${linesHtml}</div>
  </div>`)
}

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Courier New", monospace; }
  .page {
    width: 210mm; height: 297mm;
    padding: 12mm 14mm 10mm;
    page-break-after: always;
    overflow: hidden;
  }
  .page:last-child { page-break-after: auto; }
  .header {
    height: 8mm; line-height: 8mm;
    font-size: 11px; font-weight: bold;
    border-bottom: 0.4mm solid #000;
    margin-bottom: 2mm;
    white-space: nowrap; overflow: hidden;
  }
  .code { height: 273mm; overflow: hidden; }
  .line {
    height: 5.46mm; line-height: 5.46mm;
    font-size: 7.2pt;
    white-space: pre;
    overflow: hidden;
  }
</style>
</head>
<body>
${pageDivs.join('\n')}
</body>
</html>`

const outDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, '软著源材料')
fs.mkdirSync(outDir, { recursive: true })
const htmlPath = path.join(outDir, `${SOFTWARE_NAME}源程序.html`)
const pdfPath = path.join(outDir, `${SOFTWARE_NAME}源程序${VERSION}.pdf`)
fs.writeFileSync(htmlPath, html, 'utf8')

// ---- 4. Chrome headless 转 PDF ----
const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
]
const chrome = chromeCandidates.find((c) => fs.existsSync(c))
if (!chrome) {
  console.error('未找到 Chrome/Edge，HTML 已生成: ' + htmlPath)
  process.exit(1)
}
execFileSync(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--disable-extensions',
  '--no-pdf-header-footer',
  `--print-to-pdf=${pdfPath}`,
  `file:///${htmlPath.replace(/\\/g, '/')}`,
], { stdio: 'inherit' })

// ---- 5. 输出统计 ----
console.log('软件名称:', SOFTWARE_NAME)
console.log('版本:', VERSION)
console.log('自研文件数:', files.length)
console.log('代码总行数:', allLines.length)
console.log('总页数(50行/页):', totalPages)
console.log('提交方案:', totalPages <= HEAD_PAGES + TAIL_PAGES ? '不足60页，全量提交' : `前${HEAD_PAGES}页 + 后${TAIL_PAGES}页`)
console.log('实际提交行数:', usedLines.length, '页数:', usedPages)
console.log('HTML:', htmlPath)
console.log('PDF:', pdfPath)
