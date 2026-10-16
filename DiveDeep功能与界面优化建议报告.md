# DiveDeep（kaoyan-tracker）功能与界面优化建议报告

> 分析对象：`E:\code_app\code-1\code_app\kaoyan-tracker`
> 代码基线：`main` @ `3702a84`，version `1.14.6`
> 分析日期：2026-09-16
> 分析方式：通读页面组件、功能模块（`src/lib/*`）、导航组件、设计令牌（`src/index.css`）与用户操作手册；**未做真机视觉验收**，界面结论均基于源码结构与样式类。
> 配套文档：`DiveDeep项目优化建议报告.md`（工程/安全/性能维度，与本报告互补）

---

## 零、先说结论

功能与界面上**不是"缺功能"，而是"已有的功能没做到位、以及三端体验不一致"**。功能覆盖已经相当全（打卡、计时、日历、健康、英语、词汇、成就、目标承诺金、周总结、回收站、扫码登录、多主题），问题集中在四类：

| 类别 | 核心问题 | 条数 |
|---|---|---|
| **A. 功能缺陷** | 提醒在 App 端失效、导出不完整、结算依赖打开页面、硬编码日期 | 9 |
| **B. 功能缺口** | 无今日时长、无番茄钟、无导入、统计维度少、周报不可分享 | 9 |
| **C. 界面一致性** | GoalPage 脱离全局卡片体系、`window.prompt`、首页两套重复 JSX | 4 |
| **D. 布局与交互** | 移动端 7 个 Tab、Tab 高亮错页、首页信息过载、倒计时每秒重渲染 | 12 |

**投入产出比最高的五件事**：

1. 修 **BottomTab 高亮错页**（一行映射表，纯 bug）
2. 装 `@capacitor/local-notifications`，让"打卡提醒"在手机上真正生效（现在等于没有）
3. 补齐**数据导出**缺失的 7 张表 + 加导入（现在导出的备份恢复不了自己）
4. 首页首屏加 **「今日已学 X 小时」**（打卡类 App 最该有的数字，现在没有）
5. 把 **GoalPage 收编到全局 `.card`** 体系 + 干掉 `window.prompt`（一眼可见的不精致）

---

## 一、功能层面 · A 类：已实现但有缺陷

### A-1 ⚠️「打卡提醒」在 App 端等于没有

**证据链**

1. `capacitor.config.ts` 里已经配置了本地通知插件：
   ```ts
   plugins: {
     LocalNotifications: { smallIcon: 'ic_stat_icon', iconColor: '#3b82f6' },
   }
   ```
2. 但 `package.json` 的 `dependencies` 中**没有 `@capacitor/local-notifications`**（全文检索无命中）——这段配置是**死配置**。
3. 实际实现走的是 Web 通知 API（`src/lib/reminder.ts`）：
   ```ts
   export function notificationsSupported() {
     return typeof window !== 'undefined' && 'Notification' in window
   }
   export function notifyMissedCheckin(extra?: string) {
     if (!notificationsSupported() || Notification.permission !== 'granted') return
     const n = new Notification('DiveDeep · 今日还没打卡', { ... })
   }
   ```
4. `src/pages/Settings.tsx` 自己在页面上承认了这一点：
   > 「提醒只在打开 DiveDeep 时生效（如浏览器标签页开着）。打卡后当天不再提醒。」

**影响**：一个打卡 App 的核心闭环是"到点提醒 → 打开 → 打卡"。现在这个闭环在 Android 上完全断裂——WebView 里 `Notification` 构造器通常不可用或拿不到权限，而"需要用户先打开 App 才能收到提醒"等于提醒不存在。**这是全项目最该优先修的功能问题。**

**建议做法**

```bash
npm i @capacitor/local-notifications
npx cap sync android
```

```ts
// src/lib/reminder.ts —— 原生走 LocalNotifications，Web 保留 Notification
import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

export async function scheduleDailyReminder(hour: number, minute: number) {
  if (!Capacitor.isNativePlatform()) return scheduleWebReminder(hour, minute)

  const perm = await LocalNotifications.requestPermissions()
  if (perm.display !== 'granted') return false

  await LocalNotifications.cancel({ notifications: [{ id: 1001 }] })
  await LocalNotifications.schedule({
    notifications: [{
      id: 1001,
      title: 'DiveDeep · 今日还没打卡',
      body: '记得今天也得记录学习哦 📚',
      schedule: { on: { hour, minute }, allowWhileIdle: true },  // 每天固定时间
      smallIcon: 'ic_stat_icon',
      iconColor: '#3b82f6',
    }],
  })
  return true
}
```

配套两点：

- **打卡后取消当天通知**：现有 `markNotifiedToday()` 是 Web 逻辑，原生侧应在生成打卡记录后 `LocalNotifications.cancel`，或把通知体改成"根据当天状态决定是否展示"（Android 上更稳的是取消 + 重排）。
- **提醒时间支持自定义**：现在只有 3 个预设（20:00 / 21:00 / 22:00，见 `REMINDER_PRESETS`），改 `<input type="time">` 即可，顺带解决 A-7。

---

### A-2 ⚠️ 数据导出不完整，且按钮文案与实现不符

**证据**

`src/lib/export.ts` 的导出清单是 12 张表：

```
daily_logs, english_checkin, weekly_commitments, wallet_transactions,
body_metrics, health_profiles, water_intake, meal_logs, favorites,
custom_presets, user_settings, qr_login_sessions
```

