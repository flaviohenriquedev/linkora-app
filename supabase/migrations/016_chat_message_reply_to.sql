-- Resposta a uma mensagem (citação), estilo WhatsApp

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.chat_messages (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS chat_messages_reply_to_id_idx ON public.chat_messages (reply_to_id);

CREATE OR REPLACE FUNCTION public.chat_messages_reply_same_thread()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.reply_to_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.chat_messages parent
    WHERE parent.id = NEW.reply_to_id
      AND parent.thread_id = NEW.thread_id
  ) THEN
    RAISE EXCEPTION 'reply_to must reference a message in the same thread';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chat_messages_reply_same_thread_trg ON public.chat_messages;
CREATE TRIGGER chat_messages_reply_same_thread_trg
  BEFORE INSERT OR UPDATE OF reply_to_id, thread_id ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.chat_messages_reply_same_thread();
