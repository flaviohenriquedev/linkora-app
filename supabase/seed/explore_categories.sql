-- Categorias alinhadas ao menu "Explore por categoria" da home (idempotente).
-- Rode depois das migrations (tabela public.categories já existe em 003).

INSERT INTO public.categories (name, slug, description, is_active)
VALUES
  ('Estilistas', 'estilistas', NULL, true),
  ('Modelistas', 'modelistas', NULL, true),
  ('Cortadores', 'cortadores', NULL, true),
  ('Tecidos', 'tecidos', NULL, true),
  ('Aviamentos', 'aviamentos', NULL, true),
  ('Private Label', 'private-label', NULL, true),
  ('Acabamento', 'acabamento', NULL, true),
  ('Marketing', 'marketing', NULL, true),
  ('Fotógrafo', 'fotografo', NULL, true),
  ('Modelos', 'modelos', NULL, true),
  ('Cursos', 'cursos', NULL, true),
  ('Consultorias', 'consultorias', NULL, true),
  ('Mentorias', 'mentorias', NULL, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  updated_at = now();
