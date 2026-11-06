// 用户自定义大模型（OpenAI 兼容接口）：
// - 可保存多个模型配置，随时切换当前使用的一个
// - 配置只保存在本机 localStorage，不上传云端
// - 原生端通过 CapacitorHttp 走系统网络栈，Web 端走 fetch（可能受目标服务 CORS 限制）
import { postJson } from './httpRequest'

export interface AiConfig {
  /** 接口地址：可填 https://api.deepseek.com，也可填完整的 .../chat/completions */
  baseUrl: string
  /** API Key；本地 Ollama 等无需鉴权的服务可留空 */
  apiKey: string
  /** 模型名称，如 deepseek-chat */
  model: string
}

export interface AiProfile extends AiConfig {
  /** 本机唯一 id */
  id: string
  /** 展示名称；为空时回退到模型名 / 域名 */
  name: string
}

export interface AiProfilesState {
  /** 当前正在使用的模型 id；没有配置时为 null */
  activeId: string | null
  profiles: AiProfile[]
}

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
}

const AI_PROFILES_KEY = 'kaoyan_ai_profiles'
/** 旧版单模型配置 key，首次读取时自动迁移成列表中的第一项 */
const LEGACY_AI_CONFIG_KEY = 'kaoyan_ai_config'

export const EMPTY_AI_CONFIG: AiConfig = { baseUrl: '', apiKey: '', model: '' }

