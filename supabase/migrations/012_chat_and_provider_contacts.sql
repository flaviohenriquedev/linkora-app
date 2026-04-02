-- Chat 1:1 (owner <-> provider) + contatos públicos do prestador

CREATE TABLE IF NOT EXISTS public.provider_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('email', 'phone', 'whatsapp')),
  label text,
  value text NOT NULL,
  is_public boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provider_contacts_provider_id_idx ON public.provider_contacts (provider_id);
CREATE INDEX IF NOT EXISTS provider_contacts_public_idx ON public.provider_contacts (is_public);

DROP TRIGGER IF EXISTS provider_contacts_updated_at ON public.provider_contacts;
CREATE TRIGGER provider_contacts_updated_at
  BEFORE UPDATE ON public.provider_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.provider_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provider_contacts_select_own" ON public.provider_contacts;
CREATE POLICY "provider_contacts_select_own"
  ON public.provider_contacts FOR SELECT
  USING (auth.uid() = provider_id);

DROP POLICY IF EXISTS "provider_contacts_insert_own" ON public.provider_contacts;
CREATE POLICY "provider_contacts_insert_own"
  ON public.provider_contacts FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

DROP POLICY IF EXISTS "provider_contacts_update_own" ON public.provider_contacts;
CREATE POLICY "provider_contacts_update_own"
  ON public.provider_contacts FOR UPDATE
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

DROP POLICY IF EXISTS "provider_contacts_delete_own" ON public.provider_contacts;
CREATE POLICY "provider_contacts_delete_own"
  ON public.provider_contacts FOR DELETE
  USING (auth.uid() = provider_id);

DROP POLICY IF EXISTS "provider_contacts_select_public_provider" ON public.provider_contacts;
CREATE POLICY "provider_contacts_select_public_provider"
  ON public.provider_contacts FOR SELECT
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = provider_id
        AND p.role = 'provider'::public.user_role
        AND p.is_active = true
    )
  );

CREATE TABLE IF NOT EXISTS public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz,
  CONSTRAINT chat_threads_owner_provider_unique UNIQUE (owner_id, provider_id),
  CONSTRAINT chat_threads_owner_provider_diff CHECK (owner_id <> provider_id)
);

CREATE INDEX IF NOT EXISTS chat_threads_owner_idx ON public.chat_threads (owner_id);
CREATE INDEX IF NOT EXISTS chat_threads_provider_idx ON public.chat_threads (provider_id);
CREATE INDEX IF NOT EXISTS chat_threads_last_message_idx ON public.chat_threads (last_message_at DESC NULLS LAST, updated_at DESC);

DROP TRIGGER IF EXISTS chat_threads_updated_at ON public.chat_threads;
CREATE TRIGGER chat_threads_updated_at
  BEFORE UPDATE ON public.chat_threads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_threads_select_participant" ON public.chat_threads;
CREATE POLICY "chat_threads_select_participant"
  ON public.chat_threads FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = provider_id);

DROP POLICY IF EXISTS "chat_threads_insert_participant" ON public.chat_threads;
CREATE POLICY "chat_threads_insert_participant"
  ON public.chat_threads FOR INSERT
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = provider_id);

DROP POLICY IF EXISTS "chat_threads_update_participant" ON public.chat_threads;
CREATE POLICY "chat_threads_update_participant"
  ON public.chat_threads FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = provider_id)
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = provider_id);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads (id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  body text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_thread_created_idx ON public.chat_messages (thread_id, created_at);
CREATE INDEX IF NOT EXISTS chat_messages_sender_idx ON public.chat_messages (sender_id, created_at DESC);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_select_participant" ON public.chat_messages;
CREATE POLICY "chat_messages_select_participant"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.chat_threads t
      WHERE t.id = thread_id
        AND (t.owner_id = auth.uid() OR t.provider_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "chat_messages_insert_participant_sender" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_participant_sender"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.chat_threads t
      WHERE t.id = thread_id
        AND (t.owner_id = auth.uid() OR t.provider_id = auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.chat_messages_touch_thread()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chat_threads
  SET last_message_at = NEW.created_at
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chat_messages_touch_thread_trg ON public.chat_messages;
CREATE TRIGGER chat_messages_touch_thread_trg
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.chat_messages_touch_thread();

CREATE TABLE IF NOT EXISTS public.chat_presence (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'away', 'offline')),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS chat_presence_updated_at ON public.chat_presence;
CREATE TRIGGER chat_presence_updated_at
  BEFORE UPDATE ON public.chat_presence
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.chat_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_presence_select_authenticated" ON public.chat_presence;
CREATE POLICY "chat_presence_select_authenticated"
  ON public.chat_presence FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "chat_presence_insert_own" ON public.chat_presence;
CREATE POLICY "chat_presence_insert_own"
  ON public.chat_presence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_presence_update_own" ON public.chat_presence;
CREATE POLICY "chat_presence_update_own"
  ON public.chat_presence FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'chat_presence'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_presence;
  END IF;
END $$;
