-- ============================================================
-- 不熟本：数学 / 408 不熟知识点 + 配图
-- 在 Supabase SQL Editor 中执行此文件
--
-- 1) public.study_notes：每个知识点一行，按用户隔离；images 存 Storage 对象路径
-- 2) Storage 私有桶 study-note-images：路径首段是用户 id，
--    每位用户只能读写自己目录下的图片（前端用签名 URL 展示）
-- ============================================================

-- ---------- 表 ----------

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

CREATE INDEX IF NOT EXISTS idx_study_notes_user_updated
  ON public.study_notes (user_id, updated_at DESC);

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

-- ---------- 图片存储桶 ----------
-- 私有桶：图片只能通过签名 URL 访问，路径首段是用户 id 用于隔离。

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

-- 覆盖上传（极少用到，保持与 INSERT 一致）
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

-- ── 回滚（如需撤销此迁移） ──
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
