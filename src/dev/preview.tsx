/**
 * 桌面端 UI 预览台（仅开发环境使用，`?preview=1` 进入）。
 *
 * 目的：Tauri 窗口无法在浏览器里直接跑，`isTauri()` 恒为 false，导致
 * 「精简胶囊条」与「全部功能窗口」这两套桌面专属界面难以在开发时查看。
 * 这里在浏览器里搭一个可控的假环境（桩掉 Tauri 窗口 API、注入假登录态与假数据），
 * 让桌面端界面能在普通浏览器里 1:1 渲染出来，便于逐像素比对改版效果。
 *
 * 用法：
 *   npm run dev
 *   http://localhost:5173/?preview=1&view=compact     450×56 精简胶囊条（空闲）
 *   http://localhost:5173/?preview=1&view=idle        精简胶囊条（计时中）
 *   http://localhost:5173/?preview=1&view=pomo        精简胶囊条（番茄钟专注倒计时；
 *                                                     可叠 &phase=rest / &paused=1）
 *   http://localhost:5173/?preview=1&view=dropdown    科目下拉面板（叠 &pomo=1 看番茄钟模式）
 *   http://localhost:5173/?preview=1&view=full        全部功能窗口
 * 可叠加 &theme=dark|light|dawn|dusk|starry 切换主题、&running=1 摆出「计时中」态。
 *
 * 该文件不参与生产打包（入口在 main.tsx 里按 import.meta.env.DEV 动态引入）。
 */
import { createRoot } from 'react-dom/client'
import '../index.css' // 与 main.tsx 一致：预览台必须自行引入全局样式与 Tailwind
import { applyTheme, type ThemeMode } from '../lib/theme'
import {
  TIMER_RUNNING_KEY,
  type SharedTimerState,
} from '../lib/timerSync'
import { POMO_STATE_KEY, type PomoState } from '../lib/pomodoro'
import { getWeekStartStr } from '../lib/commitments'
import { todayStr } from '../lib/dailyLogs'

/** 本周目标缓存 key（与 useWeekGoal 内部保持一致，用于预览进度条） */
const WEEK_GOAL_CACHE_KEY = 'kaoyan_week_goal_cache'
const MODE_KEY = 'kaoyan_widget_mode'
/** 计时模式 key（正计时/番茄钟，与 lib/pomodoro 内部保持一致） */
const TIMER_MODE_KEY = 'kaoyan_timer_mode'
const THEME_KEY = 'app_theme'

const VALID_THEMES: ThemeMode[] = ['light', 'dark', 'dawn', 'dusk', 'starry']

declare global {
  interface Window {
  }
}

/* ────────────── Tauri 运行时桩 ──────────────
   WidgetApp 通过 @tauri-apps/api 调用窗口 API。Vite 会把该包预打包成
   optimizeDeps，其命名空间导出是只读 getter，无法在外部改写；因此这里改为
   实现真正的注入点：Tauri 的 JS 侧最终都走 window.__TAURI_INTERNALS__
   （invoke + transformCallback）。把它补全，真实 API 就能在浏览器里正常运行。
   必须在 WidgetApp 被 import 之前完成注入。 */

type InvokeArgs = Record<string, unknown>

const noopResult = () => Promise.resolve(undefined)

/** 预览窗口的假状态：位置/尺寸/置顶只记在内存里，供交互逻辑自洽运转 */
const fakeWindowState = {
  size: { width: 460, height: 52 },
  position: { x: 240, y: 520 },
  alwaysOnTop: true,
  resizable: false,
}

/**
 * 把「窗口」尺寸落到宿主容器上（html/body/#root）。
 * 预览台没有真实窗口，只有把尺寸落到 DOM 上，WidgetApp 里的 setSize 才看得见效果。
 * 同时把「窗口高度」与浏览器视口高度解耦：宿主固定成窗口尺寸并禁止溢出，
 * 这样窗口变矮时页面不会因为 min-h-screen 之类的最小高度而撑出滚动条。
 */
function applyFakeWindowSize(width: number, height: number) {
  for (const el of [document.documentElement, document.body, document.getElementById('root')]) {
    if (!el) continue
    el.style.width = `${width}px`
    el.style.height = `${height}px`
    el.style.overflow = 'hidden'
  }
  document.body.style.margin = '0'
}

