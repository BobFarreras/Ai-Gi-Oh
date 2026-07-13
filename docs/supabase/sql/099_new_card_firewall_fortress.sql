-- docs/supabase/sql/099_new_card_firewall_fortress.sql
-- Magia "Firewall Fortaleza" (#5): aplica al rival el estado "sin ataques directos" durante 3 turnos
-- (puede seguir atacando a entities). Primer consumidor del sistema de efectos de estado multi-turno.
-- Idempotente. Balance provisional.
INSERT INTO public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger,
  bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active
) VALUES
  ('exec-firewall-fortress', 'Firewall Fortaleza', 'El rival no puede hacer ataques directos durante 3 turnos.', 'EXECUTION', 'NEUTRAL', 3, NULL, NULL, NULL, NULL,
   '/assets/bgs/bg-tech.webp', '/assets/renders/executions/exec-firewall-fortress.webp',
   '{"action":"APPLY_NO_DIRECT_ATTACKS","turns":3}', NULL, '{}', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, type = EXCLUDED.type, faction = EXCLUDED.faction,
  cost = EXCLUDED.cost, attack = EXCLUDED.attack, defense = EXCLUDED.defense, archetype = EXCLUDED.archetype,
  trigger = EXCLUDED.trigger, bg_url = EXCLUDED.bg_url, render_url = EXCLUDED.render_url, effect = EXCLUDED.effect,
  fusion_recipe_id = EXCLUDED.fusion_recipe_id, fusion_material_ids = EXCLUDED.fusion_material_ids,
  fusion_energy_requirement = EXCLUDED.fusion_energy_requirement, is_active = EXCLUDED.is_active;

INSERT INTO public.market_card_listings (id, card_id, rarity, price_nexus, stock, is_available) VALUES
  ('listing-exec-firewall-fortress', 'exec-firewall-fortress', 'EPIC', 420, NULL, true)
ON CONFLICT (id) DO UPDATE SET
  card_id = EXCLUDED.card_id, rarity = EXCLUDED.rarity, price_nexus = EXCLUDED.price_nexus,
  stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;
