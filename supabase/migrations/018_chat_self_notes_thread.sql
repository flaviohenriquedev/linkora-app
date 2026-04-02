-- Conversa consigo mesmo ("Notas para mim"): permite owner_id = provider_id
ALTER TABLE public.chat_threads DROP CONSTRAINT IF EXISTS chat_threads_owner_provider_diff;

-- Não criar notificação in-app ao enviar mensagem na thread só consigo
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

  IF t_owner = t_provider THEN
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
