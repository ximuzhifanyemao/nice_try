-- ============================================
-- 考研备考追踪网站 - Supabase 数据库 Schema（合并总文件）
-- 在 Supabase SQL Editor 中执行此文件
--
-- 本文件已合并根目录下全部 supabase-migration-*.sql 迁移，
-- 覆盖：基础打卡 / 虚拟钱包与每周承诺 / 回收站 / RLS 收紧 /
-- 个性化科目 / 科目通用化与 legacy_id / 食物收藏 / 自定义预设 /
-- 健康（体重/饮食/资料）/ 饮水 / 英语打卡 / 生词同步 / 扫码登录 /
-- 钠字段迁移 / 桌面端版本 等全部模块。
--
-- 幂等设计：所有语句均可重复执行（CREATE IF NOT EXISTS、
-- 建索引 IF NOT EXISTS、建策略前先 DROP、触发器前先 DROP 等），
-- 即使数据库已部分/全部执行过旧迁移，重复运行本文件也不会报错。
-- ============================================

-- ============================================
-- 一、基础表结构（原 supabase-schema.sql）
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
  -- 软删除标记：NULL=正常记录，非 NULL=在回收站（见下方迁移说明）
  deleted_at TIMESTAMPTZ
);

-- 注意：原 UNIQUE(user_id, date) 已改为"仅未删除记录"的部分唯一索引，
-- 使同一天记录删除进回收站后仍可再新建当天记录。
-- （原 demo 提示执行 supabase-migration-trash.sql，此合并文件已将其纳入下方第二节）
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_logs_user_date_active
  ON public.daily_logs (user_id, date)
  WHERE deleted_at IS NULL;

-- subjects JSONB 格式示例:
-- [
--   { "id": "math", "hours": 2.5, "activity": "练习", "startTime": "14:00", "endTime": "16:00" },
--   { "id": "english", "hours": 1.5, "activity": "单词", "summary": "背了 100 个" },
--   { "id": "ds", "hours": 2 }
-- ]
-- activity: 学习内容（做了什么），如 单词/听课/做题/练习/背诵/刷题，可省略
-- startTime/endTime: 可选，学习时间段（HH:mm，计时器自动记录），如 "14:00" / "16:00"

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON public.daily_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON public.daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_deleted ON public.daily_logs(user_id, deleted_at DESC);

-- 3. 启用 RLS
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略：正常记录任何人可读（公开时间线），回收站中的记录仅本人可见
-- （后续第 三 节 rls-daily-logs 会将 SELECT 收紧为仅本人可读）
DROP POLICY IF EXISTS "Anyone can read active logs, owner can read trash" ON public.daily_logs;
CREATE POLICY "Anyone can read active logs, owner can read trash"
  ON public.daily_logs
  FOR SELECT
  USING (deleted_at IS NULL OR auth.uid() = user_id);

-- 5. RLS 策略：仅认证用户可插入
DROP POLICY IF EXISTS "Authenticated users can insert own logs" ON public.daily_logs;
CREATE POLICY "Authenticated users can insert own logs"
  ON public.daily_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. RLS 策略：仅本人可更新
DROP POLICY IF EXISTS "Users can update own logs" ON public.daily_logs;
CREATE POLICY "Users can update own logs"
  ON public.daily_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. RLS 策略：仅本人可删除
DROP POLICY IF EXISTS "Users can delete own logs" ON public.daily_logs;
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

DROP TRIGGER IF EXISTS update_daily_logs_updated_at ON public.daily_logs;
CREATE TRIGGER update_daily_logs_updated_at
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 一（续）、虚拟承诺金 / 每周目标核心表（原 supabase-schema.sql）
-- 虚拟钱包 / 资金流水 / 每周承诺 表结构
-- ============================================

-- 虚拟钱包
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 资金流水
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('recharge', 'deposit', 'refund', 'forfeit')),
  amount NUMERIC(12,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 每周承诺（目标 + 押金，week_start 为周起点周一）
CREATE TABLE IF NOT EXISTS public.weekly_commitments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  target_hours NUMERIC(5,1) NOT NULL,
  deposit_amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost')),
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, week_start)
);

-- ============================================
-- 二、回收站（软删除）功能迁移（原 supabase-migration-trash.sql）
-- ============================================

