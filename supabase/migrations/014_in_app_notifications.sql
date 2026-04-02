-- Notificações in-app (ex.: nova mensagem no chat)

CREATE TABLE IF NOT EXISTS public.in_app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('chat_message')),
  title text NOT NULL,
  body text,
  link text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS in_app_notifications_user_unread_idx
  ON public.in_app_notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS in_app_notifications_user_created_idx
  ON public.in_app_notifications (user_id, created_at DESC);

ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "in_app_notifications_select_own" ON public.in_app_notifications;
CREATE POLICY "in_app_notifications_select_own"
  ON public.in_app_notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "in_app_notifications_update_own" ON public.in_app_notifications;
CREATE POLICY "in_app_notifications_update_own"
  ON public.in_app_notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.in_app_notify_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t_owner uuid;
  t_provider uuid;
  recipient uuid;
  sender_name text;
BEGIN
  SELECT t.owner_id, t.provider_id INTO t_owner, t_provider
  FROM public.chat_threads t
  WHERE t.id = NEW.thread_id;

  IF t_owner IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.sender_id = t_owner THEN
    recipient := t_provider;
  ELSE
    recipient := t_owner;
  END IF;

  SELECT COALESCE(NULLIF(trim(p.full_name), ''), 'Alguém') INTO sender_name
  FROM public.profiles p
  WHERE p.id = NEW.sender_id;

  INSERT INTO public.in_app_notifications (user_id, type, title, body, link, metadata)
  VALUES (
    recipient,
    'chat_message',
    'Nova mensagem',
    left(NEW.body, 160),
    '/chat?thread=' || NEW.thread_id::text,
    jsonb_build_object(
      'thread_id', NEW.thread_id,
      'message_id', NEW.id,
      'sender_id', NEW.sender_id
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS in_app_notify_chat_message_trg ON public.chat_messages;
CREATE TRIGGER in_app_notify_chat_message_trg
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.in_app_notify_chat_message();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'in_app_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.in_app_notifications;
  END IF;
END $$;
