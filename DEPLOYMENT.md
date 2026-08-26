# DiveDeep 应用 - 国内免费部署指南

> 本文档详细说明如何将本项目免费部署到国内托管平台。

## 项目分析

| 项目 | 说明 |
|------|------|
| 类型 | React 19 单页应用 (SPA) |
| 构建工具 | Vite 8 |
| 后端服务 | Supabase（外部 BaaS，已独立部署） |
| 构建产物 | `dist/` 目录下的静态文件 |
| 路由方式 | BrowserRouter（需要服务器端 URL 重写到 index.html） |
| 环境变量 | `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`（构建时注入） |

**关键点**：本项目是纯前端静态应用，后端（Supabase）已独立部署且不受前端托管平台影响。因此部署只需找一个静态文件托管服务即可。

---

## 免费平台对比

| 平台 | 免费额度 | 国内速度 | 是否需备案 | SPA路由支持 | 推荐指数 |
|------|----------|----------|------------|------------|----------|
| 腾讯云 CloudBase | 1GB存储 + 5GB流量/月 | 快 | 默认域名不需要，自定义域名需要 | 需手动配置 | ⭐⭐⭐⭐⭐ |
| Cloudflare Pages | 无限流量 | 一般（有国内节点但有限） | 不需要 | 原生支持 | ⭐⭐⭐⭐ |
| Vercel（当前） | 100GB流量/月 | 一般偏慢 | 不需要 | 原生支持 | ⭐⭐⭐⭐ |
| GitHub Pages | 100GB流量/月 | 慢 | 不需要 | 需额外配置 | ⭐⭐⭐ |
| Gitee Pages | 有限制 | 快 | 需实名+备案 | 需额外配置 | ⭐⭐ |

**结论**：首选 **腾讯云 CloudBase**（国内速度最快、有免费额度），备选 **Cloudflare Pages**（完全免费无限制）。

---

## 方案一：腾讯云 CloudBase 静态网站托管（推荐）

### 免费额度说明

| 资源 | 免费额度 | 说明 |
|------|----------|------|
| 存储容量 | 1 GB | 静态文件存储，本项目约 1-5MB，足够用 |
| CDN 流量 | 5 GB/月 | 对于个人/小规模使用足够 |
| 请求数 | 100万次/月 | 超出后按量付费，个人使用基本不会超 |
| 构建次数 | 1000次/月 | 足够频繁部署 |

> 注意：超出免费额度后会按量计费，但个人小项目几乎不可能超。如果担心，可以在控制台设置费用告警。

### CloudBase 三种部署方式对比

| 方式 | 是否需 CLI | 自动构建 | 更新流程 | 适合场景 |
|------|-----------|----------|----------|----------|
| **A. Git 仓库部署**（最推荐） | 不需要 | 自动 | `git push` 即自动部署 | 项目已在 GitHub/Gitee |
| **B. 控制台上传文件夹** | 不需要 | 手动构建 | 本地 build → 上传 dist 文件夹 | 不想用 Git |
| C. CLI 命令部署 | 需要 | 手动构建 | `tcb hosting deploy` | CI/CD 自动化 |

> 下面详细介绍 **方式 A** 和 **方式 B**（都不需要安装 CLI）。

---

### 第一至三步：账号准备（三种方式通用）

1. 访问 https://cloud.tencent.com 注册账号
2. 完成实名认证（必须，否则无法使用任何服务）
   - 个人认证：上传身份证，几分钟内通过
3. 访问 https://console.cloud.tencent.com/tcb 开通云开发 CloudBase
4. 创建环境：环境名称填 `kaoyan-tracker`，套餐选「按量计费」，地域选「上海」或「广州」
5. 开通静态网站托管：进入环境 → 左侧菜单「静态网站托管」→ 点击「开通」
6. 开通后会获得一个默认域名，格式类似：
   ```
   https://<env-id>.tcloudbaseapp.com
   ```
   **此默认域名无需 ICP 备案即可直接访问。**

---

### 方式 A：Git 仓库自动部署（最推荐，无需 CLI）

> 原理：连接 GitHub/Gitee 仓库，每次 `git push` 后 CloudBase 自动拉取代码、安装依赖、构建、部署。和 Cloudflare Pages / Vercel 体验一样。

#### A-1. 先创建 SPA 路由配置文件（重要）

在项目 `public/` 目录下创建 `_redirects` 文件，内容为：

