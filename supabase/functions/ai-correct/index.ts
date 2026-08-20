// Supabase Edge Function：AI 翻译批改代理
// 作用：隐藏讯飞星火 APIKey/APISecret，代理调用星火大模型对学生译文进行纠正。
//
// 部署前需在 Supabase 控制台为该函数配置 Secrets：
//   SPARK_API_KEY   讯飞开放平台应用 APIKey
//   SPARK_API_SECRET讯飞开放平台应用 APISecret
//   SPARK_MODEL     （可选）模型。默认 lite（Spark Lite，走 /v1 接口，最快）；
//                   也可用 spark-x（深度推理 X1.5，走 /v2 接口）、generalv3.5（Spark Max）等
//
// 部署命令（本机装 supabase CLI 后执行）：
//   supabase functions deploy ai-correct --no-verify-jwt
// 或仅在控制台设置密钥后，由前端通过 supabase.functions.invoke 调用。

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const SPARK_MODEL = Deno.env.get('SPARK_MODEL') || 'lite'
// 注意：Spark X 系列走 /v2 接口，Lite/Pro/Max 等走 /v1 接口，需按模型自动切换
const API_VERSION = SPARK_MODEL === 'spark-x' || SPARK_MODEL === 'x1' ? 'v2' : 'v1'
const SPARK_URL = `https://spark-api-open.xf-yun.com/${API_VERSION}/chat/completions`
const SPARK_API_KEY = Deno.env.get('SPARK_API_KEY') || ''
const SPARK_API_SECRET = Deno.env.get('SPARK_API_SECRET') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/** 构造批改提示词，要求模型输出严格 JSON */
function buildPrompt(en: string, userTranslation: string, refTranslation: string): string {
  const refBlock = refTranslation
    ? `\n【参考译文（官方）】\n${refTranslation}\n`
    : '\n（未提供参考译文，请基于英语原句独立判断）\n'
  return `你是一位专业的考研英语翻译批改老师，精通长难句分析，帮助考生精准定位并改进译文。请先剖析英语原句的句子主干与结构，再基于参考译文对 "学生的译文" 进行批改。
  
【原文（英文）】
${en}

【学生的译文】
${userTranslation}
${refBlock}
批改要求：
1. 先分析英语原句的句子主干（主谓宾 / 主系表骨架），用简体中文明确标注主语、谓语、宾语等成分（例如：主语 Everybody、谓语 loves、宾语 a fat pay rise），严禁把英语原句原文当作主干输出；再逐条拆解主要修饰成分与从句（定语、状语、同位语、插入语、非谓语、各类从句等），说明其类型、所修饰的对象和在句中的作用，帮助用户提升长难句分析能力。
2. 提取该英语句子中的重点短语、固定搭配与考研常考搭配，并给出对应的中文释义。
3. 判断学生译文在准确性、通顺度、对长难句结构与固定搭配的把握上是否到位。
4. 给出修正后的完整简体中文译文，尽量贴近原文含义又符合中文表达习惯。严禁在 corrected 中出现英文或照抄英语原句。注意：修正译文必须只对应这一个英语句子，严禁输出整段或整篇译文的参考译文。
5. 逐条指出学生中文译文的突出问题（用词、语序、漏译、赘译、语法等）。注意：只评价学生的中文译文，严禁把英语原句本身的语法点当作"问题"列出，英语原句的结构分析放在 backbone 和 structure。
6. 给出可执行的改进建议。

请只输出一个 JSON 对象，禁止输出任何其他文字或 Markdown 代码块标记，格式严格如下：
{"score": 0, "corrected": "简体中文译文（严禁英文）", "issues": ["问题1", "问题2"], "suggestions": ["建议1", "建议2"], "backbone": "用中文标注句子主干成分", "structure": ["成分解析1：说明从句/短语类型、所修饰对象及作用", "成分解析2"], "collocations": ["短语搭配1（中文释义）", "短语搭配2（中文释义）"]}`;
}

/** 构造查词提示词（action: 'lookup'），要求模型输出严格 JSON */
function buildLookupPrompt(word: string): string {
  return `你是一位专业的考研英语词汇讲师，精通词根词缀与联想记忆法，熟知考研英语高频词汇、常用搭配与考点。请查询考研词汇「${word}」。

查询要求：
1. 给出该词在考研语境下的核心释义，逐条列出词性与释义，优先覆盖考研高频义项（含熟词僻义）。
2. 用词根词缀拆解或联想记忆等方法给出简明助记。
3. 列出考研英语中最常用的搭配（词组 + 中文释义）。
4. 给出一句贴合考研语境（阅读/写作/翻译）的例句并附中文翻译。
5. 如有考研考点（熟词僻义、易混词辨析、真题考法等）简要说明。

请只输出一个 JSON 对象，禁止输出任何其他文字或 Markdown 代码块标记，格式严格如下：
{"word": "单词", "phonetic": "音标", "meanings": ["词性. 释义1", "词性. 释义2"], "mnemonic": "助记", "collocations": ["搭配1（中文释义）", "搭配2（中文释义）"], "example": "例句（中文翻译）", "examNote": "考研考点说明"}

要求：全部使用简体中文；meanings 优先考研高频义项；collocations 聚焦考研常用搭配并给出中文释义；example 尽量贴近考研真题语境。`;
}

/** 清洗并容错提取模型返回中的 JSON：去除 ```json 围栏与首尾空白；
 *  直接解析失败则用平衡花括号精确提取最外层对象并清理尾随逗号后再解析 */