而全站实际使用的表有 20 张（按 `src/lib/*.ts` 里的 `.from('...')` 统计）。其中 `meal_items` 已通过 `meal_logs` 的嵌套 select 带出，**真正遗漏的有 7 张**：

| 缺失表 | 内容 | 后果 |
|---|---|---|
| `user_vocab` | 生词本 | **用户积累的单词全丢** |
| `todos` | 待办清单 | 待办全丢 |
| `user_subjects` | 自定义科目 | 恢复后科目配置丢失 |
| `calendar_events` | 日历重要日 | 重要日全丢 |
| `weekly_reflections` | 每周反思笔记 | 用户手写的复盘内容全丢 |
| `removed_subjects` | 已删科目快照 | 恢复后已删科目会"复活" |
| `wallets` | 钱包余额 | 只有流水没有余额，恢复后余额对不上 |

同时，`Profile.tsx` 里导出按钮的描述写的是：

> `desc="备份学习 · 健康 · 生词本"`

**生词本实际并不在导出范围内**——文案承诺了实现没做的事。

反过来，`qr_login_sessions`（扫码登录的临时会话，含 token）被加进了导出，属于无意义且带敏感信息的条目。

**建议做法**

1. 把缺失的 6 张表补进 `tables` 数组，并把 `qr_login_sessions` 移除；
2. 加一条**导出清单守卫测试**：比对"代码里出现过的表名集合"与"导出清单集合"，有差异就报错（这条测试能防止以后新增功能时再次漏导出）；
3. 修正按钮文案，或直接由导出清单动态生成描述。

---

### A-3 只有导出，没有导入

**证据**：`src/lib/export.ts` 只有 `exportAllData()` 与 `downloadTextFile()`，全站检索无任何 `importAllData` / 文件读取恢复逻辑。

**影响**：导出的 JSON 目前只能"看"，不能"用"。用户换账号、迁移、误操作后想恢复，没有路径。云端同步只解决"同一账号多设备"，解决不了"账号迁移"和"灾难恢复"。

**建议做法**：加一个导入入口（放在 Profile「设备与数据」分组，导出旁边）：

```ts
export async function importAllData(userId: string, payload: ExportPayload) {
  // 逐表 upsert，保留原 id 会冲突则改用 (user_id, date) 等业务唯一键
  // 导入前弹确认框说明「将合并/覆盖哪些数据」
}
```

**关键设计点**：导入策略要先想清楚是**合并**还是**覆盖**。建议默认「合并 + 冲突以文件为准」，并在导入前用 `ConfirmDialog` 明确告知影响范围。这个功能不做，导出功能的价值只有一半。

---

### A-4 承诺金结算依赖「用户打开页面」

**证据**（`src/pages/GoalPage.tsx`）

```ts
const loadData = useCallback(async () => {
  // 先结算过期承诺（幂等：已结算的不会重复处理）
  await settleExpiredCommitments(user.id)
  ...
}, [user])
```

结算逻辑写在**页面加载**里，只有用户打开"目标与承诺金"页才触发。

**影响**：如果一个用户立了承诺后一周不开这个页面，上周的承诺永远处于 `active`，押金不会返还也不会扣除，钱包余额、资金流水、首页"本周进度"全部显示错误状态。**自我约束类功能一旦失去可信度就彻底失效了**。

**建议做法**（按推荐度排序）：

1. **Supabase 定时任务**（最优）：用 `pg_cron` 每周一 00:05 跑一次结算 SQL，结算逻辑从客户端下沉到数据库函数；
2. **Edge Function + Cron**：保留 TS 逻辑，用 Supabase Scheduled Function 触发；
3. **兜底**：至少把 `settleExpiredCommitments` 提到 App 启动时（`AuthContext` 或 `LogsContext`）执行，而不是等用户点进某个页面。

---

### A-5 硬编码的考试日期出现在两个文件

**证据**

```ts
// src/pages/Home.tsx
const DEFAULT_TARGET = new Date('2026-12-20T00:00:00')

// src/components/Countdown.tsx
const DEFAULT_TARGET = new Date('2026-12-20T00:00:00')
```

同一常量在**两处**硬编码，且这个日期本身有时效性。

**影响**

- 对"通用学习打卡工具"的定位不匹配：一个考公、考雅思、考证的用户第一次打开，看到的是考研日期；
- 2026-12-20 之后倒计时会变成「倒计时已结束！」并且一直保持，新用户会以为是坏掉的页面；
- 两处硬编码意味着改的时候容易只改一处，导致首页与倒计时组件显示的日期不一致。

**建议做法**

```ts
// src/lib/constants.ts —— 单一来源
export const DEFAULT_TARGET_DATE = '2026-12-20'
export const resolveTargetDate = (dateStr: string | null): Date => { /* 统一实现 */ }
```

更根本的建议：**未设置目标时不显示倒计时数字，改为引导卡片**「设定你的目标日期，开始倒计时 →」，跳 `/settings`。这比给一个假日期体验更好，也顺手解决了"通用工具"的定位问题。

---

### A-6 待办清单功能过薄，且删除语义与学习记录不一致

**证据**（`src/lib/todos.ts`）

