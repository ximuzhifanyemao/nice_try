// ============================================================
// 离线批量生成「AI 解析」预生成内容（句子主干/结构解析/短语搭配）
// 用法：
//   node scripts/gen-ai-analysis.cjs [N=30] [--write-only]
// 说明：
//   - 默认处理前 N 天（默认 30）的所有句子，逐个调用腾讯云 SCF 生成解析
//   - 结果缓存到 scripts/_ai-results.json（key: `${day}_${num}`），支持断点续跑
//   - 生成完毕后自动把 ai 字段写回 src/data/englishDaily.json（对象级操作，保留其余内容）
//   - --write-only：跳过 AI 调用，仅根据已有缓存把 ai 字段写回数据文件
// ============================================================
const fs = require('fs')
const path = require('path')

const P = path.resolve(__dirname, '..', 'src', 'data', 'englishDaily.json')
const RESULTS = path.resolve(__dirname, '_ai-results.json')
const SCF_URL =
  (process.env.VITE_AI_CORRECT_URL || '').trim() ||
  'https://1317742320-k6jrgdqkr6.ap-shanghai.tencentscf.com'

const args = process.argv.slice(2)
const DAYS = parseInt(args.find((a) => /^\d+$/.test(a)) || '30', 10)
const WRITE_ONLY = args.includes('--write-only')

// ---------- 加载 englishDaily.json ----------
function loadData() {
  return JSON.parse(fs.readFileSync(P, 'utf-8'))
}

// ---------- 调用 SCF 生成单句解析 ----------
async function callScf(en, ref) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 55000)
  try {
    const resp = await fetch(SCF_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        action: 'analyze', // 走 SCF 专注解析分支，强制输出 backbone/structure/collocations
        en,
        userTranslation: ref || en, // SCF 要求非空；解析字段与用户译文无关
        refTranslation: ref || '',
      }),
    })
    const text = await resp.text()
    let body
    try { body = JSON.parse(text) } catch (_) { body = {} }
    if (!resp.ok || !body.ok || !body.data) {
      throw new Error(`SCF ${resp.status}: ${(body.error || text).slice(0, 200)}`)
    }
    const d = body.data || {}
    const str = (v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim())
    const strArr = (v) => (Array.isArray(v) ? v.map(str).filter(Boolean) : [])
    const backbone = str(d.backbone)
    if (!backbone) throw new Error('AI 未返回句子主干')
    return {
      backbone,
      structure: strArr(d.structure),
      collocations: strArr(d.collocations),
    }
  } finally {
    clearTimeout(timer)
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
function saveResults(results) {
  fs.writeFileSync(RESULTS, JSON.stringify(results, null, 1), 'utf-8')
}

// ---------- 生成 ----------
async function generate(data) {
  let results = {}
  if (fs.existsSync(RESULTS)) {
    try { results = JSON.parse(fs.readFileSync(RESULTS, 'utf-8')) } catch (_) { results = {} }
  }
  let ok = 0, fail = 0
  const targets = data.filter((d) => d.day <= DAYS)
  const total = targets.reduce((n, d) => n + d.sentences.length, 0)
  console.log(`目标：前 ${DAYS} 天，共 ${total} 句（已有缓存 ${Object.keys(results).length} 条）`)
  for (const day of targets) {
    for (const s of day.sentences) {
      const key = `${day.day}_${s.num}`
      if (results[key] && results[key].ok) { ok++; continue }
      let lastErr = ''
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const ai = await callScf(s.en, s.ref || s.en)
          results[key] = { ok: true, ...ai }
          saveResults(results)
          ok++
          break
        } catch (e) {
          lastErr = e.message || String(e)
          await sleep(1200)
        }
      }
      if (!results[key] || !results[key].ok) {
        results[key] = { ok: false, error: lastErr.slice(0, 300) }
        saveResults(results)
        fail++
      }
      process.stdout.write(`\r进度 ${ok + fail}/${total} | 成功 ${ok} | 失败 ${fail} | 当前 Day ${day.day} ${s.num}   `)
      await sleep(250)
    }
  }
  console.log('\n生成完成：成功 ' + ok + '，失败 ' + fail)
  return results
}

// ---------- 写回 englishDaily.json（对象级插入 ai 字段，保留其余所有内容） ----------
function writeBack(results) {
  const data = loadData()
  let inserted = 0
  let skipped = 0
  for (const day of data) {
    if (day.day < 1 || day.day > DAYS) continue
    for (const s of day.sentences) {
      if (s.ai) { skipped++; continue }
      const ai = results[`${day.day}_${s.num}`]
      if (ai && ai.ok) {
        s.ai = { backbone: ai.backbone, structure: ai.structure, collocations: ai.collocations }
        inserted++
      }
    }
  }
  fs.writeFileSync(P, JSON.stringify(data, null, 1) + '\n', 'utf-8')
  console.log(`写回完成：共插入 ${inserted} 个句子的 ai 字段（跳过已存在 ${skipped} 个）→ ${P}`)
  return inserted
}

// ---------- 主流程 ----------
async function main() {
  const data = loadData()
  const expect = data.filter((d) => d.day <= DAYS).reduce((n, d) => n + d.sentences.length, 0)
  console.log(`数据加载：共 ${expect} 个句子（前 ${DAYS} 天）`)

  let results = {}
  if (WRITE_ONLY) {
    results = JSON.parse(fs.readFileSync(RESULTS, 'utf-8'))
  } else {
    results = await generate(data)
  }
  writeBack(results)
}

main().catch((e) => { console.error(e); process.exit(1) })
