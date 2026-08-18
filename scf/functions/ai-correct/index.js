// 腾讯云 SCF 云函数：AI 翻译批改
// 免费额度：每月 40 万 GBs 资源使用量 + 40 万次调用，个人使用基本免费
// 超时时间可配置到 900 秒（这里设 60 秒足够），国内节点直连讯飞星火，稳定快速
// 部署方式见 DEPLOYMENT.md「AI 翻译批改功能（腾讯云 SCF 方案）」章节
'use strict'

const API_KEY = process.env.SPARK_API_KEY || ''
const API_SECRET = process.env.SPARK_API_SECRET || ''
// spark-x 系列（X1.5 深度推理）走 v2 接口，其余星火模型（Lite/Max 等）走 v1
const SPARK_MODEL = process.env.SPARK_MODEL || 'lite'
const API_VERSION = SPARK_MODEL.startsWith('spark-x') ? 'v2' : 'v1'
const SPARK_URL = `https://spark-api-open.xf-yun.com/${API_VERSION}/chat/completions`
// 关闭 Spark X 深度思考，大幅缩短响应时间
const SPARK_EXTRA = API_VERSION === 'v2' ? { thinking: { type: 'disabled' } } : {}

function buildSystemPrompt() {
  return '你是一位专业的考研英语翻译批改老师，精通长难句分析。你会收到用户对一个英语句子的中文翻译，以及一个参考翻译。' +
    '你的任务是：' +
    '1) 先剖析英语原句的句子主干（主谓宾 / 主系表骨架），再逐条拆解各修饰成分（定语、状语、同位语、插入语、各类从句、非谓语等）如何附着在主干上，帮助用户提升长难句分析能力；' +
    '2) 找出学生中文翻译中存在的问题（漏译、多译、语序、用词、搭配、赘译、错译等）；' +
    '3) 给出修正后的翻译；4) 给出 1-5 的评分（5 为最准确流畅）；5) 给出改进建议。' +
    '你必须只输出一个 JSON 对象，不要输出任何其他内容，格式如下：' +
    '{"score": 1-5整数, "corrected": "修正后的翻译", "issues": ["问题1", "问题2"], "suggestions": ["建议1", "建议2"], "backbone": "句子主干（简明点出主谓宾/主系表骨架）", "structure": ["成分解析1：说明从句/短语类型、所修饰对象及作用", "成分解析2"]}' +
    '要求：backbone 必须简明准确，用中文标注主语、谓语、宾语等句子成分；structure 逐条列出主要修饰成分与从句，说明其类型、修饰对象和在句中的作用，尽量与原文对应。' +
    '重要：corrected 必须只对应给定的这一个英语句子，严禁输出整段或整篇译文的参考译文。' +
    '注意：issues 和 suggestions 必须用简体中文，且只能评价学生中文译文的问题；严禁把英语原句本身的语法点当作"问题"列出（英语原句的语法结构分析请放入 backbone 和 structure）。'
}

// ---------- 考研词汇查词（action: 'lookup'） ----------

function buildLookupSystemPrompt() {
  return '你是一位专业的考研英语词汇讲师，精通词根词缀与联想记忆法，熟知考研英语高频词汇、常用搭配与考点。' +
    '用户会给你一个考研词汇。你的任务是：' +
    '1) 给出该词在考研语境下的核心释义，逐条列出词性与释义，优先覆盖考研高频义项（含熟词僻义）；' +
    '2) 用词根词缀拆解或联想记忆等方法给出简明助记；' +
    '3) 列出考研英语中最常用的搭配（词组 + 中文释义）；' +
    '4) 给出一句贴合考研语境（阅读/写作/翻译）的例句并附中文翻译；' +
    '5) 如有考研考点（熟词僻义、易混词辨析、真题考法等）简要说明。' +
    '你必须只输出一个 JSON 对象，不要输出任何其他内容，格式如下：' +
    '{"word": "单词", "phonetic": "音标", "meanings": ["词性. 释义1", "词性. 释义2"], "mnemonic": "助记", "collocations": ["搭配1（中文释义）", "搭配2（中文释义）"], "example": "例句（中文翻译）", "examNote": "考研考点说明"}' +
    '要求：全部使用简体中文；meanings 优先考研高频义项；collocations 聚焦考研常用搭配并给出中文释义；example 尽量贴近考研真题语境。'
}

async function handleLookup(word) {
  const prompt = `请查询考研词汇「${word}」的释义、助记、考研常用搭配、例句与考点。`
  const messages = [
    { role: 'system', content: buildLookupSystemPrompt() },
    { role: 'user', content: prompt },
  ]
  try {
    const content = await callSpark(messages)
    const result = extractJson(content)
    if (!result) {
      // 解析失败不报错，兜底返回 AI 原始内容，保证用户至少能看到结果
      return jsonResp(200, {
        ok: true,
        data: {
          word: word,
          phonetic: '',
          meanings: [],
          mnemonic: `（未获取结构化词条，以下是 AI 原始输出）\n\n${String(content || '')}`,
          collocations: [],
          example: '',
          examNote: '',
        },
      })
    }
    return jsonResp(200, {
      ok: true,
      data: {
        word: String(result.word || word),
        phonetic: String(result.phonetic || ''),
        meanings: Array.isArray(result.meanings) ? result.meanings.map(String) : [],
        mnemonic: String(result.mnemonic || ''),
        collocations: Array.isArray(result.collocations) ? result.collocations.map(String) : [],
        example: String(result.example || ''),
        examNote: String(result.examNote || ''),
      },
    })
  } catch (e) {
    return jsonResp(502, { ok: false, error: e.message || 'AI 查词失败' })
  }
}

