-- =============================================================================
-- Apaga todos os dados de conversa para começar do zero.
-- Executar no Supabase: SQL Editor → New query → colar → Run.
-- Requer permissão suficiente (role postgres ou dashboard).
-- =============================================================================
-- Apaga:
--   - threads, mensagens e estado "digitando" (via CASCADE a partir de threads)
--   - notificações in-app do tipo mensagem de chat
-- Não apaga: chat_presence (online/offline por utilizador), perfis, etc.
-- =============================================================================

BEGIN;

DELETE FROM public.in_app_notifications
WHERE type = 'chat_message';

TRUNCATE TABLE public.chat_threads CASCADE;

COMMIT;
