# 打卡意群交互、统计分科明细、AI 模型设置与目标页瘦身方案

## 一、目标概述

本次改动覆盖四块：

1. **英语打卡页**
   - 把「参考译文」和「句子拆解」合并进「意群切分」面板。
   - 意群改为可点击：点击后展开该意群的中文意思、语法成分（如并列短语、同位语从句、状语从句）和详细拆解。
   - 去掉页面外层“独立大框”，让打卡页与全站背景、间距一致。
   - 保持原 150 天语料不变，为全部 727 句补全意群切分（原数据只有 72 句有 `analysis.split`）。
2. **统计页**
   - 在科目统计下增加“学习内容层级占比”：科目 → 中层级（如高数/线代）→ 学习内容（如做题/复盘），并给出“做题/复盘在高数中的占比”。
3. **AI 查词**
   - 新增用户可配置的 OpenAI 兼容大模型（URL / API Key / 模型名）。
   - 查词失败或未配置时，展示查词提示词并支持一键复制，方便用户去其他模型查询。
   - 翻译 AI 批改也优先走用户自己的模型，避免现有 SCF 地址不可用。
4. **目标与承诺金页**
   - 历史承诺、资金流水默认折叠，避免无限向下滚动。
   - 每条历史承诺增加“当周实际学了多久”。

---

## 二、现状核对（已完成的探索）

### 1. 150 天语料是否变少：没有丢内容

- 最初 150 天版本在 git 提交 `4041d35`（`src/data/englishDaily.ts`）。
- 当前 `src/data/englishDaily.json`：
  - 150 天、727 句、英文总字符 94,938。
  - 原版 150 天逐日比对：149 个可比 Day 全部一致，英文总字符 95,461（差异仅为标点/空格归一化），**没有丢句**。
- 少数天只有 1-2 句，是原始当天段落本身只有这些句子（例如 Day 50 原文就只有 ② 一句）。
- 因此**不改写 150 天原文与译文**，只补全“意群切分”展示。

### 2. 意群数据现状

- `EnglishDay.sentences[].ai` 全部 727 句都有 `backbone / structure / collocations`。
- `EnglishDay.analysis` 只有 72 句，68 句有 `split`（`//` 分隔的意群）。
- 当前页面只有在 `analysis.split` 存在时才展示意群，因此大部分句子没有意群。
- 可以基于 `ai.structure` 里的英文片段（如“成分解析3：from many quarters（介词短语作后置定语）……”）反推意群边界与语法角色，不需要改数据文件。

### 3. 打卡页布局