async function callSpark(messages) {
  const resp = await fetch(SPARK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}:${API_SECRET}`,
    },
    body: JSON.stringify({
      model: SPARK_MODEL,
      temperature: 0.3,
      max_tokens: 2000,
      messages,
      ...SPARK_EXTRA,
    }),
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`讯飞接口错误 ${resp.status}: ${text.slice(0, 200)}`)
  }
  const parsed = await resp.json()
  if (parsed.choices && parsed.choices[0] && parsed.choices[0].message) {
    return parsed.choices[0].message.content
  }
  throw new Error(`讯飞返回异常: ${JSON.stringify(parsed).slice(0, 200)}`)
}

// 容错解析 AI 输出中的 JSON
// 讯飞模型偶尔会在 JSON 前后多带说明文字、含尾随逗号或被截断，
// 这里依次：1) 整段解析 2) 用平衡花括号精确提取最外层对象，并清理尾随逗号后再解析
function extractJson(text) {
  let t = String(text).replace(/```json/gi, '').replace(/```/g, '').trim()
  const tryParse = (s) => {
    try { return JSON.parse(s) } catch (_) { return null }
  }
  let obj = tryParse(t)
  if (obj) return obj
  const start = t.indexOf('{')
  if (start !== -1) {
    let depth = 0, inStr = false, esc = false
    for (let i = start; i < t.length; i++) {
      const ch = t[i]
      if (esc) { esc = false; continue }
      if (inStr) {
        if (ch === '\\') esc = true
        else if (ch === '"') inStr = false
        continue
      }
      if (ch === '"') { inStr = true; continue }
      if (ch === '{') { depth++; continue }
      if (ch === '}') {
        depth--
        if (depth === 0) {
          // 到达最外层闭合括号，清理尾随逗号（如 "a":1, }）后尝试解析
          const candidate = t.slice(start, i + 1).replace(/,\s*([}\]])/g, '$1')
          obj = tryParse(candidate)
          if (obj) return obj
        }
      }
    }
  }
  return null
}

function jsonResp(statusCode, obj) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(obj),
    isBase64Encoded: false,
  }
}

// 模型偶发把 issues/suggestions/structure 返回成对象列表（如 {问题, 建议}），
// 统一转成字符串数组：优先取对象内的首个字符串字段，避免前端渲染成 [object Object]
function toStrArr(arr) {
  if (!Array.isArray(arr)) return []
  return arr
    .map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object') {
        const vals = Object.values(item)
        const firstStr = vals.find((v) => typeof v === 'string')
        return firstStr != null ? firstStr : JSON.stringify(item)
      }
      return item == null ? '' : String(item)
    })
    .filter((s) => s !== '')
}

// 解析触发器传入的 event，兼容「函数 URL」和「API 网关」两种 HTTP 触发
function parseEvent(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { options: true }
  }
  let body = event.body
  if (event.isBase64Encoded && typeof body === 'string') {
    body = Buffer.from(body, 'base64').toString('utf-8')
  }
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch (_) { body = {} }
  }
  return { options: false, body: body || {} }
}

exports.main_handler = async (event) => {
  const { options, body } = parseEvent(event || {})
  if (options) return jsonResp(200, { ok: true })

  const action = String(body.action || 'correct').trim()

  if (!API_KEY || !API_SECRET) {
    return jsonResp(500, { ok: false, error: '服务器未配置讯飞密钥' })
  }

  // 查词：AI 查询考研单词释义/助记/搭配（action: 'lookup'）
  if (action === 'lookup') {
    const word = String(body.word || '').trim()
    if (!word) {
      return jsonResp(400, { ok: false, error: '缺少必要参数（word）' })
    }
    return handleLookup(word)
  }

  // 默认：翻译批改
  const en = String(body.en || '').trim()
  const userTranslation = String(body.userTranslation || '').trim()
  const refTranslation = String(body.refTranslation || '').trim()
  if (!en || !userTranslation) {
    return jsonResp(400, { ok: false, error: '缺少必要参数（en / userTranslation）' })
  }

  const refLine = refTranslation ? `\n参考翻译：${refTranslation}` : ''
  const prompt = `英语原句：${en}\n我的翻译：${userTranslation}${refLine}\n请先分析原句的句子主干与结构，再对"我的翻译"进行批改。注意：修正后的译文必须只对应这一个英语句子，不要输出整段或整篇译文。`
  const messages = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: prompt },
  ]

  try {
    const content = await callSpark(messages)
    const result = extractJson(content)
    if (!result) {
      // 解析失败不报错，兜底返回 AI 原始批改文本，保证用户至少能看到结果
      return jsonResp(200, {
        ok: true,
        data: {
          score: 3,
          corrected: String(content || ''),
          issues: [],
          suggestions: [],
          backbone: '',
          structure: [],
        },
      })
    }
    return jsonResp(200, {
      ok: true,
      data: {
        score: typeof result.score === 'number' ? result.score : 3,
        corrected: String(result.corrected || ''),
        issues: toStrArr(result.issues),
        suggestions: toStrArr(result.suggestions),
        backbone: String(result.backbone || ''),
        structure: toStrArr(result.structure),
      },
    })
  } catch (e) {
    return jsonResp(502, { ok: false, error: e.message || 'AI 批改失败' })
  }
}
