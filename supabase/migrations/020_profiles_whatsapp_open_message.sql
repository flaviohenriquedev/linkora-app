-- Mensagem opcional pré-preenchida ao abrir conversa no WhatsApp (link wa.me gratuito).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_open_message text;

COMMENT ON COLUMN public.profiles.whatsapp_open_message IS 'Texto opcional enviado como ?text= no link wa.me quando visitantes falam com o prestador pelo WhatsApp.';
