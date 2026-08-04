-- ============================================
-- 考研备考追踪网站 - Supabase 数据库 Schema
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================

-- 1. 创建 daily_logs 表
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  subjects JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- 每人每天只能有一条记录
  UNIQUE(user_id, date)
);

-- subjects JSONB 格式示例:
-- [
--   { "id": "math", "hours": 2.5 },
--   { "id": "english", "hours": 1.5 },
--   { "id": "ds", "hours": 2 }
-- ]

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON public.daily_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON public.daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs(user_id, date DESC);

-- 3. 启用 RLS
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略：任何人可读（公开时间线）
CREATE POLICY "Anyone can read daily_logs"
  ON public.daily_logs
  FOR SELECT
  USING (true);

-- 5. RLS 策略：仅认证用户可插入
CREATE POLICY "Authenticated users can insert own logs"
  ON public.daily_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. RLS 策略：仅本人可更新
CREATE POLICY "Users can update own logs"
  ON public.daily_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. RLS 策略：仅本人可删除
CREATE POLICY "Users can delete own logs"
  ON public.daily_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- 8. 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_logs_updated_at
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
