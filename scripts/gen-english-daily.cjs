const fs = require('fs')
const path = require('path')

const PDF_OUTPUT_DIR = path.resolve(__dirname, 'pdf_output')
const ENGLISH_DAILY_PATH = path.resolve(__dirname, '..', 'src', 'data', 'englishDaily.json')

function normalizeEn(text) {
  return text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
}

function cleanEn(text) {
  return text.replace(/\s+/g, ' ').trim()
    .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
}

function parseVocabLine(line) {
  const m = line.match(/^(.+?)([nv]\.|adj\.|adv\.|prep\.|conj\.|pron\.|num\.|art\.|int\.|aux\.|abbr\.)/)
  if (m) {
    return { raw: line, word: m[1].trim(), meaning: m[2] + line.substring(m[0].length).trim() }
  }
  if (line.match(/[作为表示引导]/)) {
    const parts = line.split(/(?=[作为表示引导...])/)
    if (parts.length >= 2) {
      return { raw: line, word: parts[0].trim(), meaning: parts.slice(1).join('').trim() }
    }
  }
  return { raw: line, word: line, meaning: '' }
}

function parsePDFText(text, year, type) {
  const results = []
  const sections = text.split(/\nB\n?站柴荣老师\n?/)
  
  let currentSource = null
  
  for (const section of sections) {
    if (!section.trim()) continue
    const trimmed = section.trim()
    if (trimmed.startsWith('夯实基础') || trimmed.startsWith('注意事项') ||
        trimmed.startsWith('一、') || trimmed.startsWith('二、') ||
        (trimmed.startsWith('1.') && !trimmed.match(/^\d{4}/)) ||
        trimmed.startsWith('具体流程') || trimmed.startsWith('阅读长难句解析') ||
        trimmed.startsWith('英二阅读长难句解析')) continue
    
    const lines = section.split('\n').map(l => l.trim()).filter(l => l)
    
    const sourceMatch = lines[0]?.match(/^(\d{4})T(\d+)$/)
    if (sourceMatch) {
      currentSource = `${sourceMatch[1]} Text ${sourceMatch[2]}`
      lines.shift()
      if (lines.length === 0) continue
    }
    if (!currentSource) continue
    
    let i = 0
    while (i < lines.length) {
      let sentNum = ''
      const numMatch = lines[i]?.match(/^([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳])/)
      
      let enText = ''
      if (numMatch) {
        sentNum = numMatch[1]
        enText = lines[i].substring(sentNum.length).trim()
        i++
      } else if (lines[i]?.match(/^[A-Z]/)) {
        enText = lines[i].trim()
        i++
      } else { i++; continue }
      
      while (i < lines.length) {
        const line = lines[i]
        if (line.includes('单词：') || line.startsWith('主干') || line.startsWith('结构提炼') ||
            line.startsWith('参考译文') || line.match(/^\d{4}T/)) break
        if (line.match(/^[①②③④⑤⑥⑦⑧⑨⑩]/) && !line.includes('//')) break
        if (line.match(/^[A-Za-z]/) && !line.startsWith('B')) {
          enText += ' ' + line
          i++
        } else break
      }
      
      enText = cleanEn(enText)
      if (!enText || enText.length < 10) { i++; continue }
      
      if (i < lines.length && lines[i].includes('单词：')) i++
      
      const vocab = []
      while (i < lines.length) {
        const line = lines[i]
        if (line.includes('//') || line.startsWith('主干') || line.startsWith('结构提炼') ||
            line.startsWith('参考译文') || line.startsWith('痛点') || line.match(/^\d{4}T/)) break
        if (line.match(/^[①②③④⑤⑥⑦⑧⑨⑩]/)) break
        if (line.match(/^(when|so that|what|or|and|that|concerning|just as|insisting|until|progressing|suggesting|whether|as|than|because|although|while|by the time|if|in return|as early|of|分词|状语|定语|第\d+个|主干|参考译文|and并列|e\.g\.|分句|比较结构|否定处理|Ais|A和B)/)) break
        if (line && !line.match(/^B/)) vocab.push(parseVocabLine(line))
        i++
      }
      
      let split = ''
      while (i < lines.length) {
        const line = lines[i]
        if (line.startsWith('主干') || line.startsWith('结构提炼') || line.startsWith('参考译文') ||
            line.startsWith('痛点') || line.match(/^\d{4}T/)) break
        if (line.match(/^[①②③④⑤⑥⑦⑧⑨⑩]/) && !line.includes('//')) break
        if (line.includes('//') || (split && line.match(/^[a-z(,\-]/))) {
          split += (split ? ' ' : '') + line
        }
        i++
      }
      split = split.replace(/\s+/g, ' ').trim()
      if (sentNum && split.startsWith(sentNum)) split = split.substring(sentNum.length).trim()
      
      const grammar = []
      while (i < lines.length) {
        const line = lines[i]
        if (line.startsWith('参考译文') || line.match(/^\d{4}T/)) break
        if (line.match(/^[①②③④⑤⑥⑦⑧⑨⑩]/) && !line.includes('//')) break
        if (line && !line.startsWith('B')) {
          let cleaned = line.replace(/^\d+\.\s*/, '').trim()
          cleaned = cleaned.replace(/^痛点[：:]?\s*/, '')
          if (cleaned) grammar.push(cleaned)
        }
        i++
      }
      
      let ref = ''
      if (i < lines.length && lines[i].startsWith('参考译文')) {
        ref = lines[i].replace(/^参考译文[：:]?\s*/, '').trim()
        i++
        while (i < lines.length) {
          const line = lines[i]
          if (line.match(/^\d{4}T/) || line.match(/^[①②③④⑤⑥⑦⑧⑨⑩]/) ||
              line.startsWith('B站') || line.startsWith('B\n')) break
          ref += line.trim()
          i++
        }
      }
      ref = ref.replace(/\s+/g, '').trim()
      
      results.push({ source: currentSource, type, sentNum, en: enText, vocab, split, grammar, ref })
    }
  }
  return results
}

// ---------- Parse all PDFs ----------

const allAnalysis = []
const txtFiles = fs.readdirSync(PDF_OUTPUT_DIR).filter(f => f.endsWith('.txt') && !f.includes('柴荣老师'))

for (const file of txtFiles) {
  const text = fs.readFileSync(path.join(PDF_OUTPUT_DIR, file), 'utf-8')
  const yearMatch = file.match(/(\d{4})/)
  const type = file.includes('英二') ? '英二' : '英一'
  const parsed = parsePDFText(text, yearMatch[1], type)
  allAnalysis.push(...parsed)
}

console.log(`Total parsed: ${allAnalysis.length} sentences`)

// ---------- Read and match ----------

const dailyData = JSON.parse(fs.readFileSync(ENGLISH_DAILY_PATH, 'utf-8'))

let matched = 0
for (const day of dailyData) {
  for (const sent of day.sentences) {
    const normSent = normalizeEn(sent.en)
    const analysisItem = allAnalysis.find(a => {
      if (a.source !== day.source) return false
      if (a.type !== day.type) return false
      return normalizeEn(a.en) === normSent
    })
    if (analysisItem) {
      if (!day.analysis) day.analysis = []
      day.analysis.push({
        sentNum: sent.num,
        vocab: analysisItem.vocab,
        split: analysisItem.split,
        grammar: analysisItem.grammar,
        ref: analysisItem.ref,
      })
      matched++
    }
  }
}
console.log(`Matched: ${matched}`)

// ---------- Write JSON output（全量 stringify，保留 ref/ai 等所有既有字段） ----------
fs.writeFileSync(ENGLISH_DAILY_PATH, JSON.stringify(dailyData, null, 1) + '\n', 'utf-8')
console.log(`Written: ${ENGLISH_DAILY_PATH}`)
console.log(`File size: ${(fs.statSync(ENGLISH_DAILY_PATH).size / 1024).toFixed(1)} KB`)