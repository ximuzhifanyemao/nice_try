# DiveDeep（kaoyan-tracker）项目优化建议报告

> 分析对象：`E:\code_app\code-1\code_app\kaoyan-tracker`
> 代码基线：`main` @ `3702a84`，version `1.14.6`（Android versionCode 84 / Tauri 1.14.6）
> 分析日期：2026-09-16
> 说明：本报告基于对仓库源码、配置、构建产物（`dist/`）、数据库脚本与云函数的实际读取，所有结论均附可复核证据。

---

## 一、体检结论（先看这里）

项目整体工程质量**高于同类个人项目平均水平**：路由级懒加载、大数据 JSON 动态导入、双端存储适配器、主题首帧防闪、明确的 CSP、75 条 RLS 策略、`0` 处 `as any`、`0` 处 `console.log`、`0` 处 TODO/FIXME——这些都不是随手能写出来的。

真正值得动的是四类问题，按"该不该马上做"排序：

| 优先级 | 问题域 | 条数 | 核心风险 |
|---|---|---|---|
| **P0** | 安全与成本 | 3 | AI 云函数可被任意刷量烧钱；仓库暴露真实环境配置；`.gitignore` 会误吞源码目录 |
| **P1** | 工程化与交付 | 3 | 无 CI、无测试、无监控；版本号三处手工同步且当前已不一致 |
| **P2** | 性能与体积 | 5 | 1.15 MB 词库/语料打进安装包；分页缺失存在静默截断；无离线能力 |
| **P3** | 代码结构 | 4 | 单文件 1300+ 行、单组件 31 个 `useState`；存储层双轨 |
| **P4** | 长期治理 | 6 | 多平台运维面过大；依赖版本无约束；仓库历史臃肿 |

**如果只做三件事**：① 给 SCF 云函数加鉴权与限流；② 把 `.env.production` 移出仓库、`assets/` 改为 `/assets/`；③ 把两个数据 JSON 移出 bundle。做完这三件，安全面基本封住，安装包体积直接掉一半。

---

## 二、项目基线（实测数据）

**技术栈**

| 层 | 选型 |
|---|---|
| 框架 | React 19.2 + TypeScript 6.0 |
| 构建 | Vite 8（rolldown）+ Tailwind CSS 4 |
| 路由 | react-router-dom 7（HashRouter） |
| 后端 | Supabase（Auth + Postgres + Storage） |
| Web 部署 | Vercel / 腾讯云 CloudBase（双通道） |
| 移动端 | Capacitor 8（Android） |
| 桌面端 | Tauri 2（置顶计时小挂件，460×52） |
| AI 代理 | 腾讯云 SCF 云函数 → 讯飞星火 |

**规模与产物**

| 指标 | 数值 |
|---|---|
| Git 跟踪文件数 | 276 |
| Git 对象库 | 51.37 MiB（pack）× 3 |
| 源码最大文件 | `Health.tsx` 1473 行、`StudyTimer.tsx` 1348 行 |
| 构建 JS 产物 | **2172 KB / 45 个 chunk** |
| 构建 CSS 产物 | 155 KB |
| 数据库 | 21 张表 / 75 条 Policy / 21 个索引 / 5 个 SECURITY DEFINER 函数 |

**产物体积 TOP 8**（`dist/assets`）

| 文件 | 体积 | 性质 |
|---|---|---|
| `englishDaily-*.js` | **754.5 KB** | 考研英语语料 JSON |
| `offlineDict-*.js` | **396.8 KB** | 离线词典 JSON |
| `react-*.js` | 223.9 KB | React + Router |
| `supabase-*.js` | 202.1 KB | Supabase SDK |
| `index-*.css` | 155.1 KB | 样式 |
| `ScanQr-*.js` | 139.0 KB | 扫码库 |
| `index-*.js` | 104.9 KB | 应用入口 |
| `Health-*.js` | 46.4 KB | 健康页 |

> **关键事实**：两个纯数据 chunk 合计 **1151.3 KB**，占全部 JS 产物的 **53%**。

---

## 三、P0 · 安全与成本风险

### P0-1 ⚠️ AI 云函数对外完全开放，存在被刷量烧钱风险

**证据**

- `scf/functions/ai-correct/index.js` 第 198 行：`'Access-Control-Allow-Origin': '*'`
- 全文检索 `authorization` / `token` / `origin` / `referer` / `apikey` / `event.headers`，**未发现任何对调用方的鉴权或限流逻辑**（唯一命中是第 135 行向讯飞发请求时带的 `Authorization`，属出站凭证）
- 该函数 URL 以明文写在 **已被 Git 跟踪** 的 `.env.production` 中：
  `VITE_AI_CORRECT_URL=https://1317742320-k6jrgdqkr6.ap-shanghai.tencentscf.com`
