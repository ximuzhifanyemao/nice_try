-- ============================================
-- 回收站（软删除）功能迁移
-- 在 Supabase Dashboard → SQL Editor 中执行
-- 注意：请先执行此文件，再使用新版前端代码
-- ============================================

-- 1. daily_logs 新增软删除标记列（NULL=正常记录，非 NULL=在回收站）
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. 将 UNIQUE(user_id, date) 约束改为"仅未删除记录"的部分唯一索引，
--    这样同一天记录删除进回收站后，仍可再新建当天的记录而不冲突
ALTER TABLE public.daily_logs DROP CONSTRAINT IF EXISTS daily_logs_user_id_date_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_logs_user_date_active
  ON public.daily_logs (user_id, date)
  WHERE deleted_at IS NULL;

-- 3. 回收站查询索引（按用户 + 删除时间倒序）
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_deleted
  ON public.daily_logs (user_id, deleted_at DESC);

-- 4. 调整读取策略：正常记录任何人可读（公开时间线），回收站中的记录仅本人可见
--    注意：CREATE POLICY 不支持 IF NOT EXISTS，故先 DROP 同名 policy 再 CREATE
DROP POLICY IF EXISTS "Anyone can read daily_logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Anyone can read active logs, owner can read trash" ON public.daily_logs;
CREATE POLICY "Anyone can read active logs, owner can read trash"
  ON public.daily_logs
  FOR SELECT
  USING (deleted_at IS NULL OR auth.uid() = user_id);
