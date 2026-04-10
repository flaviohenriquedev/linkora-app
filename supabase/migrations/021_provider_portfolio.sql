-- Portfólio do prestador (foto + legenda); imagens em `files` + Storage (migrável para S3).

ALTER TABLE public.files DROP CONSTRAINT IF EXISTS files_purpose_check;
ALTER TABLE public.files ADD CONSTRAINT files_purpose_check CHECK (
  purpose IN (
    'profile_avatar',
    'product_image',
    'document',
    'other',
    'provider_portfolio'
  )
);

CREATE TABLE IF NOT EXISTS public.provider_portfolio_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  image_file_id uuid NOT NULL REFERENCES public.files (id) ON DELETE RESTRICT,
  caption text,
  sort_order int NOT NULL DEFAULT 0,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provider_portfolio_posts_provider_idx
  ON public.provider_portfolio_posts (provider_id, created_at DESC);

DROP TRIGGER IF EXISTS provider_portfolio_posts_updated_at ON public.provider_portfolio_posts;
CREATE TRIGGER provider_portfolio_posts_updated_at
  BEFORE UPDATE ON public.provider_portfolio_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.provider_portfolio_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provider_portfolio_select_own" ON public.provider_portfolio_posts;
CREATE POLICY "provider_portfolio_select_own"
  ON public.provider_portfolio_posts FOR SELECT
  USING (auth.uid() = provider_id);

DROP POLICY IF EXISTS "provider_portfolio_insert_own" ON public.provider_portfolio_posts;
CREATE POLICY "provider_portfolio_insert_own"
  ON public.provider_portfolio_posts FOR INSERT
  WITH CHECK (
    auth.uid() = provider_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'provider'::public.user_role
    )
  );

DROP POLICY IF EXISTS "provider_portfolio_update_own" ON public.provider_portfolio_posts;
CREATE POLICY "provider_portfolio_update_own"
  ON public.provider_portfolio_posts FOR UPDATE
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

DROP POLICY IF EXISTS "provider_portfolio_delete_own" ON public.provider_portfolio_posts;
CREATE POLICY "provider_portfolio_delete_own"
  ON public.provider_portfolio_posts FOR DELETE
  USING (auth.uid() = provider_id);

DROP POLICY IF EXISTS "provider_portfolio_select_public" ON public.provider_portfolio_posts;
CREATE POLICY "provider_portfolio_select_public"
  ON public.provider_portfolio_posts FOR SELECT
  TO anon, authenticated
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

-- Leitura pública de `files` usados em post de portfólio público
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
    OR EXISTS (
      SELECT 1
      FROM public.provider_portfolio_posts pp
      INNER JOIN public.profiles pr ON pr.id = pp.provider_id
      WHERE pp.image_file_id = files.id
        AND pp.is_public = true
        AND pr.role = 'provider'::public.user_role
        AND pr.is_active = true
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
          OR EXISTS (
            SELECT 1
            FROM public.provider_portfolio_posts pp
            INNER JOIN public.profiles pr ON pr.id = pp.provider_id
            WHERE pp.image_file_id = f.id
              AND pp.is_public = true
              AND pr.role = 'provider'::public.user_role
              AND pr.is_active = true
          )
        )
    )
  );
