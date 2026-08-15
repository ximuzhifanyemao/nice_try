// Supabase Edge Function：AI 翻译批改代理
// 作用：隐藏讯飞星火 APIKey/APISecret，代理调用星火大模型对学生译文进行纠正。
//
// 部署前需在 Supabase 控制台为该函数配置 Secrets：
//   SPARK_API_KEY   讯飞开放平台应用 APIKey
//   SPARK_API_SECRET讯飞开放平台应用 APISecret
//   SPARK_MODEL     （可选）模型。默认 spark-x（深度推理 X1.5，走 /v2 接口）；
//                   也可用 lite（Spark Lite）、generalv3.5（Spark Max）等（走 /v1 接口）
//
// 部署命令（本机装 supabase CLI 后执行）：
//   supabase functions deploy ai-correct --no-verify-jwt
// 或仅在控制台设置密钥后，由前端通过 supabase.functions.invoke 调用。

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const SPARK_MODEL = Deno.env.get('SPARK_MODEL') || 'spark-x'
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
  return `你是一位专业的考研英语翻译批改老师，精通长难句分析，帮助考生精准定位并改进译文。请先剖析英语原句的句子主干与结构，再基于参考译文对 "学生的译文" 进行批改。
  
【原文（英文）】
${en}

【学生的译文】
${userTranslation}

【参考译文（官方）】
${refTranslation}

批改要求：
1. 先分析英语原句的句子主干（主谓宾 / 主系表骨架），用中文标注主语、谓语、宾语等成分；再逐条拆解主要修饰成分与从句（定语、状语、同位语、插入语、非谓语、各类从句等），说明其类型、所修饰的对象和在句中的作用，帮助用户提升长难句分析能力。
2. 判断学生译文在准确性、通顺度、对长难句结构与固定搭配的把握上是否到位。
3. 给出修正后的完整译文，尽量贴近原文含义又符合中文表达习惯。
4. 逐条指出学生译文的突出问题（用词、语序、漏译、赘译、语法等）。
5. 给出可执行的改进建议。

请只输出一个 JSON 对象，禁止输出任何其他文字或 Markdown 代码块标记，格式严格如下：
{"score": 0, "corrected": "修正后的完整译文", "issues": ["问题1", "问题2"], "suggestions": ["建议1", "建议2"], "backbone": "句子主干（简明点出主谓宾/主系表骨架）", "structure": ["成分解析1：说明从句/短语类型、所修饰对象及作用", "成分解析2"]}`;
}

/** 清洗模型返回的 JSON：去除可能包裹的 ```json ``` 代码块与首尾空白 */
function extractJson(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
}

/** 解析模型输出为结构化结果，解析失败时兜底返回原始文本 */
function parseResult(raw: string) {
  try {
    return JSON.parse(extractJson(raw))
  } catch {
    return { score: null, corrected: raw, issues: [], suggestions: [], backbone: '', structure: [] }
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
    const en = String(body.en || '').trim()
    const userTranslation = String(body.userTranslation || '').trim()
    const refTranslation = String(body.refTranslation || '').trim()

    if (!en || !userTranslation || !refTranslation) {
      return new Response(JSON.stringify({ error: '缺少 en / userTranslation / refTranslation 参数' }), {
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