- 远端仓库为公开仓库：`origin https://github.com/ximuzhifanyemao/nice_try.git`

**影响**

任何人 clone 仓库即可拿到函数 URL，`curl` 一下就能调用 `/analyze`、`/lookup` 接口，消耗的是你的讯飞星火 token 额度。函数内没有任何请求来源、频率或身份校验，最坏情况是额度被跑空、账单异常。

**建议做法**

```js
// scf/functions/ai-correct/index.js —— 在 handler 入口加两道闸
const ALLOWED_ORIGINS = [
  'https://<你的正式域名>',
  'capacitor://localhost',      // Android WebView
  'http://localhost:5173',      // 本地开发
]

function guard(event) {
  const h = event.headers || {}
  const origin = h.origin || h.Origin || ''
  // ① 来源白名单，替代 Access-Control-Allow-Origin: '*'
  if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
    return jsonResp(403, { ok: false, error: 'forbidden' })
  }
  // ② 客户端令牌（构建期注入，不写死在仓库里）
  const token = h['x-app-token'] || ''
  if (!token || token !== process.env.APP_CLIENT_TOKEN) {
    return jsonResp(401, { ok: false, error: 'unauthorized' })
  }
  return null
}
```

同时建议在腾讯云侧叠加两道（配置即可，无需改代码）：

1. **函数 URL 开启鉴权 / 接入 API 网关**，用网关的密钥对 + 限流策略；
2. **设置单 IP QPS 上限与每日调用量告警**，并给讯飞账号设消费限额。

> 注：CORS 白名单只能挡浏览器，挡不住 `curl`。真正起作用的是 ② 令牌校验 + 网关限流，CORS 收窄是减少信息暴露的补充。

---

### P0-2 ⚠️ 真实环境配置已提交进公开仓库

**证据**

```
$ git ls-files | findstr /i "env"
.env.example
.env.production      ← 已被 Git 跟踪
src/vite-env.d.ts
```

`.env.example` 与 `.env.production` 中的值都是**真实的**，不是占位符：

```
VITE_SUPABASE_URL=https://ufhidclookjnepgzbbiv.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_70ZMKXSBnZbi4ztoWdBGJQ_MYalnNVR
VITE_AI_CORRECT_URL=https://1317742320-k6jrgdqkr6.ap-shanghai.tencentscf.com
```

`.env.ota`（未跟踪，`✓` 处置正确）内含 **`service_role` key** 明文：

```
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...  (role: service_role)
```

**影响**

- `anon` / `publishable` key 设计上就是公开的，由 RLS 兜底，**泄露本身不致命**；但 `project ref` 与整条部署配置一起暴露，等于给攻击者提供了精准的目标信息（可探测接口、试探 RLS 缺口、消耗项目配额）。
- `.env.ota` 里的 `service_role` key **可绕过全部 RLS**，一旦泄露等于整个数据库的读写权限——虽然当前没进 Git，但它以明文长期驻留在工作目录，且会被 `scripts/upload-ota.mjs` 读取。

**建议做法**

1. `.env.example` 全部改回占位符（这是"示例"的本分）：
   ```
   VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-or-publishable-key>
   VITE_AI_CORRECT_URL=
   ```
2. 把 `.env.production` 移出版本控制，真实值只放在 Vercel / CloudBase 控制台的环境变量里：
   ```bash
   git rm --cached .env.production
   echo ".env.production" >> .gitignore
   ```
   （生产构建走 `build:deploy`，平台注入的环境变量优先级足够，无需文件）
3. `.env.ota` 的 `service_role` key 改为从 CI Secret 或本机环境变量读取，不落盘明文：
   ```js
   // scripts/upload-ota.mjs
   const url = process.env.SUPABASE_URL
   const key = process.env.SUPABASE_SERVICE_KEY   // CI 注入 / 本机 set，不再读 .env.ota
   ```
4. 若上述 key 曾推送过远端，**建议在 Supabase 控制台轮换一次**（anon key 轮换成本低，service_role key 务必轮换）。

---

### P0-3 ⚠️ `.gitignore` 第 35 行会误吞 `src/assets/`（已验证）

**证据**

```
$ git check-ignore -v src/assets
.gitignore:35:assets/   src/assets
```

`.gitignore` 写的是 `assets/`（无前导斜杠），git 会把它理解为"**任意层级**下名为 `assets` 的目录"，因此 `src/assets/` 同样被忽略。当前该目录为空所以没造成损失，但这是颗地雷：以后往里放任何图标、字体、图片，都不会被提交，而且 `git status` 不会给出任何提示。

