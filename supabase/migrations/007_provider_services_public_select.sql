-- Permite leitura pública de serviços ativos para listagem de prestadores.
-- Mantém edição restrita ao próprio usuário via políticas already existentes.

DROP POLICY IF EXISTS "provider_services_select_public_active" ON public.provider_services;
CREATE POLICY "provider_services_select_public_active"
  ON public.provider_services FOR SELECT
  USING (is_active = true);
