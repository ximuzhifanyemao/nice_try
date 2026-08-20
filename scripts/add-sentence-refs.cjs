// 为 englishDaily.ts 每个句子新增 ref 逐句译文。
// 处理三类问题：①英文片段合并（缩写/数字/分号被误拆成多句）②中文缺标点导致的连句
// ③中文"。"出现在引号内导致过度切分。运行后校验所有天数句子数与译文数一致。
const fs = require('fs')
const path = require('path')

const P = path.resolve(__dirname, '..', 'src', 'data', 'englishDaily.ts')

function loadData(ts) {
  const start = ts.indexOf('ENGLISH_DAILY: EnglishDay[] = [')
  const content = ts.substring(start + 'ENGLISH_DAILY: EnglishDay[] = '.length)
  let depth = 0, end = -1
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '[') depth++
    else if (content[i] === ']') { depth--; if (depth === 0) { end = i + 1; break } }
  }
  return eval(content.substring(0, end))
}

const CIRCLED = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳']

// ---- true-fragment merges (0-based inclusive index ranges of original sentences) ----
const MERGE_SPECS = {
  6: [[1,2]],
  11: [[2,3]],
  12: [[2,3],[4,5]],
  14: [[3,4]],
  16: [[0,1]],
  22: [[2,5],[6,9]],
  23: [[4,6]],
  25: [[0,1]],
  30: [[2,3]],
  38: [[3,6]],
  39: [[3,4]],
  40: [[3,4]],
  42: [[4,5]],
  44: [[1,2]],
  46: [[0,1],[2,3]],
  58: [[4,5]],
  59: [[3,5]],
  65: [[1,2]],
  68: [[2,3]],
  73: [[1,2]],
  78: [[1,2]],
  90: [[1,2],[7,8]],
  95: [[4,5]],
  101: [[0,1]],
  104: [[5,6]],
  111: [[0,4]],
  112: [[2,3]],
  114: [[2,3]],
  115: [[0,1],[3,4]],
  128: [[4,5]],
  129: [[2,3]],
  137: [[1,2]],
  140: [[2,4],[7,9]],
  142: [[4,5]],
  147: [[7,8]],
}

// ---- zh punctuation fixes (exact string replacement；缺句号导致连句) ----
const ZH_FIX = {
  45: ['彻底改变现在', '彻底改变。现在'],
  49: ['数据不安全此前', '数据不安全。此前'],
  65: ['“你可以非常有把握地使用当前数据”', '“你可以非常有把握地使用当前数据。”'],
  88: ['一种装饰在那个遥远的年代', '一种装饰。在那个遥远的年代'],
  93: ['平淡无奇的“发明”联邦巡回法院', '平淡无奇的“发明”。联邦巡回法院'],
  102: ['极其不合时宜在艺术品领域', '极其不合时宜。在艺术品领域'],
  149: ['便回返家乡 1908', '便回返家乡。1908'],
}