const FAKE_MONITOR = {
  name: 'preview-monitor',
  size: { width: 1920, height: 1080 },
  position: { x: 0, y: 0 },
  // workArea 是 @tauri-apps/api mapMonitor 的必填项（缺了会抛 "Cannot read properties of undefined"），
  // 这里按 48px 任务栏给出可用区域，与真实 Windows 桌面一致
  workArea: { position: { x: 0, y: 0 }, size: { width: 1920, height: 1032 } },
  scaleFactor: 1,
}

/**
 * 从 Tauri 的命令参数里取逻辑尺寸。
 * 注意真实参数并不是扁平的 width/height：`setSize` 会把尺寸包在 `Size` 实例里
 * （`{ label, value: { size: LogicalSize } }`），所以这里要拆几层再取宽高。
 */
function logicalSizeOf(args: InvokeArgs): { width: number; height: number } | null {
  type Size = { width?: number; height?: number }
  const value = (args as { value?: { Logical?: Size; Physical?: Size; size?: Size } })?.value
  /* Tauri 的 setSize 会把尺寸包成 `Size` 实例后传进来：`{ value: { size: LogicalSize } }`，
     而 LogicalSize 的形状是 `{ type: 'Logical', width, height }`。
     这里把几种可能形状都兜住（含历史写法与扁平写法），避免预览台悄悄收不到尺寸。 */
  const candidates: unknown[] = [value?.size, value?.Logical, value?.Physical, args]
  for (const cand of candidates) {
    const size = cand as Size | undefined
    if (size && typeof size.width === 'number' && typeof size.height === 'number') {
      return { width: size.width, height: size.height }
    }
  }
  return null
}

/** 按 Tauri 命令行约定分发 invoke：命令名形如 plugin:window|set_size */
async function fakeInvoke(cmd: string, args: InvokeArgs = {}): Promise<unknown> {
  const size = logicalSizeOf(args)
  const { width, height } = size ?? { width: undefined, height: undefined }
  switch (cmd) {
    case 'plugin:window|current_monitor':
    case 'plugin:window|primary_monitor':
    case 'plugin:window|available_monitors':
      return cmd === 'plugin:window|available_monitors' ? [FAKE_MONITOR] : FAKE_MONITOR
    case 'plugin:window|set_size':
      if (typeof width === 'number' && typeof height === 'number') {
        fakeWindowState.size = { width, height }
        // 预览台没有真实窗口：把请求的尺寸落到宿主容器上，
        // 这样「科目多时下拉自动加高」这类窗口尺寸行为也能在浏览器里被看到/截图
        applyFakeWindowSize(width, height)
      }
      return undefined
    case 'plugin:window|inner_size':
    case 'plugin:window|outer_size':
      return fakeWindowState.size
    case 'plugin:window|set_position':
      return undefined
    case 'plugin:window|outer_position':
    case 'plugin:window|inner_position':
      return fakeWindowState.position
    case 'plugin:window|scale_factor':
      return 1
    case 'plugin:window|is_maximized':
    case 'plugin:window|is_minimized':
    case 'plugin:window|is_visible':
      return true
    case 'plugin:window|is_decorated':
    case 'plugin:window|is_resizable':
      return fakeWindowState.resizable
    case 'plugin:window|is_always_on_top':
      return fakeWindowState.alwaysOnTop
    case 'plugin:window|set_always_on_top':
      fakeWindowState.alwaysOnTop = Boolean((args as { alwaysOnTop?: boolean }).alwaysOnTop)
      return undefined
    case 'plugin:window|set_resizable':
      fakeWindowState.resizable = Boolean((args as { resizable?: boolean }).resizable)
      return undefined
    // 事件系统（onMoved 等）在预览里不需要真的回调，注册即返回一个监听 id
    case 'plugin:event|listen':
      return 1
    case 'plugin:event|unlisten':
    case 'plugin:event|emit':
    case 'plugin:event|emit_to':
      return undefined
    default:
      return undefined
  }
}

