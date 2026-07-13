-- docs/supabase/sql/104_new_card_hugging_heal.sql
-- Trampa "Abrazo de Hugging Face" (#11): al activar el rival una trampa, cura al dueño 300 PV al inicio de
-- cada uno de sus turnos hasta el final del duelo (HEAL_OVER_TIME indefinido, tope PV máx).
-- Trigger ON_OPPONENT_TRAP_ACTIVATED. Idempotente. Balance provisional.
INSERT INTO public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger,
  bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active
) VALUES
  ('trap-hugging-heal', 'Abrazo de Hugging Face',
   'Cuando el rival activa una trampa, te abraza: recuperas 300 LP al inicio de cada uno de tus turnos hasta el final del duelo. No se acumula: si ya estás regenerando, se mantiene en 300 LP por turno.',
   'TRAP', 'OPEN_SOURCE', 2, NULL, NULL, NULL, 'ON_OPPONENT_TRAP_ACTIVATED',
   NULL, '/assets/renders/traps/trap-hugging-heal.webp',
   '{"action":"APPLY_HEAL_OVER_TIME","value":300}', NULL, '{}', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, type = EXCLUDED.type, faction = EXCLUDED.faction,
  cost = EXCLUDED.cost, attack = EXCLUDED.attack, defense = EXCLUDED.defense, archetype = EXCLUDED.archetype,
  trigger = EXCLUDED.trigger, bg_url = EXCLUDED.bg_url, render_url = EXCLUDED.render_url, effect = EXCLUDED.effect,
  fusion_recipe_id = EXCLUDED.fusion_recipe_id, fusion_material_ids = EXCLUDED.fusion_material_ids,
  fusion_energy_requirement = EXCLUDED.fusion_energy_requirement, is_active = EXCLUDED.is_active;

INSERT INTO public.market_card_listings (id, card_id, rarity, price_nexus, stock, is_available) VALUES
  ('listing-trap-hugging-heal', 'trap-hugging-heal', 'EPIC', 320, NULL, true)
ON CONFLICT (id) DO UPDATE SET
  card_id = EXCLUDED.card_id, rarity = EXCLUDED.rarity, price_nexus = EXCLUDED.price_nexus,
  stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;
