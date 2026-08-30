-- ============================================================
-- 桌面端（Windows）更新记录表
-- 与手机 OTA（app_versions）解耦，供电脑程序检测更新（免 GitHub API，国内直连）
-- 在 Supabase Dashboard → SQL Editor 中执行本文件即可
-- ============================================================

create table if not exists public.desktop_versions (
  id uuid primary key default gen_random_uuid(),
  -- 语义化版本号，如 1.13.28（唯一）
  version text not null unique,
  -- 安装包可下载地址（建议放在 Supabase Storage 公开桶 desktop-bundles）
  bundle_url text not null,
  -- 安装包文件名（前端据此判断走 msiexec 还是 NSIS /S）
  file_name text not null default 'DiveDeep-setup.exe',
  file_size bigint not null default 0,
  checksum text,
  release_notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- RLS：仅公开可读「当前活跃」版本（客户端用 anon key 检测更新）
alter table public.desktop_versions enable row level security;

drop policy if exists "desktop_versions_public_read_active" on public.desktop_versions;
create policy "desktop_versions_public_read_active"
  on public.desktop_versions
  for select
  using (is_active = true);