-- 1. daily_logs 新增软删除标记列（NULL=正常记录，非 NULL=在回收站）
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. 将 UNIQUE(user_id, date) 约束改为"仅未删除记录"的部分唯一索引，
--    这样同一天记录删除进回收站后，仍可再新建当天的记录而不冲突
ALTER TABLE public.daily_logs DROP CONSTRAINT IF EXISTS daily_logs_user_id_date_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_logs_user_date_active
  ON public.daily_logs (user_id, date)
  WHERE deleted_at IS NULL;

-- 3. 回收站查询索引（按用户 + 删除时间倒序）
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_deleted
  ON public.daily_logs (user_id, deleted_at DESC);

-- 4. 调整读取策略：正常记录任何人可读（公开时间线），回收站中的记录仅本人可见
--    注意：CREATE POLICY 不支持 IF NOT EXISTS，故先 DROP 同名 policy 再 CREATE
DROP POLICY IF EXISTS "Anyone can read daily_logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Anyone can read active logs, owner can read trash" ON public.daily_logs;
CREATE POLICY "Anyone can read active logs, owner can read trash"
  ON public.daily_logs
  FOR SELECT
  USING (deleted_at IS NULL OR auth.uid() = user_id);

-- ============================================
-- 三、收紧 daily_logs 的公开读策略（原 supabase-migration-rls-daily-logs.sql）
--
-- 背景：原 SELECT 策略为「任何匿名用户可读取所有用户的未删除学习记录」，
-- 服务于「公开时间线」设想，但前端唯一消费函数 fetchAllLogs() 已确认为死代码，
-- 数据对外可读却无功能收益，纯属隐私暴露。本段将 SELECT 收紧为「仅本人可读」。
-- ============================================
DROP POLICY IF EXISTS "Anyone can read active logs, owner can read trash"
  ON public.daily_logs;
DROP POLICY IF EXISTS "Users can read own logs" ON public.daily_logs;
CREATE POLICY "Users can read own logs"
  ON public.daily_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 四、虚拟承诺金 / 每周目标 完整迁移（原 supabase-migration-goals.sql）
-- 成就系统（本地计算）+ 虚拟承诺金（钱包/每周承诺/资金流水的 RLS、RPC）
-- ============================================

-- 1. 虚拟钱包：RLS 与策略（表结构已在上方创建，仅启用 RLS 并配置策略）
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own wallet" ON public.wallets;
CREATE POLICY "Users can read own wallet"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wallet" ON public.wallets;
CREATE POLICY "Users can insert own wallet"
  ON public.wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
CREATE POLICY "Users can update own wallet"
  ON public.wallets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. 资金流水：索引、RLS 与策略
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON public.wallet_transactions(user_id, created_at DESC);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own transactions" ON public.wallet_transactions;
CREATE POLICY "Users can read own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.wallet_transactions;
CREATE POLICY "Users can insert own transactions"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. 每周承诺：索引、RLS 与策略
CREATE INDEX IF NOT EXISTS idx_weekly_commitments_user
  ON public.weekly_commitments(user_id, week_start DESC);

ALTER TABLE public.weekly_commitments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own commitments" ON public.weekly_commitments;
CREATE POLICY "Users can read own commitments"
  ON public.weekly_commitments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own commitments" ON public.weekly_commitments;
CREATE POLICY "Users can insert own commitments"
  ON public.weekly_commitments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own commitments" ON public.weekly_commitments;
CREATE POLICY "Users can update own commitments"
  ON public.weekly_commitments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. 权限授予（匿名用户不涉及钱包/承诺，仅登录用户可操作）
GRANT SELECT, INSERT, UPDATE ON public.wallets TO authenticated;
GRANT SELECT, INSERT ON public.wallet_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.weekly_commitments TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE wallet_transactions_id_seq TO authenticated;

