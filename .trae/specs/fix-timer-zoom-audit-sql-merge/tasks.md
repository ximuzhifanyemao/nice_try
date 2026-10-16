# Tasks

- [x] Task 1: ScaleToFit 稳定缩放改造（修复计时页增删科目整页跳动）
  - [x] 1.1 阅读 `src/App.tsx` 中 `ScaleToFit` 现状，明确 ResizeObserver → 立即重算 scale 的触发路径
  - [x] 1.2 引入静默窗口：内容/容器尺寸变化后 debounce（约 200ms）再执行测量重算；首次挂载仍立即测量
  - [x] 1.3 引入迟滞阈值：新旧 scale 差值绝对值 < 0.03 时保持原值不重渲染
  - [x] 1.4 引入平滑过渡：内层 scale 容器加 `transition`（仅视觉，不影响测量），剩余必要缩放渐变呈现
  - [x] 1.5 验证：`npm run lint` + `npm run build` 通过；确认增删科目不再整页跳动

- [x] Task 2: 用户视角系统体检 + 修复确认问题
  - [x] 2.1 按功能区逐项审计（认证登出、计时共享状态、记录 CRUD、目标/周报、日历/打卡、健康、英语/生词、回收站、扫码登录、OTA、设置/导出）
  - [x] 2.2 汇总为分级结论（P1/P2/P3，附带 file:line 依据）
  - [x] 2.3 修复全部确认的 P1 问题（登出跨用户计时数据串用）
  - [x] 2.4 修复低风险高价值的 P2 问题（提醒"今日"UTC 时区偏差）
  - [x] 2.5 回归验证：`npm run lint` + `npm run build` 通过

- [x] Task 3: 合并 SQL 迁移文件为单一幂等文件
  - [x] 3.1 通读根目录 `supabase-schema.sql` 与全部 `supabase-migration-*.sql`，确定依赖顺序（基础表 → RLS/RPC → 各功能模块）
  - [x] 3.2 重写 `supabase-schema.sql` 为单一合并文件：分节注释 + 按依赖顺序排列 + 全部幂等化（`IF NOT EXISTS`、`DROP POLICY IF EXISTS` + CREATE、触发器守卫）
  - [x] 3.3 删除根目录 15 个 `supabase-migration-*.sql`（`supabase/migrations/001_ota_setup.sql` 保留）
  - [x] 3.4 更新 `readme.md`、`scripts/upload-desktop-update.mjs` 中对旧迁移文件的引用（DEPLOYMENT.md 无相关引用）
  - [x] 3.5 全库检索确认无残留对已删除文件的引用

- [x] Task 4: 收尾验证与审计结论整理
  - [x] 4.1 运行 `npm run lint`、`npm run build` 全量通过
  - [x] 4.2 git status 复核：仅包含预期变更（无 apk/jdk/router 等大文件被误提交）
  - [x] 4.3 按 checklist.md 逐条核对，审计结论在此会话总结中给出

# Task Dependencies

- [Task 2] 与 [Task 3] 相互独立，可并行（由不同子代理执行）
- [Task 1] 独立，可与 [Task 2]/[Task 3] 并行
- [Task 4] 依赖 [Task 1]、[Task 2]、[Task 3] 全部完成