function installTauriStubs() {
  let callbackId = 1
  const internals = {
    invoke: fakeInvoke,
    // Tauri 用它把回调注册成 window 上的全局函数并返回 id
    transformCallback: (cb?: (payload: unknown) => void) => {
      const id = callbackId++
      ;(window as unknown as Record<string, unknown>)[`_${id}`] = (payload: unknown) => cb?.(payload)
      return id
    },
    metadata: {
      currentWindow: { label: 'main' },
      currentWebview: { label: 'main', windowLabel: 'main' },
    },
    plugins: {},
    convertFileSrc: (p: string) => p,
    unregisterCallback: (id: number) => {
      delete (window as unknown as Record<string, unknown>)[`_${id}`]
    },
    runCallback: () => noopResult,
    callbacks: new Map(),
  }
  Object.defineProperty(window, '__TAURI_INTERNALS__', {
    value: internals,
    configurable: true,
    writable: true,
  })
  // 事件插件的 JS 侧内部实现：@tauri-apps/api/event 的 unlisten 需要它
  Object.defineProperty(window, '__TAURI_EVENT_PLUGIN_INTERNALS__', {
    value: { unregisterListener: () => {} },
    configurable: true,
    writable: true,
  })
  Object.defineProperty(window, '__TAURI__', { value: {}, configurable: true, writable: true })
  // @tauri-apps/api 的 isTauri() 查的是 globalThis.isTauri（由 Tauri 初始化脚本注入），
  // 不是 __TAURI_INTERNALS__。漏了它，预览台里所有 isTauri() 分支都会走网页版，
  // 桌面专属分支（原生另存为、桌面更新文案等）就完全没法审阅了。
  Object.defineProperty(window, 'isTauri', { value: true, configurable: true, writable: true })
}

/* ────────────── 假后端 ──────────────
   预览台不需要真实数据，但也不能让请求真的打出去：
   一是每次打开都要等网络超时（10s）才渲染，二是假 token 会触发
   refresh_token 失败并在页面上留下「JWT cryptographic operation failed」之类的噪声。
   这里拦截 Supabase 的 POST 刷新接口返回 400（等价于「token 已失效」，
   supabase-js 会清理会话并停止重试），其余请求返回空结果集。 */