// ---- 完整逐句译文覆盖（中文过度切分/引号错位等无法由合并或补标点解决的天） ----
// 数组顺序与最终（合并后）句子顺序一一对应。
const REF_OVERRIDES = {
  17: [
    '责怪纵容放任的 20 世纪 60 年代并不新鲜，但这次却不是对教育退步的又一场批判。',
    '麦荷特先生的学术专长是语言的历史与变迁。举例来说，他认为“whom”一词的逐渐消失是自然的，和古英语中词格尾缀的消失一样根本没什么可遗憾的。',
  ],
  53: [
    '（美国，而不是欧洲）欠缺针对数据泄露的法律惩处，这种情况虽不至于证明当前事态合理，但却可能助长其发展。',
    '加州最近通过了一项法律，在此之前，美国的公司在数据丢失时无需通知任何人，甚至是受害者本人。',
    '这种情况可能很快就会改变：大量有关数据安全的立法提案正在国会接受审议。与此同时，美国 6 月 17 日披露的一起涉及大约 4000 万信用卡账户的信息失窃案，又使得美国联邦贸易委员会头一天（16 日）做出的一项极为重大的决议——该决议警告美国商界，如果公司不能充分保障数据的安全，那么监管机构就会采取措施——颜面尽失。',
  ],
  63: [
    '身高增长需要热量和营养——尤其是蛋白质——以满足组织扩展的需求。人在 20 岁以后很少会继续长高了。',
    '20 世纪之初，营养不足和儿童传染病阻碍了身高的增长。',
    '然而，随着饮食和健康状况的改善，儿童和青少年的身高每 20 年平均增长约 1.5 英寸，这种模式被称为身高（增长）的长期趋势。',
    '然而根据疾病控制与预防中心的数据，平均身高——男性 5 英尺 9 英寸，女性 5 英尺 4 英寸——自 1960 年以来并未真正改变过。',
  ],
  82: [
    '随着教育的改善，人类生产力潜能也得到了提高。',
    '当竞争环境迫使我们的祖先去获得这种潜能时，他们反过来又能受得起更多教育。',
    '对出色经济表现所要求的复杂政治体制来说，这种日益提高的教育水平可能是一个必要但不充分条件。',
    '因此，如果不进行“只能靠更广泛正规教育才有可能实现”的政治变革，贫困国家可能无法摆脱其贫困牢笼。',
    '但是，正规教育的缺乏并不会限制发展中国家劳动人口在可预见的未来从本质上提高生产力。',
    '相反，对生产力提高的限制解释了为什么这些国家的教育没能发展得更快。',
  ],
  99: [
    '是银行的想法不切实际，它们的账目严重高估了资产。',
    '如今，银行辩称，市场价格夸大了损失，因为这些价格大多反映的是市场暂时的流动性不足，而不是坏账可能达到的分量。',
    '真相在多年后方可得知。',
    '但是，银行股票的交易价格低于其账面价值，这表明投资者持怀疑态度。',
    '另外，市场的萧条也在一定程度上反映出银行的瘫痪。银行因害怕将损失计入账目而不愿出售资产，而同时又不愿收购那些所谓的廉价资产。',
  ],
  110: [
    '最近从宝洁退休的消费心理学家卡罗尔·伯宁说：“如果能成为每天或每周的惯例，那我们的产品就成功了”。宝洁公司去年卖出了 760 亿美元的汰渍、佳洁士和其他产品。',
    '创建积极习惯是改善消费者生活的重要部分，它也对使新产品具有商业可行性至关重要。',
    '通过实验和观察，伯宁博士等社会科学家已了解到，通过大量无休止的广告将“某些行为”与“习惯暗示”联系起来的做法是有效的。',
    '随着这门新兴习惯科学的兴起，这些策略被用于销售价值尚属疑问的美容霜或者不健康的食品，从而引发了激烈辩论。',
  ],
  136: [
    '女孩对粉色的青睐看起来似乎是无法避免的，似乎在某种程度上被编码进了她们的 DNA。不过，根据美国研究副教授乔帕雷提的说法，情况不是这样的。',
    '20 世纪初以前，儿童根本没有颜色编码：在家用洗衣机问世之前的年代里，出于实用角度，所有婴儿都穿白色衣服，因为将衣服洗干净的唯一方法是将衣服煮沸。',
    '而且，男孩、女孩都穿着被认为是中性的衣服。',
    '当育儿颜色引入之时，粉色实际上被认为是更具男性特征的颜色，是红色的清淡柔和版，与力量相关。',
    '而蓝色象征着女性特征，令人联想到圣母玛利亚，代表着坚贞与忠诚。',
    '直到 20世纪 80 年代中期，随着强化年龄和性别差异成为儿童市场主要营销策略时，粉色才盛行起来，开始对女孩产生一种看似固有的吸引力，这让粉色成为定义女性特质的一部分至少在最初关键的几年里是如此。',
  ],
  146: [
    '《在美国制造》一文中，作者亚当·戴维森讲述了一个来自棉花产地、有关现代纺织厂自动化到达何种程度的笑话：普通纺织厂如今只有两名员工，“一个人和一只狗。',
    '人负责喂狗，而狗负责让人远离机器。”',
    '戴维森此文只不过是新近涌现的诸多同类文章中的一篇，这些文章都提出这样一种观点：当前失业率居高不下以及中产阶级收入缩水，很大程度上是由于大萧条造成的需求大幅降低，但同时也由于全球化和信息技术革命的发展，这种发展使机器或外来雇工取代劳力的速度超过了以往任何时期。',
  ],
}

