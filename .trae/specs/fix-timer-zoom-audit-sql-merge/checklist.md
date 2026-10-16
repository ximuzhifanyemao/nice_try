# Checklist 验收清单

## Task 1: ScaleToFit 稳定缩放
- [x] `src/App.tsx` 的 ScaleToFit 已引入静默窗口（内容变化后延迟约 200ms 再重算）
- [x] ScaleToFit 已引入迟滞阈值（新旧 scale 差 < 0.03 时保持原值）
- [x] ScaleToFit 已引入平滑过渡（scale 变化不再瞬跳）
- [x] 首页双栏单屏不受影响（首页按现状跳过缩放逻辑）
- [x] 在全部功能计时页中添加/删除科目不再出现整页缩放跳动（代码层面论证 + lint/build 通过）

## Task 2: 系统体检与修复
- [x] 已完成各功能区审计，结论含 file:line 依据与 P1/P2/P3 分级
- [x] 所有确认的 P1 问题已修复（登出跨用户计时数据串用）
- [x] 选定的 P2 问题已修复（提醒"今日"UTC 时区偏差；范围明确且未扩大）
- [x] lint + build 通过，未引入回归

## Task 3: SQL 合并
- [x] 根目录存在单一合并迁移文件（`supabase-schema.sql`，1055 行），覆盖原 schema + 全部 15 个迁移内容
- [x] 合并文件语句按依赖顺序排列且全部幂等（63 处 `DROP POLICY IF EXISTS` 守卫等，可对存量库安全重跑）
- [x] 根目录 15 个 `supabase-migration-*.sql` 已删除；`supabase/migrations/001_ota_setup.sql` 保留
- [x] `readme.md` / `scripts/upload-desktop-update.mjs` 中旧迁移引用已全部更新（DEPLOYMENT.md 本无引用）
- [x] 全库检索（rg）确认无对已删除文件的残留引用

## Task 4: 收尾
- [x] `npm run lint` 通过（0 errors，30 条既有 warning）
- [x] `npm run build` 通过（含 ScaleToFit 修复后的复验）
- [x] git status 仅包含预期变更，无大文件混入（gradle/Cargo.toml 为先前 cap:sync 产物，未动）
- [x] 审计结论已在最终回复中向用户给出（含 P1/P2/P3 摘要）