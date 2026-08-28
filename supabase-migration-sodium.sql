-- ============================================================
-- 把「糖(g)」改为「钠(mg/100g)」：sugar_g_per100g → sodium_mg_per100g
-- 原字段存放的是糖(g)，与新语义（钠/100g 按 mg）不兼容，因此旧列直接丢弃、新列置空。
-- 幂等：可重复执行，兼容 未迁移 / 已迁移 / 中途失败 各种状态。
-- 在 Supabase SQL Editor 对已存在的库执行即可（重复执行也不会报错）。
-- ============================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['meal_items', 'favorites', 'custom_presets']
  LOOP
    -- 1) 确保「钠」列存在且可空（缺失则补）
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'sodium_mg_per100g'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN sodium_mg_per100g NUMERIC(7,1)', t);
    END IF;

    -- 2) 若仍存在旧「糖」列（旧的存的是糖数据，与钠不通用），丢弃
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'sugar_g_per100g'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I DROP COLUMN sugar_g_per100g', t);
    END IF;

    -- 3) 旧数据置空，避免误读
    EXECUTE format('UPDATE public.%I SET sodium_mg_per100g = NULL', t);
  END LOOP;
END $$;