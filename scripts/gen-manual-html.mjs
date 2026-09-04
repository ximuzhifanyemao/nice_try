// 生成软著申请资料：用户操作手册 HTML（可直接打印为 PDF，页码用 PDFelement 后期添加）
// 用法: node scripts/gen-manual-html.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const OUT_DIR = join(ROOT, '软著申请资料')
const MD = readFileSync(join(OUT_DIR, '02_用户操作手册.md'), 'utf8').replace(/\r\n/g, '\n')
const SOFTWARE_NAME = 'DiveDeep学习打卡追踪系统'
const VERSION = 'V1.0'

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// 行内标记：**加粗**、`代码`、*斜体*
function inline(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`(.+?)`/g, '<code style="font-family:Consolas,monospace;background:#f4f4f4;padding:0 2pt;">$1</code>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>')
}

function mdTable(rows) {
  const header = rows[0].split('|').map((c) => c.trim()).filter(Boolean)
  const body = rows.slice(2).map((r) => r.split('|').map((c) => c.trim()).filter(Boolean))
  return `<table>
<thead><tr>${header.map((h) => `<th>${inline(esc(h))}</th>`).join('')}</tr></thead>
<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(esc(c))}</td>`).join('')}</tr>`).join('')}</tbody>
</table>`
}

const lines = MD.split('\n')
const htmlParts = []
let i = 0
while (i < lines.length) {
  const line = lines[i]
  const t = line.trim()
  if (t === '') { i++; continue }
  if (t === '---') { htmlParts.push('<hr />'); i++; continue }
  let m
  if ((m = t.match(/^#\s+(.*)/))) { htmlParts.push(`<h1>${inline(esc(m[1]))}</h1>`); i++; continue }
  if ((m = t.match(/^##\s+(.*)/))) { htmlParts.push(`<h2>${inline(esc(m[1]))}</h2>`); i++; continue }
  if ((m = t.match(/^###\s+(.*)/))) { htmlParts.push(`<h3>${inline(esc(m[1]))}</h3>`); i++; continue }
  if (t.startsWith('>')) {
    const quote = []
    while (i < lines.length && lines[i].trim().startsWith('>')) { quote.push(lines[i].trim().slice(1).trim()); i++ }
    htmlParts.push(`<blockquote>${quote.map((q) => inline(esc(q))).join('<br/>')}</blockquote>`)
    continue
  }
  if (t.startsWith('|')) {
    const rows = []
    while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i].trim()); i++ }
    htmlParts.push(mdTable(rows))
    continue
  }
  if (/^\d+\.\s/.test(t)) {
    const items = []
    while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) { items.push(inline(esc(lines[i].trim().replace(/^\d+\.\s/, '')))); i++ }
    htmlParts.push(`<ol><li>${items.join('</li><li>')}</li></ol>`)
    continue
  }
  if (/^[-*]\s/.test(t)) {
    const items = []
    while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) { items.push(inline(esc(lines[i].trim().replace(/^[-*]\s/, '')))); i++ }
    htmlParts.push(`<ul><li>${items.join('</li><li>')}</li></ul>`)
    continue
  }
  htmlParts.push(`<p>${inline(esc(t))}</p>`)
  i++
}

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>${SOFTWARE_NAME} ${VERSION} 用户操作手册</title>
<style>
  @page { size: A4; margin: 16mm 18mm 16mm 18mm; }
  * { box-sizing: border-box; }
  body { font-family: 'SimSun', 'Microsoft YaHei', serif; font-size: 9.5pt; line-height: 1.42; color: #000; background: #fff; margin: 0; }
  .doc-title { text-align: center; margin: 0 0 2pt; }
  .doc-title h1 { font-size: 15pt; margin: 0 0 2pt; }
  .doc-title .sub { font-size: 10.5pt; margin: 1pt 0; }
  h2 { font-size: 11.5pt; margin: 8pt 0 3pt; border-bottom: 0.8pt solid #000; padding-bottom: 2pt; }
  h3 { font-size: 10.5pt; margin: 6pt 0 2pt; }
  p { margin: 3pt 0; text-align: justify; }
  ol, ul { margin: 3pt 0 3pt 2em; padding: 0; }
  li { margin: 1pt 0; }
  table { border-collapse: collapse; margin: 4pt auto; width: 100%; }
  th, td { border: 0.6pt solid #000; padding: 2.5pt 4pt; font-size: 9pt; }
  th { background: #f2f2f2; }
  blockquote { margin: 4pt 2em; padding: 2pt 6pt; border-left: 3pt solid #999; background: #fafafa; }
  hr { border: none; border-top: 0.8pt solid #000; margin: 8pt 0; }
  .foot-note { margin-top: 10pt; color: #333; font-size: 9pt; }
</style>
</head>
<body>
<div class="doc-title">
  <h1>${SOFTWARE_NAME}</h1>
  <p class="sub">用户操作手册</p>
  <p class="sub">软件版本：${VERSION}</p>
  <p class="sub">著作权人：（个人姓名，登记时填写）</p>
</div>
${htmlParts.join('\n')}
</body>
</html>`

mkdirSync(OUT_DIR, { recursive: true })
const outFile = join(OUT_DIR, '02_用户操作手册（打印版）.html')
writeFileSync(outFile, html, 'utf8')
console.log('输出:', outFile)