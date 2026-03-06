-- docs/supabase/sql/templates/002_market_pack_template.sql - Plantilla transaccional para crear/actualizar un sobre y su pool de cartas por IDs existentes.
begin;

-- 1) Definición del sobre
insert into public.market_pack_definitions (
  id,
  name,
  description,
  price_nexus,
  cards_per_pack,
  pack_pool_id,
  preview_card_ids,
  is_available
) values (
  'pack-sample-lab',                            -- id único del sobre
  'Sample Lab Pack',
  'Sobre de ejemplo para cartas de laboratorio.',
  320,                                          -- precio en Nexus
  5,                                            -- cuántas cartas salen al abrir
  'pool-sample-lab',                            -- id lógico de pool
  array['entity-sample-card'],                  -- cartas preview (deben existir en cards_catalog)
  true
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price_nexus = excluded.price_nexus,
  cards_per_pack = excluded.cards_per_pack,
  pack_pool_id = excluded.pack_pool_id,
  preview_card_ids = excluded.preview_card_ids,
  is_available = excluded.is_available;

-- 2) Limpia entradas anteriores del pool para reescritura determinista
delete from public.market_pack_pool_entries
where pack_pool_id = 'pool-sample-lab';

-- 3) Inserta cartas del pool con peso (deben existir previamente en cards_catalog)
insert into public.market_pack_pool_entries (
  id,
  pack_pool_id,
  card_id,
  rarity,
  weight
) values
('pool-sample-lab-entity-sample-card', 'pool-sample-lab', 'entity-sample-card', 'COMMON', 60)
-- ,('pool-sample-lab-fusion-sample', 'pool-sample-lab', 'fusion-sample', 'LEGENDARY', 5)
;

commit;
