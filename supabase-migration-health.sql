-- ============================================
-- 饮食与体重（健康）功能 - Supabase 数据库迁移
-- 在 Supabase SQL Editor 中执行此文件
-- 功能：每日体重+体成分、每餐饮食记录、每100g营养、个人资料(用于建议摄入估算)
-- ============================================

-- 1. body_metrics：每日体重 + 可选体成分（体脂称数据）
-- 主键 (user_id, date)：同一天重复保存即覆盖（upsert）
CREATE TABLE IF NOT EXISTS public.body_metrics (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  body_fat_percent NUMERIC(5,2),
  muscle_kg NUMERIC(5,2),
  bmi NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_body_metrics_user_date
  ON public.body_metrics(user_id, date DESC);

ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own body metrics"
  ON public.body_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own body metrics"
  ON public.body_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own body metrics"
  ON public.body_metrics FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own body metrics"
  ON public.body_metrics FOR DELETE USING (auth.uid() = user_id);

-- 2. meal_logs：一餐（早/午/晚/加餐）
CREATE TABLE IF NOT EXISTS public.meal_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date
  ON public.meal_logs(user_id, date DESC);

ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own meals"
  ON public.meal_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meals"
  ON public.meal_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meals"
  ON public.meal_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own meals"
  ON public.meal_logs FOR DELETE USING (auth.uid() = user_id);

-- 3. meal_items：一餐内的各食品 + 每100g营养（能量 kJ，蛋白质/脂肪/碳水/糖 g，NRV）
-- 存 user_id 便于按用户聚合与 RLS 校验；meal_id 级联删除
CREATE TABLE IF NOT EXISTS public.meal_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID NOT NULL REFERENCES public.meal_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  amount_g NUMERIC(7,1) NOT NULL,
  energy_kj_per100g NUMERIC(8,1),
  protein_g_per100g NUMERIC(6,2),
  fat_g_per100g NUMERIC(6,2),
  carbs_g_per100g NUMERIC(6,2),
  sugar_g_per100g NUMERIC(6,2),
  nrv_percent NUMERIC(5,1),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_items_meal ON public.meal_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_items_user ON public.meal_items(user_id);

ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own meal items"
  ON public.meal_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meal items"
  ON public.meal_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meal items"
  ON public.meal_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own meal items"
  ON public.meal_items FOR DELETE USING (auth.uid() = user_id);

-- 4. health_profiles：个人资料，用于 BMR/TDEE 建议摄入估算（每用户一条，upsert）
CREATE TABLE IF NOT EXISTS public.health_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gender TEXT NOT NULL DEFAULT 'male' CHECK (gender IN ('male','female')),
  age INTEGER,
  height_cm NUMERIC(5,1),
  activity_level TEXT NOT NULL DEFAULT 'light'
    CHECK (activity_level IN ('sedentary','light','moderate','high','very_high')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.health_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own health profile"
  ON public.health_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health profile"
  ON public.health_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health profile"
  ON public.health_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own health profile"
  ON public.health_profiles FOR DELETE USING (auth.uid() = user_id);

-- 5. updated_at 触发器（复用现有 update_updated_at_column，若未创建则新建）
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_body_metrics_updated_at ON public.body_metrics;
CREATE TRIGGER update_body_metrics_updated_at
  BEFORE UPDATE ON public.body_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_meal_logs_updated_at ON public.meal_logs;
CREATE TRIGGER update_meal_logs_updated_at
  BEFORE UPDATE ON public.meal_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_profiles_updated_at ON public.health_profiles;
CREATE TRIGGER update_health_profiles_updated_at
  BEFORE UPDATE ON public.health_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. 权限授予（仅登录用户）
GRANT SELECT, INSERT, UPDATE, DELETE ON public.body_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_profiles TO authenticated;