-- ============================================================
-- 收紧 daily_logs 的公开读策略（2026-08-28）
--
-- 背景：原 SELECT 策略为
--   USING (deleted_at IS NULL OR auth.uid() = user_id)
-- 即「任何匿名用户可读取所有用户的未删除学习记录」。
-- 该策略服务于「公开时间线」设想，但前端唯一的消费函数
-- fetchAllLogs() 已确认为死代码（无任何调用方），
-- 意味着数据对外可读却没有任何功能收益，纯属隐私暴露。
--
-- 本迁移将 SELECT 收紧为「仅本人可读（含自己的回收站）」。
-- 插入/更新/删除策略不变。
--
-- ⚠️ 需要在 Supabase Dashboard → SQL Editor 中手动执行。
-- ============================================================

-- 1. 删除旧的公开读策略
DROP POLICY IF EXISTS "Anyone can read active logs, owner can read trash"
  ON public.daily_logs;

-- 2. 换成仅本人可读（自己的未删除记录 + 自己回收站里的记录）
CREATE POLICY "Users can read own logs"
  ON public.daily_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- 顺带核对：以下三张表（wallets / wallet_transactions /
-- weekly_commitments）的 RLS 已于 supabase-migration-goals.sql
-- 启用并配了 owner-only 策略，且已通过匿名 API 探测验证线上生效
--（匿名查询返回空数组）。无需任何操作，此处仅作记录。
-- ============================================================