```ts
export async function fetchMyTodos(userId: string): Promise<Todo[]> {
  const { data } = await supabase.from('todos').select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })   // 按创建时间升序，完成项混在中间
}
export async function deleteTodo(todoId: string) {
  const { error } = await supabase.from('todos').delete().eq('id', todoId)  // 硬删除
}
```

**三个问题**

| 问题 | 说明 |
|---|---|
| **排序不合理** | 按创建时间升序，已完成和未完成混排。用户打开首页最想看到的是"还没做的事"，现在要靠眼睛扫。应改为：未完成在前 + 已完成沉底（或折叠） |
| **硬删除** | 学习记录删除进回收站可恢复（`daily_logs.deleted_at` + `Trash.tsx`），待办删除直接消失。**同一个 App 里两套删除语义**，用户会困惑也会误删 |
| **无生命周期** | 没有截止日期、没有归档、没有"昨天未完成自动延续"。数据只增不减，`fetchMyTodos` 全量拉取，一年后列表会很长 |

**建议做法**

```ts
// 排序：未完成优先，同组内按创建时间
.order('done', { ascending: true })
.order('created_at', { ascending: false })
```

并考虑补齐最小可用的待办能力（按价值排序）：

1. **未完成置顶 + 已完成折叠**（必做，成本最低）
2. **软删除**：加 `deleted_at`，复用回收站（与学习记录统一）
3. **截止日期 + 逾期标红**（备考场景很实用）
4. **归档已完成的旧待办**，避免列表无限增长

---

### A-7 提醒时间只能从 3 个预设里选

**证据**：`REMINDER_PRESETS` 只有 `20:00 / 21:00 / 22:00` 三项。

**影响**：习惯 23:30 打卡、或想设 07:00 晨间提醒的用户无法设置。

**建议做法**：改为 `<input type="time">`，预设保留作为快捷按钮（两者并存体验最好）。

---

### A-8 英语打卡天数硬编码 150

**证据**：`Home.tsx` 中 `{checkinCount}/150 天`、`width: ${(checkinCount / 150) * 100}%`，文案里还有「柴荣老师 150 天」。而 `src/data/englishDaily.json`（754 KB）是数据源。

**影响**：语料一旦扩充（比如补到 180 天），需要在多处手工改 150；改漏就会出现进度条超过 100% 或分母不对。

**建议做法**：从数据源推导 `const TOTAL_DAYS = englishDaily.length`，或至少在 `src/lib/englishCheckin.ts` 里导出一个常量统一引用。

---

### A-9 主题系统"名不副实"：5 套主题其实是 2 套配色 + 3 种背景

**证据**

`src/lib/theme.ts` 定义了 5 个主题：

```ts
light / dark / dawn(晨光) / dusk(暮色) / starry(午夜繁星)
```

但 `src/index.css` 里 `@theme` 只定义了**字体与阴影**令牌，**没有任何颜色令牌**：

```css
@theme {
  --font-sans: ...;
  --shadow-card: ...;
  --shadow-card-hover: ...;
  --shadow-glow: ...;
}
```

全部颜色都靠组件里逐处硬编码（`text-indigo-600 dark:text-indigo-400`、`bg-gray-50 dark:bg-slate-900`…）。而 dawn / dusk / starry 只做了这件事：

```css
html[data-theme='dawn'] .theme-surface { background-image: linear-gradient(...); }
html[data-theme='dusk'] .theme-surface { background-image: linear-gradient(...); }
html[data-theme='starry'] .theme-surface { background-image: radial-gradient(...), linear-gradient(...); }
```

**影响**

- 用户切到「晨光 / 暮色 / 午夜繁星」，只有**页面背景**变了，卡片、按钮、强调色、图表配色完全不动。所谓"主题"实际是"背景皮肤"，与用户预期有落差；
- 没有颜色令牌 → 改一次品牌色要动上百处 → 这也是上一份报告里 **CSS 产物 155 KB 偏大**的根因之一。

**建议做法**：引入语义色令牌，让氛围主题真正参与配色：

```css
@theme {
  --color-surface: #ffffff;        /* 卡片底 */
  --color-surface-muted: #f8fafc;  /* 次级底 */
  --color-border: #e5e7eb;
  --color-brand: #4f46e5;          /* 强调色 */
  --color-text: #0f172a;
  --color-text-muted: #64748b;
}

html[data-theme='dusk'] {
  --color-surface: #1a2340;        /* 暮色主题下卡片偏蓝紫 */
  --color-brand: #818cf8;
  --color-border: #2a3356;
}
```

组件改用 `bg-surface border-border text-text-muted`，主题切换就能真正改变整站观感。**如果不想动这么大的改造，至少要诚实命名**——把 dawn/dusk/starry 从「主题」改称「背景风格」，别让用户期待落空。

---

## 二、功能层面 · B 类：功能缺口

### B-1 🔥 首页没有「今日已学 X 小时」

**证据**（`src/pages/Home.tsx`）：首页展示的统计是

- `stats.totalHours` → **累计时长**
- `stats.checkedDays` → **打卡天数**
- 本周进度 `actualHours / weekTarget`

**唯独没有"今天学了多久"。**

**影响**：对一个每日打卡工具来说，「今日已学 X 小时」是用户一天里最想看、最能驱动继续学的数字。现在用户要看到它，得点进"统计"页（而且统计页默认是按周聚合）。**首页把最有价值的数字漏掉了。**