/** 生成一个本机模型配置 id（不依赖 crypto.randomUUID 的 secure context 限制） */
export function newAiProfileId(): string {
  return `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** 模型在列表里的展示名：自定义名称 → 模型名 → 域名 */
export function profileDisplayName(profile: AiProfile): string {
  if (profile.name.trim()) return profile.name.trim()
  if (profile.model.trim()) return profile.model.trim()
  const host = profile.baseUrl.trim().replace(/^https?:\/\//i, '').split('/')[0]
  return host || '未命名模型'
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readConfig(raw: Record<string, unknown>): AiConfig {
  return {
    baseUrl: readString(raw.baseUrl),
    apiKey: readString(raw.apiKey),
    model: readString(raw.model),
  }
}

function readProfile(raw: unknown): AiProfile | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  return {
    id: readString(obj.id) || newAiProfileId(),
    name: readString(obj.name),
    ...readConfig(obj),
  }
}

/** 旧版单模型配置迁移：转成列表中的唯一一项并设为当前使用 */
function migrateLegacyAiConfig(): AiProfilesState {
  try {
    const raw = localStorage.getItem(LEGACY_AI_CONFIG_KEY)
    if (!raw) return { activeId: null, profiles: [] }
    const parsed = JSON.parse(raw) as Record<string, unknown> | null
    if (!parsed || typeof parsed !== 'object') return { activeId: null, profiles: [] }
    const config = readConfig(parsed)
    if (!config.baseUrl && !config.apiKey && !config.model) return { activeId: null, profiles: [] }
    const profile: AiProfile = { id: newAiProfileId(), name: '', ...config }
    const state: AiProfilesState = { activeId: profile.id, profiles: [profile] }
    try {
      localStorage.setItem(AI_PROFILES_KEY, JSON.stringify(state))
      localStorage.removeItem(LEGACY_AI_CONFIG_KEY)
    } catch {
      /* 存储不可用时仍返回迁移结果，本次会话可用 */
    }
    return state
  } catch {
    return { activeId: null, profiles: [] }
  }
}

/** 读取本机保存的模型列表（含当前使用项），无数据时自动迁移旧版单模型配置 */
export function loadAiProfiles(): AiProfilesState {
  try {
    const raw = localStorage.getItem(AI_PROFILES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AiProfilesState> | null
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.profiles)) {
        const profiles = parsed.profiles
          .map(readProfile)
          .filter((p): p is AiProfile => p !== null)
        const active = typeof parsed.activeId === 'string' ? parsed.activeId : null
        const activeId = profiles.some((p) => p.id === active) ? active : profiles[0]?.id ?? null
        return { activeId, profiles }
      }
    }
  } catch {
    /* 列表损坏时退回旧配置迁移 */
  }
  return migrateLegacyAiConfig()
}

/** 保存模型列表（自动清洗字段并校正 activeId） */
export function saveAiProfiles(state: AiProfilesState): AiProfilesState {
  const profiles = state.profiles
    .map(readProfile)
    .filter((p): p is AiProfile => p !== null)
    .map(({ id, name, baseUrl, apiKey, model }) => ({ id, name, baseUrl, apiKey, model }))
  const active = profiles.some((p) => p.id === state.activeId) ? state.activeId : null
  const next: AiProfilesState = { activeId: active ?? profiles[0]?.id ?? null, profiles }
  try {
    localStorage.setItem(AI_PROFILES_KEY, JSON.stringify(next))
  } catch {
    /* 存储不可用时忽略，调用方仍能拿到本次结果 */
  }
  return next
}

/** 读取当前使用中的模型配置（没有配置时返回空配置） */
export function loadAiConfig(): AiConfig {
  const state = loadAiProfiles()
  const active = state.profiles.find((p) => p.id === state.activeId)
  return active
    ? { baseUrl: active.baseUrl, apiKey: active.apiKey, model: active.model }
    : { ...EMPTY_AI_CONFIG }
}

/** 清除本机全部 AI 模型配置（含旧版单模型配置） */
export function clearAiConfig(): void {
  try {
    localStorage.removeItem(AI_PROFILES_KEY)
    localStorage.removeItem(LEGACY_AI_CONFIG_KEY)
  } catch {
    /* 忽略 */
  }
}

/** 是否填了可用的接口地址与模型名（API Key 允许为空） */
export function isAiConfigured(config: AiConfig = loadAiConfig()): boolean {
  return Boolean(config.baseUrl.trim() && config.model.trim())
}

/** 把用户填写的 Base URL 规范化成 chat/completions 地址 */
export function normalizeEndpoint(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  if (/\/chat\/completions$/i.test(trimmed)) return trimmed
  return `${trimmed}/chat/completions`
}

/** 调用 OpenAI 兼容的 chat/completions，返回 assistant 文本 */
export async function chatCompletion(
  config: AiConfig,
  messages: AiChatMessage[],
  options: ChatCompletionOptions = {},
): Promise<string> {
  const url = normalizeEndpoint(config.baseUrl)
  if (!url) throw new Error('未填写 AI 接口地址')
  if (!config.model.trim()) throw new Error('未填写模型名称')

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (config.apiKey.trim()) headers.Authorization = `Bearer ${config.apiKey.trim()}`

  let result: { ok: boolean; status: number; body: any }
  try {
    result = await postJson(
      url,
      {
        model: config.model.trim(),
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 2000,
      },
      options.timeoutMs ?? 45000,
      headers,
    )
  } catch (err) {
    // 请求层异常（CSP 拦截 / 跨域 / DNS / 超时）统一转成可读提示，避免直接抛 "Failed to fetch"
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('请求超时，请检查网络或接口地址是否可用')
    }
    const msg = err instanceof Error ? err.message : String(err)
    if (/failed to fetch|load failed|networkerror|network request failed/i.test(msg)) {
      throw new Error(
        '网络请求未能发出（Failed to fetch）：请确认接口地址以 https:// 开头、当前网络可访问该服务；浏览器端还可能是目标服务未允许跨域（CORS）',
      )
    }
    throw err
  }

  const { ok, status, body } = result

  if (!ok) {
    const errorText =
      body?.error?.message ||
      body?.message ||
      (typeof body === 'string' ? body : '') ||
      JSON.stringify(body)?.slice(0, 200)
    throw new Error(`AI 接口错误（${status}）${errorText ? `：${errorText}` : ''}`)
  }

  const raw = body?.choices?.[0]?.message?.content
  const content =
    typeof raw === 'string'
      ? raw
      : Array.isArray(raw)
        ? raw.map((part) => (typeof part === 'string' ? part : part?.text ?? '')).join('')
        : ''
  if (!content.trim()) throw new Error('AI 接口未返回内容')
  return content
}

/** 测试连接：发一条极短消息，返回模型回复 */
export async function testAiConfig(config: AiConfig): Promise<string> {
  return chatCompletion(
    config,
    [{ role: 'user', content: '请只回复 OK' }],
    { temperature: 0, maxTokens: 8, timeoutMs: 20000 },
  )
}

/** 容错解析 AI 输出中的 JSON（去掉 ```json 包裹、前后说明文字、尾随逗号） */
export function extractJsonObject(text: string): Record<string, unknown> | null {
  let t = String(text || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()
  if (!t) return null

  const tryParse = (value: string): Record<string, unknown> | null => {
    try {
      const parsed = JSON.parse(value) as unknown
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null
    } catch {
      return null
    }
  }

  const whole = tryParse(t)
  if (whole) return whole

  const start = t.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < t.length; i++) {
    const c = t[i]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (c === '\\') {
        escaped = true
      } else if (c === '"') {
        inString = false
      }
      continue
    }
    if (c === '"') {
      inString = true
      continue
    }
    if (c === '{') depth++
    if (c === '}') {
      depth--
      if (depth === 0) {
        const candidate = t.slice(start, i + 1).replace(/,\s*([}\]])/g, '$1')
        return tryParse(candidate)
      }
    }
  }
  return null
}

