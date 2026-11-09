-- ============================================================
-- 政治一页纸学习进度云端同步
-- 在 Supabase SQL Editor 中执行此文件
-- 进度结构：{ mastered: number[], saved: number[], review: number[],
--            visits: string[], last: number | null }
-- 每个用户一行，前端用 upsert(onConflict: user_id) 写入。
-- ============================================================

CREATE TABLE IF NOT EXISTS public.politics_progress (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  state      JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS：仅本人可读写自己的进度
ALTER TABLE public.politics_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "politics_progress_select_own" ON public.politics_progress;
CREATE POLICY "politics_progress_select_own"
  ON public.politics_progress
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "politics_progress_insert_own" ON public.politics_progress;
CREATE POLICY "politics_progress_insert_own"
  ON public.politics_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "politics_progress_update_own" ON public.politics_progress;
CREATE POLICY "politics_progress_update_own"
  ON public.politics_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.politics_progress TO authenticated;

-- ── 回滚（如需撤销此迁移） ──
-- DROP POLICY IF EXISTS "politics_progress_select_own" ON public.politics_progress;
-- DROP POLICY IF EXISTS "politics_progress_insert_own" ON public.politics_progress;
-- DROP POLICY IF EXISTS "politics_progress_update_own" ON public.politics_progress;
-- DROP TABLE IF EXISTS public.politics_progress;