**建议做法**：把首页那个三格里的「累计时长」换成「今日时长」，累计时长移到统计页或弱化展示。或者做成 4 格：今日 / 本周 / 连续打卡 / 累计。同时给出与昨日/目标的对比（如「今日 2.5h · 比昨天 +0.5h」），激励效果会明显强于静态数字。

---

### B-2 计时器没有番茄钟 / 休息提醒

**证据**：`StudyTimer.tsx`（1348 行）实现的是正计时 + 暂停/继续/放弃，没有「25 分钟专注 + 5 分钟休息」的模式，也没有休息到点提醒。`capacitor.config.ts` 注释里也写明本地通知是"计时到点提醒"用的，但没有番茄钟周期。

**影响**：备考用户大量使用番茄工作法；正计时需要用户自己盯时间，与"专注"的诉求相反。而且项目已经有前台服务（`TimerForegroundService`）和通知能力，加番茄钟的边际成本很低。

**建议做法**：加一个「番茄模式」开关（25/5 或自定义 45/10），到点用本地通知 + 声音提醒。复用现有 `LocalNotifications`（见 A-1 装好之后）。

---

### B-3 没有数据导入（与 A-3 同一问题，从用户视角单列）

已有 `exportAllData` → 下载 JSON。缺 `importAllData` → 无法恢复。**导出 + 导入才是完整的备份闭环**，目前只有一半。

---

### B-4 统计维度偏少

**现有**（`src/pages/Summary.tsx`）：总学习时长、打卡天数、分科目时长与占比、每日趋势、周期筛选（日/周/月/自定义）。

**缺失但备考场景很想要**：

| 指标 | 价值 |
|---|---|
| **今日 / 本周 已学时长**（首页也没有，见 B-1） | 最高频 |
| **平均每日时长 / 中位数** | 判断节奏是否稳定 |
| **最高效时段**（按 `startTime` 聚合小时段） | 找出自己的黄金学习时间 |
| **科目环比**（本周 vs 上周各科目） | 发现某科被落下 |
| **目标达成率历史曲线**（连续 N 周达标） | 强化承诺金的正反馈 |
| **连续打卡 vs 断签分布** | 看到自己的坚持模式 |

**建议做法**：`summary.ts` 已经是纯计算模块，加指标成本低、且**天然适合写单测**（与上一份报告的测试建议形成配合）。建议先补「平均每日时长」和「科目环比」两个——计算简单、信息增量大。

---

### B-5 周报 / 月报不能分享

**证据**：有 `WeeklyReport.tsx`（8718 字节）和 `WeeklySummary.tsx`（19208 字节，本周 vs 上周 + 反思笔记），但只能站内查看。

**影响**：学习类 App 最自然的传播路径是"晒周报"。现在用户想分享只能截图，而截图会把导航栏、其他信息一起截进去，观感差。

**建议做法**：加「生成分享图」——用 `html2canvas` 或直接 canvas 绘制一张固定尺寸（如 1080×1440）的周报卡片（本周时长、打卡天数、科目分布、一句格言），下载/分享。成本中等，但这是**唯一能让用户主动帮你传播的功能**。

---

### B-6 待办与日历、学习记录不联动

**证据**：`Calendar.tsx` 点击日期只展示当天的打卡明细（学习/健康/英语）；`TodoList` 只有 `content` / `done` / `created_at`，没有日期维度。

**影响**：用户无法回答"我 3 天前定了什么待办、做完了吗"，待办成了一个没有时间维度的悬浮清单。

**建议做法**：给 `todos` 加 `due_date`（可选），日历的日期详情里同时展示当天到期/完成的待办。

---

### B-7 承诺金只能设总时长，不能按科目设目标

**证据**：`weekly_commitments` 只有 `target_hours` 一个目标字段（见 `supabase-schema.sql` 与 `commitments.ts`）。

**影响**：真实备考需要"英语 8h + 数学 10h"这种分科目标。只有总时长时，用户可以用一科猛刷凑满总数，弱科依然被落下——这恰好削弱了承诺金作为约束工具的意义。

**建议做法**：`target_hours` 保留为总目标，另加可选的 `subject_targets` JSONB（`[{subjectId, hours}]`），首页与目标页展示分科达成情况。属于增强项，可排在后面。

---

### B-8 多端并发编辑无冲突处理

**证据**：`LogsContext` 从 Supabase 拉取日志，未见版本号 / 乐观锁 / 冲突合并逻辑。

**影响**：手机和电脑同时编辑同一天记录时，后写入的会覆盖先写入的（取决于更新语句形态）。概率不高，但一旦发生就是"我明明记了，怎么没了"这类最难排查的问题。

**建议做法**：至少加 `updated_at` 比较的乐观锁（写入前校验版本），冲突时提示用户选择保留哪一份。

---

### B-9 回收站只覆盖学习记录

**证据**：`Trash.tsx` 只处理 `daily_logs`（软删除）。待办（A-6）、健康记录（`meal_logs` / `water_intake` / `body_metrics`）删除后不可恢复。

**建议做法**：统一"删除 = 软删除"的约定，或在删除健康/待办记录时用 `ConfirmDialog` 明确提示"不可恢复"（`ConfirmDialog.tsx` 已存在，成本很低）。

---

## 三、界面层面 · C 类：一致性

### C-1 ⚠️ GoalPage 完全脱离全局卡片体系

**证据**