**建议做法**

```diff
- assets/
+ /assets/
```

`/assets/` 只匹配仓库根目录的 `assets/`（那是 `@capacitor/assets` 生成目录），`src/assets/` 恢复正常跟踪。同理建议顺手检查 `icons/` 与 `!public/icons/` 这一对——当前逻辑是正确的（父目录 `public/` 未被排除，因此可以重新包含），但语义脆弱，建议写成 `/icons/` + `!/public/icons/` 更明确。

---

## 四、P1 · 工程化与交付缺失

### P1-1 没有 CI，所有质量门禁靠人工

**证据**：根目录不存在 `.github`；`package.json` 无 `test` 脚本；无任何 CI 配置文件。

**影响**：`tsc -b` 的严格检查（`strict` / `noUnusedLocals` / `noUnusedParameters` 全开，这很好）目前只在本地 `npm run build` 时生效。一旦有人在 CloudBase 上直接构建、或本地跳过构建直接推 `dist`，类型错误会直达生产。

**建议做法**：加一个最小可用的流水线，20 行搞定，先只做"能编译 + 能过 lint"：

```yaml
# .github/workflows/ci.yml
name: ci
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx tsc -b          # 类型门禁
      - run: npm run lint        # oxlint
      - run: npm run build       # 构建门禁
```

---

### P1-2 零测试覆盖，且 lint 规则形同虚设

**证据**

- `src/` 下 `*.test.*` / `*.spec.*` 文件数：**0**
- `devDependencies` 中无 vitest / jest / testing-library
- `.oxlintrc.json` 只启用了 **2 条** 规则：
  ```json
  { "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }] }
  ```
- 无 Prettier / 无格式化脚本 / 无 husky 提交钩子

**影响**：这个项目里有大量**纯逻辑、强回归价值**的代码——`src/lib/format.ts`、`summary.ts`、`commitments.ts`、`achievements.ts`、`dailyLogs.ts`、`subjects.ts`（816 行）、`bleTimer.ts`。这些一旦改错，是"数字对不上""打卡记录丢了一天"这类用户直接可感、但很难靠肉眼发现的问题。

**建议做法**

1. 装 vitest（与 Vite 8 同源，配置零成本），**只测纯函数层**，不追求组件测试：
   ```bash
   npm i -D vitest
   ```
   ```json
   "scripts": { "test": "vitest run", "test:watch": "vitest" }
   ```
   优先级：周目标结算（`commitments.ts`）→ 时长聚合与格式化（`format.ts`/`summary.ts`）→ 成就判定（`achievements.ts`）→ 跨天/跨周边界。
2. oxlint 打开一批高价值规则（成本低、误报少）：
   ```json
   "rules": {
     "react/rules-of-hooks": "error",
     "react/only-export-components": ["warn", { "allowConstantExport": true }],
     "no-console": ["warn", { "allow": ["error", "warn"] }],
     "no-debugger": "error",
     "eqeqeq": "error",
     "no-var": "error",
     "typescript/no-explicit-any": "warn"
   }
   ```
3. 加 `format` 脚本 + Prettier（或直接用 oxlint 的格式化能力），避免 diff 里混入无意义的缩进变更。

---

### P1-3 版本号三处手工同步，当前已经不一致

**证据**

| 位置 | 当前值 | 状态 |
|---|---|---|
| `package.json` | `1.14.6` | 已提交 |
| `android/app/build.gradle` | `versionCode 84` / `versionName "1.14.6"` | **已修改未提交**（`git status` 显示 ` M`） |
| `src-tauri/tauri.conf.json` | `1.14.6` | 已提交 |

`git log` 里能看到专门为同步版本号开的提交（`[release]: 同步 v1.14.5 打包版本号（Android versionCode 83 / Desktop tauri 1.14.5）`）——说明这套手工同步已经在反复消耗精力，而且现在 `build.gradle` 的改动还悬在工作区里。

**建议做法**：以 `package.json` 为唯一数据源，写一个同步脚本，挂到 `release:*` 之前：

```js
// scripts/sync-version.mjs —— 以 package.json 为准，回写 Android / Tauri
import { readFileSync, writeFileSync } from 'node:fs'
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))
const [maj, min, pat] = pkg.version.split('.').map(Number)
const versionCode = maj * 10000 + min * 100 + pat   // 1.14.6 → 11406

// Android
const gradlePath = 'android/app/build.gradle'
let g = readFileSync(gradlePath, 'utf8')
g = g.replace(/versionCode \d+/, `versionCode ${versionCode}`)
g = g.replace(/versionName "[^"]+"/, `versionName "${pkg.version}"`)
writeFileSync(gradlePath, g)

// Tauri
const tauriPath = 'src-tauri/tauri.conf.json'
const conf = JSON.parse(readFileSync(tauriPath, 'utf8'))
conf.version = pkg.version
writeFileSync(tauriPath, JSON.stringify(conf, null, 2) + '\n')
```

