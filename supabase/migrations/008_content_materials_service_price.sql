-- Valor do serviço (centavos de real; null = não informado)
ALTER TABLE public.provider_services
  ADD COLUMN IF NOT EXISTS price_cents integer NULL
  CONSTRAINT provider_services_price_cents_nonneg CHECK (price_cents IS NULL OR price_cents >= 0);

-- Artigos (blog_posts): imagem de capa e anexo
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS image_file_id uuid REFERENCES public.files (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attachment_file_id uuid REFERENCES public.files (id) ON DELETE SET NULL;

-- Cursos: imagem, anexo e link externo
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS image_file_id uuid REFERENCES public.files (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attachment_file_id uuid REFERENCES public.files (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS external_link text NULL;

-- Materiais: título + arquivo
CREATE TABLE IF NOT EXISTS public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  attachment_file_id uuid REFERENCES public.files (id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS materials_sort_idx ON public.materials (sort_order, title);

DROP TRIGGER IF EXISTS materials_updated_at ON public.materials;
CREATE TRIGGER materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "materials_select_public" ON public.materials;
CREATE POLICY "materials_select_public"
  ON public.materials FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "materials_insert_admin" ON public.materials;
CREATE POLICY "materials_insert_admin"
  ON public.materials FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "materials_update_admin" ON public.materials;
CREATE POLICY "materials_update_admin"
  ON public.materials FOR UPDATE
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "materials_delete_admin" ON public.materials;
CREATE POLICY "materials_delete_admin"
  ON public.materials FOR DELETE
  USING (public.is_admin(auth.uid()));
