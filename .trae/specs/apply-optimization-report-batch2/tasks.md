# Tasks

## Task 0: 收尾验证并提交当前工作区改动（基线）
- [x] SubTask 0.1 通读工作区 diff（BottomTab / Countdown / countdown.ts / PromptDialog / export / todos / englishCheckin / Home / GoalPage / Settings / Profile / QrLogin / LogCard / RangePicker / StudyTimer / WeeklyChart / Achievements / build.gradle），确认与本批目标一致、无无关或破坏性改动
- [x] SubTask 0.2 运行验证：`npm run lint`；按 `package.json` 既有脚本执行类型检查/构建（优先 `tsc --noEmit` 或项目等效命令，CloudBase 构建仍走 `build:deploy` 约定）；修复发现的问题
- [x] SubTask 0.3 仅提交本轮相关的已跟踪改动（不纳入未跟踪的 mp4 / 软著资料 / 文档等），提交信息说明「优化报告第一批 + 收尾」；提交后 `git status` 复核

## Task 1: A-1 App 端原生打卡提醒
依赖：无（可并行 Task 2/3/4/5，但涉及 android/ 目录，避免与其他任务并发写同一文件）
- [x] SubTask 1.1 安装 `@capacitor/local-notifications`（^8.x），执行 `npx cap sync android`（小图标沿用 `ic_stat_icon`，已在 capacitor.config.ts 配置）
- [x] SubTask 1.2 `reminder.ts` 增加原生调度能力：`syncNativeReminderSchedule(userId, cfg)`，维护未来 7 天滚动窗口（每个未打卡日期一条 `schedule.at` 本地时区时间点通知、固定 id 区间便于批量取消）
- [x] SubTask 1.3 `CheckinReminder.tsx` 接入原生路径：原生平台启用时收敛并重建调度（已打卡日期剔除）；增加 App 前台/状态变化时重算（复用现有 logs 判断「今日已打卡」）；登录/登出清理调度
- [x] SubTask 1.4 Settings 提醒开关与时间变更时：原生平台请求权限并重建调度；关闭时清理全部调度
- [x] SubTask 1.5 文案按平台区分（原生：「关闭 App 也能收到提醒」）；验证 lint + build 通过

## Task 2: A-3 数据导入闭环
依赖：Task 0（基线）完成后再动 export.ts/Profile.tsx
- [x] SubTask 2.1 `export.ts` 新增 `importAllData(userId, payload)`：校验 `schema_version` 与 data 结构；对 `TABLES` 内各行做「以 id 为键 upsert、user_id 归入当前用户」的合并（文件为准）；`meal_logs` 特殊两步写（先建日志取新 id，再写 `meal_items`）
- [x] SubTask 2.2 导入异常表单独容错并汇总报告，不中断整体；返回每表写入条数与失败清单
- [x] SubTask 2.3 Profile「设备与数据」新增「导入数据」Row（`<input type=file accept=.json>` 读取 → `ConfirmDialog` 展示影响范围与条数 → 确认执行 → 成功 toast 并提示刷新页面）

## Task 3: A-4 承诺金结算不依赖打开页面
依赖：无（可并行）
- [x] SubTask 3.1 抽取结算触发：登录成功后（AuthContext）以幂等方式调用 `settleExpiredCommitments(user.id)`（fire-and-forget、吞错）；GoalPage 原有调用保留作为兜底
- [x] SubTask 3.2 `supabase-schema.sql` 新增 `settle_expired_commitments_all()` 存储函数（幂等，按周汇总学习时长并结算 active 且已过期的承诺，含钱包流水写入），附 pg_cron `cron.schedule` 注释（每周一 00:05，创建扩展 `CREATE EXTENSION IF NOT EXISTS pg_cron`）供用户在控制台启用
- [x] SubTask 3.3 单测/手动验证幂等性（连续调用不重复结算）

## Task 4: A-6 待办软删除 + 回收站
依赖：无（可并行）
- [x] SubTask 4.1 `supabase-schema.sql` 的 todos 表增加 `deleted_at TIMESTAMPTZ`（`ADD COLUMN IF NOT EXISTS` 幂等）
- [x] SubTask 4.2 `todos.ts`：查询过滤 `deleted_at is null`；`deleteTodo` 改为软删除；新增 `fetchDeletedTodos` / `restoreTodo` / `permanentlyDeleteTodo`
- [x] SubTask 4.3 `Trash.tsx` 增加「待办」区块：展示已删待办，提供恢复 / 彻底删除；无数据时显示空状态说明
- [x] SubTask 4.4 TodoList 删除交互提示「已移入回收站」

## Task 5: D-3 首页二级功能入口
依赖：无（可并行，注意与 Task 0 若已改 Home.tsx 的冲突，串行执行）
- [x] SubTask 5.1 Home 移动端分支在英语打卡入口附近增加「生词本」「每周总结」紧凑快捷入口（图标 + 文案，点按跳转 /vocabulary、/weekly-summary）
- [x] SubTask 5.2 桌面端不重复显示入口；验证移动/桌面两分支视觉一致性

## Task 6: 收尾验证 + 提交
依赖：Task 1~5 全部完成
- [x] SubTask 6.1 `npm run lint` + 类型检查/构建全量通过；`npx cap sync android` 后 Android 工程可编译（若环境允许，`assembleRelease` 可不跑全量，仅 `:app:compileDebugJavaWithJavac` 或编译验证）
- [x] SubTask 6.2 按 checklist.md 逐条核对；修复遗留问题
- [x] SubTask 6.3 提交本批改动（不含无关未跟踪文件），git status 复核

# Task Dependencies
- [Task 0] 最先执行（任何复用 export/Profile/Home 的任务都依赖其完成提交）
- [Task 1] 独立但独占 android/ 与 package.json，不与 Task 2/4 并发
- [Task 2] 依赖 [Task 0]（export.ts 属基线提交范围）
- [Task 3] 独立可并行（仅动 AuthContext/commitments/supabase-schema.sql；schema 修改与 Task 4 的 schema 修改同文件，串行合并）
- [Task 4] 独立可并行（schema 与 Task 3 同文件，需串行编辑或合并一次提交）
- [Task 5] 依赖 [Task 0]（Home.tsx 属基线改动），与 Task 2/3/4 可并行
- [Task 6] 依赖 Task 1~5