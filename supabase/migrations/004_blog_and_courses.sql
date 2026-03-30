-- Conteúdo administrativo: posts do blog e cursos

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL,
  excerpt text,
  body text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blog_posts_slug_unique UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  is_published boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT courses_slug_unique UNIQUE (slug)
);

CREATE OR REPLACE FUNCTION public.set_blog_posts_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_courses_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_blog_posts_updated_at();

DROP TRIGGER IF EXISTS courses_updated_at ON public.courses;
CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_courses_updated_at();

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog_posts_select_public" ON public.blog_posts;
CREATE POLICY "blog_posts_select_public"
  ON public.blog_posts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "blog_posts_insert_admin" ON public.blog_posts;
CREATE POLICY "blog_posts_insert_admin"
  ON public.blog_posts FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "blog_posts_update_admin" ON public.blog_posts;
CREATE POLICY "blog_posts_update_admin"
  ON public.blog_posts FOR UPDATE
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "blog_posts_delete_admin" ON public.blog_posts;
CREATE POLICY "blog_posts_delete_admin"
  ON public.blog_posts FOR DELETE
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "courses_select_public" ON public.courses;
CREATE POLICY "courses_select_public"
  ON public.courses FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "courses_insert_admin" ON public.courses;
CREATE POLICY "courses_insert_admin"
  ON public.courses FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "courses_update_admin" ON public.courses;
CREATE POLICY "courses_update_admin"
  ON public.courses FOR UPDATE
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "courses_delete_admin" ON public.courses;
CREATE POLICY "courses_delete_admin"
  ON public.courses FOR DELETE
  USING (public.is_admin(auth.uid()));
