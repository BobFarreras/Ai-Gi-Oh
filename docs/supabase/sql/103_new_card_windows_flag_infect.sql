-- docs/supabase/sql/103_new_card_windows_flag_infect.sql
-- Trampa "Bandera de Windows Retro" (#10): al activar el rival una trampa, lo infecta con 300 de daño
-- al inicio de cada uno de sus turnos hasta el final del duelo (DAMAGE_OVER_TIME indefinido).
-- Trigger ON_OPPONENT_TRAP_ACTIVATED. Idempotente. Balance provisional.
INSERT INTO public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger,
  bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active
) VALUES
  ('trap-windows-flag-infect', 'Bandera de Windows Retro',
   'Cuando el rival activa una trampa, lo infecta: pierde 300 LP al inicio de cada uno de sus turnos hasta el final del duelo. No se acumula: si ya está infectado, se mantiene en 300 LP por turno.',
   'TRAP', 'BIG_TECH', 2, NULL, NULL, NULL, 'ON_OPPONENT_TRAP_ACTIVATED',
   NULL, '/assets/renders/traps/trap-windows-flag-infect.webp',
   '{"action":"APPLY_DAMAGE_OVER_TIME","value":300}', NULL, '{}', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, type = EXCLUDED.type, faction = EXCLUDED.faction,
  cost = EXCLUDED.cost, attack = EXCLUDED.attack, defense = EXCLUDED.defense, archetype = EXCLUDED.archetype,
  trigger = EXCLUDED.trigger, bg_url = EXCLUDED.bg_url, render_url = EXCLUDED.render_url, effect = EXCLUDED.effect,
  fusion_recipe_id = EXCLUDED.fusion_recipe_id, fusion_material_ids = EXCLUDED.fusion_material_ids,
  fusion_energy_requirement = EXCLUDED.fusion_energy_requirement, is_active = EXCLUDED.is_active;

INSERT INTO public.market_card_listings (id, card_id, rarity, price_nexus, stock, is_available) VALUES
  ('listing-trap-windows-flag-infect', 'trap-windows-flag-infect', 'EPIC', 340, NULL, true)
ON CONFLICT (id) DO UPDATE SET
  card_id = EXCLUDED.card_id, rarity = EXCLUDED.rarity, price_nexus = EXCLUDED.price_nexus,
  stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;
