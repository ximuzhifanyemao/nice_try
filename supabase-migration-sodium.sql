-- ============================================================
-- 把「糖(g)」改为「钠(mg)」：旧列 sugar_g_per100g → sodium_mg_per100g
-- 原字段存放的是糖(g)，与新语义（钠/100g 按 mg）不兼容，因此重命名后置空。
-- 在 Supabase SQL Editor 对已存在的库执行一次即可。
-- ============================================================

-- meal_items
ALTER TABLE public.meal_items RENAME COLUMN sugar_g_per100g TO sodium_mg_per100g;
UPDATE public.meal_items SET sodium_mg_per100g = NULL;

-- favorites
ALTER TABLE public.favorites RENAME COLUMN sugar_g_per100g TO sodium_mg_per100g;
UPDATE public.favorites SET sodium_mg_per100g = NULL;

-- custom_presets
ALTER TABLE public.custom_presets RENAME COLUMN sugar_g_per100g TO sodium_mg_per100g;
UPDATE public.custom_presets SET sodium_mg_per100g = NULL;