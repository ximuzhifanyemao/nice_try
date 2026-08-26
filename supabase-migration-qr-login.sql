-- ============================================
-- 扫码登录
-- 表 qr_login_sessions：桌面端生成 token，手机扫码确认后写入 session，桌面端轮询拿回登录态
-- 在 Supabase SQL Editor 中执行此文件
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
CREATE POLICY "Anyone can create QR login session"
  ON public.qr_login_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read QR login session"
  ON public.qr_login_sessions FOR SELECT
  USING (true);

-- 手机端（已登录，authenticated）可以确认登录，写入 session
CREATE POLICY "Authenticated users can update QR login session"
  ON public.qr_login_sessions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 桌面端拿到 session 后删除该行
CREATE POLICY "Anyone can delete QR login session"
  ON public.qr_login_sessions FOR DELETE
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.qr_login_sessions TO anon, authenticated;
