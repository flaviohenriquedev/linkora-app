-- Rodar uma vez no SQL Editor do Supabase (ou `psql`) após aplicar a migration 010.
-- Preenche profiles.has_password com base em auth.users.encrypted_password.

UPDATE public.profiles p
SET has_password = (
  u.encrypted_password IS NOT NULL
  AND length(btrim(u.encrypted_password::text)) > 0
)
FROM auth.users u
WHERE u.id = p.id;

-- Opcional: conferir linhas divergentes
-- SELECT p.id, p.has_password, (u.encrypted_password IS NOT NULL) AS auth_has_pw
-- FROM public.profiles p
-- JOIN auth.users u ON u.id = p.id
-- WHERE p.has_password IS DISTINCT FROM (u.encrypted_password IS NOT NULL AND length(btrim(u.encrypted_password::text)) > 0);