```
/*    /index.html   200
```

这样构建时会自动把 `_redirects` 复制到 `dist/` 目录，CloudBase 会读取它处理 SPA 路由。

#### A-2. 配置环境变量到项目

由于 Git 部署是云端构建，本地 `.env` 不会被上传。需要把 Supabase 配置写入项目根目录的 `.env.production`：

```bash
# 在项目根目录创建 .env.production（会被 git 上传，云端构建时读取）
# ⚠️ 注意：.env.production 包含密钥，推送到公开仓库前请确认能接受
```

`.env.production` 内容：

```
VITE_SUPABASE_URL=https://你的项目ID.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon-key
```

> 如果不想把密钥提交到 Git，可以用 **方式 B** 或在 CloudBase 构建配置中设置环境变量（见 A-5 步说明）。

#### A-3. 推送代码到 Git 仓库

```bash
# GitHub
git remote add origin https://github.com/你的用户名/kaoyan-tracker.git
git add .
git commit -m "准备 CloudBase 部署"
git push -u origin main
```

也可以用 Gitee（国内速度更快）。

#### A-4. 在 CloudBase 连接 Git 仓库

1. 进入 [云开发控制台 - 静态网站托管](https://tcb.cloud.tencent.com/dev#/static-hosting)
2. 选择「应用部署」→「Git 仓库部署」
3. 选择 Git 平台（GitHub / GitLab / Gitee / 工蜂）
4. 授权并选择你的 `kaoyan-tracker` 仓库
5. 配置构建参数：
   - 项目框架：`Vite`
   - Node.js 版本：`20` 或 `22`
   - 安装命令：`npm install`（自动填充）
   - 构建命令：`npm run build`（自动填充）
   - 构建产物目录：`dist`（自动填充）
6. 点击「部署」

#### A-5. 设置环境变量（如果 A-2 没创建 .env.production）

在部署配置页面找到「环境变量」设置，添加：

| 变量名 | 值 |
|--------|-----|
| `VITE_SUPABASE_URL` | `https://你的项目ID.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `你的anon-key` |

#### A-6. 以后更新代码

```bash
# 只要 git push，CloudBase 就会自动重新构建部署
git add .
git commit -m "更新内容"
git push
```

无需本地 build，无需安装任何工具，全自动。

---

### 方式 B：控制台上传文件夹（无需 CLI、无需 Git）

> 原理：本地构建后，直接在网页控制台把 `dist/` 文件夹拖进去上传。最简单直接。

#### B-1. 本地构建项目

```bash
cd e:\code_app\code-1\code_app\kaoyan-tracker

# 创建 .env（如果还没有）
cp .env.example .env
# 编辑 .env 填入 Supabase 配置：
#   VITE_SUPABASE_URL=https://你的项目ID.supabase.co
#   VITE_SUPABASE_ANON_KEY=你的anon-key

npm install
npm run build
```

构建成功后会在 `dist/` 目录生成静态文件。

#### B-2. 创建 `_redirects` 文件（处理 SPA 路由）

在 `public/` 目录下创建 `_redirects` 文件，内容为：

```
/*    /index.html   200
```

然后重新执行 `npm run build`，确保 `dist/_redirects` 文件存在。

#### B-3. 在控制台上传

1. 进入 [云开发控制台 - 静态网站托管](https://tcb.cloud.tencent.com/dev#/static-hosting)
2. 选择「文件管理」模式
3. 点击「上传文件夹」
4. 选择本地的 `dist/` 文件夹
5. 等待上传完成

#### B-4. 以后更新代码

每次代码修改后：
1. 本地执行 `npm run build`
2. 在控制台删除旧文件（全选删除）
3. 重新上传 `dist/` 文件夹

> 这个方式更新稍麻烦（需手动上传），但完全不用装 CLI。

---

### 验证部署（两种方式通用）

1. 打开默认域名 `https://<env-id>.tcloudbaseapp.com`
2. 测试首页加载是否正常
3. 测试直接访问 `/login` 等子路径是否正常（验证 SPA 路由）
4. 测试登录功能是否正常（验证 Supabase 连接）

---

## 方案二：Cloudflare Pages（完全免费备选）

Cloudflare Pages 提供无限流量、无限构建，且完全免费。国内访问速度尚可。

### 第一步：准备 GitHub 仓库

```bash
# 确保项目已推送到 GitHub
git remote add origin https://github.com/你的用户名/kaoyan-tracker.git
git push -u origin main
```

### 第二步：在 Cloudflare 创建 Pages 项目

1. 访问 https://dash.cloudflare.com 注册/登录
2. 左侧菜单选择「Workers & Pages」→「创建应用程序」→「Pages」
3. 选择「连接到 Git」
4. 授权并选择你的 GitHub 仓库
5. 配置构建设置：
   - 框架预设：`Vite`
   - 构建命令：`npm run build`
   - 构建输出目录：`dist`
   - 环境变量：
     - `VITE_SUPABASE_URL` = `https://你的项目ID.supabase.co`
     - `VITE_SUPABASE_ANON_KEY` = `你的anon-key`
6. 点击「保存并部署」

### 第三步：配置 SPA 路由

Cloudflare Pages 原生支持 SPA 回退。在项目根目录创建 `public/_redirects` 文件（如果没有的话）：

```
/*    /index.html   200
```

或者创建 `functions/_middleware.js`（高级用法，一般不需要）。

### 第四步：验证

部署完成后会获得域名 `https://kaoyan-tracker.pages.dev`，直接访问测试即可。

---

## 方案三：Vercel（当前方案，保持不变）

如果 Vercel 在你的网络环境下可以正常访问，其实没必要迁移。Vercel 免费额度为 100GB/月，对个人项目足够。

项目已经配置了 `vercel.json` 处理 SPA 路由，只需确保环境变量在 Vercel Dashboard 中正确设置即可。

---

## 关于 Supabase 后端的说明

### 当前架构

```
用户浏览器 → 国内静态托管平台（前端）→ Supabase（后端，海外服务器）
```

### 潜在问题

Supabase 服务器在海外（AWS），国内访问可能：
- 速度偏慢（通常 200-800ms 延迟）
- 偶尔出现连接不稳定
- 极端情况下可能无法访问

### 如果 Supabase 太慢怎么办？

**方案 A：继续使用 Supabase（推荐，零成本）**

代码中已实现 10 秒请求超时机制，大多数情况下可以正常使用。对于个人/小规模使用，延迟在可接受范围内。

**方案 B：迁移到国内后端（成本较高）**

如果确实需要更快的后端响应，可以考虑：

| 替代方案 | 免费额度 | 迁移难度 | 说明 |
|----------|----------|----------|------|
| CloudBase 云数据库 | 有免费额度 | 高 | 需重写数据层和认证逻辑 |
| 微信云开发 | 有免费额度 | 高 | 需重写数据层和认证逻辑 |
| Appwrite（自托管） | 取决于服务器 | 中 | 需要一台云服务器 |

> 迁移后端工作量较大（需要重写 `src/lib/supabase.ts` 和 `src/contexts/AuthContext.tsx`），建议先用 Supabase 试试，确实不行再考虑迁移。

---

## AI 翻译批改功能（讯飞星火 + 腾讯云 SCF 云函数）

打卡页的「AI 纠正」按钮会调用大模型对学生的译文进行批改；
生词本的「AI 查词」按钮会调用大模型查询考研单词的释义、助记、常用搭配、例句与考点。
为保证密钥安全，前端不直接访问讯飞接口，而是通过**云函数做中转代理**（同一函数按 `action` 区分：`correct` 批改 / `lookup` 查词）。

### 架构说明（重要）

- **推荐：腾讯云 SCF 云函数**（国内节点，直连讯飞，稳定快速，免费额度充足）
  - Supabase Edge Function 跑在美国节点，跨境访问中国大陆的讯飞 API 会频繁超时（实测偶发 130 秒超时）
  - CloudBase 云函数免费版**超时锁死 3 秒**，讯飞响应常超时，改 60 秒需付费，因此选用 **SCF 云函数**：
  ```
  打卡页 → fetch(SCF 函数URL) → SCF 云函数（国内） → 讯飞星火 HTTP API
  ```
- 兜底：未配置 SCF 地址时，前端会回退调用 Supabase Edge Function（不推荐，跨境不稳定）。

### 一、部署腾讯云 SCF 云函数

代码已就绪：`scf/functions/ai-correct/index.js`（Node.js 事件函数，入口 `exports.main_handler`，无需任何依赖）。

1. 登录 [腾讯云云函数控制台](https://console.cloud.tencent.com/scf) → 「新建」
2. 选择「从头开始/自定义创建」：
   - 函数类型：**事件函数**（不要选「Web 函数」，Web 函数需填启动命令）
   - 函数名称：`ai-correct`，地域选上海或广州
   - 运行环境：**Nodejs 18.13** 或 **Nodejs 20**
   - 提交方式：本地上传 zip（把 index.js 打包）或在线编辑粘贴完整代码
3. 展开「高级配置」：
   - 内存：256MB；**执行超时时间：60 秒**（免费可调，上限 900 秒）
   - 环境变量添加：
     | 变量名 | 值 |
     |---|---|
     | `SPARK_API_KEY` | 讯飞应用的 APIKey |
     | `SPARK_API_SECRET` | 讯飞应用的 APISecret |
     | `SPARK_MODEL` | `spark-x`（Spark X 走 `/v2`）；`lite` / `generalv3.5` 走 `/v1` |
4. 点「完成」创建，然后把 [index.js](scf/functions/ai-correct/index.js) 的完整内容粘贴进「函数代码」，点「部署」
   - **已部署过旧版（仅批改）的情况**：云函数控制台 → 该函数 →「函数代码」，用本仓库最新的 `scf/functions/ai-correct/index.js` 覆盖并重新「部署」即可，无需新建函数 / 触发器 / 环境变量（查词复用同一 URL）。
5. 「触发管理」→「创建触发器」：
   - 触发方式：**函数URL（HTTP 触发器）**（API 网关已停服，不要用「API 网关触发器」）
   - 认证方式：**免鉴权**；触发路径：`/ai-correct`
   - 若有「允许跨域 CORS」开关则打开（代码也已内置 `Access-Control-Allow-Origin: *` 响应头）
   - 创建后得到公网地址，形如 `https://1317742320-xxxx.ap-shanghai.tencentscf.com`

### 二、前端接入

1. 把上面拿到的完整地址填到 `.env.production`：
   ```
   VITE_AI_CORRECT_URL=https://1317742320-xxxx.ap-shanghai.tencentscf.com
   ```
2. 重新构建部署前端（CloudBase / Vercel 均需读取该环境变量）。

### 三、申请讯飞星火密钥

注册 [讯飞开放平台](https://console.xfyun.cn/) → 创建应用 → 在「服务管控」领取模型的 `APIKey` 与 `APISecret`（新用户有免费 token）。
- Spark X1.5（推荐）：[console.xfyun.cn/services/bmx1](https://console.xfyun.cn/services/bmx1)，`SPARK_MODEL=spark-x`（走 `/v2` 接口，需**关闭深度思考**，代码已内置 `thinking: {type:'disabled'}` 加快响应）
- Spark Lite（实名后无限量）：`SPARK_MODEL=lite`（走 `/v1` 接口，最快）
- Spark Max：`SPARK_MODEL=generalv3.5`（走 `/v1` 接口）

### 验证

- 登录后在打卡页输入一句译文，点击「AI 纠正」，应显示修正译文、问题与建议。
- 生词本页任意生词点「AI 查词」，应显示释义、助记、考研常用搭配、例句与考点；再次查看同一单词会直接读缓存，不再消耗 token。

### 注意事项

- 每个句子独立调用一次，连续批改多句会消耗较多 token，建议按需使用；生词查词结果会缓存在本机 localStorage，重复查看免费。
- 若提示「服务器未配置讯飞密钥」：说明云函数环境变量未配置，请检查 `SPARK_API_KEY` / `SPARK_API_SECRET`。
- 若本地开发想走 SCF，可在 `.env.local` 中同样配置 `VITE_AI_CORRECT_URL`。

---

## App 在线更新（OTA）与数据库 RLS 配置

App 的「检查更新」功能依赖 Supabase 的 `app_versions` 表读取最新版本记录。该表开启了 RLS（Row Level Security），需手动添加一条**公开读策略**，否则登录用户（`authenticated` 角色）会因无读权限、查询返回空，导致 App 永远误判「已是最新版本」。

### 执行 SQL（Supabase → SQL Editor）

```sql
alter table public.app_versions enable row level security;

drop policy if exists "app_versions_public_read" on public.app_versions;
create policy "app_versions_public_read"
  on public.app_versions
  for select
  to public
  using ( is_active = true );
```

- `to public` 同时覆盖匿名（`anon`）与登录（`authenticated`）角色，保证未登录/已登录都能读到最新版本。
- 策略仅允许 `select` 且 `is_active = true` 的记录，安全可控。

> 每次更换 Supabase 项目或新建数据库时，需重新执行上述 SQL，否则 App 会再次出现「检查更新一直显示已是最新」的问题。

---

## 部署后的日常维护

### 更新部署流程

每次代码修改后需要重新部署：

```bash
# 1. 本地构建
npm run build

# 2. CloudBase 部署
tcb hosting deploy ./dist -e <你的环境ID>

# 或者，如果使用 Cloudflare Pages：
# 只需 git push，Cloudflare 会自动构建部署
```

### 设置费用告警（CloudBase）

1. 腾讯云控制台 → 费用 → 费用告警
2. 设置阈值：当费用超过 1 元时告警
3. 这样即使超出免费额度也能及时发现

### 监控 Supabase 项目状态

Supabase 免费项目 7 天不活跃会自动暂停：
1. 定期访问应用保持活跃
2. 如果被暂停，登录 Supabase Dashboard 手动恢复即可

---

## 快速部署 Checklist

### 方式 A：Git 仓库自动部署（推荐）

- [ ] 注册腾讯云账号并完成实名认证
- [ ] 创建 CloudBase 环境（按量计费）
- [ ] 开通静态网站托管
- [ ] 在 `public/` 目录创建 `_redirects` 文件
- [ ] 配置 `.env.production`（或在 CloudBase 构建配置中设置环境变量）
- [ ] 代码推送到 GitHub/Gitee
- [ ] 在 CloudBase 控制台连接 Git 仓库
- [ ] 配置构建参数（框架选 Vite，产物目录 dist）
- [ ] 部署成功，访问默认域名验证
- [ ] 测试子路径访问（如 `/login`）正常
- [ ] 测试登录/注册功能正常
- [ ] 设置费用告警

### 方式 B：控制台上传文件夹

- [ ] 注册腾讯云账号并完成实名认证
- [ ] 创建 CloudBase 环境（按量计费）
- [ ] 开通静态网站托管
- [ ] 在 `public/` 目录创建 `_redirects` 文件
- [ ] 本地 `.env` 文件配置正确（Supabase URL 和 Key）
- [ ] `npm run build` 构建成功，确认 `dist/_redirects` 存在
- [ ] 在控制台「文件管理」上传 `dist/` 文件夹
- [ ] 访问默认域名验证
- [ ] 测试子路径访问（如 `/login`）正常
- [ ] 测试登录/注册功能正常
- [ ] 设置费用告警

---

## 常见问题

### Q: CloudBase 部署后页面空白？

检查浏览器控制台是否有报错。常见原因：
1. 环境变量未正确注入（`.env` 文件配置错误）→ 重新构建
2. JS/CSS 文件路径错误 → 确认 `dist/` 目录结构正确

### Q: 直接访问子路径返回 404？

SPA 路由未配置。确保 `public/_redirects` 文件存在且内容为 `/* /index.html 200`，然后重新构建部署。

### Q: 登录失败或超时？

1. 检查 `.env` 中的 Supabase URL 格式是否正确（无末尾斜杠、无 `/rest/v1` 路径）
2. 检查 Supabase 项目是否被暂停（7天不活跃会自动暂停）
3. 可能是网络问题，尝试切换网络环境

### Q: CloudBase 免费额度用完了怎么办？

个人小项目几乎不可能超。如果真超了：
1. 可以切换到 Cloudflare Pages（完全免费无限制）
2. 或回到 Vercel（100GB/月免费）

### Q: 想要自定义域名？

- CloudBase：自定义域名需要 ICP 备案（个人备案免费但需要 1-2 周）
- Cloudflare Pages：可直接绑定未备案域名（但国内访问可能受影响）
- 如果只是自己用，默认域名完全够用

---

## 总结推荐

**对于「没钱 + 不想装 CLI + 国内访问」的需求，推荐方案：**

1. **前端部署**：CloudBase + Git 仓库自动部署（`git push` 即自动构建部署，无需 CLI）
2. **后端**：继续使用 Supabase 免费版（代码已做超时处理，个人使用够用）
3. **备选**：如果 CloudBase 不行，切 Cloudflare Pages（完全免费，也是 Git 自动部署）
4. **域名**：使用平台提供的默认域名，无需备案

**总成本：0 元 | 需安装工具：无 | 更新代码：`git push` 即可**
