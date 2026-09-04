// 校验打印版 HTML：页数、每页代码行数
// 用法: node scripts/check-soft-html.mjs <打印版.html>
import { readFileSync } from 'node:fs'

const html = readFileSync(process.argv[2], 'utf8')
const sections = html.split(/<section class="page">/).slice(1)
const pageRows = sections.map((sec) => {
  // 行数 = <pre> 内换行数 + 1
  const preMatch = sec.match(/<pre class="code">([\s\S]*?)<\/pre>/)
  if (!preMatch) return 0
  const body = preMatch[1]
  if (body === '') return 1
  return body.split('\n').length
})
const headers = [...html.matchAll(/<header>([\s\S]*?)<\/header>/g)].map((m) => m[1])
const out = []
out.push(`页数: ${sections.length}`)
out.push(`每页行数: 最少 ${Math.min(...pageRows)} / 最多 ${Math.max(...pageRows)}`)
const odd = pageRows.map((n, i) => (n === 50 ? null : `第${i + 1}页=${n}`)).filter(Boolean)
out.push(odd.length ? '⚠ 非50行页: ' + odd.join(', ') : '✓ 所有页均为 50 行')
out.push(`页眉示例: ${headers[0]} / ${headers[1]} / ${headers[headers.length - 1]}`)
console.log(out.join('\n'))