// ============================================================
// 离线批量生成「AI 解析」预生成内容（句子主干/结构解析/短语搭配）
// 用法：
//   node scripts/gen-ai-analysis.cjs [N=30] [--write-only]
// 说明：
//   - 默认处理前 N 天（默认 30）的所有句子，逐个调用腾讯云 SCF 生成解析
//   - 结果缓存到 scripts/_ai-results.json（key: `${day}_${num}`），支持断点续跑
//   - 生成完毕后自动把 ai 字段写回 src/data/englishDaily.ts（纯文本插入，保留其余内容）
//   - --write-only：跳过 AI 调用，仅根据已有缓存把 ai 字段写回数据文件
// ============================================================
const fs = require('fs')
const path = require('path')

const P = path.resolve(__dirname, '..', 'src', 'data', 'englishDaily.ts')
const RESULTS = path.resolve(__dirname, '_ai-results.json')
const SCF_URL =
  (process.env.VITE_AI_CORRECT_URL || '').trim() ||
  'https://1317742320-k6jrgdqkr6.ap-shanghai.tencentscf.com'

const args = process.argv.slice(2)
const DAYS = parseInt(args.find((a) => /^\d+$/.test(a)) || '30', 10)
const WRITE_ONLY = args.includes('--write-only')

// ---------- 加载 englishDaily.ts 数据（eval 数组字面量） ----------
function loadData(ts) {
  const start = ts.indexOf('ENGLISH_DAILY: EnglishDay[] = [')
  const content = ts.substring(start + 'ENGLISH_DAILY: EnglishDay[] = '.length)
  let depth = 0, end = -1
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '[') depth++
    else if (content[i] === ']') { depth--; if (depth === 0) { end = i + 1; break } }
  }
  if (end === -1) throw new Error('无法定位 ENGLISH_DAILY 数组')
  return eval(content.substring(0, end))
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

// ---------- 写回 englishDaily.ts（纯文本插入 ai 字段） ----------
function writeBack(results) {
  const ts = fs.readFileSync(P, 'utf-8')
  const lines = ts.split('\n')
  let curDay = 0
  let inserted = 0
  const out = []
  for (const line of lines) {
    const dm = line.match(/^\s*day: (\d+),$/)
    if (dm) curDay = parseInt(dm[1], 10)
    const sm = line.match(/num: "([^"]+)"/)
    const isSent = sm && /^\s*\{ num: /.test(line)
    if (isSent && curDay >= 1 && curDay <= DAYS) {
      const ai = results[`${curDay}_${sm[1]}`]
      if (ai && ai.ok) {
        const closeIdx = line.lastIndexOf('}')
        const head = line.slice(0, closeIdx).replace(/\s+$/, '')
        const tail = line.slice(closeIdx)
        const indent = (line.match(/^\s*/) || [''])[0]
        const aiStr =
          'ai: { backbone: ' + JSON.stringify(ai.backbone) +
          ', structure: ' + JSON.stringify(ai.structure) +
          ', collocations: ' + JSON.stringify(ai.collocations) + ' }'
        out.push(head + ',')
        out.push(indent + '  ' + aiStr + tail)
        inserted++
        continue
      }
    }
    out.push(line)
  }
  fs.writeFileSync(P, out.join('\n'), 'utf-8')
  console.log(`写回完成：共插入 ${inserted} 个句子的 ai 字段 → ${P}`)
  return inserted
}

// ---------- 主流程 ----------
async function main() {
  const ts = fs.readFileSync(P, 'utf-8')
  const data = loadData(ts)
  // 预检：句子行格式可识别
  const sentLineRe = /^\s*\{ num: ".*?"/
  const lineCount = ts.split('\n').filter((l) => sentLineRe.test(l)).length
  const expect = data.reduce((n, d) => n + d.sentences.length, 0)
  if (lineCount !== expect) {
    console.error(`预检失败：识别到句子行 ${lineCount}，数据中句子数 ${expect}，请检查格式后重试`)
    process.exit(1)
  }
  console.log(`预检通过：共 ${expect} 个句子，行格式可识别`)

  let results = {}
  if (WRITE_ONLY) {
    results = JSON.parse(fs.readFileSync(RESULTS, 'utf-8'))
  } else {
    results = await generate(data)
  }
  writeBack(results)
}

main().catch((e) => { console.error(e); process.exit(1) })
