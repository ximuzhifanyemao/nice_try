-- ============================================================
-- user_subjects.legacy_id 唯一约束：全局 → 按用户
-- 背景：legacy_id 记录「迁移自旧内置科目」的 id（如 'math'）。
-- 原索引 idx_user_subjects_legacy_id 对 legacy_id 全局唯一，
-- 导致第一个用户迁移了该科目后，其他老用户再迁移同名内置科目会
-- 触发唯一约束冲突、整批插入失败 → 内置科目永远不会进入科目管理，
-- 表现为「原来内置的科目无法修改」。
-- 改为「同一用户内」唯一后，每个用户都能各自迁移并修改内置科目。
-- 在 Supabase SQL Editor 中执行本文件
-- ============================================================

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