全局在 `src/index.css` 定义了统一卡片：

```css
@layer components {
  .card {
    @apply rounded-2xl border border-gray-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-14px_rgba(15,23,42,0.1)]
           dark:border-slate-800 dark:bg-slate-900 dark:shadow-none;
  }
  .card-hover { ... }
}
```

而 `GoalPage.tsx` 里**每一处卡片都是手写的**：

```tsx
// 错误态
<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 text-center">
// 本周承诺
<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 space-y-4">
// 历史承诺
<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 space-y-3">
// 资金流水
<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 space-y-3">
```

**三处差异**

| 属性 | 全局 `.card` | GoalPage 手写 |
|---|---|---|
| 圆角 | `rounded-2xl` | `rounded-xl` |
| 边框色 | `border-gray-200/70`（浅灰带透明度） | `border-gray-100`（更浅） |
| 阴影 | 自定义双层阴影 | `shadow-sm` |

**影响**：从首页点进「目标与承诺金」，卡片会明显"变样"——圆角更小、边框更淡、阴影更扁平。这是**一眼可见的不精致**，与整个 App 其他页面的观感割裂。`Summary.tsx` 也混用（有的用 `.card`、有的手写），同样的问题。

**建议做法**：全站检索 `rounded-xl shadow-sm border border-gray-100` 与 `rounded-xl shadow-sm border border-gray-100 dark:border-slate-700`，替换为 `.card` / `.card-hover`。顺手加一条 oxlint 规则或 code review 约定：**页面里不出现手写卡片样式**。

---

### C-2 ⚠️ 充值用 `window.prompt()`，与整体 UI 严重违和

**证据**（`src/pages/GoalPage.tsx`）

```tsx
const handleRecharge = async () => {
  const raw = window.prompt('输入虚拟充值金额（元）：')
  if (raw === null) return
  const amount = Number(raw)
  ...
}
```

**影响**

- 一个已经做到渐变横幅、自定义主题、精细阴影的 App，突然弹出一个**浏览器原生 prompt 对话框**（灰底、系统字体、不可控样式），视觉上完全出戏；
- 移动端 `window.prompt` 体验更差（部分 WebView 会直接忽略或显示为丑陋的系统弹窗）；
- 无法做输入校验提示、无法显示"当前余额 ¥X"这类辅助信息。

**建议做法**：项目里已经有 `ConfirmDialog.tsx`，扩展成支持输入框的 `PromptDialog`（或引入一个轻量 Modal 组件），在应用内完成充值输入。**这是投入最小、观感提升最明显的一处修改。**

---

### C-3 首页的桌面模式与移动模式是两套逐行重复的 JSX

**证据**（`src/pages/Home.tsx`，约 500 行）

`twoCol ? (...) : (...)` 两个分支里，下面这些块**几乎逐行重复**：

| 重复块 | 说明 |
|---|---|
| 打卡提醒卡片 | 完全相同的 `className` 与文案逻辑 |
| 连续打卡卡片 | 相同结构，仅 `gap-3` / `gap-2` 不同 |
| 本周进度卡片 | 同上 |
| Countdown + 阶段标签 + 三格统计 | 相同结构，仅字号 `text-base sm:text-lg` 与 `text-[15px]` 不同 |
| 英语长难句打卡入口 | 文案不同（桌面少一句"柴荣老师 150 天"），其余相同 |

**影响**：这是 UI 漂移的温床——已经能看到端倪（英语入口两版文案不一致、统计格字号规则不同）。改一处漏一处的概率很高。

**建议做法**：抽出 `CheckinReminderCard`、`StreakCard`、`WeekProgressCard`、`CountdownPanel`、`EnglishCheckinEntry` 五个组件，用 props 控制尺寸差异（如 `size="compact" | "normal"`）。首页文件能从 507 行降到 200 行以内，同时消除两套 UI 不一致的风险。

---

### C-4 emoji 与图标系统混用

**证据**

- 有完整的图标组件 `src/components/Icon.tsx`（`<Icon name="flame" />` 等），Sidebar 还用了另一套 `BlueIcons`；
- 但 `GoalPage.tsx` 的状态文案里用文本 emoji：`'✅ 目标达成'` / `'❌ 未达成'` / `'⏳ 进行中'`；
- Toast 也用 emoji（`show('保存失败：...', { icon: '❌' })`）；
- 首页打卡提醒用 `'🔥 连续打卡已断签...'` / `'✍️ 今天还没打卡...'`。

**影响**：同一语义（"成功/失败"）在不同位置一会儿是 SVG 图标、一会儿是 emoji，视觉语言不统一；emoji 在不同平台的渲染差异也大（Android 与 Windows 的 ✅ 字形不同）。

**建议做法**：定一条规则——**状态/功能图标统一用 `<Icon>`，emoji 只用于轻量情感点缀**（如 Toast 的图标位、空状态的插画感文案）。`statusMeta` 里的三个 emoji 换成 `<Icon name="check" />` / `<Icon name="x" />` / `<Icon name="clock" />`。

---

## 四、界面层面 · D 类：布局与交互

### D-1 ⚠️ BottomTab 高亮错页（纯 bug）

**证据**（`src/components/BottomTab.tsx`）