然后在 `package.json` 里把 `release:android` 改为 `node scripts/sync-version.mjs && node scripts/release-android.mjs`。

> 附带收益：`vite.config.ts` 里用 `git log` 解析 changelog 的做法很巧，但依赖 `.git` 目录存在且格式稳定。CloudBase 构建环境未必有完整 `.git`，代码里已经写了 `.git/logs/HEAD` 兜底——**建议把这条兜底路径也纳入 CI 验证**，否则线上版本页会静默显示空 changelog。

---

## 五、P2 · 性能与体积

### P2-1 两个数据 JSON 撑起了一半的 JS 体积

**证据**

| 文件 | 体积 | 占比 |
|---|---|---|
| `englishDaily-*.js` | 754.5 KB | 34.7% |
| `offlineDict-*.js` | 396.8 KB | 18.3% |
| **合计** | **1151.3 KB** | **53.0%**（分母 2172 KB） |

**现状是好的**：`src/data/englishDaily.ts` / `offlineDict.ts` 已经用动态 `import()` + 模块级缓存 + 并发去重，做得很规范：

```ts
// 现状（src/data/offlineDict.ts）—— 已经正确
let cache = null, pending = null
export function loadOfflineDict() {
  if (cache) return Promise.resolve(cache)
  if (!pending) pending = import('./offlineDict.json').then(m => (cache = m.default))
  return pending
}
```

**问题在于**：动态 import 只解决了 **Web 端的按需下载**，对 **Capacitor Android** 无效——`dist/` 全量打进 APK，无论用户是否用过英语打卡，这 1.15 MB 都随安装包下载。词典与语料属于"低频使用 + 强静态"数据，完全没必要进安装包。

**建议做法**：把数据体从 bundle 移到静态资源 / 对象存储，运行时按需拉取 + 本地持久缓存：

```ts
// src/data/offlineDict.ts —— 改为运行时拉取 + 本地缓存
const DICT_VERSION = 3
const CDN = 'https://<你的对象存储或站点>/data'

export async function loadOfflineDict(): Promise<Record<string, string>> {
  const key = `offlineDict:v${DICT_VERSION}`
  const hit = await idbGet(key)                 // 优先读本地缓存
  if (hit) return hit

  const res = await fetch(`${CDN}/offlineDict.v${DICT_VERSION}.json`)
  if (!res.ok) throw new Error('dict fetch failed')
  const data = await res.json()
  await idbPut(key, data)                       // 写缓存，下次离线可用
  return data
}
```

**收益**：安装包 / 首包 **-1.15 MB（-53% 的 JS 体积）**。
**代价**：首次使用需联网下载（约 1.1 MB）。若不接受这个代价，折中方案是"安装包内置精简高频词表（约 100 KB），全量词典后台静默下载"。
**配套**：`scripts/gen-english-daily.cjs` / `build-offline-dict.cjs` 增加一步"输出到 `public/data/` 并按内容 hash 命名"，避免缓存击穿。

---

### P2-2 分页缺失，存在静默截断风险

**证据**（`src/` 全量检索）

| 模式 | 出现次数 |
|---|---|
| `select('*')` | **27** |
| `.limit(` | 12 |
| `.range(` | **2** |
| `.from(` | 104 |

**影响**：Supabase 的 PostgREST 有**服务端默认返回行数上限（1000 行）**，超出部分不会报错，直接静默丢弃。这是一个"用了半年才发现历史记录少了一截"的典型故障。对 `daily_logs` 这类随使用时长线性增长的表，一个坚持打卡 2 年以上的用户很容易触及。同时 27 处 `select('*')` 把 `subjects` 这种 JSONB 大字段也一并拉回来，白白放大传输量。

**建议做法**：在 `src/lib/supabase.ts` 旁边加一个分页工具，统一替换：

```ts
// src/lib/query.ts
const PAGE = 1000

export async function selectAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1)
    if (error) throw error
    const rows = data ?? []
    out.push(...rows)
    if (rows.length < PAGE) break          // 不足一页即结束
  }
  return out
}
```

调用侧同时把 `select('*')` 换成显式列清单：

