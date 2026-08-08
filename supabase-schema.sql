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
  -- 软删除标记：NULL=正常记录，非 NULL=在回收站（见下方迁移说明）
  deleted_at TIMESTAMPTZ
);

-- 注意：原 UNIQUE(user_id, date) 已改为"仅未删除记录"的部分唯一索引，
-- 使同一天记录删除进回收站后仍可再新建当天记录。
-- 若表已按旧结构创建，请执行 supabase-migration-trash.sql 迁移：
--   1. ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
--   2. ALTER TABLE public.daily_logs DROP CONSTRAINT IF EXISTS daily_logs_user_id_date_key;
--   3. CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_logs_user_date_active
--        ON public.daily_logs (user_id, date) WHERE deleted_at IS NULL;
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
CREATE POLICY "Anyone can read active logs, owner can read trash"
  ON public.daily_logs
  FOR SELECT
  USING (deleted_at IS NULL OR auth.uid() = user_id);

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

-- ============================================
-- 虚拟承诺金 / 每周目标（成就系统全部在客户端由 daily_logs 计算，无需建表）
-- 完整迁移见 supabase-migration-goals.sql（含 RLS、RPC 函数），此处仅列出核心表结构
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

-- 每周承诺（目标 + 押金，week_start 为周起点周日）
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