```ts
const getActiveKey = (): string => {
  const { pathname } = location
  if (pathname === '/') return 'home'
  if (pathname === '/english-checkin') return 'checkin'
  if (pathname === '/my-records' || pathname === '/my-records/new' || /^\/my-records\/[^/]+$/.test(pathname)) return 'records'
  if (pathname === '/timer') return 'timer'
  if (pathname === '/summary') return 'summary'
  if (pathname === '/health') return 'health'
  return 'profile'          // ← 兜底：所有未列举的路径都算「我的」
}
```

未覆盖的路径有：`/weekly-summary`、`/vocabulary`、`/achievements`、`/goal`、`/settings`、`/trash`、`/scan-qr`、`/login`、`/register` 等。

**影响**：用户从首页点进「周总结 / 生词本 / 成就 / 目标 / 设置 / 回收站」时，**底部导航会错误地高亮"我的"**。

对比：桌面端 `Sidebar.tsx` 的 `getActiveKey` 处理得**正确**（覆盖了全部 11 个路径）。所以这是移动端独有的 bug。

**建议做法**

```ts
const ROUTE_TAB: [RegExp, string][] = [
  [/^\/$/, 'home'],
  [/^\/english-checkin/, 'checkin'],
  [/^\/my-records/, 'records'],       // 前缀匹配，覆盖 /new 与 /:id/edit
  [/^\/timer/, 'timer'],
  [/^\/summary/, 'summary'],
  [/^\/health/, 'health'],
]
const getActiveKey = () =>
  ROUTE_TAB.find(([re]) => re.test(pathname))?.[1] ?? 'profile'
```

---

### D-2 ⚠️ 移动端底部 7 个 Tab 过多，且与桌面顺序不一致

**证据**

| 端 | 入口 | 数量 |
|---|---|---|
| 移动端 BottomTab | 首页 / **打卡** / **记录** / **计时** / 统计 / 健康 / 我的 | **7** |
| 桌面端 Sidebar | 首页 / **计时** / **打卡** / **记录** / 统计 / 周总结 / 生词 / 成就 / 目标 / 健康 / 我的 | 11 |

**两个问题**

1. **7 个超过移动端常规上限**。iOS HIG 建议 5 个，Android Material 建议 3–5 个。按 375px 宽的 iPhone SE 算，每个 Tab 只有约 53px，而文字是 `text-[10px]`——已经到可读性下限，点击热区也偏小。7 个还会让"健康"这类低频功能占据宝贵的首屏位置。
2. **顺序不一致**。移动端「打卡」在「记录」前、「计时」在「记录」后；桌面端「计时」在「打卡」前。跨端使用的用户（这个项目同时有 Web/Android/桌面三端）会形成肌肉记忆冲突。

**建议做法**

- 底部收敛到 **5 个**：首页 / 打卡 / 计时 / 统计 / 我的。把「记录」并入首页与「我的」，「健康」移入「我的」或首页卡片；
- 两端顺序**统一为同一份配置**（把 `NAV_ITEMS` 抽到一个共享模块，两端按各自的展示规则从中筛选），从根上避免再次漂移。

---

### D-3 移动端存在功能可达性缺口

**证据**：桌面侧边栏有 11 个入口，移动端底部只有 7 个，差值里有 4 个功能：**周总结、生词本、成就、目标**。

其中：

- 「成就」「目标」在首页有卡片入口 ✅
- **「周总结」**：移动端只能从「统计」页顶部那张渐变卡片进入（`Summary.tsx` 里 `Link to="/weekly-summary"`）——路径深、发现性差
- **「生词本」**：移动端只能从「我的」页进入——一个高频的背单词功能被藏在三层之下

**影响**：桌面端用户和移动端用户看到的是两个不同的产品。

**建议做法**：移动端首页在合适位置补「生词本」与「周总结」入口（生词本可以放进英语打卡卡片旁边，周总结可以在周日/周一自动置顶提醒）。

---

### D-4 首页信息过载，首屏看不到日历

**证据**：移动端首页从上到下的模块顺序（`Home.tsx` 的 `else` 分支）：

1. 打卡提醒条
2. 连续打卡 + 本周进度（两格）
3. 英语长难句打卡入口
4. 待办事项清单
5. 倒计时 + 阶段标签 + 每日格言 + 累计时长/打卡天数/去打卡（三格）
6. 日历

**影响**：6 个大块纵向堆叠，用户要滑很久才看到日历。而"倒计时"这个最有情绪价值的信息被压在第 5 位。信息没有分级，每块都在抢注意力。

**建议做法**：按"每天第一眼最想知道什么"重排：

```
① 今日状态（今日已学 X 小时 + 连续 N 天 + 打卡按钮）  ← 合并、置顶
② 倒计时 + 阶段
③ 待办（未完成的前 3 条 + 展开）
④ 日历
⑤ 英语打卡 / 生词本（次要）
```

「每日格言」「本周分布」这类装饰性内容可以从首屏移到次级位置或折叠区。

---

### D-5 倒计时每秒重渲染

**证据**（`src/components/Countdown.tsx`）

```ts
useEffect(() => {
  const calc = () => { /* 计算 天/时/分/秒 */ }
  calc()
  intervalRef.current = setInterval(calc, 1000)   // 每秒一次
  return () => clearInterval(intervalRef.current)
}, [targetDate])
```

**影响**

