-- docs/supabase/sql/109_new_card_reaq_board_swap.sql
-- Magia "reaq m" (#6): intercambia por completo tus entities del tablero con las del rival. Las que
-- recibes no pueden atacar el turno del intercambio. Efecto síncrono. Idempotente. Balance provisional.
INSERT INTO public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger,
  bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active
) VALUES
  ('exec-reaq-board-swap', 'reaq m',
   'Intercambia tus entities del tablero con las del rival. Las que recibes no pueden atacar este turno.',
   'EXECUTION', 'NEUTRAL', 5, NULL, NULL, NULL, NULL,
   '/assets/bgs/bg-tech.webp', '/assets/renders/executions/exec-reaq-board-swap.webp',
   '{"action":"SWAP_BOARD_ENTITIES"}', NULL, '{}', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, type = EXCLUDED.type, faction = EXCLUDED.faction,
  cost = EXCLUDED.cost, attack = EXCLUDED.attack, defense = EXCLUDED.defense, archetype = EXCLUDED.archetype,
  trigger = EXCLUDED.trigger, bg_url = EXCLUDED.bg_url, render_url = EXCLUDED.render_url, effect = EXCLUDED.effect,
  fusion_recipe_id = EXCLUDED.fusion_recipe_id, fusion_material_ids = EXCLUDED.fusion_material_ids,
  fusion_energy_requirement = EXCLUDED.fusion_energy_requirement, is_active = EXCLUDED.is_active;

INSERT INTO public.market_card_listings (id, card_id, rarity, price_nexus, stock, is_available) VALUES
  ('listing-exec-reaq-board-swap', 'exec-reaq-board-swap', 'EPIC', 380, NULL, true)
ON CONFLICT (id) DO UPDATE SET
  card_id = EXCLUDED.card_id, rarity = EXCLUDED.rarity, price_nexus = EXCLUDED.price_nexus,
  stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;
