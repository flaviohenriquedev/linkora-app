-- Linkora — schema inicial (aplicar no SQL Editor do Supabase ou via CLI)
-- Projeto / banco: linkora

-- Papel do usuário no app (proprietário / prestador)
-- Necessário para `gen_random_uuid()`
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('owner', 'provider');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Metadados de arquivos (futura troca por S3; hoje Storage Supabase)
CREATE TABLE IF NOT EXISTS public.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  bucket text NOT NULL DEFAULT 'linkora-files',
  storage_path text NOT NULL,
  mime_type text,
  byte_size bigint,
  purpose text NOT NULL CHECK (purpose IN ('profile_avatar', 'product_image', 'document', 'other')),
  linked_entity_type text,
  linked_entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT files_storage_path_unique UNIQUE (storage_path)
);

CREATE INDEX IF NOT EXISTS files_user_id_idx ON public.files (user_id);
CREATE INDEX IF NOT EXISTS files_purpose_idx ON public.files (purpose);

-- Perfil (1:1 com auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'owner',
  full_name text NOT NULL DEFAULT '',
  headline text,
  bio text,
  city text,
  avatar_file_id uuid REFERENCES public.files (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);

-- Novo usuário: cria linha em profiles a partir do metadata do Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r text;
BEGIN
  r := COALESCE(NEW.raw_user_meta_data->>'role', 'owner');
  IF r NOT IN ('owner', 'provider') THEN
    r := 'owner';
  END IF;

  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    r::public.user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Profiles: cada um lê/edita o próprio; leitura pública opcional para prestadores (descoberta)
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Prestadores visíveis publicamente (para listagens futuras)
CREATE POLICY "profiles_select_providers_public"
  ON public.profiles FOR SELECT
  USING (role = 'provider'::public.user_role);

-- Files: dono do arquivo
CREATE POLICY "files_select_own"
  ON public.files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "files_insert_own"
  ON public.files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "files_update_own"
  ON public.files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "files_delete_own"
  ON public.files FOR DELETE
  USING (auth.uid() = user_id);

-- Storage: bucket privado
INSERT INTO storage.buckets (id, name, public)
VALUES ('linkora-files', 'linkora-files', false)
ON CONFLICT (id) DO NOTHING;

-- Objetos: pasta por usuário auth.uid()/...
CREATE POLICY "storage_linkora_select_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'linkora-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "storage_linkora_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'linkora-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "storage_linkora_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'linkora-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "storage_linkora_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'linkora-files' AND (storage.foldername(name))[1] = auth.uid()::text);
