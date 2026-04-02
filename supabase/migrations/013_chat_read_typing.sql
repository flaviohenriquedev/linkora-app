-- Confirmação de leitura (1:1) + indicador "digitando"

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

COMMENT ON COLUMN public.chat_messages.read_at IS 'Quando o destinatário visualizou a mensagem (apenas mensagens do outro participante).';

CREATE OR REPLACE FUNCTION public.chat_mark_messages_read(p_thread uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.chat_threads t
    WHERE t.id = p_thread
      AND (t.owner_id = auth.uid() OR t.provider_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  UPDATE public.chat_messages m
  SET read_at = now()
  WHERE m.thread_id = p_thread
    AND m.sender_id <> auth.uid()
    AND m.read_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.chat_mark_messages_read(uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.chat_typing (
  thread_id uuid NOT NULL REFERENCES public.chat_threads (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS chat_typing_thread_updated_idx ON public.chat_typing (thread_id, updated_at DESC);

ALTER TABLE public.chat_typing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_typing_select_participant" ON public.chat_typing;
CREATE POLICY "chat_typing_select_participant"
  ON public.chat_typing FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.chat_threads t
      WHERE t.id = thread_id
        AND (t.owner_id = auth.uid() OR t.provider_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "chat_typing_insert_own" ON public.chat_typing;
CREATE POLICY "chat_typing_insert_own"
  ON public.chat_typing FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.chat_threads t
      WHERE t.id = thread_id
        AND (t.owner_id = auth.uid() OR t.provider_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "chat_typing_update_own" ON public.chat_typing;
CREATE POLICY "chat_typing_update_own"
  ON public.chat_typing FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_typing_delete_own" ON public.chat_typing;
CREATE POLICY "chat_typing_delete_own"
  ON public.chat_typing FOR DELETE
  USING (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'chat_typing'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_typing;
  END IF;
END $$;
