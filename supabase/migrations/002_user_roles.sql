-- Permite que o mesmo usuário (mesmo e-mail) tenha múltiplos papéis no Linkora.
-- Ex.: owner e provider simultaneamente.

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

CREATE INDEX IF NOT EXISTS user_roles_role_idx ON public.user_roles (role);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
CREATE POLICY "user_roles_select_own"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_roles_insert_own" ON public.user_roles;
CREATE POLICY "user_roles_insert_own"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_roles_delete_own" ON public.user_roles;
CREATE POLICY "user_roles_delete_own"
  ON public.user_roles FOR DELETE
  USING (auth.uid() = user_id);

-- Backfill: cada usuário atual ganha o papel presente em profiles.role
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, p.role
FROM public.profiles p
ON CONFLICT (user_id, role) DO NOTHING;