- 「距考试还有 289 天」这种信息，秒数每秒跳动是**视觉噪音**（而且会分散注意力）；
- 每秒触发一次 `setState`，导致整个倒计时卡片（含阶段标签、三格统计）每秒重渲染一次。首页因此常驻一个 1Hz 的重渲染源，在低端 Android 上是可以感知的耗电与卡顿来源。

**建议做法**

- 显示粒度降到**天 + 时**（或剩余 <1 天时才显示分秒）；
- 刷新间隔相应改为 60s（或用 `setTimeout` 对齐到下一个整分）；
- 如确需秒级，把秒数拆成独立子组件，避免整卡重渲染。

---

### D-6 全站没有骨架屏

**证据**：`src/` 全量检索 `animate-pulse` 仅 **2** 处；loading 普遍用 spinner（`Summary.tsx`、`GoalPage.tsx`、`TodoList.tsx` 都是居中转圈）。

**影响**：首页同时有 4 个异步数据源（`logs` / `commitments` / `checkins` / `settings`）各自加载，加载完成时间不同 → 会出现"连续打卡先显示 0 天 → 跳成 12 天"、"本周进度先空 → 跳成 8.5/20h"这类**数字跳动**。spinner 只解决"知道在加载"，没解决"布局与数值的稳定感"。

**建议做法**：给首屏关键卡片（连续打卡、本周进度、今日时长、日历）加骨架屏，用固定高度的灰块占位，让布局先稳定下来，数值再填充。优先级：连续打卡/本周进度 > 日历 > 其他。

---

### D-7 桌面端布局判定用 JS media query，首帧会闪

**证据**（`src/main.tsx`）

```tsx
function WebRoot() {
  const isDesktop = useMediaQuery('(min-width: 640px)')
  const isWide = useMediaQuery('(min-width: 1024px)')
  return isDesktop ? <WebDesktopLayout forceTwoCol={isWide} /> : <App />
}
```

`useMediaQuery` 的初始值来自 `window.matchMedia(query).matches`（同步读，这点是对的 ✅），但 `WebDesktopLayout` 与 `App` 是**两套完全不同的布局树**（顶栏+侧边栏 vs 底部 Tab），窗口尺寸跨越断点时整棵树会重建。

**影响**：桌面浏览器窗口缩放到 640px 附近时，布局会在两种形态间来回切换；首次渲染也有一定概率先画出移动布局。

**建议做法**：低优先级。若要优化，用 CSS 控制两种布局的显隐（`hidden sm:flex` 之类），保持 DOM 结构稳定；或至少给断点切换加过渡。

---

### D-8 日历在窄屏可能过小

**证据**：用户既有约定是「日历 4:3 容器、5:4 日期格」（固定宽高比），`Calendar.tsx` 里 `expanded` 参数区分桌面/移动。

**影响**：固定比例在窄屏（<375px）会把日期格压得很小，日期数字与打卡标记的可读性下降。

**建议做法**：小屏改为**自适应高度**（去掉固定比例，让行高由内容决定），保证日期格最小可点击尺寸 ≥ 40px。

---

### D-9 侧边栏主题弹层缺键盘可达性

**证据**（`src/components/Sidebar.tsx`）：主题选择器有 `aria-expanded` ✅，但弹出层没有 `role="menu"`、没有 Esc 关闭、没有焦点陷阱与方向键导航；关闭靠一个全屏透明遮罩的 `onClick`。

**影响**：键盘用户无法用 Esc 关闭菜单，Tab 键会跑到遮罩后面的元素上。

**建议做法**：加 `onKeyDown` 处理 Esc，给弹层加 `role="menu"` / 子项 `role="menuitem"`，并在打开时把焦点移到第一项。

> 值得肯定的是，全局已经写了 `:focus-visible` 焦点环样式（`src/index.css`），键盘可达性的基础是有的，只是这个弹层没接上。

---

### D-10 ARIA 覆盖偏薄

**证据**（`src/` 全量统计）

| 属性 | 出现次数 |
|---|---|
| `role=` | **1** |
| `aria-label` | 22 |

对比：`TodoList.tsx` 做得很好（`aria-pressed` / `role="switch"` / `aria-label` 齐全），`BottomTab` 有 `aria-current="page"` ✅，`Settings` 的开关有 `role="switch"` + `aria-checked` ✅。但**大量用 `<Link>` 包裹的整块卡片没有可访问名称**（首页的连续打卡卡、本周进度卡、英语打卡入口、Profile 的 `Row` 组件等）。

**建议做法**：给纯图标按钮补 `aria-label`（多数已有）；给卡片式 `Link` 补简短 `aria-label` 或确保内部有可读文本。

---

### D-11 空状态设计不统一

**证据**

- 有设计：`TodoList.tsx` →「暂无待办，给自己定一个小目标吧」✅
- 有设计：`Summary.tsx` →「本时间段暂无学习记录」+「新建学习记录」按钮 ✅
- **无设计**：`GoalPage.tsx` 的「历史承诺」「资金流水」在无数据时整块消失（`{transactions.length > 0 && ...}`），页面直接少一块，用户不知道是"没有"还是"没加载出来"

**建议做法**：抽一个 `EmptyState` 组件（图标 + 一句说明 + 可选行动按钮），统一"无数据"的表达。

---

### D-12 氛围主题的 `background-attachment: fixed` 有兼容性风险

**证据**（`src/index.css`）

```css
html[data-theme='dawn'] .theme-surface {
  background-image: linear-gradient(...);
  background-attachment: fixed;
}
```

