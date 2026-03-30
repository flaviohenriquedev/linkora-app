-- Área administrativa do sistema (separada de owner/provider)

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT categories_name_unique UNIQUE (name),
  CONSTRAINT categories_slug_unique UNIQUE (slug)
);

CREATE OR REPLACE FUNCTION public.set_categories_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS categories_updated_at ON public.categories;
CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_categories_updated_at();

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users a WHERE a.user_id = uid
  );
$$;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_select_own" ON public.admin_users;
CREATE POLICY "admin_users_select_own"
  ON public.admin_users FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
CREATE POLICY "categories_select_public"
  ON public.categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "categories_insert_admin" ON public.categories;
CREATE POLICY "categories_insert_admin"
  ON public.categories FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "categories_update_admin" ON public.categories;
CREATE POLICY "categories_update_admin"
  ON public.categories FOR UPDATE
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "categories_delete_admin" ON public.categories;
CREATE POLICY "categories_delete_admin"
  ON public.categories FOR DELETE
  USING (public.is_admin(auth.uid()));