```ts
// 改前
supabase.from('daily_logs').select('*').eq('user_id', uid)
// 改后
selectAll((from, to) =>
  supabase.from('daily_logs')
    .select('id, date, subjects, summary, updated_at')   // 只取需要的列
    .eq('user_id', uid).is('deleted_at', null)
    .order('date', { ascending: false })
    .range(from, to),
)
```

优先改造对象：`src/lib/dailyLogs.ts`（408 行，全量拉取日志）、`src/pages/Summary.tsx`、`src/pages/MyRecords.tsx`、`src/components/Calendar.tsx`。

---

### P2-3 CSS 产物 155 KB 偏大

**证据**：`dist/assets/index-*.css` = **155.1 KB**，而 `src/index.css` 源文件仅 11 KB。Tailwind 4 按需生成工具类，正常项目产出应在 30–60 KB 区间。

**排查方向**

1. 是否残留大量手写 CSS（`src/index.css` 之外的 `scan-overlay.css` 等）；
2. 是否有大量 arbitrary value（如 `text-[#3b82f6]`、`w-[437px]`）绕过了设计令牌，导致每处都生成独立规则；
3. 是否有被 `@source` 扫进来的无关目录（Tailwind 4 的 `@source` 若包含过宽，会把脚本/文档里的类名一并生成）。

**建议做法**：把散落的色值收敛到 `@theme` 令牌，用语义类名替代 arbitrary value；用 `npx tailwindcss --help` 对应的分析能力或临时在构建后比对规则数定位来源。155 KB 的 CSS 在移动端首屏是实打实的解析成本。

---

### P2-4 主动放弃了 Service Worker，离线能力为零

**证据**（`src/main.tsx`）

```ts
// 清理 PWA 时代残留的 Service Worker 与缓存，避免旧版页面被缓存拦截导致更新后仍显示旧内容
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))
}
if ('caches' in window) {
  caches.keys().then(keys => keys.forEach(k => caches.delete(k)))
}
```

**理解这个决定**：被旧缓存坑过（更新后仍显示旧页面），所以选择一刀切关掉。但代价是：一个**学习打卡工具**，在地铁、图书馆弱网、飞行模式下，页面直接白屏——而这恰恰是目标用户的高频场景。项目里已经有 `manifest.webmanifest`（可安装到主屏），却没有离线能力，体验是割裂的。

**建议做法**：用 `vite-plugin-pwa` 重新引入，但**针对性地解决当初的痛点**：

```ts
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

VitePWA({
  registerType: 'autoUpdate',       // 新版本就绪即接管，不再"卡在旧版"
  workbox: {
    skipWaiting: true,              // 新 SW 立即激活
    clientsClaim: true,             // 立即接管已打开的页面
    cleanupOutdatedCaches: true,    // 自动清理旧版本缓存
    navigateFallback: 'index.html',
    globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
    runtimeCaching: [{
      // 数据 JSON：网络优先，失败回退缓存（保证离线可查词、可看历史）
      urlPattern: /\/data\/.*\.json$/,
      handler: 'NetworkFirst',
      options: { cacheName: 'data-v1', expiration: { maxEntries: 20 } },
    }],
  },
})
```

关键点：`autoUpdate + skipWaiting + clientsClaim + cleanupOutdatedCaches` 这套组合正是为了消除"用户看到的还是旧版"的问题；再把版本化缓存名 + activate 时清理旧缓存补齐，就同时拿到了"更新及时"和"离线可用"。**建议先在小范围（本地 preview）验证更新链路，再上生产**。

---

### P2-5 Supabase SDK 202 KB 可以瘦身

**证据**：`supabase-*.js` = 202.1 KB。

**建议做法**：当前只用到 Auth + Postgres + Storage（`apkDownloadUrl`）。可评估改用更细粒度的入口或把 Storage 的 `getPublicUrl` 换成字符串拼接（`${SUPABASE_URL}/storage/v1/object/public/ota-bundles/DiveDeep.apk`），从而不必把 Storage 模块打进主包。收益量级中等（几十 KB），优先级低于 P2-1/P2-2。

---

## 六、P3 · 代码结构

### P3-1 巨型单文件与"状态爆炸"

**实测数据**

| 文件 | 行数 | `useState` | `useEffect` |
|---|---|---|---|
| `src/pages/Health.tsx` | **1473** | 20 | 2 |
| `src/components/StudyTimer.tsx` | **1348** | **31** | 6 |
| `src/lib/subjects.ts` | 816 | — | — |
| `src/pages/EnglishCheckin.tsx` | 779 | 14 | 3 |
| `src/components/Calendar.tsx` | 626 | 10 | 2 |
| `src/pages/Home.tsx` | 507 | 4 | 2 |
| `src/pages/ScanQr.tsx` | 503 | 5 | 2 |
| `src/lib/dailyLogs.ts` | 408 | — | — |
| `src/components/LogForm.tsx` | 343 | 5 | 0 |