-- 5. RPC：虚拟充值（原子更新余额 + 写流水）
CREATE OR REPLACE FUNCTION public.recharge_wallet(
  p_user_id UUID,
  p_amount NUMERIC,
  p_note TEXT DEFAULT '虚拟充值'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id <> auth.uid() THEN
    RAISE EXCEPTION '无权限';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION '金额必须大于 0';
  END IF;

  INSERT INTO public.wallets(user_id, balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = wallets.balance + p_amount, updated_at = now();

  INSERT INTO public.wallet_transactions(user_id, type, amount, note)
  VALUES (p_user_id, 'recharge', p_amount, p_note);
END;
$$;

-- 6. RPC：创建/修改本周承诺（校验余额、扣押金、写流水，原子完成）
CREATE OR REPLACE FUNCTION public.create_commitment(
  p_user_id UUID,
  p_week_start DATE,
  p_target_hours NUMERIC,
  p_deposit_amount NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing public.weekly_commitments%ROWTYPE;
  cur_balance NUMERIC;
  delta NUMERIC;
BEGIN
  IF p_user_id <> auth.uid() THEN
    RAISE EXCEPTION '无权限';
  END IF;
  IF p_target_hours IS NULL OR p_target_hours <= 0 THEN
    RAISE EXCEPTION '目标时长必须大于 0';
  END IF;
  IF p_deposit_amount IS NULL OR p_deposit_amount <= 0 THEN
    RAISE EXCEPTION '承诺金额必须大于 0';
  END IF;

  SELECT * INTO existing
  FROM public.weekly_commitments
  WHERE user_id = p_user_id AND week_start = p_week_start;

  IF existing.id IS NOT NULL AND existing.status <> 'active' THEN
    RAISE EXCEPTION '该周已结算，无法修改';
  END IF;

  SELECT balance INTO cur_balance FROM public.wallets WHERE user_id = p_user_id;
  IF cur_balance IS NULL THEN
    cur_balance := 0;
  END IF;

  IF existing.id IS NOT NULL THEN
    -- 修改已有承诺：余额 + 旧押金 >= 新押金
    delta := p_deposit_amount - existing.deposit_amount;
    IF cur_balance < delta THEN
      RAISE EXCEPTION '余额不足，请先充值';
    END IF;
    UPDATE public.wallets
      SET balance = balance - delta, updated_at = now()
      WHERE user_id = p_user_id;
    UPDATE public.weekly_commitments
      SET target_hours = p_target_hours, deposit_amount = p_deposit_amount
      WHERE id = existing.id;
    IF delta <> 0 THEN
      INSERT INTO public.wallet_transactions(user_id, type, amount, note)
      VALUES (p_user_id, CASE WHEN delta < 0 THEN 'refund' ELSE 'deposit' END, abs(delta), '修改每周承诺');
    END IF;
  ELSE
    IF cur_balance < p_deposit_amount THEN
      RAISE EXCEPTION '余额不足，请先充值';
    END IF;
    UPDATE public.wallets
      SET balance = balance - p_deposit_amount, updated_at = now()
      WHERE user_id = p_user_id;
    INSERT INTO public.weekly_commitments(user_id, week_start, target_hours, deposit_amount)
    VALUES (p_user_id, p_week_start, p_target_hours, p_deposit_amount);
    INSERT INTO public.wallet_transactions(user_id, type, amount, note)
    VALUES (p_user_id, 'deposit', p_deposit_amount, '每周承诺押金');
  END IF;
END;
$$;

-- 7. RPC：结算已结束周（上周及更早）的活跃承诺
-- 按 daily_logs 中该周（week_start ~ week_start+6，周一起点）实际总时长判定：达标返还押金，未达标扣除
CREATE OR REPLACE FUNCTION public.settle_commitments(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.weekly_commitments%ROWTYPE;
  actual_hours NUMERIC;
  week_end DATE;
BEGIN
  IF p_user_id <> auth.uid() THEN
    RAISE EXCEPTION '无权限';
  END IF;

  FOR c IN
    SELECT * FROM public.weekly_commitments
    WHERE user_id = p_user_id AND status = 'active'
      AND week_start + 6 < CURRENT_DATE
  LOOP
    week_end := c.week_start + 6;

    SELECT COALESCE(SUM((sub.value->>'hours')::numeric), 0)
    INTO actual_hours
    FROM public.daily_logs dl
    CROSS JOIN LATERAL jsonb_array_elements(dl.subjects) AS sub
    WHERE dl.user_id = p_user_id
      AND dl.date >= c.week_start
      AND dl.date <= week_end
      AND dl.deleted_at IS NULL;

    IF actual_hours >= c.target_hours THEN
      -- 达标：押金返还到钱包
      UPDATE public.wallets
        SET balance = balance + c.deposit_amount, updated_at = now()
        WHERE user_id = p_user_id;
      INSERT INTO public.wallet_transactions(user_id, type, amount, note)
      VALUES (p_user_id, 'refund', c.deposit_amount, '目标达成，押金返还');
      UPDATE public.weekly_commitments
        SET status = 'won', settled_at = now()
        WHERE id = c.id;
    ELSE
      -- 未达标：押金扣除（已在本周开始时扣减，此处仅记录）
      INSERT INTO public.wallet_transactions(user_id, type, amount, note)
      VALUES (p_user_id, 'forfeit', c.deposit_amount, '目标未达成，押金扣除');
      UPDATE public.weekly_commitments
        SET status = 'lost', settled_at = now()
        WHERE id = c.id;
    END IF;
  END LOOP;
END;
$$;

-- 8. RPC 执行权限（仅登录用户）
GRANT EXECUTE ON FUNCTION public.recharge_wallet(UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_commitment(UUID, DATE, NUMERIC, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.settle_commitments(UUID) TO authenticated;

-- ============================================
-- 五、个性化配置（原 supabase-migration-customization.sql）
--  user_settings / user_subjects 及 RLS、权限
-- ============================================

-- 1. 用户个性化设置（每用户一条）：倒计时标题 + 目标日期
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  countdown_title TEXT NOT NULL DEFAULT '距离目标还有',
  target_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user ON public.user_settings(user_id);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own settings" ON public.user_settings;
CREATE POLICY "Users can read own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. 用户自定义科目（含学习内容），每用户可多行
CREATE TABLE IF NOT EXISTS public.user_subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'custom',
  activities JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_user_subjects_user ON public.user_subjects(user_id);

ALTER TABLE public.user_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own subjects" ON public.user_subjects;
CREATE POLICY "Users can read own subjects"
  ON public.user_subjects FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subjects" ON public.user_subjects;
CREATE POLICY "Users can insert own subjects"
  ON public.user_subjects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subjects" ON public.user_subjects;
CREATE POLICY "Users can update own subjects"
  ON public.user_subjects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own subjects" ON public.user_subjects;
CREATE POLICY "Users can delete own subjects"
  ON public.user_subjects FOR DELETE
  USING (auth.uid() = user_id);

-- 3. 权限授予
GRANT SELECT, INSERT, UPDATE ON public.user_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_subjects TO authenticated;

-- ============================================
-- 六、科目通用化：legacy_id 字段（原 supabase-migration-subject-rename.sql）
--  给 user_subjects 增加 legacy_id，关联旧内置科目 id（如 'math'）
-- ============================================

ALTER TABLE public.user_subjects ADD COLUMN IF NOT EXISTS legacy_id TEXT;

-- 每个 legacy_id 全局唯一（多个 NULL 互不冲突）
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subjects_legacy_id ON public.user_subjects(legacy_id);

-- ============================================
-- 七、legacy_id 唯一约束：全局 → 按用户（原 supabase-migration-legacy-per-user.sql）
--  移除全局唯一索引，改为「同一用户内唯一」，使每个用户都能各自迁移内置科目
-- ============================================

-- 移除旧的全局唯一索引
DROP INDEX IF EXISTS public.idx_user_subjects_legacy_id;

-- 新建「每用户」唯一索引（多个 NULL 互不冲突；同一用户同一 legacy_id 仍唯一，幂等）
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subjects_user_legacy
  ON public.user_subjects(user_id, legacy_id)
  WHERE legacy_id IS NOT NULL;

-- 校验提示：若历史数据中存在同一用户同 legacy_id 的重复行，上面的建索引会失败，
-- 请先执行下面语句检查重复（应返回 0 行，如有则在删除/合并重复后重试建索引）：
-- SELECT user_id, legacy_id FROM public.user_subjects
--   WHERE legacy_id IS NOT NULL GROUP BY user_id, legacy_id HAVING COUNT(*) > 1;

-- ============================================
-- 八、食物收藏表（原 supabase-migration-favorites.sql）
--  用于"添加餐次"时快捷选择，避免每次重输完整营养表
-- ============================================

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  energy_kj_per100g NUMERIC(6,2),
  protein_g_per100g NUMERIC(6,2),
  fat_g_per100g NUMERIC(6,2),
  carbs_g_per100g NUMERIC(6,2),
  sodium_mg_per100g NUMERIC(7,1),
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
CREATE OR REPLACE FUNCTION public.set_favorites_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_favorites_updated_at ON public.favorites;
CREATE TRIGGER set_favorites_updated_at
  BEFORE UPDATE ON public.favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.set_favorites_updated_at();

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

-- ============================================
-- 九、自定义食物预设表（原 supabase-migration-custom-presets.sql）
--  用户按买到/实际吃的食品自建预设，可增删改
-- ============================================

CREATE TABLE IF NOT EXISTS public.custom_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  energy_kj_per100g NUMERIC(6,2),
  protein_g_per100g NUMERIC(6,2),
  fat_g_per100g NUMERIC(6,2),
  carbs_g_per100g NUMERIC(6,2),
  sodium_mg_per100g NUMERIC(7,1),
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

-- ============================================
-- 十、饮食与体重（健康）功能（原 supabase-migration-health.sql）
--  每日体重+体成分、每餐饮食记录、每100g营养、个人资料
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

DROP POLICY IF EXISTS "Users can read own body metrics" ON public.body_metrics;
CREATE POLICY "Users can read own body metrics"
  ON public.body_metrics FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own body metrics" ON public.body_metrics;
CREATE POLICY "Users can insert own body metrics"
  ON public.body_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own body metrics" ON public.body_metrics;
CREATE POLICY "Users can update own body metrics"
  ON public.body_metrics FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own body metrics" ON public.body_metrics;
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

DROP POLICY IF EXISTS "Users can read own meals" ON public.meal_logs;
CREATE POLICY "Users can read own meals"
  ON public.meal_logs FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own meals" ON public.meal_logs;
CREATE POLICY "Users can insert own meals"
  ON public.meal_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own meals" ON public.meal_logs;
CREATE POLICY "Users can update own meals"
  ON public.meal_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own meals" ON public.meal_logs;
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
  sodium_mg_per100g NUMERIC(7,1),
  nrv_percent NUMERIC(5,1),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_items_meal ON public.meal_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_items_user ON public.meal_items(user_id);

ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own meal items" ON public.meal_items;
CREATE POLICY "Users can read own meal items"
  ON public.meal_items FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own meal items" ON public.meal_items;
CREATE POLICY "Users can insert own meal items"
  ON public.meal_items FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own meal items" ON public.meal_items;
CREATE POLICY "Users can update own meal items"
  ON public.meal_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own meal items" ON public.meal_items;
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

DROP POLICY IF EXISTS "Users can read own health profile" ON public.health_profiles;
CREATE POLICY "Users can read own health profile"
  ON public.health_profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own health profile" ON public.health_profiles;
CREATE POLICY "Users can insert own health profile"
  ON public.health_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own health profile" ON public.health_profiles;
CREATE POLICY "Users can update own health profile"
  ON public.health_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own health profile" ON public.health_profiles;
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

-- ============================================
-- 十一、饮水记录表（原 supabase-migration-water.sql）
--  water_intake：按用户+日期存"标准杯数"，一杯 250ml
-- ============================================

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

-- ============================================
-- 十二、英语长难句 150 天打卡（原 supabase-migration-english-checkin.sql）
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
DROP POLICY IF EXISTS "Users can read own english checkins" ON public.english_checkin;
CREATE POLICY "Users can read own english checkins"
  ON public.english_checkin
  FOR SELECT
  USING (auth.uid() = user_id);

-- 仅本人可插入自己的打卡记录
DROP POLICY IF EXISTS "Users can insert own english checkins" ON public.english_checkin;
CREATE POLICY "Users can insert own english checkins"
  ON public.english_checkin
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 仅本人可删除自己的打卡记录（用于撤销打卡）
DROP POLICY IF EXISTS "Users can delete own english checkins" ON public.english_checkin;
CREATE POLICY "Users can delete own english checkins"
  ON public.english_checkin
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 十三、生词本云端同步（原 supabase-migration-vocab-sync.sql）
--  表 user_vocab：每个标记生词一行，按用户隔离
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_vocab (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day INT NOT NULL,
  sent_idx INT NOT NULL,
  word_idx INT NOT NULL,
  word TEXT NOT NULL,
  sentence TEXT NOT NULL DEFAULT '',
  added_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_vocab_user ON public.user_vocab(user_id);

-- 同一用户对同一位置 (day, sent_idx, word_idx) 的单词唯一
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_vocab_pos
  ON public.user_vocab(user_id, day, sent_idx, word_idx);

ALTER TABLE public.user_vocab ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own vocab" ON public.user_vocab;
CREATE POLICY "Users can read own vocab"
  ON public.user_vocab FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own vocab" ON public.user_vocab;
CREATE POLICY "Users can insert own vocab"
  ON public.user_vocab FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own vocab" ON public.user_vocab;
CREATE POLICY "Users can update own vocab"
  ON public.user_vocab FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own vocab" ON public.user_vocab;
CREATE POLICY "Users can delete own vocab"
  ON public.user_vocab FOR DELETE
  USING (auth.uid() = user_id);

-- 按 (user_id, word, sentence) 的更新操作需要（remove/按词删除）
CREATE INDEX IF NOT EXISTS idx_user_vocab_word_sent
  ON public.user_vocab(user_id, word, sentence);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_vocab TO authenticated;

-- ============================================
-- 十四、扫码登录（原 supabase-migration-qr-login.sql）
--  桌面端生成 token，手机扫码确认后写入 session，桌面端轮询拿回登录态
-- ============================================

CREATE TABLE IF NOT EXISTS public.qr_login_sessions (
  token TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending / confirmed / expired
  session_access_token TEXT,
  session_refresh_token TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

-- 自动过期：超过 5 分钟的 pending 记录标记为 expired
CREATE INDEX IF NOT EXISTS idx_qr_login_status ON public.qr_login_sessions(status);
CREATE INDEX IF NOT EXISTS idx_qr_login_created ON public.qr_login_sessions(created_at);

ALTER TABLE public.qr_login_sessions ENABLE ROW LEVEL SECURITY;

-- 桌面端（未登录，anon）可以创建 token 和轮询状态
DROP POLICY IF EXISTS "Anyone can create QR login session" ON public.qr_login_sessions;
CREATE POLICY "Anyone can create QR login session"
  ON public.qr_login_sessions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read QR login session" ON public.qr_login_sessions;
CREATE POLICY "Anyone can read QR login session"
  ON public.qr_login_sessions FOR SELECT
  USING (true);

-- 手机端（已登录，authenticated）可以确认登录，写入 session
DROP POLICY IF EXISTS "Authenticated users can update QR login session" ON public.qr_login_sessions;
CREATE POLICY "Authenticated users can update QR login session"
  ON public.qr_login_sessions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 桌面端拿到 session 后删除该行
DROP POLICY IF EXISTS "Anyone can delete QR login session" ON public.qr_login_sessions;
CREATE POLICY "Anyone can delete QR login session"
  ON public.qr_login_sessions FOR DELETE
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.qr_login_sessions TO anon, authenticated;

-- ============================================
-- 十五、把「糖(g)」改为「钠(mg/100g)」（原 supabase-migration-sodium.sql）
--  涉及 meal_items / favorites / custom_presets；幂等，可重复执行
-- ============================================

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

-- ============================================
-- 十六、桌面端（Windows）更新记录表（原 supabase-migration-desktop-versions.sql）
--  与手机 OTA（app_versions）解耦，供电脑程序检测更新（免 GitHub API，国内直连）
-- ============================================

CREATE TABLE IF NOT EXISTS public.desktop_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 语义化版本号，如 1.13.28（唯一）
  version TEXT NOT NULL UNIQUE,
  -- 安装包可下载地址（建议放在 Supabase Storage 公开桶 desktop-bundles）
  bundle_url TEXT NOT NULL,
  -- 安装包文件名（前端据此判断走 msiexec 还是 NSIS /S）
  file_name TEXT NOT NULL DEFAULT 'DiveDeep-setup.exe',
  file_size BIGINT NOT NULL DEFAULT 0,
  checksum TEXT,
  release_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS：仅公开可读「当前活跃」版本（客户端用 anon key 检测更新）
ALTER TABLE public.desktop_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "desktop_versions_public_read_active" ON public.desktop_versions;
CREATE POLICY "desktop_versions_public_read_active"
  ON public.desktop_versions
  FOR SELECT
  USING (is_active = true);