function stripSearchNote(zh) {
  const idx = zh.indexOf('【帮你搜索】')
  return idx === -1 ? zh : zh.substring(0, idx).trim()
}

function splitZh(zh) {
  let pieces = zh.split(/(?<=[。！？])/).map(x => x.trim()).filter(Boolean)
  const merged = []
  for (const piece of pieces) {
    if (/^["'”’」』》）〕】]+$/.test(piece) && merged.length > 0) {
      merged[merged.length - 1] += piece
    } else {
      merged.push(piece)
    }
  }
  return merged
}

function joinFrag(a, b) {
  const left = a.trim()
  const right = b.trim()
  // 数字断开（1. + 2）与域名（Amazon. + com）合并时不留空格
  if (/(\d|Amazon)\.$/.test(left) && /^[\da-z]/.test(right)) return left + right
  return left + ' ' + right
}

function process(ts, write) {
  const data = loadData(ts)
  const problems = []

  for (const day of data) {
    const specs = MERGE_SPECS[day.day] || []
    const oldSent = day.sentences

    // 构建合并分组
    const groups = []
    let i = 0
    while (i < oldSent.length) {
      const range = specs.find(([a]) => a === i)
      if (range) { groups.push(range); i = range[1] + 1 }
      else { groups.push([i, i]); i++ }
    }

    // 生成新句子（含合并后的 en）
    day.sentences = groups.map(([a, b], gi) => {
      let text = oldSent[a].en.trim()
      for (let k = a + 1; k <= b; k++) text = joinFrag(text, oldSent[k].en)
      return { num: CIRCLED[gi] || ('#' + (gi + 1)), en: text }
    })

    // 重映射 analysis.sentNum
    if (day.analysis) {
      const oldIndexByNum = {}
      oldSent.forEach((s, idx) => { oldIndexByNum[s.num] = idx })
      const newNumByOldIndex = {}
      groups.forEach(([a, b], gi) => {
        for (let k = a; k <= b; k++) newNumByOldIndex[k] = CIRCLED[gi] || ('#' + (gi + 1))
      })
      day.analysis.forEach(a => {
        const oi = oldIndexByNum[a.sentNum]
        if (oi != null && newNumByOldIndex[oi] != null) a.sentNum = newNumByOldIndex[oi]
      })
    }

    // 计算逐句译文
    const refs = []
    if (REF_OVERRIDES[day.day]) {
      refs.push(...REF_OVERRIDES[day.day])
    } else {
      let zh = stripSearchNote(day.zh)
      if (ZH_FIX[day.day]) {
        const [from, to] = ZH_FIX[day.day]
        if (!zh.includes(from)) {
          problems.push(`ZH_FIX 未命中 Day ${day.day}: ${JSON.stringify(from)}`)
        }
        zh = zh.split(from).join(to)
      }
      refs.push(...splitZh(zh))
    }

    // 清理引号残留
    const clean = (s) => s.replace(/^\s*[”’"』）》〕】]+\s*/, '').replace(/\s*[“‘"「《（〔【]+\s*$/, '').trim()
    const finalRefs = refs.map(clean)

    if (finalRefs.length !== day.sentences.length) {
      problems.push({ day: day.day, sent: day.sentences.length, zh: finalRefs.length, pieces: finalRefs })
    }

    // 附到句子上
    day.sentences.forEach((s, si) => { s.ref = finalRefs[si] ?? '' })
  }

  return { data, problems, days: data.length }
}

// 序列化输出
function tsStr(s) { return JSON.stringify(s) }
function genVocab(vocab) {
  if (!vocab || vocab.length === 0) return '[]'
  const items = vocab.map(v => `{ raw: ${tsStr(v.raw)}, word: ${tsStr(v.word)}, meaning: ${tsStr(v.meaning)} }`)
  return '[\n      ' + items.join(',\n      ') + '\n    ]'
}
function genGrammar(grammar) {
  if (!grammar || grammar.length === 0) return '[]'
  const items = grammar.map(g => tsStr(g))
  return '[' + items.join(', ') + ']'
}

function serialize(data) {
  let output = `// 本文件由 doc/ 下 PDF 文件自动提取生成，请勿手改
// 包含：打卡原文 + 参考译文 + 长难句解析（单词、切分、语法、逐句译文）

export interface EnglishDaySentence {
  num: string
  en: string
  ref: string
}

export interface VocabItem {
  raw: string
  word: string
  meaning: string
}

export interface AnalysisItem {
  sentNum: string
  vocab: VocabItem[]
  split: string
  grammar: string[]
  ref: string
}

export interface EnglishDay {
  day: number
  type: '英一' | '英二'
  source: string
  sentences: EnglishDaySentence[]
  zh: string
  analysis?: AnalysisItem[]
}

export const ENGLISH_DAILY: EnglishDay[] = [
`

  for (let di = 0; di < data.length; di++) {
    const day = data[di]
    output += `  {
    day: ${day.day},
    type: ${tsStr(day.type)},
    source: ${tsStr(day.source)},
    zh: ${tsStr(day.zh)},
    sentences: [
`
    for (let si = 0; si < day.sentences.length; si++) {
      const s = day.sentences[si]
      const comma = si < day.sentences.length - 1 ? ',' : ''
      output += `    { num: ${tsStr(s.num)}, en: ${tsStr(s.en)}, ref: ${tsStr(s.ref)} }${comma}
`
    }
    output += `    ]`

    if (day.analysis && day.analysis.length > 0) {
      output += `,
    analysis: [
`
      for (let ai = 0; ai < day.analysis.length; ai++) {
        const a = day.analysis[ai]
        const comma = ai < day.analysis.length - 1 ? ',' : ''
        output += `      {
        sentNum: ${tsStr(a.sentNum)},
        vocab: ${genVocab(a.vocab)},
        split: ${tsStr(a.split)},
        grammar: ${genGrammar(a.grammar)},
        ref: ${tsStr(a.ref)}
      }${comma}
`
      }
      output += `    ]`
    }
    output += `
  }`
    if (di < data.length - 1) output += ','
    output += '\n'
  }
  output += `];
`
  return output
}

const ts = fs.readFileSync(P, 'utf-8')
const { data, problems, days } = process(ts, false)

const badDays = problems.filter(p => typeof p === 'object')
const zhFixMisses = problems.filter(p => typeof p === 'string')

console.log(`总天数: ${days}`)
console.log(`剩余不匹配天数: ${badDays.length}`)
for (const p of badDays) {
  console.log(`  Day ${p.day}: sent=${p.sent} zh=${p.zh}`)
}
if (zhFixMisses.length) {
  console.log('ZH_FIX 未命中:')
  zhFixMisses.forEach(m => console.log('  ' + m))
}

if (badDays.length === 0 && zhFixMisses.length === 0) {
  const out = serialize(data)
  fs.writeFileSync(P, out, 'utf-8')
  console.log(`\n已写入: ${P}`)
  console.log(`文件大小: ${(fs.statSync(P).size / 1024).toFixed(1)} KB`)
} else {
  console.log('\n存在问题，未写入文件。')
}