`StudyTimer.tsx` 一个组件里 **31 个 `useState`** 是最突出的信号——这通常意味着它同时承担了"计时状态机 + 前台服务同步 + BLE 硬件连接 + 科目选择 + UI 呈现"至少五种职责。

**建议做法**

1. **拆 hook**：把 `StudyTimer.tsx` 按职责切成
   - `useStudyTimer()` — 计时状态机（开始/暂停/恢复/结算）
   - `useForegroundTimer()` — `src/plugins/timer-foreground` 与 `TimerForegroundService` 的桥接
   - `useBleTimer()` — 封装已有的 `src/lib/bleTimer.ts`（338 行，本身已是独立模块，只是没被抽成 hook）
   - `useSubjectPicker()` — 科目选择与校验
2. **合并状态**：31 个 `useState` 收敛为 `useReducer`。状态转移集中在一处，天然可单测——这与 P1-2 的测试建议形成正循环。
   ```ts
   type TimerState = { phase: 'idle'|'running'|'paused'; startedAt: number|null; accumulated: number; subjectId: string|null; /* ... */ }
   type TimerAction = { type: 'start'; subjectId: string } | { type: 'pause' } | { type: 'resume' } | { type: 'settle' }
   ```
3. **定个可执行的门槛**：单文件 ≤ 400 行、单组件 `useState` ≤ 8。`Health.tsx`（1473 行）按 Tab / 数据域拆成 3–4 个子组件目录。
4. `subjects.ts` 816 行里若混着"数据常量 + 业务逻辑 + 类型定义"，按 `subjects.constants.ts` / `subjects.logic.ts` / `subjects.types.ts` 分家。

---

### P3-2 渲染优化覆盖不均：46 处 `useMemo`，仅 1 处 `React.memo`

**证据**：`src/` 全量检索 `useMemo` 命中 46 次，`memo(` 命中 **1** 次。

**影响**：`Calendar.tsx`（626 行，10 个 `useState`）要渲染整个月的日期格；`LogCard` 在记录列表里会渲染几十上百次。父组件任一 state 变化都会让这些子项全量重渲染。计算做了 memo，**组件本身没做**。

**建议做法**：给"数量多 + props 稳定"的列表项/网格项加 `memo`，而不是无差别全包：

```tsx
// src/components/LogCard.tsx
export default memo(LogCard)

// src/components/Calendar.tsx 内的日期格
const DayCell = memo(function DayCell({ date, hours, isToday, onSelect }: DayCellProps) { /* ... */ })
```

> 注意：`memo` 只有配合稳定的回调（`useCallback`）和引用（`useMemo`）才有效，否则等于白加。建议先给日历格和日志卡片做，用 React DevTools Profiler 验证收益，不要全面铺开。

---

### P3-3 存储层双轨：为 Auth 做了原生适配器，业务数据却走裸 `localStorage`

**证据**

- `src/lib/supabase.ts` 里专门为 Capacitor 写了 `nativeStorageAdapter`（走 `@capacitor/preferences` → Android SharedPreferences），注释写得很清楚：
  > *"比 WebView 的 localStorage 更可靠，App 升级或系统清理缓存后不会丢失登录态。"*
- 但 `src/` 中 **`localStorage` 直接出现 69 次**，业务数据（主题、科目、待办、设置等）仍走 WebView 的 `localStorage`。

**影响**：Android 系统在存储紧张时会清理 WebView 的 `localStorage`；`localStorage` 在 WebView 数据清除、应用重装时也会丢失。结果是"**登录态保住了，但我的科目配置/待办/主题全没了**"——比一起丢更难排查。

**建议做法**：建一层统一存储抽象，把 69 处调用收敛进来。

```ts
// src/lib/storage.ts
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const isNative = Capacitor.isNativePlatform()

export const storage = {
  async get(key: string): Promise<string | null> {
    if (isNative) return (await Preferences.get({ key })).value
    return localStorage.getItem(key)
  },
  async set(key: string, value: string): Promise<void> {
    if (isNative) return void (await Preferences.set({ key, value }))
    localStorage.setItem(key, value)
  },
  async remove(key: string): Promise<void> {
    if (isNative) return void (await Preferences.remove({ key }))
    localStorage.removeItem(key)
  },
}
```

`index.html` 里那段"首帧前读主题防闪烁"的内联脚本无法异步，可保留 `localStorage` 读取作为快速路径（Web 端本来就是 `localStorage`），但**写入**必须走 `storage.set`，并在 App 启动时把原生值同步回 `localStorage` 作为首帧缓存。

