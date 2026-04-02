-- Apenas a conversa "Notas para mim" (owner_id = provider_id = utilizador) pode ser apagada pelo próprio.

DROP POLICY IF EXISTS "chat_threads_delete_self_notes_own" ON public.chat_threads;
CREATE POLICY "chat_threads_delete_self_notes_own"
  ON public.chat_threads FOR DELETE
  TO authenticated
  USING (
    owner_id = provider_id
    AND owner_id = auth.uid()
  );
