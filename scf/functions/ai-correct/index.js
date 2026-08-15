// 腾讯云 SCF 云函数：AI 翻译批改
// 免费额度：每月 40 万 GBs 资源使用量 + 40 万次调用，个人使用基本免费
// 超时时间可配置到 900 秒（这里设 60 秒足够），国内节点直连讯飞星火，稳定快速
// 部署方式见 DEPLOYMENT.md「AI 翻译批改功能（腾讯云 SCF 方案）」章节
'use strict'

const API_KEY = process.env.SPARK_API_KEY || ''
const API_SECRET = process.env.SPARK_API_SECRET || ''
// spark-x 系列（X1.5 深度推理）走 v2 接口，其余星火模型（Lite/Max 等）走 v1
const SPARK_MODEL = process.env.SPARK_MODEL || 'spark-x'
const API_VERSION = SPARK_MODEL.startsWith('spark-x') ? 'v2' : 'v1'
const SPARK_URL = `https://spark-api-open.xf-yun.com/${API_VERSION}/chat/completions`
// 关闭 Spark X 深度思考，大幅缩短响应时间
const SPARK_EXTRA = API_VERSION === 'v2' ? { thinking: { type: 'disabled' } } : {}

function buildSystemPrompt() {
  return '你是一位专业的考研英语翻译批改老师，精通长难句分析。你会收到用户对一个英语句子的中文翻译，以及一个参考翻译。' +
    '你的任务是：' +
    '1) 先剖析英语原句的句子主干（主谓宾 / 主系表骨架），再逐条拆解各修饰成分（定语、状语、同位语、插入语、各类从句、非谓语等）如何附着在主干上，帮助用户提升长难句分析能力；' +
    '2) 找出用户翻译中存在的问题（语法、用词、漏译、多译、语序、时态、搭配等）；' +
    '3) 给出修正后的翻译；4) 给出 1-5 的评分（5 为最准确流畅）；5) 给出改进建议。' +
    '你必须只输出一个 JSON 对象，不要输出任何其他内容，格式如下：' +
    '{"score": 1-5整数, "corrected": "修正后的翻译", "issues": ["问题1", "问题2"], "suggestions": ["建议1", "建议2"], "backbone": "句子主干（简明点出主谓宾/主系表骨架）", "structure": ["成分解析1：说明从句/短语类型、所修饰对象及作用", "成分解析2"]}' +
    '要求：backbone 必须简明准确，用中文标注主语、谓语、宾语等句子成分；structure 逐条列出主要修饰成分与从句，说明其类型、修饰对象和在句中的作用，尽量与原文对应。'
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
function extractJson(text) {
  let t = String(text).replace(/```json/gi, '').replace(/```/g, '').trim()
  try { return JSON.parse(t) } catch (_) { /* 继续尝试截取 */ }
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try { return JSON.parse(t.slice(start, end + 1)) } catch (_) { /* 无法解析 */ }
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

  const en = String(body.en || '').trim()
  const userTranslation = String(body.userTranslation || '').trim()
  const refTranslation = String(body.refTranslation || '').trim()

  if (!API_KEY || !API_SECRET) {
    return jsonResp(500, { ok: false, error: '服务器未配置讯飞密钥' })
  }
  if (!en || !userTranslation) {
    return jsonResp(400, { ok: false, error: '缺少必要参数（en / userTranslation）' })
  }

  const prompt = `英语原句：${en}\n我的翻译：${userTranslation}\n参考翻译：${refTranslation}\n请先分析原句的句子主干与结构，再对"我的翻译"进行批改。`
  const messages = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: prompt },
  ]

  try {
    const content = await callSpark(messages)
    const result = extractJson(content)
    if (!result) {
      return jsonResp(500, { ok: false, error: 'AI 输出格式异常' })
    }
    return jsonResp(200, {
      ok: true,
      data: {
        score: typeof result.score === 'number' ? result.score : 3,
        corrected: String(result.corrected || ''),
        issues: Array.isArray(result.issues) ? result.issues : [],
        suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
        backbone: String(result.backbone || ''),
        structure: Array.isArray(result.structure) ? result.structure : [],
      },
    })
  } catch (e) {
    return jsonResp(502, { ok: false, error: e.message || 'AI 批改失败' })
  }
}
