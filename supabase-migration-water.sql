-- ============================================================
-- 饮水记录表（water_intake，按用户+日期存"标准杯数"，一杯 250ml）
-- 用法：在 Supabase SQL Editor 执行本文件
-- ============================================================

CREATE TABLE IF NOT EXISTS public.water_intake (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  cups INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

-- 启用行级安全
ALTER TABLE public.water_intake ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own water" ON public.water_intake;
CREATE POLICY "Users can read own water"
  ON public.water_intake FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own water" ON public.water_intake;
CREATE POLICY "Users can insert own water"
  ON public.water_intake FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own water" ON public.water_intake;
CREATE POLICY "Users can update own water"
  ON public.water_intake FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own water" ON public.water_intake;
CREATE POLICY "Users can delete own water"
  ON public.water_intake FOR DELETE
  USING (auth.uid() = user_id);

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION public.set_water_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_water_updated_at ON public.water_intake;
CREATE TRIGGER set_water_updated_at
  BEFORE UPDATE ON public.water_intake
  FOR EACH ROW
  EXECUTE FUNCTION public.set_water_updated_at();