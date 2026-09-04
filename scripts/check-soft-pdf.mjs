// 检查软著 PDF：页数、每页文本行数（源程序≥50行/页，文档≥30行/页）
// 用法: node scripts/check-soft-pdf.mjs <pdf> 源程序|文档
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'

const [, , file, kind = '源程序'] = process.argv
const src = readFileSync(file).toString('latin1')

// 1. 页面数：/Type /Page 对象个数（+ 根 /Count 佐证）
const pageTypeCount = (src.match(/\b\/Type\s*\/Page\b/g) || []).length
const maxCount = Math.max(0, ...[...(src.match(/\/Count\s+(\d+)/g) || [])].map((s) => Number(s.match(/\d+/)[0])))

// 2. 收集每一个 /Contents N 0 R（按出现顺序 = 页面顺序），提取内容流
const refs = [...src.matchAll(/\/Contents\s+(\d+)\s+\d+\s+R/g)].map((m) => Number(m[1]))
const decodeRef = (ref) => {
  // \b 防止 ref=7 误匹配到 107/207 等对象
  const m = src.match(new RegExp('\\b' + ref + '\\s+\\d+\\s+obj[\\s\\S]*?stream\\r?\\n([\\s\\S]*?)endstream'))
  if (!m) return null
  try {
    return inflateSync(Buffer.from(m[1], 'latin1')).toString('latin1')
  } catch {
    return null
  }
}

// 3. 解析内容流：统计文本行（文本定位 Tm 的 y 值去重，兼容 Chromium/Tm 与经典/Td 两种布局）
function analyzeContent(s) {
  // 布局 A：每行一个 Tm（Chromium headless）
  const tmA = []
  {
    const re = /[\d.-]+\s+[\d.-]+\s+[\d.-]+\s+[\d.-]+\s+([\d.-]+)\s+([\d.-]+)\s+Tm/g
    let m
    while ((m = re.exec(s))) tmA.push({ x: Number(m[1]), y: Number(m[2]) })
  }
  // 布局 B：Td 逐行推进（经典布局）
  const tokenRe = /\[|\]|<[0-9A-Fa-f\s]*>|\((?:\\.|[^\\()])*\)|[A-Za-z*'"][A-Za-z0-9*.']*|-?\d+(?:\.\d+)?/g
  const stack = []
  const yRows = []
  let ty = 0
  let TL = 0
  let inText = false
  let tok
  while ((tok = tokenRe.exec(s)) !== null) {
    const t = tok[0]
    if (/^-?\d/.test(t)) { stack.push(parseFloat(t)); continue }
    if (t === '[' || t === ']' || t.startsWith('<') || t.startsWith('(')) continue
    switch (t) {
      case 'BT': inText = true; stack.length = 0; break
      case 'ET': inText = false; stack.length = 0; break
      case 'Td': { const dy = stack.pop() || 0; stack.pop(); ty += dy; break }
      case 'TD': { const dy = stack.pop() || 0; stack.pop(); ty -= TL; ty += dy; break }
      case 'Tm': { const f = stack.pop() || 0; stack.length = 0; ty = f; break }
      case 'T*': ty -= TL; break
      case 'TL': TL = stack.pop() || 0; break
      case 'Tj': case "'": case '"': case 'TJ': { if (inText) yRows.push(Math.round(ty * 10) / 10); break }
      default: stack.length = 0
    }
  }
  // 取两者中更接近预期的结果（Tm 布局下优先用 Tm 计数）
  const uniqArr = (a, tol) => { const r = []; for (const v of a) if (!r.some((u) => Math.abs(u - v) < tol)) r.push(v); return r }
  if (tmA.length > 0) {
    // Chromium 布局：y 可能被 d=-1 翻转或未翻，统一按唯一值
    return { tm: uniqArr(tmA.map((t) => t.y), 1.5).length, td: uniqArr(yRows, 1.5).length }
  }
  return { tm: 0, td: uniqArr(yRows, 1.5).length }
}

// 4. 逐页统计（优先采用 Tm 布局的行数）
const rowCounts = refs.map((r) => {
  const o = analyzeContent(decodeRef(r) || '')
  return o.tm > 0 ? o.tm : o.td
})
const perPage = rowCounts

const totalPages = perPage.length
const minRows = perPage.length ? Math.min(...perPage) : 0
const maxRows = perPage.length ? Math.max(...perPage) : 0
const out = []
out.push(`文件: ${file}`)
out.push(`类型: ${kind}`)
out.push(`总页数: ${maxCount || '?'}（PDF 页面树 /Count） / 内容流数: ${totalPages}`)
if (totalPages) {
  out.push(`每页行数: 最少 ${minRows} / 最多 ${maxRows}`)
  out.push(`前3页: ${perPage.slice(0, 3).join(', ')}    末3页: ${perPage.slice(-3).join(', ')}`)
  const under = []
  perPage.forEach((n, i) => { if (n < (kind === '源程序' ? 50 : 30)) under.push(`第${i + 1}页(${n}行)`) })
  out.push('--- 判断 ---')
  out.push(`页数: ${totalPages}${kind === '源程序' ? '（源程序要求前后各30页=60页，或不足60页全部提交）' : '（文档要求前后各30页=60页，或不足60页全部提交）'}`)
  if (under.length) out.push(`⚠ 行数不足页: ${under.join('、')}`)
  else out.push(`✓ 每页行数均满足要求（${kind === '源程序' ? '≥50' : '≥30'}行）`)
  if (kind === '源程序' && totalPages === 60) out.push('✓ 共60页，符合前30页+后30页格式')
  if (kind === '源程序' && totalPages !== 60) out.push(`⚠ 共${totalPages}页，与标准60页不符，请核对打印设置`)
  if (kind === '文档' && totalPages < 60) out.push(`✓ 共${totalPages}页（<60页），提交全部即可`)
  if (kind === '文档' && totalPages >= 60) out.push('⚠ 达到/超过60页，需取前30页+后30页')
} else {
  out.push('⚠ 未能解析任何内容流')
}
console.log(out.join('\n'))