-- ============================================================
-- OTA 热更新：数据库表 + Storage 配置
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================================

-- 1. 创建版本记录表
CREATE TABLE IF NOT EXISTS public.app_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version     TEXT NOT NULL,                    -- 语义化版本号，如 "1.2.0"
  version_code INT NOT NULL,                   -- 数字版本号，如 3
  bundle_url  TEXT NOT NULL,                   -- Storage 中的 bundle zip 下载链接
  file_size   BIGINT DEFAULT 0,                -- 文件大小（字节）
  checksum    TEXT,                            -- SHA256 校验值
  release_notes TEXT DEFAULT '',               -- 更新说明
  is_active   BOOLEAN DEFAULT true,            -- 是否启用
  created_at  TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_version UNIQUE (version)
);

-- 索引：按创建时间倒序获取最新版本
CREATE INDEX IF NOT EXISTS idx_app_versions_active_created
  ON public.app_versions (is_active, created_at DESC);

-- 2. RLS 策略：允许匿名用户读取（用于 App 检查更新）
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "允许匿名读取版本信息"
  ON public.app_versions
  FOR SELECT
  TO anon
  USING (is_active = true);

-- 3. 创建 Storage Bucket（在 Supabase Dashboard → Storage 中手动创建，或执行以下 SQL）
-- 注意：bucket 创建需要通过 Supabase Dashboard 或 API，SQL 不支持直接创建 bucket
-- 请在 Supabase Dashboard → Storage → New Bucket 中创建名为 "ota-bundles" 的 bucket
-- 并将 bucket 设为 Public（公开访问）

-- 4. Storage 访问策略：允许匿名用户下载 bundle
-- 以下策略需要在 bucket 创建后执行
-- 如果 bucket 已存在，执行以下 SQL 设置访问策略：

-- 允许匿名用户读取 ota-bundles 中的文件
-- CREATE POLICY "允许匿名下载 OTA 包"
--   ON storage.objects
--   FOR SELECT
--   TO anon
--   USING (bucket_id = 'ota-bundles');

-- 允许认证用户上传 OTA 包（通过脚本上传）
-- CREATE POLICY "允许认证用户上传 OTA 包"
--   ON storage.objects
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'ota-bundles');