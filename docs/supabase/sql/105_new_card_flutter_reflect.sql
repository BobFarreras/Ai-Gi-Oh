-- docs/supabase/sql/105_new_card_flutter_reflect.sql
-- Trampa "Flutter Enjambre" (#9): cuando el rival te ataca DIRECTO, anula ese golpe (no recibes daño) y
-- refleja el ATK de la entity atacante a los LP del rival. Trigger ON_OPPONENT_DIRECT_ATTACK_DECLARED.
-- Idempotente. Balance provisional.
INSERT INTO public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger,
  bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active
) VALUES
  ('trap-flutter-reflect', 'Flutter Enjambre',
   'Cuando el rival te ataca directo, anula ese golpe (no recibes daño) y refleja el ATK de la entity atacante a los LP del rival.',
   'TRAP', 'OPEN_SOURCE', 3, NULL, NULL, NULL, 'ON_OPPONENT_DIRECT_ATTACK_DECLARED',
   NULL, '/assets/renders/traps/trap-flutter-reflect.webp',
   '{"action":"REFLECT_DIRECT_DAMAGE"}', NULL, '{}', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, type = EXCLUDED.type, faction = EXCLUDED.faction,
  cost = EXCLUDED.cost, attack = EXCLUDED.attack, defense = EXCLUDED.defense, archetype = EXCLUDED.archetype,
  trigger = EXCLUDED.trigger, bg_url = EXCLUDED.bg_url, render_url = EXCLUDED.render_url, effect = EXCLUDED.effect,
  fusion_recipe_id = EXCLUDED.fusion_recipe_id, fusion_material_ids = EXCLUDED.fusion_material_ids,
  fusion_energy_requirement = EXCLUDED.fusion_energy_requirement, is_active = EXCLUDED.is_active;

INSERT INTO public.market_card_listings (id, card_id, rarity, price_nexus, stock, is_available) VALUES
  ('listing-trap-flutter-reflect', 'trap-flutter-reflect', 'EPIC', 360, NULL, true)
ON CONFLICT (id) DO UPDATE SET
  card_id = EXCLUDED.card_id, rarity = EXCLUDED.rarity, price_nexus = EXCLUDED.price_nexus,
  stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;
