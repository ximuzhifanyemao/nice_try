# 优化报告第二批 + 收尾提交 Spec

## Why
第三方模型出具的《DiveDeep（kaoyan-tracker）功能与界面优化建议报告》（基线 main @ 3702a84 / v1.14.6）已按「第一批」落地大部分改动，但全部处于**未提交、未验证**状态。报告第二批里仍存在高价值功能硬伤：打卡提醒在 App 端等于没有（A-1）、导出没有导入闭环（A-3）、承诺金结算依赖打开目标页（A-4）、待办硬删除语义与学习记录不一致（A-6）；另有移动端二级功能入口缺失（D-3）。

本次规格：先验证并提交当前工作区批量改动作为基线，再完成第二批剩余项，使报告第一批/第二批全部闭环。

## What Changes
- 验证（lint/build/类型检查）当前未提交的工作区改动，修复问题后**提交为一个基线 commit**
- **A-1** App 端（Android）打卡提醒真正生效：安装 `@capacitor/local-notifications`，`npx cap sync android`，原生侧滚动窗口调度（跳过已打卡日期），Web 侧行为不变
- **A-3/B-3** 数据导入闭环：`importAllData` + Profile「设备与数据」导入入口（文件选择 + 影响范围确认弹窗），合并策略、文件为准
- **A-4** 承诺金结算不再依赖打开目标页：登录后启动即结算（幂等），并提供可选 SQL 定时任务（存储函数 + pg_cron 注释）
- **A-6** 待办软删除：`todos.deleted_at` 列 + 软删除/恢复/彻底删除 API + 回收站展示待办
- **D-3** 移动端首页补「生词本」「每周总结」快捷入口
- 更新 `supabase-schema.sql`（todos 加 `deleted_at`、结算存储函数），保持单文件幂等约定

## Impact
- 受影响规格：fix-timer-zoom-audit-sql-merge（SQL 单文件幂等约定继续遵守）、fix-subject-history-name-and-batch-delete（回收站页面扩展）
- 受影响代码：
  - `src/lib/reminder.ts`、`src/components/CheckinReminder.tsx`、`src/pages/Settings.tsx`（A-1）
  - `src/lib/export.ts`（A-3）、`src/pages/Profile.tsx`（A-3 入口 + 复用 Row）
  - `src/lib/commitments.ts`、`src/contexts/AuthContext.tsx`、`supabase-schema.sql`（A-4）
  - `src/lib/todos.ts`、`src/pages/Trash.tsx`（A-6）
  - `src/pages/Home.tsx`（D-3）
  - `package.json`、`android/`（cap sync 产物，A-1）
- 新增代码：无（复用 PromptDialog / ConfirmDialog / Row / Icon）

## ADDED Requirements

### Requirement: App 端原生打卡提醒（A-1）
系统 SHALL 在 Android（Capacitor）原生侧按用户设定时间调度打卡提醒，使 App 关闭时仍能收到通知；Web/桌面端维持现有浏览器 Notification 行为。

#### Scenario: 开启提醒并调度
- **WHEN** 用户在 Android 上的设置页开启「打卡提醒」（含自定义时间）
- **THEN** 请求通知权限；授权后取消旧调度并重建未来 7 天内所有「当日尚未打卡」日期的本地通知（时间点 = 用户设定时分的本地时区）

#### Scenario: 当日已打卡则当天不提醒
- **WHEN** 用户当天已生成学习记录，且 App 回到前台/状态刷新触发重算
- **THEN** 该日期的提醒从调度中剔除；其余未打卡日期不受影响

#### Scenario: 现有 Settings 文案
- **THEN** 「提醒只在打开 DiveDeep 时生效」的描述仅在 Web 端保留；原生端注明「关闭 App 也能收到提醒」

### Requirement: 数据导入闭环（A-3）
系统 SHALL 支持从导出 JSON 恢复/合并个人数据，形成「导出 = 备份、导入 = 恢复」闭环。

#### Scenario: 从导出文件导入
- **WHEN** 用户在 Profile「设备与数据」选择导入数据并选择导出的 JSON 文件
- **THEN** 校验 schema 与结构后弹出影响说明；确认后按「合并、文件为准」逐表 upsert，命令用户刷新页面查看结果

#### Scenario: meal_logs 嵌套数据
- **THEN** meal_logs 与 meal_items 按新记录 id 两步写入，保证餐次与食物条目关联不丢失

### Requirement: 承诺金结算不依赖页面打开（A-4）
系统 SHALL 在用户登录后自动结算过期承诺（幂等），并提供服务端定时结算的可选 SQL 路径。

#### Scenario: 两周未打开目标页
- **WHEN** 用户登录（任意页面）
- **THEN** 过期承诺被结算，钱包余额/流水/首页周进度立即反映正确状态，无需打开「目标与承诺金」

#### Scenario: SQL 定时任务（可选）
- **THEN** `supabase-schema.sql` 提供 `settle_expired_commitments_all()` 存储函数与 pg_cron 调度注释，用户可在 Supabase 控制台启用周一定时执行

### Requirement: 待办软删除并可回收（A-6）
待办删除 SHALL 采用软删除（`deleted_at`），与学习记录回收站语义一致。

#### Scenario: 删除待办
- **WHEN** 用户删除一条待办
- **THEN** 记录进入回收站（列表隐藏），提示「已移入回收站」

#### Scenario: 回收站恢复/彻底删除
- **WHEN** 用户在回收站查看待办，选择恢复或彻底删除
- **THEN** 恢复回列表 / 从数据库永久删除

### Requirement: 首页二级功能入口（D-3）
移动端首页 SHALL 提供「生词本」「每周总结」直达入口，减少功能深埋。

#### Scenario: 移动端浏览首页
- **THEN** 首页出现紧凑快捷入口（生词本 → /vocabulary、每周总结 → /weekly-summary），桌面端不重复显示（侧边栏已有）

## MODIFIED Requirements

### Requirement: 打卡提醒机制分层
现有 `reminder.ts`/`CheckinReminder.tsx` 仅支持 Web Notification（App 关闭即失效）。A-1 改造后：原生平台走 LocalNotifications，Web 保留 Notification，两者共用同一份 `ReminderConfig` 与「当日已打卡则不提醒」语义。

### Requirement: 数据导出维护约定
`export.ts` 的 `TABLES` 清单（已含 18 表 + `schema_version: 2`）继续作为单一来源；新增 `importAllData` 与其共用该清单，保证导入导出范围一致。

## REMOVED Requirements
无（本轮不删除既有功能；不触碰用户当前工作区中与本批无关的改动）。

**Reason**: 本规格强调收尾已有改动而非回滚。
**Migration**: 基线 commit 提交前仅做验证与必要修复，不改动尚在推进中的第三方会话产物（如未提交的 mp4/软著资料等未跟踪文件，不纳入提交）。