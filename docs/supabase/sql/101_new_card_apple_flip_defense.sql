-- docs/supabase/sql/101_new_card_apple_flip_defense.sql
-- Magia "Apple" (#4): eliges una entity del rival y la volteas a modo DEFENSA.
-- Efecto con selección (acción pendiente, patrón LOCK/DESTROY). Idempotente. Balance provisional.
INSERT INTO public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger,
  bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active
) VALUES
  ('exec-apple-flip-defense', 'Apple', 'Voltea una entity del rival a modo defensa.', 'EXECUTION', 'BIG_TECH', 2, NULL, NULL, NULL, NULL,
   '/assets/bgs/bg-tech.webp', '/assets/renders/executions/exec-apple-flip-defense.webp',
   '{"action":"FLIP_OPPONENT_ENTITY_TO_DEFENSE"}', NULL, '{}', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, type = EXCLUDED.type, faction = EXCLUDED.faction,
  cost = EXCLUDED.cost, attack = EXCLUDED.attack, defense = EXCLUDED.defense, archetype = EXCLUDED.archetype,
  trigger = EXCLUDED.trigger, bg_url = EXCLUDED.bg_url, render_url = EXCLUDED.render_url, effect = EXCLUDED.effect,
  fusion_recipe_id = EXCLUDED.fusion_recipe_id, fusion_material_ids = EXCLUDED.fusion_material_ids,
  fusion_energy_requirement = EXCLUDED.fusion_energy_requirement, is_active = EXCLUDED.is_active;

INSERT INTO public.market_card_listings (id, card_id, rarity, price_nexus, stock, is_available) VALUES
  ('listing-exec-apple-flip-defense', 'exec-apple-flip-defense', 'RARE', 300, NULL, true)
ON CONFLICT (id) DO UPDATE SET
  card_id = EXCLUDED.card_id, rarity = EXCLUDED.rarity, price_nexus = EXCLUDED.price_nexus,
  stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;
