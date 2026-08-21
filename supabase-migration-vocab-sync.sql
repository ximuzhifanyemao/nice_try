-- ============================================
-- 生词本云端同步
-- 表 user_vocab：每个标记生词一行，按用户隔离
-- 在 Supabase SQL Editor 中执行此文件
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

CREATE POLICY "Users can read own vocab"
  ON public.user_vocab FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vocab"
  ON public.user_vocab FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vocab"
  ON public.user_vocab FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vocab"
  ON public.user_vocab FOR DELETE
  USING (auth.uid() = user_id);

-- 按 (user_id, word, sentence) 的更新操作需要（remove/按词删除）
CREATE INDEX IF NOT EXISTS idx_user_vocab_word_sent
  ON public.user_vocab(user_id, word, sentence);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_vocab TO authenticated;