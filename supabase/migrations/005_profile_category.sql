-- Categoria principal do prestador (Explore por categoria / filtros)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_category_id_idx ON public.profiles (category_id);
