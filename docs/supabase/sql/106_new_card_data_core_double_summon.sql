-- docs/supabase/sql/106_new_card_data_core_double_summon.sql
-- Magia "Núcleo de Datos" (#2): concede una invocación normal EXTRA este turno (permite invocar dos
-- entities). Efecto síncrono sin selección. Idempotente. Balance provisional.
INSERT INTO public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger,
  bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active
) VALUES
  ('exec-data-core-double-summon', 'Núcleo de Datos',
   'Este turno puedes invocar una entity más de lo normal (dos invocaciones en total).',
   'EXECUTION', 'NEUTRAL', 3, NULL, NULL, NULL, NULL,
   '/assets/bgs/bg-tech.webp', '/assets/renders/executions/exec-data-core-double-summon.webp',
   '{"action":"GRANT_EXTRA_SUMMON","count":1}', NULL, '{}', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, type = EXCLUDED.type, faction = EXCLUDED.faction,
  cost = EXCLUDED.cost, attack = EXCLUDED.attack, defense = EXCLUDED.defense, archetype = EXCLUDED.archetype,
  trigger = EXCLUDED.trigger, bg_url = EXCLUDED.bg_url, render_url = EXCLUDED.render_url, effect = EXCLUDED.effect,
  fusion_recipe_id = EXCLUDED.fusion_recipe_id, fusion_material_ids = EXCLUDED.fusion_material_ids,
  fusion_energy_requirement = EXCLUDED.fusion_energy_requirement, is_active = EXCLUDED.is_active;

INSERT INTO public.market_card_listings (id, card_id, rarity, price_nexus, stock, is_available) VALUES
  ('listing-exec-data-core-double-summon', 'exec-data-core-double-summon', 'EPIC', 320, NULL, true)
ON CONFLICT (id) DO UPDATE SET
  card_id = EXCLUDED.card_id, rarity = EXCLUDED.rarity, price_nexus = EXCLUDED.price_nexus,
  stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;