// ---------- 提示词（与 SCF / Supabase 云函数保持一致） ----------

export const LOOKUP_SYSTEM_PROMPT =
  '你是一位专业的考研英语词汇讲师，精通词根词缀与联想记忆法，熟知考研英语高频词汇、常用搭配与考点。' +
  '用户会给你一个考研词汇。你的任务是：' +
  '1) 给出该词在考研语境下的核心释义，逐条列出词性与释义，优先覆盖考研高频义项（含熟词僻义）；' +
  '2) 用词根词缀拆解或联想记忆等方法给出简明助记；' +
  '3) 列出考研英语中最常用的搭配（词组 + 中文释义）；' +
  '4) 给出一句贴合考研语境（阅读/写作/翻译）的例句并附中文翻译；' +
  '5) 如有考研考点（熟词僻义、易混词辨析、真题考法等）简要说明。' +
  '你必须只输出一个 JSON 对象，不要输出任何其他内容，格式如下：' +
  '{"word": "单词", "phonetic": "音标", "meanings": ["词性. 释义1", "词性. 释义2"], "mnemonic": "助记", "collocations": ["搭配1（中文释义）", "搭配2（中文释义）"], "example": "例句（中文翻译）", "examNote": "考研考点说明"}' +
  '要求：全部使用简体中文；meanings 优先考研高频义项；collocations 聚焦考研常用搭配并给出中文释义；example 尽量贴近考研真题语境。'

export function lookupUserPrompt(word: string): string {
  return `请查询考研词汇「${word}」的释义、助记、考研常用搭配、例句与考点。`
}

/** 查词失败时展示给用户的完整提示词，可直接复制到其他模型 */
export function buildLookupPrompt(word: string): string {
  return `【系统提示】\n${LOOKUP_SYSTEM_PROMPT}\n\n【用户输入】\n${lookupUserPrompt(word)}`
}

export const CORRECT_SYSTEM_PROMPT =
  '你是一位专业的考研英语翻译批改老师，精通长难句分析。你会收到用户对一个英语句子的中文翻译，以及一个参考翻译。' +
  '你的任务是：' +
  '1) 先剖析英语原句的句子主干（主谓宾 / 主系表骨架），再逐条拆解各修饰成分（定语、状语、同位语、插入语、各类从句、非谓语等）如何附着在主干上，帮助用户提升长难句分析能力；' +
  '2) 找出该英语句子中的重点短语、固定搭配与考研常考搭配，并给出对应的中文释义；' +
  '3) 找出学生中文翻译中存在的问题（漏译、多译、语序、用词、搭配、赘译、错译等）；' +
  '4) 给出修正后的翻译；5) 给出 1-5 的评分（5 为最准确流畅）；6) 给出改进建议。' +
  '你必须只输出一个 JSON 对象，不要输出任何其他内容，格式如下：' +
  '{"score": 1-5整数, "corrected": "简体中文译文", "issues": ["问题1", "问题2"], "suggestions": ["建议1", "建议2"], "backbone": "用中文标注句子主干成分", "structure": ["成分解析1：说明从句/短语类型、所修饰对象及作用", "成分解析2"], "collocations": ["短语搭配1（中文释义）", "短语搭配2（中文释义）"]}' +
  '要求（务必逐条遵守）：' +
  '1) corrected 必须是一句完整、通顺、地道的简体中文译文，严禁出现英文，严禁照抄或复述英语原句；' +
  '2) backbone 必须用简体中文说明英语原句的主干结构并明确标注成分（例如：主语 Everybody、谓语 loves、宾语 a fat pay rise），严禁把英语原句原文当作 backbone 输出；' +
  '3) structure 用简体中文逐条说明各修饰成分/从句的类型、修饰对象与作用；' +
  '4) collocations 用简体中文列出该句中的重点短语/固定搭配及其中文释义，聚焦考研常考搭配；' +
  '5) issues、suggestions 用简体中文，只针对学生中文译文的毛病，严禁把英语原句的语法点当作"问题"列出（英语结构分析放入 backbone 和 structure）；' +
  '6) corrected 只对应给定的这一个英语句子，严禁输出整段或整篇译文。'

export function buildCorrectUserPrompt(en: string, userTranslation: string, refTranslation: string): string {
  return `英语原句：${en}\n我的翻译：${userTranslation}\n参考翻译：${refTranslation}\n请对"我的翻译"进行批改。`
}
