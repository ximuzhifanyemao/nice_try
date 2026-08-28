// 构建离线考研词库：从 englishDaily 提取语料词 → 用开源考研词库(KyleBing)生成 src/data/offlineDict.json
// 用法：node scripts/build-offline-dict.cjs  （会打印覆盖率并写文件）
// 词库源码：https://github.com/KyleBing/english-vocabulary (MIT) 初中/高中/四级/六级/考研 合并
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '..', 'src', 'data')
const SRC_FILES = ['_ky1.txt', '_ky2.txt', '_ky3.txt', '_ky4.txt', '_kyky.txt'].map(f => path.join(__dirname, f))
const OUT_JSON = path.join(DATA, 'offlineDict.json')

// ---------- 1. 从 englishDaily.json 提取语料独特词 ----------
const daily = JSON.parse(fs.readFileSync(path.join(DATA, 'englishDaily.json'), 'utf8'))
const corpus = new Set()
for (const day of daily) {
  for (const s of day.sentences) {
    for (const t of s.en.toLowerCase().split(/[^a-zA-Z']+/).filter(Boolean)) {
      corpus.add(t.replace(/['’]$/, ''))
    }
  }
}

// ---------- 2. 解析合并词库 ----------
const dict = new Map() // base word -> meanings[]
for (const f of SRC_FILES) {
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue
    const sp = line.search(/[ \t]/)
    if (sp === -1) continue
    const word = line.slice(0, sp).trim().toLowerCase()
    const meaning = line.slice(sp).replace(/\t/g, ' ').replace(/\s+/g, ' ').trim()
    if (word && meaning && !dict.has(word)) dict.set(word, meaning)
  }
}

// ---------- 3. 简单词形还原（用于匹配语料中的变形词） ----------
function stem(w) {
  if (w.length <= 3) return w
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3)
  if (w.endsWith('ied') && w.length > 4) return w.slice(0, -3) + 'y'
  if (w.endsWith('ed') && w.length > 4 && !w.endsWith('eed')) return w.slice(0, -2)
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y'
  if (w.endsWith('es') && w.length > 4 && dict.has(w.slice(0, -2))) return w.slice(0, -2)
  if (w.endsWith('s') && w.length > 3 && dict.has(w.slice(0, -1)) && !w.endsWith('ss') && !w.endsWith('us')) return w.slice(0, -1)
  return w
}

// ---------- 4. 覆盖统计 ----------
let hit = 0, miss = 0
const missList = []
for (const t of corpus) {
  if (dict.has(t) || dict.has(stem(t))) hit++
  else { miss++; if (missList.length < 60) missList.push(t) }
}
console.log('语料独特词:', corpus.size)
console.log('考研词库词条:', dict.size)
console.log(`覆盖率: ${hit}/${corpus.size} = ${(hit / corpus.size * 100).toFixed(1)}%`)
console.log('未命中示例:', missList.join(' '))

// ---------- 5. 写入 offlineDict.json ----------
fs.writeFileSync(OUT_JSON, JSON.stringify(Object.fromEntries(dict), null, 1) + '\n', 'utf8')
console.log('已写入:', OUT_JSON)