---

### P3-4 类型严格度还有一档可以升

**证据**（`tsconfig.app.json`）：`strict: true`、`noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch`、`erasableSyntaxOnly` 都已开启——配置质量不错，且代码里 **0 处 `as any`**，说明基础很干净。

**建议做法**：再加一条对"数组/对象下标访问"最有效的规则：

```jsonc
{
  "noUncheckedIndexedAccess": true   // arr[0] 的类型变为 T | undefined，逼你处理越界
}
```

这条规则对 `subjects`、`englishDaily`、`calendar` 这类大量按下标取值的代码会暴露出真实缺陷。**建议单独开一个 PR 引入**，因为它会产生一批编译错误需要逐个处理，混在其他改动里会污染 diff。

---

## 七、P4 · 长期与治理

| # | 问题 | 证据 | 建议 |
|---|---|---|---|
| 1 | **部署面过大** | 同时维护 Vercel + CloudBase + Capacitor(Android) + Tauri(桌面) + SCF(云函数) + Supabase，5 个平台 4 套构建流程 | 评估收敛到 1 个 Web 托管 + Capacitor 一套；双 Web 通道（Vercel/CloudBase）若只是容灾，考虑主备而非并行维护 |
| 2 | **依赖版本无约束** | React 19 / Vite 8 / Tailwind 4 / TS 6 均为很新的大版本；无 `engines`、无 `.nvmrc`、无 Dependabot | 加 `"engines": { "node": ">=22" }` + `.nvmrc`；开启 Dependabot（周更、分组 PR）；Vite 8 底层是 rolldown，属新生态，建议在 CI 里固定 Node 版本 |
| 3 | **脚本冗余** | `"build": "tsc -b && vite build"` 与 `"build:deploy"` 完全相同 | 合并为一个，或让 `build:deploy` 只多一步环境校验 |
| 4 | **仓库根目录混杂** | `app-icon-new.jpg`(418 KB)、`软著申请资料/`、`logo-exports/`、`old-icon-redesign/`、`vibe_images/`、`DEPLOYMENT.md`(20 KB) | 归入 `design/`、`docs/`；软著材料单独仓库或 `docs/copyright/`（当前还是未跟踪状态） |
| 5 | **Git 历史臃肿** | `size-pack: 51.37 MiB`（276 个跟踪文件） | 明显偏大，疑似历史中提交过二进制大文件。可先 `git gc --aggressive --prune=now` 尝试；仍大则用 `git filter-repo` 清理历史中的大文件（**注意会改写历史，需与协作者协调**） |
| 6 | **Schema 双轨** | `supabase-schema.sql`（49 KB 全量合并）+ `supabase/migrations/`（仅 2 个迁移：`001_ota_setup.sql`、`002_removed_subjects.sql`） | 两条路径并行必然漂移。建议**以 migrations 为唯一事实源**，`supabase-schema.sql` 由迁移自动生成（`supabase db dump`），并在 README 注明"该文件为生成物，请勿手改" |

---

## 八、落地路线图

### 第一批：本周可完成（安全 + 低成本高收益）

- [ ] **P0-1** 给 SCF 加来源白名单 + 客户端令牌校验；腾讯云侧开启限流与用量告警
- [ ] **P0-2** `.env.example` 改占位符；`git rm --cached .env.production` 并加入 `.gitignore`；`.env.ota` 的 key 改走环境变量；**轮换 service_role key**
- [ ] **P0-3** `.gitignore` 第 35 行 `assets/` → `/assets/`（一行改动，堵住源码丢失地雷）
- [ ] **P1-3** 加 `scripts/sync-version.mjs`，把当前悬空的 `build.gradle` 版本改动纳入提交
- [ ] **P4-3** 合并重复的 `build` / `build:deploy`

### 第二批：两周内（体积 + 稳定性）

- [ ] **P2-1** 两个数据 JSON 移出 bundle，改运行时拉取 + IndexedDB 缓存（**收益最大：-1.15 MB**）
- [ ] **P2-2** 引入 `selectAll` 分页工具，替换 `dailyLogs` / `Summary` / `MyRecords` / `Calendar` 的全量查询；`select('*')` 改显式列
- [ ] **P1-1** 上 GitHub Actions：`tsc -b` + `lint` + `build` 三道门禁
- [ ] **P3-3** 建 `src/lib/storage.ts`，业务数据逐步迁移到原生 Preferences

### 第三批：一个月内（结构与体验）

