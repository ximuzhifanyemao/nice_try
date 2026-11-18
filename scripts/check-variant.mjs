// 校验变形题库（src/data/variant/*.json）结构与页图文件
// 用法: node scripts/check-variant.mjs [--year 2024]
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const DATA_DIR = join(ROOT, 'src/data/variant')
const PUBLIC_DIR = join(ROOT, 'public')

const yearArgIndex = process.argv.indexOf('--year')
const onlyYear = yearArgIndex >= 0 ? Number(process.argv[yearArgIndex + 1]) : null

const errors = []
const warnings = []
const rows = []

let files = []
try {
  files = readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'))
} catch {
  errors.push(`无法读取目录 ${DATA_DIR}`)
}

if (!files.length) errors.push('src/data/variant 下没有任何年份数据，请先运行 npm run import:variant')

for (const file of files.sort()) {
  const matched = /^(\d{4})\.json$/.exec(file)
  if (!matched) {
    warnings.push(`${file}: 文件名不是 <年份>.json，已忽略`)
    continue
  }
  const year = Number(matched[1])
  if (onlyYear && year !== onlyYear) continue

  let paper
  try {
    paper = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8'))
  } catch (e) {
    errors.push(`${year}: JSON 解析失败 - ${e.message}`)
    continue
  }

  if (paper?.year !== year) errors.push(`${year}: 文件内 year 应为 ${year}，实际为 ${paper?.year}`)
  if (paper?.source !== 'variant') errors.push(`${year}: source 应为 variant，实际为 ${paper?.source}`)
  if (typeof paper?.sourceFile !== 'string' || !paper.sourceFile) errors.push(`${year}: sourceFile 不能为空`)

  const questions = paper?.questions
  if (!Array.isArray(questions) || !questions.length) {
    errors.push(`${year}: questions 为空或不是数组`)
    continue
  }

  const pages = paper?.pages ?? {}
  const seenNumbers = new Set()
  let single = 0
  let comprehensive = 0
  let withCrop = 0
  let ocrCount = 0

  questions.forEach((q, index) => {
    const at = (label) => `${year} 第 ${q?.number ?? index + 1} 题: ${label}`
    if (!q || typeof q !== 'object') {
      errors.push(`${year} 索引 ${index}: 题目不是对象`)
      return
    }
    if (q.year !== year) errors.push(at(`year 应为 ${year}`))
    if (!Number.isInteger(q.number) || q.number < 1 || q.number > 60) errors.push(at(`number 非法: ${q.number}`))
    const expectedId = `V-${year}-${String(q.number).padStart(2, '0')}`
    if (q.id !== expectedId) errors.push(at(`id 应为 ${expectedId}，实际为 ${q.id}`))
    if (q.type !== 'single' && q.type !== 'comprehensive') errors.push(at(`type 非法: ${q.type}`))
    if (typeof q.stem !== 'string' || !q.stem.trim()) errors.push(at('题干为空'))
    if (q.ocr !== undefined && typeof q.ocr !== 'boolean') errors.push(at('ocr 必须是布尔值'))

    if (seenNumbers.has(q.number)) errors.push(at('题号重复'))
    seenNumbers.add(q.number)

    if (q.type === 'single') {
      single++
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        errors.push(at(`单选题必须恰好 4 个选项，实际为 ${Array.isArray(q.options) ? q.options.length : '非数组'}`))
      } else {
        if (q.options.some((o) => !o || typeof o.key !== 'string' || !o.key)) errors.push(at('选项 key 不能为空'))
        if (q.options.some((o) => typeof o.text !== 'string' || !o.text.trim())) errors.push(at('选项文本不能为空'))
        if (new Set(q.options.map((o) => o?.key)).size !== 4) errors.push(at('选项 key 重复'))
      }
    } else {
      comprehensive++
      if (!Array.isArray(q.options) || q.options.length !== 0) errors.push(at('综合题的 options 应为空数组'))
    }

    if (q.crops !== undefined) {
      if (!Array.isArray(q.crops) || !q.crops.length) errors.push(at('crops 必须是非空数组或省略'))
      else {
        withCrop++
        for (const crop of q.crops) {
          if (!pages[crop.page]) errors.push(at(`crop 引用了不存在的页 ${crop.page}`))
          if (![crop.x, crop.y, crop.w, crop.h].every((n) => Number.isFinite(n))) errors.push(at('crop 坐标必须是数字'))
          if (crop.w <= 0 || crop.h <= 0) errors.push(at('crop 宽高必须大于 0'))
          const meta = pages[crop.page]
          if (meta) {
            if (crop.x < 0 || crop.y < 0 || crop.x + crop.w > meta.width + 1 || crop.y + crop.h > meta.height + 1) {
              errors.push(at(`crop 超出页 ${crop.page} 的范围`))
            }
          }
        }
      }
    }
    if (q.ocr) ocrCount++
  })

  // 题号必须从 1 开始连续
  const maxNumber = Math.max(...questions.map((q) => q.number))
  const missing = []
  for (let n = 1; n <= maxNumber; n++) if (!seenNumbers.has(n)) missing.push(n)
  if (missing.length) errors.push(`${year}: 题号不连续，缺少 ${missing.join(', ')}`)

  // 被引用的页图必须存在
  for (const [pageNo, meta] of Object.entries(pages)) {
    if (!meta?.src) {
      errors.push(`${year}: 页 ${pageNo} 缺少 src`)
      continue
    }
    const filePath = join(PUBLIC_DIR, meta.src.replace(/^\//, ''))
    if (!existsSync(filePath)) errors.push(`${year}: 页图不存在 ${meta.src}`)
    const used = questions.some((q) => (q.crops ?? []).some((c) => String(c.page) === pageNo))
    if (!used) warnings.push(`${year}: 页 ${pageNo} 的页图没有被任何题目引用`)
  }

  rows.push({ year, total: questions.length, single, comprehensive, withCrop, ocrCount, pages: Object.keys(pages).length, sourceFile: paper.sourceFile })
}

// ---------- 输出 ----------
const lines = []
lines.push('变形题库校验')
lines.push('目录: src/data/variant')
lines.push('')
for (const row of rows) {
  lines.push(
    `  ${row.year}  共 ${String(row.total).padStart(2)} 题（单选 ${row.single} / 综合 ${row.comprehensive}）  截图 ${row.withCrop}  页图 ${row.pages}  OCR ${row.ocrCount}`,
  )
}
lines.push('')
lines.push(`合计: ${rows.length} 年 ${rows.reduce((s, r) => s + r.total, 0)} 题`)

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
