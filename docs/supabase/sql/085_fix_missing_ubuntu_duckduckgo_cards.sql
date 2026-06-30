-- docs/supabase/sql/085_fix_missing_ubuntu_duckduckgo_cards.sql
-- Fix: 'entity-ubuntu' y 'entity-duckduckgo' se referencian en market_card_listings
-- (supabase/seed.sql, migraciones 063/074) y en el UPDATE de coste de 077, pero NUNCA
-- se insertaban en cards_catalog. Resultado: el seed fallaba con
--   market_card_listings_card_id_fkey_catalog (FK 23503) durante `supabase db reset`.
--
-- Ambas cartas existen en producción; aquí faltaba su INSERT. Este fichero se ordena el
-- último (corre tras todas las migraciones y antes del seed), así que las insertamos ya
-- con sus valores BALANCEADOS finales (los que dejaría 077), no los de base:
--   Ubuntu      1500/2200 (budget 3700) · coste 6 · muro OPEN_SOURCE
--   DuckDuckGo  1000/1700 (budget 2700) · coste 3 · privacidad/scan OPEN_SOURCE
-- Idempotente (UPSERT) para alinearse con el patrón de 063.
begin;

insert into public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger, bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active
) values
('entity-ubuntu', 'Ubuntu', 'Distribución Linux robusta que sostiene la línea defensiva con un muro de alta resistencia.', 'ENTITY', 'OPEN_SOURCE', 6, 1500, 2200, 'SECURITY', null, '/assets/bgs/bg-tech.webp', '/assets/renders/ubuntu.webp', null, null, '{}', null, true),
('entity-duckduckgo', 'DuckDuckGo', 'Buscador centrado en la privacidad que rastrea y limpia el campo a bajo coste.', 'ENTITY', 'OPEN_SOURCE', 3, 1000, 1700, 'SECURITY', null, '/assets/bgs/bg-tech.webp', '/assets/renders/duckduckgo.webp', null, null, '{}', null, true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  type = excluded.type,
  faction = excluded.faction,
  cost = excluded.cost,
  attack = excluded.attack,
  defense = excluded.defense,
  archetype = excluded.archetype,
  trigger = excluded.trigger,
  bg_url = excluded.bg_url,
  render_url = excluded.render_url,
  effect = excluded.effect,
  fusion_recipe_id = excluded.fusion_recipe_id,
  fusion_material_ids = excluded.fusion_material_ids,
  fusion_energy_requirement = excluded.fusion_energy_requirement,
  is_active = excluded.is_active;

commit;