- [ ] **P1-2** 接入 vitest，覆盖 `commitments` / `format` / `summary` / `achievements` 四个纯逻辑模块；oxlint 规则扩充
- [ ] **P3-1** 拆 `StudyTimer.tsx`（31 个 state → `useReducer` + 4 个自定义 hook）与 `Health.tsx`（1473 行 → 3–4 个子模块）
- [ ] **P3-2** 给日历格、日志卡片加 `memo`，用 Profiler 验证收益
- [ ] **P2-4** 用 `vite-plugin-pwa` 重建离线能力（`autoUpdate` + `skipWaiting` + `clientsClaim`），先在 preview 验证更新链路
- [ ] **P2-3** 定位并削减 155 KB CSS

### 第四批：持续治理

- [ ] **P3-4** 开启 `noUncheckedIndexedAccess`（单独 PR）
- [ ] **P4** 部署面收敛、`engines`/`.nvmrc`/Dependabot、Schema 单一事实源、Git 历史瘦身、目录归位

---

## 九、已经做得好的地方（建议保持）

这些不是客套，是确实高于平均水平的工程实践，重构时不要顺手破坏：

| 实践 | 位置 | 说明 |
|---|---|---|
| 路由级代码分割 | `src/App.tsx` | 21 个页面全部 `lazy()`，`Suspense` 兜底 |
| 手动 chunk 切分 | `vite.config.ts` | react / supabase / date-fns 独立 vendor chunk，利于长期缓存 |
| 大数据动态导入 + 并发去重 | `src/data/englishDaily.ts`、`offlineDict.ts` | 模块级 `cache` + `pending`，失败可重试 |
| 原生存储适配器 | `src/lib/supabase.ts` | 针对 Capacitor 的 session 持久化，注释说明了动机 |
| 首帧主题防闪 | `index.html` 内联脚本 + `src/main.tsx` | 双保险，避免暗色模式闪白 |
| 带超时的 fetch | `src/lib/supabase.ts` | 10s 超时，避免移动端请求挂死 |
| 显式 CSP | `src-tauri/tauri.conf.json` | 按需放行 supabase / cloudbase / github，未用通配符兜底 |
| 未配置环境变量的降级 | `src/lib/supabase.ts` | 用占位 URL 避免白屏，错误交 UI 层展示 |
| 边界分析的注释质量 | `src/App.tsx` 的 `ScaleToFit` | 把"缩放正反馈棘轮"的推导写进了注释，这类注释比代码本身更值钱 |
| 数据库安全设计 | `supabase-schema.sql` | 21 表 / 75 条 Policy / 21 个索引 / 5 个 SECURITY DEFINER 函数，幂等脚本可重复执行 |
| 代码卫生 | `src/` 全量 | `0` 处 `as any`、`0` 处 `console.log`、`0` 处 TODO/FIXME |

> 顺带一提：`src-tauri/tauri.conf.json` 的 CSP 里 `connect-src` 未包含 `*.tencentscf.com`。当前 Tauri 只渲染计时挂件（`main.tsx` 中 `isTauri()` 分支），不调 AI 接口，所以暂时无影响；但**如果桌面端后续要开放"全部功能"模式并调用 AI 批改，这条 CSP 必须补上**，否则请求会被静默拦截。

---

## 十、复核方式

本报告的关键结论都可用以下命令复现：

```bash
# P0-3：确认 src/assets 被误忽略
git check-ignore -v src/assets

# P0-2：确认 .env.production 被跟踪
git ls-files | findstr /i env

# P1-2：确认零测试
dir /s /b src\*.test.* src\*.spec.*

# P2-1：查看产物体积分布
node -e "var fs=require('fs'),p=require('path');var d='dist/assets';fs.readdirSync(d).map(function(f){return [f,fs.statSync(p.join(d,f)).size]}).sort(function(a,b){return b[1]-a[1]}).slice(0,10).forEach(function(x){console.log((x[1]/1024).toFixed(1)+' KB  '+x[0])})"

# P2-2：统计查询模式
findstr /s /c:"select('*')" src\*.ts src\*.tsx | find /c /v ""
findstr /s /c:".range(" src\*.ts src\*.tsx | find /c /v ""

# P3-1：定位巨型文件
node -e "var fs=require('fs');['src/components/StudyTimer.tsx','src/pages/Health.tsx'].forEach(function(f){var t=fs.readFileSync(f,'utf8');console.log(f+' lines='+t.split('\n').length+' useState='+(t.split('useState').length-1))})"

# P3-3：统计裸 localStorage 用量
findstr /s /c:"localStorage" src\*.ts src\*.tsx | find /c /v ""
```

---

*报告完。所有体积数据取自仓库内 `dist/assets` 的实测文件大小（未压缩），未做 gzip/brotli 估算。*
