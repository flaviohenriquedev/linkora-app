-- Conta ativa/inativa (soft): listagens públicas só prestadores ativos; admin vê todos.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.is_active IS 'False = conta desativada (não aparece como profissional; login bloqueado após verificação).';

-- Novos usuários começam ativos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r text;
  hp boolean;
BEGIN
  r := COALESCE(NEW.raw_user_meta_data->>'role', 'owner');
  IF r NOT IN ('owner', 'provider') THEN
    r := 'owner';
  END IF;

  hp := NEW.encrypted_password IS NOT NULL AND length(btrim(NEW.encrypted_password::text)) > 0;

  INSERT INTO public.profiles (id, role, full_name, has_password, is_active)
  VALUES (
    NEW.id,
    r::public.user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    hp,
    true
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "profiles_select_providers_public" ON public.profiles;
CREATE POLICY "profiles_select_providers_public"
  ON public.profiles FOR SELECT
  USING (
    role = 'provider'::public.user_role
    AND is_active = true
  );

-- Lista paginada para administradores (join com auth.users para e-mail)
CREATE OR REPLACE FUNCTION public.admin_list_users_paginated(
  p_limit int DEFAULT 10,
  p_offset int DEFAULT 0,
  p_search text DEFAULT NULL,
  p_role text DEFAULT 'all'
)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role public.user_role,
  is_active boolean,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT
      p.id AS pid,
      u.email::text AS em,
      p.full_name AS fn,
      p.role AS r,
      p.is_active AS ia,
      p.created_at AS ca
    FROM public.profiles p
    INNER JOIN auth.users u ON u.id = p.id
    WHERE
      (p_search IS NULL OR length(trim(p_search)) = 0 OR
        p.full_name ILIKE '%' || trim(p_search) || '%' OR
        u.email ILIKE '%' || trim(p_search) || '%')
      AND (
        p_role IS NULL OR length(trim(p_role)) = 0 OR lower(trim(p_role)) = 'all' OR
        (lower(trim(p_role)) = 'provider' AND p.role = 'provider'::public.user_role) OR
        (lower(trim(p_role)) = 'owner' AND p.role = 'owner'::public.user_role)
      )
  ),
  counted AS (
    SELECT
      f.pid,
      f.em,
      f.fn,
      f.r,
      f.ia,
      f.ca,
      COUNT(*) OVER () AS tc
    FROM filtered f
  )
  SELECT
    c.pid,
    c.em,
    c.fn,
    c.r,
    c.ia,
    c.ca,
    c.tc
  FROM counted c
  ORDER BY c.ca DESC
  LIMIT COALESCE(NULLIF(p_limit, 0), 10)
  OFFSET COALESCE(p_offset, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users_paginated(int, int, text, text) TO authenticated;

-- Usuário desativa a própria conta (não reativa por aqui)
CREATE OR REPLACE FUNCTION public.request_account_deactivation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;
  UPDATE public.profiles SET is_active = false WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_account_deactivation() TO authenticated;
