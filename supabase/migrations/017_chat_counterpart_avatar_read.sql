-- Permitir que participantes de uma thread vejam o registo `files` e o objeto no Storage
-- do avatar do outro participante (URLs assinadas no chat).

DROP POLICY IF EXISTS "files_select_chat_counterpart_avatar" ON public.files;
CREATE POLICY "files_select_chat_counterpart_avatar"
  ON public.files FOR SELECT
  TO authenticated
  USING (
    purpose = 'profile_avatar'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.avatar_file_id = files.id
        AND EXISTS (
          SELECT 1
          FROM public.chat_threads t
          WHERE (p.id = t.owner_id OR p.id = t.provider_id)
            AND (auth.uid() = t.owner_id OR auth.uid() = t.provider_id)
        )
    )
  );

DROP POLICY IF EXISTS "storage_linkora_select_chat_counterpart_avatar" ON storage.objects;
CREATE POLICY "storage_linkora_select_chat_counterpart_avatar"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'linkora-files'
    AND EXISTS (
      SELECT 1
      FROM public.files f
      INNER JOIN public.profiles p ON p.avatar_file_id = f.id
      INNER JOIN public.chat_threads t
        ON (p.id = t.owner_id OR p.id = t.provider_id)
        AND (auth.uid() = t.owner_id OR auth.uid() = t.provider_id)
      WHERE f.purpose = 'profile_avatar'
        AND f.storage_path = objects.name
    )
  );
