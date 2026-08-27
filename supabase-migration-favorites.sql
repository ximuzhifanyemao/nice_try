-- ============================================================
-- 食物收藏表（用于"添加餐次"时快捷选择，避免每次重输完整营养表）
-- 用法：在 Supabase SQL Editor 执行本文件
-- ============================================================

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  energy_kj_per100g NUMERIC(6,2),
  protein_g_per100g NUMERIC(6,2),
  fat_g_per100g NUMERIC(6,2),
  carbs_g_per100g NUMERIC(6,2),
  sugar_g_per100g NUMERIC(6,2),
  usage_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, food_name)
);

-- 启用行级安全
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 用户只能读写自己的收藏
DROP POLICY IF EXISTS "Users can read own favorites" ON public.favorites;
CREATE POLICY "Users can read own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorites" ON public.favorites;
CREATE POLICY "Users can insert own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own favorites" ON public.favorites;
CREATE POLICY "Users can update own favorites"
  ON public.favorites FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;
CREATE POLICY "Users can delete own favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- 自动更新 updated_at 时间戳
DROP TRIGGER IF EXISTS set_favorites_updated_at ON public.favorites;
CREATE TRIGGER set_favorites_updated_at
  BEFORE UPDATE ON public.favorites
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- RPC: 收藏使用次数 +1（安全地按 (user_id, food_name) 原子累加）
CREATE OR REPLACE FUNCTION public.bump_favorite_usage(p_user_id UUID, p_food_name TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.favorites
  SET usage_count = usage_count + 1
  WHERE user_id = p_user_id AND food_name = p_food_name;
$$;

-- 允许匿名/认证用户调用（由 SECURITY DEFINER 控制实际权限）
GRANT EXECUTE ON FUNCTION public.bump_favorite_usage(UUID, TEXT) TO authenticated, anon;
