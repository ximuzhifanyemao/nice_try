// 校验 408 真题库（src/data/exam408/*.json）结构
// 用法: node scripts/check-exam408.mjs [--partial]
//   默认（严格）：要求 2009-2026 共 18 个年份文件齐全、每年 47 题且题号覆盖 1-47
//   --partial  ：仅校验已有的年份文件（题目数量与题号覆盖降级为警告），用于样例数据联调
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const START_YEAR = 2009
const END_YEAR = 2026
const TOTAL_QUESTIONS = 47
const YEARS = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i)
const SECTIONS = ['ds', 'co', 'os', 'cn']
const TYPES = ['single', 'comprehensive']
const DIR = resolve(process.cwd(), 'src/data/exam408')

const partial = process.argv.includes('--partial')
const errors = []
const warnings = []
const rows = []
let totalOk = 0
let totalMissing = 0

const rel = (name) => `src/data/exam408/${name}`

let files = []
try {
  files = readdirSync(DIR).filter((f) => f.endsWith('.json'))
} catch {
  errors.push(`无法读取目录 ${DIR}`)
}

const fileByYear = new Map()
for (const file of files) {
  const matched = /^(\d{4})\.json$/.exec(file)
  if (!matched) {
    warnings.push(`${rel(file)}: 文件名不是 <年份>.json，已忽略`)
    continue
  }
  fileByYear.set(Number(matched[1]), file)
}

function checkPaper(year, file) {
  let paper
  try {
    paper = JSON.parse(readFileSync(join(DIR, file), 'utf8'))
  } catch (e) {
    errors.push(`${year}: JSON 解析失败 - ${e.message}`)
    return null
  }

  if (paper?.year !== year) errors.push(`${year}: 文件内 year 应为 ${year}，实际为 ${paper?.year}`)
  if (typeof paper?.source !== 'string' || paper.source.trim() === '')
    errors.push(`${year}: source 不能为空`)

  const questions = paper?.questions
  if (!Array.isArray(questions)) {
    errors.push(`${year}: questions 不是数组`)
    return null
  }

  if (questions.length !== TOTAL_QUESTIONS) {
    const msg = `${year}: 题目数量应为 ${TOTAL_QUESTIONS}，实际为 ${questions.length}`
    if (partial) warnings.push(`${msg}（--partial 仅警告）`)
    else errors.push(msg)
  }

  const seenNumbers = new Set()
  let ok = 0
  let missing = 0

  questions.forEach((q, index) => {
    if (!q || typeof q !== 'object') {
      errors.push(`${year} 索引 ${index}: 题目不是对象`)
      return
    }
    const at = (label) => `${year} 第 ${q.number ?? index + 1} 题: ${label}`
    const number = q.number

    if (!Number.isInteger(number) || number < 1 || number > TOTAL_QUESTIONS)
      errors.push(at(`number 非法（应为 1-${TOTAL_QUESTIONS}）: ${number}`))
    // 题内 year 可省略（加载时会从文件年份继承），写了就必须与文件年份一致
    if (q.year !== undefined && q.year !== year)
      errors.push(at(`year 应为 ${year}，实际为 ${q.year}`))

    const expectedId = `408-${year}-${String(number).padStart(2, '0')}`
    if (q.id !== expectedId) errors.push(at(`id 应为 ${expectedId}，实际为 ${q.id}`))
    if (!TYPES.includes(q.type)) errors.push(at(`type 非法: ${q.type}`))
    if (!SECTIONS.includes(q.section)) errors.push(at(`section 非法: ${q.section}`))
    if (!Array.isArray(q.tags)) errors.push(at('tags 必须是数组'))
    if (q.status !== 'ok' && q.status !== 'missing')
      errors.push(at(`status 非法（应为 ok / missing）: ${q.status}`))

    if (seenNumbers.has(number)) errors.push(at('题号重复'))
    seenNumbers.add(number)

    if (q.status === 'missing') {
      missing++ // 待补充题允许空内容
      return
    }

    if (typeof q.stem !== 'string' || q.stem.trim() === '') errors.push(at('题干为空'))
    if (typeof q.answer !== 'string' || q.answer.trim() === '') errors.push(at('答案为空'))

    if (q.type === 'single') {
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        errors.push(at(`单选题必须恰好 4 个选项，实际为 ${Array.isArray(q.options) ? q.options.length : '非数组'}`))
      } else {
        if (q.options.some((o) => typeof o?.key !== 'string' || o.key.trim() === ''))
          errors.push(at('选项 key 不能为空'))
        if (q.options.some((o) => typeof o?.text !== 'string' || o.text.trim() === ''))
          errors.push(at('选项文本不能为空'))
        if (new Set(q.options.map((o) => o?.key)).size !== 4) errors.push(at('选项 key 重复'))
      }
      if (!/^[A-D]$/.test(q.answer)) errors.push(at(`单选题答案应在 A-D 内，实际为 ${q.answer}`))
    } else if (q.type === 'comprehensive') {
      if (!Array.isArray(q.options) || q.options.length !== 0)
        errors.push(at('综合题的 options 应为空数组'))
    }

    ok++
  })

  const uncovered = []
  for (let n = 1; n <= TOTAL_QUESTIONS; n++) if (!seenNumbers.has(n)) uncovered.push(n)
  if (uncovered.length) {
    const msg = `${year}: 题号未覆盖 1-${TOTAL_QUESTIONS}，缺少 ${uncovered.join(', ')}`
    if (partial) warnings.push(`${msg}（--partial 仅警告）`)
    else errors.push(msg)
  }

  return { year, ok, missing, total: questions.length }
}

const absentYears = []
for (const year of YEARS) {
  const file = fileByYear.get(year)
  if (!file) {
    absentYears.push(year)
    continue
  }
  const row = checkPaper(year, file)
  if (row) {
    rows.push(row)
    totalOk += row.ok
    totalMissing += row.missing
  }
}

if (absentYears.length) {
  const msg = `缺少 ${absentYears.length} 个年份文件: ${absentYears.join(', ')}`
  if (partial) warnings.push(`${msg}（--partial 仅警告）`)
  else errors.push(msg)
}

const extraYears = [...fileByYear.keys()].filter((y) => !YEARS.includes(y))
if (extraYears.length) warnings.push(`存在范围外年份文件: ${extraYears.join(', ')}`)

// ---------- 输出 ----------
const lines = []
lines.push(`408 真题库校验（${partial ? '样例模式 --partial' : '严格模式'}）`)
lines.push(`目录: src/data/exam408`)
lines.push('')
for (const row of rows) {
  lines.push(`  ${row.year}  ok ${row.ok} / missing ${row.missing}  （共 ${row.total} 题）`)
}
for (const year of absentYears) lines.push(`  ${year}  缺少数据文件`)
lines.push('')
lines.push(
  `合计: 文件 ${rows.length}/${YEARS.length} 年，ok ${totalOk} / missing ${totalMissing} / 共 ${totalOk + totalMissing} 题`,
)

if (warnings.length) {
  lines.push('')
  lines.push(`警告 (${warnings.length}):`)
  for (const w of warnings) lines.push(`  - ${w}`)
}
if (errors.length) {
  lines.push('')
  lines.push(`错误 (${errors.length}):`)
  for (const e of errors) lines.push(`  - ${e}`)
}
lines.push('')
lines.push(errors.length ? '✗ 校验未通过' : '✓ 校验通过')
console.log(lines.join('\n'))

if (errors.length) process.exitCode = 1
