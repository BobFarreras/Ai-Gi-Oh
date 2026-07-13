-- docs/supabase/sql/112_new_card_firewall_counter_magic.sql
-- Trampa "Escudo Firewall" (#15): cuando el rival activa una magia, anula su efecto y destruye esa carta
-- antes de que se resuelva. Trigger ON_OPPONENT_EXECUTION_ACTIVATED. Idempotente. Balance provisional.
INSERT INTO public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger,
  bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active
) VALUES
  ('trap-firewall-counter-magic', 'Escudo Firewall',
   'Cuando el rival activa una magia, anula su efecto y destruye esa carta antes de que se resuelva.',
   'TRAP', 'OPEN_SOURCE', 3, NULL, NULL, NULL, 'ON_OPPONENT_EXECUTION_ACTIVATED',
   NULL, '/assets/renders/traps/trap-firewall-counter-magic.webp',
   '{"action":"NEGATE_OPPONENT_EXECUTION_AND_DESTROY"}', NULL, '{}', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, type = EXCLUDED.type, faction = EXCLUDED.faction,
  cost = EXCLUDED.cost, attack = EXCLUDED.attack, defense = EXCLUDED.defense, archetype = EXCLUDED.archetype,
  trigger = EXCLUDED.trigger, bg_url = EXCLUDED.bg_url, render_url = EXCLUDED.render_url, effect = EXCLUDED.effect,
  fusion_recipe_id = EXCLUDED.fusion_recipe_id, fusion_material_ids = EXCLUDED.fusion_material_ids,
  fusion_energy_requirement = EXCLUDED.fusion_energy_requirement, is_active = EXCLUDED.is_active;

INSERT INTO public.market_card_listings (id, card_id, rarity, price_nexus, stock, is_available) VALUES
  ('listing-trap-firewall-counter-magic', 'trap-firewall-counter-magic', 'EPIC', 360, NULL, true)
ON CONFLICT (id) DO UPDATE SET
  card_id = EXCLUDED.card_id, rarity = EXCLUDED.rarity, price_nexus = EXCLUDED.price_nexus,
  stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;
