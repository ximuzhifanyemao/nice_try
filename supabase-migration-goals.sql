-- ============================================
-- 虚拟承诺金 / 每周目标 - Supabase 数据库迁移
-- 在 Supabase SQL Editor 中执行此文件
-- 功能：成就系统（本地计算，无需建表）+ 虚拟承诺金（钱包/每周承诺/资金流水）
-- ============================================

-- 1. 虚拟钱包：记录用户虚拟余额（充值 - 押金 + 返还）
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wallet"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet"
  ON public.wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet"
  ON public.wallets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. 资金流水：充值 / 押金 / 返还 / 扣除
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('recharge', 'deposit', 'refund', 'forfeit')),
  amount NUMERIC(12,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON public.wallet_transactions(user_id, created_at DESC);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. 每周承诺：目标时长 + 押金，每周一条（week_start 为周起点，周一）
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

CREATE INDEX IF NOT EXISTS idx_weekly_commitments_user
  ON public.weekly_commitments(user_id, week_start DESC);

ALTER TABLE public.weekly_commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own commitments"
  ON public.weekly_commitments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own commitments"
  ON public.weekly_commitments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

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
