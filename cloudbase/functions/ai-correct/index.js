// CloudBase 云函数：AI 翻译批改
// 部署在腾讯云国内节点，直连讯飞星火（大陆 API），稳定快速，规避 Supabase（美国）跨境访问讯飞的超时问题
// 通过 CloudBase 云函数「HTTP 访问服务」暴露给前端调用
const https = require('https')

const API_KEY = process.env.SPARK_API_KEY || ''
const API_SECRET = process.env.SPARK_API_SECRET || ''
// spark-x 系列（X1.5 深度推理）走 v2 接口，其余星火模型（Lite/Max 等）走 v1
const SPARK_MODEL = process.env.SPARK_MODEL || 'lite'
const API_VERSION = SPARK_MODEL.startsWith('spark-x') ? 'v2' : 'v1'
const SPARK_URL = `https://spark-api-open.xf-yun.com/${API_VERSION}/chat/completions`
// 关闭 Spark X 深度思考，大幅缩短响应时间，避免前端/网关超时
const SPARK_EXTRA = API_VERSION === 'v2' ? { thinking: { type: 'disabled' } } : {}

function buildSystemPrompt() {
  return '你是一位专业的英语翻译批改老师。你会收到用户对一个英语句子的中文翻译，以及一个参考翻译。' +
    '你的任务是：1) 找出用户翻译中存在的问题（语法、用词、漏译、多译、语序、时态、搭配等）；' +
    '2) 给出修正后的翻译；3) 给出 1-5 的评分（5 为最准确流畅）；4) 给出改进建议。' +
    '你必须只输出一个 JSON 对象，不要输出任何其他内容，格式如下：' +
    '{"score": 1-5整数, "corrected": "修正后的翻译", "issues": ["问题1", "问题2"], "suggestions": ["建议1", "建议2"]}'
}

function callSpark(messages) {
  return new Promise((resolve, reject) => {
    const payload = {
      model: SPARK_MODEL,
      temperature: 0.3,
      max_tokens: 2000,
      messages,
      ...SPARK_EXTRA,
    }
    const data = JSON.stringify(payload)
    const url = new URL(SPARK_URL)
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}:${API_SECRET}`,
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 30000,
    }, (res) => {
      let raw = ''
      res.on('data', (c) => { raw += c })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw)
          if (parsed.choices && parsed.choices[0] && parsed.choices[0].message) {
            resolve(parsed.choices[0].message.content)
          } else {
            reject(new Error(`讯飞返回异常: ${raw.slice(0, 200)}`))
          }
        } catch (e) {
          reject(new Error(`讯飞响应解析失败: ${raw.slice(0, 200)}`))
        }
      })
    })
    req.on('timeout', () => req.destroy(new Error('调用讯飞超时（30 秒）')))
    req.on('error', reject)
    req.write(data)
    req.end()
  })
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
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(obj),
  }
}

exports.main = async (event) => {
  // HTTP 访问触发时 event.body 可能是字符串或已解析对象
  let body = event && event.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch (_) { body = {} }
  }
  body = body || {}
  const en = String(body.en || '').trim()
  const userTranslation = String(body.userTranslation || '').trim()
  const refTranslation = String(body.refTranslation || '').trim()

  if (!API_KEY || !API_SECRET) {
    return jsonResp(500, { ok: false, error: '服务器未配置讯飞密钥' })
  }
  if (!en || !userTranslation) {
    return jsonResp(400, { ok: false, error: '缺少必要参数（en / userTranslation）' })
  }

  const prompt = `英语原句：${en}\n我的翻译：${userTranslation}\n参考翻译：${refTranslation}\n请对"我的翻译"进行批改。`
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
      },
    })
  } catch (e) {
    return jsonResp(502, { ok: false, error: e.message || 'AI 批改失败' })
  }
}