function extractJson(text: string): string {
  let t = String(text)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()
  const tryParse = (s: string) => {
    try { return JSON.parse(s) } catch { return null }
  }
  try {
    const parsed = tryParse(t)
    if (parsed) return JSON.stringify(parsed)
  } catch { /* 继续向下提取 */ }

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
          const candidate = t.slice(start, i + 1).replace(/,\s*([}\]])/g, '$1')
          const parsed = tryParse(candidate)
          if (parsed) return JSON.stringify(parsed)
        }
      }
    }
  }
  return t
}

/** 解析模型输出为结构化结果，解析失败时兜底返回原始文本 */
function parseResult(raw: string) {
  // 模型偶发把 issues/suggestions/structure 返回成对象列表，统一转成字符串数组，
  // 优先取对象内的首个字符串字段，避免前端渲染成 [object Object]
  const toStrArr = (arr: unknown): string[] =>
    Array.isArray(arr)
      ? arr
          .map((item) => {
            if (typeof item === 'string') return item
            if (item && typeof item === 'object') {
              const firstStr = Object.values(item as Record<string, unknown>).find(
                (v) => typeof v === 'string'
              )
              return firstStr != null ? String(firstStr) : JSON.stringify(item)
            }
            return item == null ? '' : String(item)
          })
          .filter((s) => s !== '')
      : []
  try {
    const r = JSON.parse(extractJson(raw)) as Record<string, unknown>
    return {
      score: typeof r.score === 'number' ? r.score : null,
      corrected: typeof r.corrected === 'string' ? r.corrected : String(r.corrected || ''),
      issues: toStrArr(r.issues),
      suggestions: toStrArr(r.suggestions),
      backbone: typeof r.backbone === 'string' ? r.backbone : String(r.backbone || ''),
      structure: toStrArr(r.structure),
      collocations: toStrArr(r.collocations),
    }
  } catch {
    return { score: null, corrected: raw, issues: [], suggestions: [], backbone: '', structure: [], collocations: [] }
  }
}

serve(async (req) => {
  // CORS 预检
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    if (!SPARK_API_KEY || !SPARK_API_SECRET) {
      return new Response(JSON.stringify({ error: '服务端未配置 SPARK_API_KEY / SPARK_API_SECRET' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const action = String(body.action || 'correct').trim()

    // 查词分支：AI 查询考研单词释义/助记/搭配（action: 'lookup'）
    if (action === 'lookup') {
      const word = String(body.word || '').trim()
      if (!word) {
        return new Response(JSON.stringify({ error: '缺少 word 参数' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const messages = [
        { role: 'system', content: '你是一个严谨、细致的考研英语词汇讲师。' },
        { role: 'user', content: buildLookupPrompt(word) },
      ]

      const sparkResp = await fetch(SPARK_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SPARK_API_KEY}:${SPARK_API_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: SPARK_MODEL,
          temperature: 0.3,
          max_tokens: 2000,
          messages,
          ...(API_VERSION === 'v2' ? { thinking: { type: 'disabled' } } : {}),
        }),
      })

      if (!sparkResp.ok) {
        const errText = await sparkResp.text()
        return new Response(
          JSON.stringify({ error: `星火接口返回 ${sparkResp.status}: ${errText}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const data = await sparkResp.json()
      const content: string = data?.choices?.[0]?.message?.content ?? ''
      let result: Record<string, unknown>
      try {
        result = JSON.parse(extractJson(content))
      } catch {
        result = {}
      }

      return new Response(
        JSON.stringify({
          word: String(result.word || word),
          phonetic: String(result.phonetic || ''),
          meanings: Array.isArray(result.meanings) ? result.meanings.map(String) : [],
          mnemonic: String(result.mnemonic || ''),
          collocations: Array.isArray(result.collocations) ? result.collocations.map(String) : [],
          example: String(result.example || ''),
          examNote: String(result.examNote || ''),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 默认：翻译批改
    const en = String(body.en || '').trim()
    const userTranslation = String(body.userTranslation || '').trim()
    const refTranslation = String(body.refTranslation || '').trim()

    if (!en || !userTranslation) {
      return new Response(JSON.stringify({ error: '缺少 en / userTranslation 参数' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const messages = [
      { role: 'system', content: '你是一个严谨、细致的英语翻译批改助手。' },
      { role: 'user', content: buildPrompt(en, userTranslation, refTranslation) },
    ]

    // 讯飞星火 OpenAI 兼容接口鉴权：Bearer APIKey:APISecret
    const sparkResp = await fetch(SPARK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SPARK_API_KEY}:${SPARK_API_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: SPARK_MODEL,
        temperature: 0.3,
        // 提高 max_tokens，避免长句批改被截断
        max_tokens: 2000,
        messages,
        // Spark X 深度推理默认思考模式极慢（单次可达 40 秒以上，易触发网关/浏览器超时），
        // 关闭深度思考以大幅加快批改响应；Lite/Max 等非 X 模型无需此参数
        ...(API_VERSION === 'v2' ? { thinking: { type: 'disabled' } } : {}),
      }),
    })

    if (!sparkResp.ok) {
      const errText = await sparkResp.text()
      return new Response(
        JSON.stringify({ error: `星火接口返回 ${sparkResp.status}: ${errText}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await sparkResp.json()
    const content: string = data?.choices?.[0]?.message?.content ?? ''

    return new Response(JSON.stringify(parseResult(content)), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'AI 服务异常' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})