-- docs/supabase/sql/111_new_card_octocat_steal_entity.sql
-- Magia "Octocat" (#12): eliges una entity del tablero rival y la robas a tu campo (si tienes hueco). La
-- entity robada no puede atacar el turno del robo. Selección vía acción pendiente. Idempotente.
INSERT INTO public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger,
  bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active
) VALUES
  ('exec-octocat-steal-entity', 'Octocat', 'Roba una entity del tablero rival a tu campo (no puede atacar este turno).',
   'EXECUTION', 'NEUTRAL', 6, NULL, NULL, NULL, NULL,
   '/assets/bgs/bg-tech.webp', '/assets/renders/executions/exec-octocat-steal-entity.webp',
   '{"action":"STEAL_OPPONENT_ENTITY"}', NULL, '{}', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, type = EXCLUDED.type, faction = EXCLUDED.faction,
  cost = EXCLUDED.cost, attack = EXCLUDED.attack, defense = EXCLUDED.defense, archetype = EXCLUDED.archetype,
  trigger = EXCLUDED.trigger, bg_url = EXCLUDED.bg_url, render_url = EXCLUDED.render_url, effect = EXCLUDED.effect,
  fusion_recipe_id = EXCLUDED.fusion_recipe_id, fusion_material_ids = EXCLUDED.fusion_material_ids,
  fusion_energy_requirement = EXCLUDED.fusion_energy_requirement, is_active = EXCLUDED.is_active;

INSERT INTO public.market_card_listings (id, card_id, rarity, price_nexus, stock, is_available) VALUES
  ('listing-exec-octocat-steal-entity', 'exec-octocat-steal-entity', 'EPIC', 420, NULL, true)
ON CONFLICT (id) DO UPDATE SET
  card_id = EXCLUDED.card_id, rarity = EXCLUDED.rarity, price_nexus = EXCLUDED.price_nexus,
  stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;
