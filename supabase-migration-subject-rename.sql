-- ============================================
-- 科目通用化（去除内置考研科目限制）
--  - user_subjects 增加 legacy_id：绑定旧内置科目 id（如 'math'），
--    使历史打卡记录（subjects[].id 沿用旧 id）能映射到迁移后的自定义科目，
--    改名后历史记录同样显示新名称
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================

ALTER TABLE public.user_subjects ADD COLUMN IF NOT EXISTS legacy_id TEXT;

-- 每个 legacy_id 全局唯一（多个 NULL 互不冲突），保证迁移幂等
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subjects_legacy_id ON public.user_subjects(legacy_id);