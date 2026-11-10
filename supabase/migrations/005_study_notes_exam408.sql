-- ============================================================
-- 不熟本：完整初始化（可重复执行）
-- 在 Supabase SQL Editor 中执行本文件即可，无需先跑 004。
--
-- 1) public.study_notes：每个知识点一行，按用户隔离
-- 2) Storage 私有桶 study-note-images：路径首段为用户 id，仅本人可读写
-- 3) 二级科目 / 教材页码 / 关联真题三列（老库用 ADD COLUMN IF NOT EXISTS 补齐）
-- ============================================================

-- ---------- 表（老库已存在时跳过） ----------

CREATE TABLE IF NOT EXISTS public.study_notes (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 学科：数学 / 408
  subject     TEXT NOT NULL CHECK (subject IN ('math', 'cs408')),
  -- 知识点 / 题目名称
  title       TEXT NOT NULL DEFAULT '',
  -- 不熟在哪里、正确思路、易错点
  content     TEXT NOT NULL DEFAULT '',
  -- Storage 对象路径数组，如 ["<uid>/<uuid>.jpg"]
  images      JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- 是否已弄懂
  mastered    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- 新增列（004 建表的老库在此补齐） ----------

-- 二级科目 key，空字符串表示未分类
--   数学：calculus / linear_algebra / probability
--   408 ：ds / co / os / cn
ALTER TABLE public.study_notes
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '';

-- 教材页码，自由文本（如「王道 P98」）
ALTER TABLE public.study_notes
  ADD COLUMN IF NOT EXISTS page_ref TEXT NOT NULL DEFAULT '';

-- 关联的真题 id 数组（JSONB），如 ["408-2024-01"]
ALTER TABLE public.study_notes
  ADD COLUMN IF NOT EXISTS exam_question_ids JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_study_notes_user_updated
  ON public.study_notes (user_id, updated_at DESC);

-- ---------- 表访问策略 ----------

ALTER TABLE public.study_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "study_notes_select_own" ON public.study_notes;
CREATE POLICY "study_notes_select_own"
  ON public.study_notes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "study_notes_insert_own" ON public.study_notes;
CREATE POLICY "study_notes_insert_own"
  ON public.study_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "study_notes_update_own" ON public.study_notes;
CREATE POLICY "study_notes_update_own"
  ON public.study_notes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "study_notes_delete_own" ON public.study_notes;
CREATE POLICY "study_notes_delete_own"
  ON public.study_notes FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_notes TO authenticated;

-- ---------- 图片私有桶 ----------

INSERT INTO storage.buckets (id, name, public)
VALUES ('study-note-images', 'study-note-images', false)
ON CONFLICT (id) DO NOTHING;

-- 仅本人可读自己目录下的图片（createSignedUrls 也需要 SELECT 权限）
DROP POLICY IF EXISTS "study_note_images_select_own" ON storage.objects;
CREATE POLICY "study_note_images_select_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'study-note-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 仅本人可上传到自己的目录
DROP POLICY IF EXISTS "study_note_images_insert_own" ON storage.objects;
CREATE POLICY "study_note_images_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'study-note-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "study_note_images_update_own" ON storage.objects;
CREATE POLICY "study_note_images_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'study-note-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 删除自己的图片
DROP POLICY IF EXISTS "study_note_images_delete_own" ON storage.objects;
CREATE POLICY "study_note_images_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'study-note-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── 回滚（如需撤销） ──
-- DROP POLICY IF EXISTS "study_note_images_select_own" ON storage.objects;
-- DROP POLICY IF EXISTS "study_note_images_insert_own" ON storage.objects;
-- DROP POLICY IF EXISTS "study_note_images_update_own" ON storage.objects;
-- DROP POLICY IF EXISTS "study_note_images_delete_own" ON storage.objects;
-- DELETE FROM storage.buckets WHERE id = 'study-note-images';
-- DROP POLICY IF EXISTS "study_notes_select_own" ON public.study_notes;
-- DROP POLICY IF EXISTS "study_notes_insert_own" ON public.study_notes;
-- DROP POLICY IF EXISTS "study_notes_update_own" ON public.study_notes;
-- DROP POLICY IF EXISTS "study_notes_delete_own" ON public.study_notes;
-- DROP TABLE IF EXISTS public.study_notes;
