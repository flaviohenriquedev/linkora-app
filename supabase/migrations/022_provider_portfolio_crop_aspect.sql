-- Proporção do recorte guardada por post (reflete o que o prestador escolheu no modal).

ALTER TABLE public.provider_portfolio_posts
  ADD COLUMN IF NOT EXISTS crop_aspect text NOT NULL DEFAULT '1_1';

ALTER TABLE public.provider_portfolio_posts
  DROP CONSTRAINT IF EXISTS provider_portfolio_posts_crop_aspect_check;

ALTER TABLE public.provider_portfolio_posts
  ADD CONSTRAINT provider_portfolio_posts_crop_aspect_check
  CHECK (crop_aspect IN ('1_1', '3_4', '9_16'));
