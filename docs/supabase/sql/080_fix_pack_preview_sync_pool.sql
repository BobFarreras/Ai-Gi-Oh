-- docs/supabase/sql/080_fix_pack_preview_sync_pool.sql - Sincroniza preview_card_ids de cada pack con su pool real (corrige packs antiguos cuyo preview no coincidía con lo que sale al abrir).
UPDATE market_pack_definitions d
SET preview_card_ids = p.pool_card_ids
FROM (
  SELECT pack_pool_id, array_agg(card_id ORDER BY card_id) AS pool_card_ids
  FROM market_pack_pool_entries
  GROUP BY pack_pool_id
) p
WHERE p.pack_pool_id = d.pack_pool_id
  AND d.preview_card_ids IS DISTINCT FROM p.pool_card_ids;