function installFakeBackend() {
  const realFetch = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (/\/auth\/v1\/token/.test(url)) {
      return new Response(
        JSON.stringify({ error: 'invalid_grant', error_description: 'preview: token disabled' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }
    if (/\/rest\/v1\/weekly_commitments/.test(url)) {
      // 本周目标：让「本周目标」摘要卡在预览里也可见（真实数据来自用户设置）
      return new Response(
        JSON.stringify([
          { id: 'preview-commit', week_start: getWeekStartStr(), target_hours: 40, status: 'active' },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }
    if (/\/rest\/v1\/user_subjects/.test(url)) {
      // 科目表返回预览用的假数据（否则空数组会把本地快照里的科目清掉）
      return new Response(JSON.stringify(previewSubjects), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (previewLogsEnabled && /\/rest\/v1\/daily_logs/.test(url)) {
      // 今日学习记录（?logs=1）：用于查看日历当天的时间轴详情与进度条填充。
      // 写入请求（保存/补交）存进内存副本，让「计时→保存→日历查看」整条链路在预览里可跑通。
      const method = (init?.method ?? 'GET').toUpperCase()
      if (method !== 'GET' && typeof init?.body === 'string') {
        const base = previewSavedLog ?? buildPreviewTodayLog()
        previewSavedLog = { ...base, ...(JSON.parse(init.body) as Record<string, unknown>) }
      }
      const row = previewSavedLog ?? buildPreviewTodayLog()
      const acceptsObject = /pgrst\.object/.test(JSON.stringify(init?.headers ?? {}))
      return new Response(JSON.stringify(acceptsObject ? row : [row]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (/\/rest\/v1\//.test(url)) {
      // 其余列表查询返回空数组；带 Accept: application/vnd.pgrst.object 的单条查询返回 null
      const wantsObject = (init?.headers && JSON.stringify(init.headers).includes('pgrst.object')) ?? false
      return new Response(wantsObject ? 'null' : '[]', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (/supabase\.co|\/auth\/v1\//.test(url)) {
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    return realFetch(input, init)
  }
}

/* ────────────── 假登录态 ──────────────
   胶囊条/下拉需要登录用户才显示今日时长与本周目标。这里往 Supabase 的
   session 存储位写一份「永不过期」的假会话，让 AuthProvider 启动即恢复登录。
   storageKey 规则：sb-<项目ref>-auth-token（取 Supabase URL 的首段域名）。 */

function supabaseStorageKey(): string {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? 'placeholder.supabase.co'
  const ref = url.replace(/^https?:\/\//, '').split('/')[0].split('.')[0] || 'placeholder'
  return `sb-${ref}-auth-token`
}

/** 写入一份假会话（仅用于预览；token 是本地伪造串，不参与真实请求鉴权） */
function seedMockSession() {
  const far = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365
  const user = {
    id: '00000000-0000-4000-8000-000000000001',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'preview@divedeep.local',
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { nickname: '预览用户' },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
  }
  const session = {
    access_token: 'preview.fake.jwt',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: far,
    refresh_token: 'preview-refresh-token',
    user,
  }
  localStorage.setItem(supabaseStorageKey(), JSON.stringify(session))
}

/* ────────────── 假数据注入 ────────────── */

/** 假登录态对应的用户 id（与 seedMockSession 里的 user.id 保持一致） */
const PREVIEW_USER_ID = '00000000-0000-4000-8000-000000000001'
/** 自定义科目本地快照 key（与 lib/subjects.ts 的 SUBJECTS_STORAGE_KEY 保持一致） */
const SUBJECTS_KEY = `kaoyan_user_subjects_${PREVIEW_USER_ID}`

/** 是否返回「今日学习记录」假数据（?logs=N，N=科目条数；N=1 视为默认 4 条） */
let previewLogsEnabled = false
/** 预览记录里的科目条数（用于验证「记录多时详情区限高滚动」） */
let previewLogCount = 4
/** 预览期间「云端记录」的内存副本：保存/合并写回后仍能被日历读到 */
let previewSavedLog: Record<string, unknown> | null = null

/**
 * 预览用的今日学习记录：含时间段与暂停明细，
 * 便于核对日历当天详情的时间轴样式（无时间段 / 有暂停 两种情况都要能看到）。
 * ?logs=N 可生成 N 条，用来验证记录很多时详情区是否限高滚动、日历不被压扁。
 */
function buildPreviewTodayLog() {
  const date = todayStr()
  const extra = Array.from({ length: Math.max(0, previewLogCount - 4) }, (_, i) => {
    const start = 8 * 60 + i * 40
    const fmt = (m: number) => `${String(Math.floor((m % 1440) / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    const tpl = [
      { id: 'math', activity: '刷题', hours: 0.6 },
      { id: 'english', activity: '阅读', hours: 0.7 },
      { id: 's-408-1', activity: '练习', hours: 0.5 },
      { id: 'politics', activity: '刷题', hours: 0.4 },
    ][i % 4]
    return {
      ...tpl,
      startTime: fmt(start),
      endTime: fmt(start + 36),
      ...(i % 2 === 0 ? { pauses: [{ at: fmt(start + 15), ms: 300000 }] } : {}),
    }
  })
  return {
    id: 'preview-log-today',
    user_id: PREVIEW_USER_ID,
    date,
    summary: '上午数学提速，下午英语收尾。',
    created_at: `${date}T21:20:00.000Z`,
    updated_at: `${date}T21:20:00.000Z`,
    deleted_at: null,
    subjects: [
      { id: 'math', activity: '练习', hours: 0.4, startTime: '09:12', endTime: '09:36', pauses: [{ at: '09:20', ms: 240000 }] },
      {
        id: 's-math-2',
        activity: '听课',
        hours: 1.2,
        startTime: '10:05',
        endTime: '11:15',
        pauses: [{ at: '10:40', ms: 480000 }, { at: '11:02', ms: 180000 }],
      },
      { id: 'english', activity: '单词', hours: 0.6, startTime: '14:20', endTime: '14:56' },
      { id: 'politics', activity: '背诵', hours: 0.8, startTime: '20:30', endTime: '21:18', pauses: [{ at: '21:00', ms: 720000 }] },
      ...extra,
    ],
  }
}

/**
 * 假科目数据：真实用户在登录后会从本地快照恢复自定义科目，
 * 随后云端会返回同一份数据。预览台需要两处都提供，
 * 否则空数组会把刚恢复的科目列表清掉（loadUserSubjects 以云端结果为准）。
 */
const PREVIEW_SUBJECTS = [
  { id: 'math', name: '数学', category: 'math', activities: ['听课', '刷题'], legacy_id: 'math' },
  { id: 's-math-2', name: '高数强化', category: 'math', activities: ['听课', '刷题', '错题整理'], legacy_id: null },
  { id: 'english', name: '英语', category: 'english', activities: ['单词', '阅读', '长难句'], legacy_id: 'english' },
  { id: 's-408-1', name: '数据结构', category: '408', activities: ['听课', '练习'], legacy_id: null },
  { id: 's-408-2', name: '操作系统', category: '408', activities: ['听课', '练习'], legacy_id: null },
  { id: 'politics', name: '政治', category: 'politics', activities: ['听课', '背诵', '刷题'], legacy_id: 'politics' },
  // 无分组科目：验证「有分组 + 无分组」混排时的排版
  { id: 's-other-1', name: '毕业设计', category: 'custom', activities: [], legacy_id: null },
]

/** 生成指定数量的假科目（→ 验证下拉「够则 300 / 不够则长高 / 到顶则滚动」三档） */
function buildSubjects(count: number) {
  if (count <= PREVIEW_SUBJECTS.length) return PREVIEW_SUBJECTS.slice(0, count)
  const extra = Array.from({ length: count - PREVIEW_SUBJECTS.length }, (_, i) => ({
    id: `s-extra-${i}`,
    name: `补充科目${i + 1}`,
    category: i % 2 === 0 ? 'english' : 'custom',
    activities: ['听课'],
    legacy_id: null,
  }))
  return [...PREVIEW_SUBJECTS, ...extra]
}

/** 当前预览使用的科目表（由 ?subjects=N 控制，默认 7 个） */
let previewSubjects = PREVIEW_SUBJECTS

function seedSubjects(count: number) {
  previewSubjects = buildSubjects(count)
  localStorage.setItem(SUBJECTS_KEY, JSON.stringify(previewSubjects))
}

/** 构造一段「已计时 1 小时 12 分」的共享计时状态 */
function mockRunningTimer(): SharedTimerState {
  return {
    subjectId: 'math',
    activity: '高数强化',
    startTime: Date.now() - 72 * 60 * 1000,
  }
}

/** 构造一个进行中的番茄钟（?view=pomo 预览倒计时/暂停/休息态；overdue=1 摆出「刚到点」以验证结算） */
function mockPomo(phase: 'focus' | 'rest', paused: boolean, overdue = false): PomoState {
  const focusMin = 25
  const restMin = 5
  const elapsedMin = overdue ? focusMin : phase === 'focus' ? 12 : 2
  const start = Date.now() - elapsedMin * 60000
  return {
    phase,
    subjectId: 'math',
    activity: '高数强化',
    round: phase === 'focus' ? 2 : 3,
    focusMin,
    restMin,
    phaseStartAt: start,
    endAt: overdue ? Date.now() - 1000 : start + (phase === 'focus' ? focusMin : restMin) * 60000,
    paused,
    pauseAt: paused ? Date.now() : null,
  }
}

function seedData(view: string, theme: ThemeMode, running: boolean, params: URLSearchParams) {
  localStorage.setItem(THEME_KEY, theme)
  localStorage.setItem(MODE_KEY, view === 'full' ? 'full' : 'compact')
  // 今日已学 5.4h / 本周目标 40h（已达成 18.6h）→ 进度条与目标线都有内容可看
  localStorage.setItem(
    WEEK_GOAL_CACHE_KEY,
    JSON.stringify({ weekStart: getWeekStartStr(), target: 40, actual: 18.6 }),
  )
  /* 番茄钟：?view=pomo（可叠 &phase=rest|&paused=1）摆出专注/休息倒计时；
     ?pomo=run 在任意视图（如 view=full#/timer）摆出进行中的番茄钟；
     ?pomo=1 只切「番茄钟」模式偏好（用于预览下拉里的番茄钟时长设置行） */
  localStorage.removeItem(POMO_STATE_KEY)
  localStorage.setItem(TIMER_MODE_KEY, 'stopwatch')
  if (view === 'pomo' || params.get('pomo') === 'run') {
    const phase = params.get('phase') === 'rest' ? 'rest' : 'focus'
    const overdue = params.get('overdue') === '1'
    localStorage.setItem(POMO_STATE_KEY, JSON.stringify(mockPomo(phase, params.get('paused') === '1', overdue)))
    localStorage.setItem(TIMER_MODE_KEY, 'pomodoro')
  } else if (params.get('pomo') === '1') {
    localStorage.setItem(TIMER_MODE_KEY, 'pomodoro')
  }
  // ?running=1：强制摆出「计时中」态（全功能计时页 Hero 的渐变数字/控制钮也要能截到）
  if (running || view === 'idle' || (view === 'dropdown' && !params.has('pomo'))) {
    localStorage.setItem(TIMER_RUNNING_KEY, JSON.stringify(mockRunningTimer()))
  } else {
    localStorage.removeItem(TIMER_RUNNING_KEY)
  }
}

/* ────────────── 启动 ────────────── */

/** 诊断标记（默认空操作；?diag=1 时改写为写入 DOM 的实现） */
let mark: (s: string) => void = () => {}

export async function startPreview() {
  const params = new URLSearchParams(location.search)
  // 诊断标记（?diag=1）：把启动流程的每一步写进 DOM，便于用 --dump-dom 定位中断点
  if (params.get('diag') === '1') {
    const diag = (s: string) => {
      const el =
        document.getElementById('preview-diag') ??
        document.body.appendChild(Object.assign(document.createElement('div'), { id: 'preview-diag' }))
      el.textContent += `[${s}]`
    }
    window.addEventListener('error', (e) => diag(`ERR:${e.message}`))
    window.addEventListener('unhandledrejection', (e) => diag(`REJ:${String((e as PromiseRejectionEvent).reason)}`))
    mark = diag
  }
  mark('start')

  const view = params.get('view') ?? 'compact'
  const themeParam = params.get('theme') as ThemeMode | null
  const theme: ThemeMode = themeParam && VALID_THEMES.includes(themeParam) ? themeParam : 'dark'
  // ?subjects=N 控制假科目数量：验证下拉「够则 300 / 不够则长高 / 到顶则滚动」
  const subjectCount = Number(params.get('subjects') ?? 7)
  // ?logs=N：让假后端返回一条今日学习记录（N=科目条数，N=1 视为默认 4 条）
  const logParam = params.get('logs')
  previewLogsEnabled = logParam !== null && logParam !== '0'
  previewLogCount = Math.max(4, Number(logParam) || 4)

  seedMockSession()
  seedSubjects(Number.isFinite(subjectCount) ? Math.max(0, subjectCount) : 7)
  installFakeBackend()
  seedData(view, theme, params.get('running') === '1', params)
  applyTheme(theme)
  document.documentElement.classList.add('preview-host')
  mark('seeded')

  installTauriStubs()
  mark('stubbed')
  const [{ default: WidgetApp, CompactShell, FullModeShell }, { AuthProvider }, { ToastProvider }] = await Promise.all([
    import('../widget/WidgetApp'),
    import('../contexts/AuthContext'),
    import('../lib/Toast'),
  ])
  mark('imported')

  // 让 html/body 贴合窗口尺寸，避免预览时出现多余滚动条干扰观察
  document.body.style.margin = '0'
  document.body.style.overflow = 'hidden'

  /**
   * 桌面窗口内容：view=full 走全功能外壳；其余走精简外壳。
   * 关键点：这里渲染的是 WidgetApp 导出的**真实外壳组件**，
   * 而不是另写一份近似布局，保证截图审阅的就是线上界面本身。
   *
   * view=widget-dropdown 例外：整窗挂载真实 WidgetApp，并自动点开科目下拉，
   * 用于验证「下拉按科目数量自适应加高」这类由 WidgetApp 自身状态驱动的行为
   * （外壳组件是被动接收 dropdownOpen 的，跑不到那段逻辑）。
   */
  function DesktopPreview() {
    if (view === 'full') return <FullModeShell onToggleMode={() => {}} />
    if (view === 'widget-dropdown') return <WidgetApp />
    return (
      <CompactShell
        // 下拉面板的高度由 Tauri 窗口负责，预览台直接按目标尺寸给出
        dropdownOpen={view === 'dropdown'}
        dropdownClosing={false}
        onToggleMode={() => {}}
        onOpenDropdown={() => {}}
        onCloseDropdown={() => {}}
        onPick={() => {}}
      />
    )
  }

  // 自动点开下拉：模拟用户点「选择科目开始」，跑通真实的展开路径（含窗口加高）
  if (view === 'widget-dropdown') {
    const timer = window.setInterval(() => {
      const trigger = document.querySelector<HTMLButtonElement>('button[aria-label="选择科目开始"]')
      if (trigger) {
        trigger.click()
        window.clearInterval(timer)
      }
    }, 100)
    window.setTimeout(() => window.clearInterval(timer), 10000)
  }

  createRoot(document.getElementById('root')!).render(
    <div className="h-full w-full">
      <ToastProvider>
        <AuthProvider>
          <DesktopPreview />
        </AuthProvider>
      </ToastProvider>
    </div>,
  )
}

// 作为 preview.html 的模块入口直接执行
void startPreview()
