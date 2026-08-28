-- ============================================================
-- 自定义食物预设表（用户按买到/实际吃的食品自建预设，可增删改）
-- 用法：在 Supabase SQL Editor 执行本文件
-- ============================================================

CREATE TABLE IF NOT EXISTS public.custom_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  energy_kj_per100g NUMERIC(6,2),
  protein_g_per100g NUMERIC(6,2),
  fat_g_per100g NUMERIC(6,2),
  carbs_g_per100g NUMERIC(6,2),
  sugar_g_per100g NUMERIC(6,2),
  suggest_grams NUMERIC(6,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

-- 启用行级安全
ALTER TABLE public.custom_presets ENABLE ROW LEVEL SECURITY;

-- 用户只能读写自己的自定义预设
DROP POLICY IF EXISTS "Users can read own custom_presets" ON public.custom_presets;
CREATE POLICY "Users can read own custom_presets"
  ON public.custom_presets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own custom_presets" ON public.custom_presets;
CREATE POLICY "Users can insert own custom_presets"
  ON public.custom_presets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own custom_presets" ON public.custom_presets;
CREATE POLICY "Users can update own custom_presets"
  ON public.custom_presets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own custom_presets" ON public.custom_presets;
CREATE POLICY "Users can delete own custom_presets"
  ON public.custom_presets FOR DELETE
  USING (auth.uid() = user_id);

-- 自动更新 updated_at 时间戳
CREATE OR REPLACE FUNCTION public.set_custom_presets_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_custom_presets_updated_at ON public.custom_presets;
CREATE TRIGGER set_custom_presets_updated_at
  BEFORE UPDATE ON public.custom_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_custom_presets_updated_at();