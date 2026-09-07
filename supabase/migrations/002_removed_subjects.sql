-- ============================================================
-- 已删除科目名快照（云端同步）
-- 在 Supabase SQL Editor 中执行此文件
-- 解决：删除科目记录只存本机 localStorage，换设备/清缓存后
-- ensureBuiltinMigration 会误判「从未删过」并依据打卡记录自动重建已删科目。
-- 此表让删除记录在所有设备间共享。
-- ============================================================

-- 1. 创建删除记录表
-- id 为科目 id 或内置 legacy_id（如 'math'、'os'）；(user_id, id) 复合主键保证
-- 不同用户可各自删除同名内置 legacy_id，互不影响。
CREATE TABLE IF NOT EXISTS public.removed_subjects (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id         TEXT NOT NULL,                    -- 科目 id 或 legacy_id
  name       TEXT NOT NULL,                    -- 删除时的科目名（历史记录回显用）
  category   TEXT NOT NULL DEFAULT 'custom',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, id)
);

-- 2. RLS 策略：仅本人可读写自己的删除记录
ALTER TABLE public.removed_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "removed_subjects_select_own" ON public.removed_subjects;
CREATE POLICY "removed_subjects_select_own"
  ON public.removed_subjects
  FOR SELECT
  USING (auth.uid() = user_id);

-- upsert（onConflict: user_id,id）需要 INSERT + UPDATE 权限
DROP POLICY IF EXISTS "removed_subjects_insert_own" ON public.removed_subjects;
CREATE POLICY "removed_subjects_insert_own"
  ON public.removed_subjects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "removed_subjects_update_own" ON public.removed_subjects;
CREATE POLICY "removed_subjects_update_own"
  ON public.removed_subjects
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. 权限授予
GRANT SELECT, INSERT, UPDATE ON public.removed_subjects TO authenticated;

-- ── 回滚（如需撤销此迁移） ──
-- DROP POLICY IF EXISTS "removed_subjects_select_own" ON public.removed_subjects;
-- DROP POLICY IF EXISTS "removed_subjects_insert_own" ON public.removed_subjects;
-- DROP POLICY IF EXISTS "removed_subjects_update_own" ON public.removed_subjects;
-- DROP TABLE IF EXISTS public.removed_subjects;