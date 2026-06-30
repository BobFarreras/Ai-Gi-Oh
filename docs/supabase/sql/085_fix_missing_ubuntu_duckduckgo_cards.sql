-- docs/supabase/sql/085_fix_missing_ubuntu_duckduckgo_cards.sql
-- Fix: 'entity-ubuntu' y 'entity-duckduckgo' se referencian en market_card_listings
-- (supabase/seed.sql) y en migraciones de balance, pero NUNCA se insertaban en
-- cards_catalog: se habían creado solo en producción (panel admin / SQL manual), sin
-- migración. En `supabase db reset` limpio el seed fallaba con FK 23503
-- (market_card_listings_card_id_fkey_catalog) al referenciar cartas inexistentes.
--
-- Estos VALORES REPLICAN EXACTAMENTE PRODUCCIÓN (faction NEUTRAL; Ubuntu=TOOL,
-- DuckDuckGo=SECURITY) para que la instalación limpia quede idéntica a prod.
-- Se ordena el último (corre tras todas las migraciones y antes del seed). Como la
-- migración 078 (mapa de pasivas por arquetipo) corre antes, también re-añadimos aquí
-- la pasiva V5 de estas dos cartas (igual que en prod). Idempotente.
begin;

insert into public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger, bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active
) values
('entity-ubuntu', 'Ubuntu', 'Estabilidad a largo plazo en un mundo de ejecución volátil.', 'ENTITY', 'NEUTRAL', 6, 1500, 2200, 'TOOL', null, '/assets/bgs/bg-tech.webp', '/assets/renders/ubuntu.webp', null, null, '{}', null, true),
('entity-duckduckgo', 'DUCKDUCKGO', 'Navegador veloz con espíritu libre i seguro.', 'ENTITY', 'NEUTRAL', 3, 1000, 1700, 'SECURITY', null, '/assets/bgs/bg-tech.webp', '/assets/renders/duckduckgo.webp', null, null, '{}', null, true)
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

-- Pasiva V5 temática (igual que prod): la 078 ya corrió sin estas cartas presentes.
delete from public.card_mastery_passive_map where card_id in ('entity-ubuntu', 'entity-duckduckgo');
insert into public.card_mastery_passive_map (card_id, passive_skill_id, priority) values
  ('entity-ubuntu', 'passive-draw-on-summon', 1),
  ('entity-duckduckgo', 'passive-reflect-damage-200', 1);

commit;
