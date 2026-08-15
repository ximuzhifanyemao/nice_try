-- ============================================
-- 英语长难句 150 天打卡 - Supabase 迁移
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================

CREATE TABLE IF NOT EXISTS public.english_checkin (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 打卡天数（1-150，顺序打卡）
  day INTEGER NOT NULL CHECK (day >= 1 AND day <= 150),
  completed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, day)
);

CREATE INDEX IF NOT EXISTS idx_english_checkin_user ON public.english_checkin(user_id, day);

ALTER TABLE public.english_checkin ENABLE ROW LEVEL SECURITY;

-- 仅本人可读自己的打卡记录
CREATE POLICY "Users can read own english checkins"
  ON public.english_checkin
  FOR SELECT
  USING (auth.uid() = user_id);

-- 仅本人可插入自己的打卡记录
CREATE POLICY "Users can insert own english checkins"
  ON public.english_checkin
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 仅本人可删除自己的打卡记录（用于撤销打卡）
CREATE POLICY "Users can delete own english checkins"
  ON public.english_checkin
  FOR DELETE
  USING (auth.uid() = user_id);