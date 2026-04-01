-- Leitura pública (anon) de arquivos ligados a conteúdo publicado — permite createSignedUrl sem service role.

DROP POLICY IF EXISTS "files_select_published_content" ON public.files;
CREATE POLICY "files_select_published_content"
  ON public.files FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.blog_posts bp
      WHERE bp.is_published = true
        AND (bp.image_file_id = files.id OR bp.attachment_file_id = files.id)
    )
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.is_published = true
        AND (c.image_file_id = files.id OR c.attachment_file_id = files.id)
    )
    OR EXISTS (
      SELECT 1 FROM public.materials m
      WHERE m.is_published = true
        AND m.attachment_file_id = files.id
    )
  );

DROP POLICY IF EXISTS "storage_linkora_select_published_files" ON storage.objects;
CREATE POLICY "storage_linkora_select_published_files"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'linkora-files'
    AND EXISTS (
      SELECT 1 FROM public.files f
      WHERE f.storage_path = name
        AND (
          EXISTS (
            SELECT 1 FROM public.blog_posts bp
            WHERE bp.is_published = true
              AND (bp.image_file_id = f.id OR bp.attachment_file_id = f.id)
          )
          OR EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.is_published = true
              AND (c.image_file_id = f.id OR c.attachment_file_id = f.id)
          )
          OR EXISTS (
            SELECT 1 FROM public.materials m
            WHERE m.is_published = true
              AND m.attachment_file_id = f.id
          )
        )
    )
  );