`starry` 主题还叠了两层带 `animation` 的伪元素（`::before` / `::after`，`z-index: -1`）+ 每层 12–14 个 `radial-gradient`。

**影响**：`background-attachment: fixed` 在 iOS Safari（含 PWA 全屏模式）上支持不佳，常表现为背景随滚动位移或直接失效；两层 26 个 radial-gradient 的动画在低端 Android 上可能造成滚动掉帧。

**建议做法**：iOS 上降级为 `scroll`（用 `@supports` 或媒体查询）；starry 的闪烁动画考虑加 `prefers-reduced-motion` 尊重（`@media (prefers-reduced-motion: reduce) { animation: none }`）——这既是无障碍要求，也能省电。

---

## 五、优先级路线图

### 第一批：本周（低成本、高感知）

- [ ] **D-1** 修 BottomTab 高亮错页（改成前缀匹配表，约 5 行）
- [ ] **C-2** 干掉 `window.prompt`，改用应用内输入弹窗
- [ ] **C-1** GoalPage / Summary 手写卡片统一到 `.card`（纯样式替换）
- [ ] **B-1** 首页加「今日已学 X 小时」
- [ ] **A-7** 提醒时间支持自定义
- [ ] **A-8** 英语打卡天数从数据源推导

### 第二批：两周内（修功能硬伤）

- [ ] **A-1** 装 `@capacitor/local-notifications`，让打卡提醒在 App 端真正生效（**最高价值**）
- [ ] **A-2** 补齐导出缺失的 7 张表 + 移除 `qr_login_sessions` + 修正文案
- [ ] **A-4** 承诺金结算改为定时任务（pg_cron 或 Edge Function）
- [ ] **A-5** 硬编码考试日期统一到常量模块，未设置时改为引导卡片
- [ ] **A-6** 待办：未完成置顶 + 软删除（与学习记录统一）
- [ ] **D-2 / D-3** 移动端 Tab 收敛到 5 个，两端顺序统一，补周总结/生词本入口

### 第三批：一个月内（体验提升）

- [ ] **A-3 / B-3** 数据导入功能（补齐备份闭环）
- [ ] **C-3** 首页抽 5 个卡片组件，消除两套重复 JSX
- [ ] **D-5** 倒计时降频到分钟级 / 拆分秒级子组件
- [ ] **D-4** 首页信息重排（今日状态置顶，日历上移）
- [ ] **D-6** 首屏关键卡片加骨架屏
- [ ] **B-2** 番茄钟模式 + 休息提醒
- [ ] **B-4** 统计补「平均每日时长」「科目环比」
- [ ] **D-11** 统一 EmptyState 组件

### 第四批：增强项

- [ ] **A-9** 引入语义色令牌，让氛围主题真正参与配色（同时能显著减小 CSS 体积）
- [ ] **B-5** 周报生成分享图
- [ ] **B-7** 承诺金支持分科目目标
- [ ] **B-8** 多端并发编辑冲突处理
- [ ] **B-9** 健康记录 / 待办删除统一软删除
- [ ] **D-8 ~ D-12** 日历窄屏适配、键盘可达性、ARIA 补全、空状态、主题兼容性

---

## 六、值得保持的地方

功能与界面上同样有不少用心之处，重构时不要破坏：

| 实践 | 位置 | 说明 |
|---|---|---|
| 主题首帧防闪 | `index.html` 内联脚本 + `applyTheme()` | 在首帧渲染前就把 `data-theme` 与 `dark` 类打好，无白闪 |
| 五套主题含氛围渐变 | `theme.ts` + `index.css` | 晨光/暮色/午夜繁星的渐变与错峰闪烁，视觉效果做得比多数同类产品精致 |
| 键盘焦点环 | `index.css` `:focus-visible` | 全局统一，且正确排除了表单元素（表单自管 `focus:ring`） |
| 数字等宽 | `index.css` `font-feature-settings: "tnum"` | 统计数字对齐整齐，细节到位 |
| 统一组件样式层 | `index.css` `@layer components` 的 `.card` / `.card-hover` / `.btn-*` | 思路完全正确（GoalPage 只是没遵守） |
| 移动端安全区 | `BottomTab` 的 `pb-[env(safe-area-inset-bottom)]` | 刘海屏底部不被遮挡 |
| 待办的无障碍 | `TodoList.tsx` | `aria-pressed` / `role="switch"` / `aria-label` 齐全，是全站标杆 |
| 桌面双栏单屏 | `Home.tsx` 的 `twoCol` + `App.tsx` 的 `ScaleToFit` | 自适应缩放的收敛推导写进了注释，思路严谨 |
| 空状态文案 | `TodoList` / `Summary` | 有引导性（"给自己定一个小目标吧"），不是干巴巴的"无数据" |
| 深浅色双主题覆盖 | 全站 | `dark:` 变体覆盖完整，没有出现"某处只有浅色"的漏网 |

---

## 七、说明

- 本报告的界面结论来自**源码与样式类分析**，未做真机/多分辨率视觉验收。若要进一步确认视觉细节（间距节奏、对比度、窄屏挤压），建议补一轮**多分辨率截图评审**（375 / 768 / 1280 / 1600 四档），重点看首页、GoalPage、Health 三个页面。
- 功能结论均可通过源码复核，关键位置已在各条目内标注文件与行号线索。
