-- Linkora: flag explícita de senha local (auth.encrypted_password não é exposta ao cliente)
-- Google OAuth: has_password = false; e-mail+senha no signup: has_password = true

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_password boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.has_password IS 'True se o usuário definiu senha local (e-mail+senha); false se só OAuth / primeiro acesso.';

-- Novo usuário: define has_password a partir de encrypted_password no momento do INSERT
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

  INSERT INTO public.profiles (id, role, full_name, has_password)
  VALUES (
    NEW.id,
    r::public.user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    hp
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Quando o usuário define ou altera senha (ex.: OTP + updateUser), sincroniza o perfil
CREATE OR REPLACE FUNCTION public.sync_profile_has_password_from_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET has_password = (
    NEW.encrypted_password IS NOT NULL
    AND length(btrim(NEW.encrypted_password::text)) > 0
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_password_updated ON auth.users;
CREATE TRIGGER on_auth_user_password_updated
  AFTER UPDATE OF encrypted_password ON auth.users
  FOR EACH ROW
  WHEN (OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password)
  EXECUTE PROCEDURE public.sync_profile_has_password_from_auth();
