-- Serviços por prestador (categoria por serviço); migra category_id do perfil.

CREATE TABLE IF NOT EXISTS public.provider_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories (id) ON DELETE RESTRICT,
  title text NOT NULL DEFAULT 'Serviço principal',
  description text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provider_services_user_id_idx ON public.provider_services (user_id);
CREATE INDEX IF NOT EXISTS provider_services_category_id_idx ON public.provider_services (category_id);

ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provider_services_select_own" ON public.provider_services;
CREATE POLICY "provider_services_select_own"
  ON public.provider_services FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "provider_services_insert_own" ON public.provider_services;
CREATE POLICY "provider_services_insert_own"
  ON public.provider_services FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "provider_services_update_own" ON public.provider_services;
CREATE POLICY "provider_services_update_own"
  ON public.provider_services FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "provider_services_delete_own" ON public.provider_services;
CREATE POLICY "provider_services_delete_own"
  ON public.provider_services FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS provider_services_updated_at ON public.provider_services;
CREATE TRIGGER provider_services_updated_at
  BEFORE UPDATE ON public.provider_services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.provider_services (user_id, category_id, title, sort_order)
SELECT p.id, p.category_id, 'Serviço principal', 0
FROM public.profiles p
WHERE p.category_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.provider_services s WHERE s.user_id = p.id);

DROP INDEX IF EXISTS public.profiles_category_id_idx;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS category_id;