- [english-checkin.css](file:///e:/code_app/code-1/code_app/kaoyan-tracker/src/pages/english-checkin.css) 的 `.ec-page` 自带：
  - 1px 边框、30px 圆角、多层渐变背景、大阴影、`min-height: calc(100vh - 96px)`、最大宽度 960px。
- 这就是用户看到的“独立的框”。
- 答案区目前是三个独立面板：参考译文、句子拆解、短语搭配；意群只是不可点击的 `span`。

### 4. AI 查词失败原因

- `src/lib/wordLookup.ts` 的顺序是：本地缓存 → 离线词典 → `VITE_AI_CORRECT_URL`（腾讯云 SCF）→ Supabase Edge Function。
- 实测 `.env.local` 中的 SCF 地址 `https://1317742320-k6jrgdqkr6.ap-shanghai.tencentscf.com` **请求超时**，所以查词报 `AI 查词失败：Failed to fetch`。
- 当前没有任何“用户自己的模型”配置入口。

### 5. 统计页与目标页

- `src/lib/summary.ts` 的 `computeSummary` 只汇总到“科目”级别，未使用 `DailyLogSubject.activity`。
- `src/pages/GoalPage.tsx` 的历史承诺与资金流水全部铺开；历史承诺只显示目标，不显示实际学习时长。

---

## 三、具体改动

### A. 新增：`src/lib/englishBreakdown.ts`（意群生成与语法映射）

新增纯函数模块，输入一句英文、可选的 `AnalysisItem`、`sentence.ai`，输出可点击的意群数组。

```ts
export interface SentenceChunk {
  text: string
  /** 这一部分的中文意思（从语法解析中提取，提取不到时为空） */
  zh: string
  /** 语法角色：方式状语 / 同位语从句 / 并列短语 / 介词短语作后置定语 ... */
  grammar: string
  /** 该意群对应的完整语法说明 */
  explanation: string
  start: number
  end: number
}
```

生成顺序：

1. **优先使用 `analysis.split`**（当前 68 句）
   - 按 `//` 拆分，复用现有的“无空格粘连文本还原”逻辑（把 `restoreChunkSpaces` 从 `EnglishCheckin.tsx` 迁入本模块并导出）。
   - 为每个片段在 `sentence.en` 中定位 `start/end`；定位失败时按前后片段补洞，保证覆盖整句。
2. **没有 `split` 时从 `ai.structure` 反推**
   - 解析每条结构说明：
     - 去掉 `成分解析N：` 前缀；
     - 以第一个中文冒号 `：` 左右分段；
     - 在左右两段中找英文片段（如 `from many quarters`、`if you learn...`、`a fat`、`Above all`）；
     - 用归一化匹配定位到原句；
     - 过滤纯虚词片段，保留从句引导词（if/when/that/which/what/until...）作为边界。
   - 把定位到的片段起点作为切分边界；再对过长的片段按逗号、分号、冒号、破折号和常见从句引导词二次切分。
   - 合并过于零碎的片段（如只有标点、单虚词）。
3. **兜底**
   - 若仍无法切分，用标点/从句引导词切分；若整句无法切，整句作为一个意群。
   - 单意群时 `zh = sentence.ref`，`grammar = '整句'`，`explanation = sentence.ai.backbone`。

语法角色与中文意思提取：

- `grammar`：
  - 结构说明左侧的中文标签优先（如 `同位语从句`、`介词短语作后置定语`、`形容词短语`）；
  - 否则取右侧开头的“作定语/作状语/……”，截到第一个逗号；
  - 否则用 `analysis.grammar`（如 `when引导状语从句`）按英文关键词匹配；
  - 都没有则显示 `意群`。
- `zh`：
  1. 结构说明中的中文引号内容（`“快乐消失的触发条件”`、`“用石块换取黄瓜片”`等）；
  2. `意为 / 即 / 指的是 / 说明 / 明确 / 表示` 后面的短语；
  3. 该意群内命中的 `ai.collocations` 释义；
  4. `analysis.vocab` 中命中单词的释义拼成“word 释义；...”（最多 3 个）；
  5. 单意群时直接用整句参考译文；
  6. 仍为空则返回空串，UI 显示“暂无整块释义，可参考整句译文”。

### B. 修改：`src/pages/EnglishCheckin.tsx`

1. 删除页面内的 `restoreChunkSpaces`，改为从 `englishBreakdown.ts` 导入。
2. `chunks` 改为 `SentenceChunk[]`：
   ```ts
   const chunks = useMemo(
     () => (sentence ? buildSentenceChunks(sentence, analysisItem) : []),
     [sentence, analysisItem],
   )
   ```
3. 新增 `activeChunk` 状态（`number | null`），切换 Day/句子时重置。
4. 答案区重构（约 1287-1342 行）：
   - 删除独立的「参考译文」与「句子拆解」面板，合并为一个「意群切分」面板：
     - 顶部保留参考译文（`ec-ref-line`，标签 + 译文）。
     - 保留紧凑的「句子主干」。
     - 意群行：每个意群是 `<button className="ec-chunk ...">`，保留 `/` 分隔与 6 种颜色。
     - 点击意群设置 `activeChunk`，在该面板内展开详情卡：
       - 意群原文；
       - 「这一部分的意思」：`chunk.zh`；
       - 「句子成分」：`chunk.grammar` + `chunk.explanation`；
       - 没有释义时提示可参考整句译文。
     - 保留「语法提示」列表（`analysis.grammar`），放在面板底部。
   - 「短语搭配」面板与「翻译练习」保持原位置与交互。
5. 查词抽屉（约 1704-1724 行）：
   - 在 `lookupError` 或「本地词库未收录」时渲染新的 `LookupPromptFallback word={activeTerm.headword}`。
   - 文案：`AI 查词不可用？复制下面的提示词到其他模型查询`。
   - 保留原有「AI 查词」按钮；配置了用户模型后该按钮会走用户模型。
6. 翻译 AI 批改（约 939-990 行）：
   - 若 `isAiConfigured(loadAiConfig())`，用 `chatCompletion` + `CORRECT_SYSTEM_PROMPT` 调用用户模型，再 `normalizeAiCorrection`。
   - 否则维持现有 SCF / Supabase 逻辑。
   - 用户模型返回非 JSON 时提示 `AI 返回格式无法解析，请更换模型后重试`。
7. 顶部/底部结构不变；不改打卡顺序、阅读进度、生词本逻辑。

### C. 修改：`src/pages/english-checkin.css`

目标：去掉“独立大框”，与全站一致，同时保留意群彩色胶囊。

- `.ec-page`：
  - 移除边框、圆角、阴影、径向渐变背景；
  - `background: transparent`，`max-width` 改为约 1000px，`margin: 0 auto`，`min-height: auto`；
  - 保留底部 150px 内边距给固定翻页条。
- `.ec-topbar`：
  - 去掉卡片背景与阴影，改为轻量标题栏（可保留底部 1px 分隔线）；
  - 图标按钮保留白底小方块。
- `.ec-head` / `.ec-study`：压缩上下间距。
- 新增/调整：
  - `.ec-chunk` 支持 `button` 的 hover、active、focus-visible、选中描边；
  - `.ec-chunk-detail`：浅色卡片、左侧色条、分区标题；
  - `.ec-ref-line` / `.ec-block-hint`；
  - 深色模式对应变量。
- 不改 `.ec-footer` 与 `.ec-sheet` 的 portal 定位，避免影响移动端翻页和抽屉。

### D. 新增：`src/lib/aiModel.ts`（用户模型配置与调用）

内容：

```ts
export interface AiConfig {
  baseUrl: string   // 支持 https://api.deepseek.com 或完整 .../chat/completions
  apiKey: string    // 允许为空（本地 Ollama）
  model: string
}
```

- 存储：`localStorage` key `kaoyan_ai_config`，**只存本机，不上传云端**。
- `loadAiConfig()` / `saveAiConfig()` / `clearAiConfig()` / `isAiConfigured()`。
- `normalizeEndpoint(baseUrl)`：
  - 已以 `/chat/completions` 结尾 → 原样；
  - 否则去掉末尾 `/` 后追加 `/chat/completions`。
- `chatCompletion(config, messages, options?)`：
  - POST `{ model, messages, temperature, max_tokens }`；
  - `Authorization: Bearer <key>`（key 为空则不发送）；
  - 通过 `postJson`（原生端 CapacitorHttp、Web 端 fetch）请求；
  - 读取 `choices[0].message.content`。
- `testAiConfig(config)`：发送“请只回复 OK”，用于设置页测试。
- `extractJsonObject(text)`：容忍 ```json 包裹、前后说明文字、尾随逗号。
- 提示词常量：
  - `LOOKUP_SYSTEM_PROMPT`：照搬 `scf/functions/ai-correct/index.js` 的查词系统提示词；
  - `lookupUserPrompt(word)`：`请查询考研词汇「word」的释义、助记、考研常用搭配、例句与考点。`；
  - `buildLookupPrompt(word)`：系统提示 + 用户提示的完整可复制文本；
  - `CORRECT_SYSTEM_PROMPT`：照搬现有翻译批改系统提示词；
  - `buildCorrectUserPrompt(en, userTranslation, refTranslation)`。

### E. 修改：`src/lib/httpRequest.ts`

`postJson` 增加可选自定义请求头：

```ts
export async function postJson(
  url: string,
  body: unknown,
  timeoutMs = 30000,
  headers: Record<string, string> = {},
): Promise<JsonPostResult>
```

- CapacitorHttp 分支合并 `headers`；
- fetch 分支合并 `headers`；
- 现有调用不传第四个参数，行为不变。

### F. 修改：`src/lib/wordLookup.ts`

- 引入 `aiModel` 的配置与调用。
- `lookupWord` 顺序改为：
  1. 本地缓存；
  2. 离线词典；
  3. **若配置了用户模型 → 优先调用用户模型**；
  4. 未配置 → 保持现有 SCF / Supabase 兜底。
- 用户模型返回：
  - `extractJsonObject` 成功 → 归一化成 `WordLookup`；
  - 解析失败 → 把原始内容放进 `mnemonic`，保证用户至少看到结果。
- 导出 `buildLookupPrompt` 供兜底组件使用（从 `aiModel.ts` re-export 或直接引用）。
- 不改缓存 key 与 `getCachedLookup` 行为。

### G. 新增：`src/components/LookupPromptFallback.tsx`

- Props：`{ word: string }`。
- 使用 Tailwind 样式，渲染：
  - 折叠项标题：`AI 查词不可用？复制提示词到其他模型`；
  - `pre` 展示 `buildLookupPrompt(word)` 完整文本（`whitespace-pre-wrap`）；
  - 「复制提示词」按钮（`navigator.clipboard`，失败时选中文本兜底）；
  - 「去设置 AI 模型」链接到 `/settings`。
- 在 `EnglishCheckin` 词条抽屉与 `VocabularyBook` 错误提示处复用。

### H. 修改：`src/pages/VocabularyBook.tsx`

- `lookupError` 同时记录失败的单词（新增 `lookupErrorWord` 状态）。
- 错误横幅下方渲染 `<LookupPromptFallback word={lookupErrorWord} />`。
- 其余生词本逻辑不变。

### I. 修改：`src/pages/Settings.tsx`

- `SettingsCategory` 增加 `'ai'`，`CATEGORIES` 增加「AI 模型」，图标用现有 `sparkles`。
- 新卡片内容：
  - 接口地址（`placeholder: https://api.deepseek.com`）；
  - API Key（`type="password"`，可留空给 Ollama）；
  - 模型名称（`placeholder: deepseek-chat`）；
  - 说明：仅保存在本机；需兼容 OpenAI Chat Completions；Web 端受 CORS 限制，桌面/安卓端走原生网络更稳。
  - 「保存设置」与「测试连接」按钮。
- 初始化读取 `loadAiConfig()`；保存后 `toast.show('AI 模型设置已保存')`。
- 测试连接调用 `testAiConfig`，成功显示 `连接成功：<模型返回内容>`，失败显示错误信息。
- 页面布局沿用现有 `wide ? 左侧分类 : 手机全部卡片` 的结构。

### J. 修改：`src/lib/summary.ts` + `src/pages/Summary.tsx`

新增统计函数：

```ts
export interface ActivityShare {
  name: string
  hours: number
  /** 在父级中的占比（组内活动按组总时长，未分组按科目总时长） */
  percentageOfParent: number
}

export interface ActivityGroupShare {
  name: string
  hours: number
  /** 在所属科目中的占比 */
  percentageOfSubject: number
  activities: ActivityShare[]
}

export interface SubjectDetailBreakdown {
  subjectId: string
  name: string
  hours: number
  /** 在所选周期总时长中的占比 */
  percentageOfTotal: number
  groups: ActivityGroupShare[]
  leaves: ActivityShare[]
}

export function computeSubjectDetailBreakdown(logs: DailyLog[]): SubjectDetailBreakdown[]
```

计算规则：

- 遍历每条 `DailyLogSubject`：
  - 按 `subjectId` 汇总；
  - `activity` 用现有 `splitActivityPath` 拆分：
    - 有中层级（如 `高数/做题`）→ 记入 `groups['高数']['做题']`；
    - 无中层级（如 `复盘`）→ 记入 `leaves['复盘']`；
    - 无 `activity` → 记入 `leaves['未分类']`。
- 占比：
  - 科目占比 = 科目时长 / 周期总时长；
  - 中层级占比 = 中层级时长 / 科目时长；
  - 学习内容占比 = 该内容时长 / 所属中层级时长。
- 所有列表按小时降序；百分比保留 1 位小数。

`Summary.tsx`：

- 保留现有「每门课统计」总占比卡片。
- 在其下方新增「分科占比明细」卡片：
  - 每科：`数学 12.0h · 占总 60.0%`；
  - 中层级缩进：`高数 8.0h · 占数学 66.7%`；
  - 学习内容再缩进：`做题 5.0h · 占高数 62.5%` / `复盘 3.0h · 占高数 37.5%`；
  - 未分组内容：`复盘 2.0h · 占数学 16.7%`；
  - 科目没有活动记录时显示「暂无学习内容细分」。
- 用现有 `getChipColor` / `getBarColor` 保持配色一致；活动行用细进度条展示百分比。

### K. 修改：`src/pages/GoalPage.tsx`

1. 历史承诺增加实际时长：
   ```ts
   const historyRows = useMemo(
     () => historyCommitments.map((c) => ({
       ...c,
       actualHours: sumHoursInRange(logs, c.week_start, getWeekEndStr(new Date(c.week_start))),
     })),
     [historyCommitments, logs],
   )
   ```
   - 行内显示：`目标 20h · 实际 18.5h · 押金 ¥50`；
   - 可加一条细进度条（actual / target）。
2. 折叠：
   - 新增 `showAllHistory`、`showAllTransactions`；
   - 历史承诺默认显示最近 3 条，按钮「查看全部 N 周 / 收起」；
   - 资金流水默认显示最近 5 条，按钮「查看全部 N 条 / 收起」。
3. 保持现有钱包、本周承诺、分科目标表单逻辑不变；不新增数据库字段。

---

## 四、关键决策（已与用户确认）

1. **150 天内容保持原样**，不重新抽取 PDF；只为全部句子补全意群切分。
2. **AI 接口采用 OpenAI 兼容格式**：Base URL + API Key + 模型名；支持 DeepSeek、硅基流动、通义、Ollama 等。
3. **打卡页只去掉外层大框、融合背景**，不做桌面双栏大改。
4. AI Key 仅保存在本机 `localStorage`，不写入 Supabase。
5. 所有意群在运行时生成，不改 `src/data/englishDaily.json`，避免破坏现有 150 天译文与打卡进度。

---

## 五、验证步骤

1. **类型检查**
   - `npx tsc -b`
2. **Lint**
   - `npx oxlint`
3. **构建**
   - PowerShell：`$env:NODE_OPTIONS=''; npm run build:deploy`
   - 注意项目环境会注入 safe-delete，构建前清空 `NODE_OPTIONS`。
4. **功能冒烟（浏览器）**
   - `/english-checkin`：
     - 页面不再有独立大框；
     - 点击「显示答案」后能看到参考译文 + 可点击意群；
     - 点击任意意群，展开中文意思、语法角色、详细拆解；
     - 连续切换 5 个不同 Day，确认没有空意群、没有报错。
   - 查词抽屉：
     - 未配置模型/请求失败时出现「复制提示词」；
     - 复制内容包含系统提示与 `「word」` 用户提示；
     - 配置模型后可正常查词。
   - `/settings`：
     - 保存/清除 AI 配置；
     - 测试连接成功与失败提示。
   - `/summary`：
     - 科目下能看到中层级和学习内容层级；
     - 百分比口径为“父级占比”（如做题/复盘占高数）。
   - `/goal`：
     - 历史承诺默认只显示 3 条，可展开；
     - 每条历史承诺显示实际学习时长；
     - 资金流水默认只显示 5 条。
5. **数据回归**
   - 不修改 `englishDaily.json`；现有打卡记录、阅读进度、生词本、翻译练习缓存不受影响。

---

## 六、风险与处理

- **意群切分质量**：非 AI 规则切分在极少数长句上可能不够完美；已用 `analysis.split` 优先、`ai.structure` 次优、标点兜底三层策略。若某句只生成一个意群，点击时展示整句译文与主干，不会出现空白。
- **Web 端 CORS**：用户自定义模型在浏览器里可能被 CORS 拦截；设置页会提示，桌面/安卓端通过 `CapacitorHttp` 原生网络栈不受影响。
- **AI Key 安全**：只存本机 `localStorage`，不写云端；设置页明确说明。
