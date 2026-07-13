-- docs/supabase/sql/108_new_card_openclaw_nullify_buff.sql
-- Trampa "OpenClaw Bug Trap": cuando el rival activa una magia que buffea sus entities, resta ese mismo
-- valor a las entities buffeadas (anula el buff). Trigger ON_OPPONENT_STAT_BUFF_APPLIED. Idempotente.
INSERT INTO public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger,
  bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active
) VALUES
  ('trap-openclaw-nullify-buff', 'OpenClaw Bug Trap',
   'Cuando el rival aplica un buff a sus entities, resta ese mismo valor a las entities buffeadas (anula el buff).',
   'TRAP', 'OPEN_SOURCE', 2, NULL, NULL, NULL, 'ON_OPPONENT_STAT_BUFF_APPLIED',
   NULL, '/assets/renders/traps/trap-openclaw-nullify-buff.webp',
   '{"action":"NULLIFY_OPPONENT_BUFF"}', NULL, '{}', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, type = EXCLUDED.type, faction = EXCLUDED.faction,
  cost = EXCLUDED.cost, attack = EXCLUDED.attack, defense = EXCLUDED.defense, archetype = EXCLUDED.archetype,
  trigger = EXCLUDED.trigger, bg_url = EXCLUDED.bg_url, render_url = EXCLUDED.render_url, effect = EXCLUDED.effect,
  fusion_recipe_id = EXCLUDED.fusion_recipe_id, fusion_material_ids = EXCLUDED.fusion_material_ids,
  fusion_energy_requirement = EXCLUDED.fusion_energy_requirement, is_active = EXCLUDED.is_active;

INSERT INTO public.market_card_listings (id, card_id, rarity, price_nexus, stock, is_available) VALUES
  ('listing-trap-openclaw-nullify-buff', 'trap-openclaw-nullify-buff', 'RARE', 290, NULL, true)
ON CONFLICT (id) DO UPDATE SET
  card_id = EXCLUDED.card_id, rarity = EXCLUDED.rarity, price_nexus = EXCLUDED.price_nexus,
  stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;
