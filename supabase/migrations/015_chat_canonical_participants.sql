-- Chat entre quaisquer dois utilizadores: owner_id / provider_id = par canónico
-- (menor UUID em owner_id, maior em provider_id) para um único upsert por par.
-- Nota: MIN(uuid) não existe no PostgreSQL; usa-se MIN(id::text).

WITH ranked AS (
  SELECT
    id,
    MIN(id::text) OVER (
      PARTITION BY LEAST(owner_id::text, provider_id::text), GREATEST(owner_id::text, provider_id::text)
    ) AS keep_id_text
  FROM public.chat_threads
),
dup_ids AS (
  SELECT id AS dup_id, keep_id_text::uuid AS keep_id FROM ranked WHERE id::text <> keep_id_text
)
UPDATE public.chat_messages m
SET thread_id = d.keep_id
FROM dup_ids d
WHERE m.thread_id = d.dup_id;

DELETE FROM public.chat_typing t
WHERE t.thread_id IN (
  WITH ranked AS (
    SELECT
      id,
      MIN(id::text) OVER (
        PARTITION BY LEAST(owner_id::text, provider_id::text), GREATEST(owner_id::text, provider_id::text)
      ) AS keep_id_text
    FROM public.chat_threads
  )
  SELECT id FROM ranked WHERE id::text <> keep_id_text
);

DELETE FROM public.chat_threads t
WHERE t.id IN (
  WITH ranked AS (
    SELECT
      id,
      MIN(id::text) OVER (
        PARTITION BY LEAST(owner_id::text, provider_id::text), GREATEST(owner_id::text, provider_id::text)
      ) AS keep_id_text
    FROM public.chat_threads
  )
  SELECT id FROM ranked WHERE id::text <> keep_id_text
);

UPDATE public.chat_threads
SET
  owner_id = CASE WHEN owner_id::text < provider_id::text THEN owner_id ELSE provider_id END,
  provider_id = CASE WHEN owner_id::text < provider_id::text THEN provider_id ELSE owner_id END;
