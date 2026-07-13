-- docs/supabase/sql/113_new_card_typescript_shield.sql
-- Trampa "Escudo de Tipos TypeScript" (#8): trampa PERSISTENTE ligada a la entity 'entity-typescript'.
-- Cada vez que el rival la ataca, esa entity gana 1000 DEF (acumulable). La trampa no se consume: sigue
-- puesta mientras la entity siga en el campo. Trigger ON_OPPONENT_ATTACK_DECLARED. Idempotente.
INSERT INTO public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger,
  bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active
) VALUES
  ('trap-typescript-shield', 'Escudo de Tipos TypeScript',
   'Ligada a tu TypeScript: cada vez que la atacan, gana 1000 DEF (acumulable). La trampa sigue puesta mientras esa entity siga en el campo.',
   'TRAP', 'OPEN_SOURCE', 2, NULL, NULL, NULL, 'ON_OPPONENT_ATTACK_DECLARED',
   NULL, '/assets/renders/traps/trap-typescript-shield.webp',
   '{"action":"REINFORCE_LINKED_ENTITY_ON_ATTACK","linkedCardId":"entity-typescript","value":1000}', NULL, '{}', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, type = EXCLUDED.type, faction = EXCLUDED.faction,
  cost = EXCLUDED.cost, attack = EXCLUDED.attack, defense = EXCLUDED.defense, archetype = EXCLUDED.archetype,
  trigger = EXCLUDED.trigger, bg_url = EXCLUDED.bg_url, render_url = EXCLUDED.render_url, effect = EXCLUDED.effect,
  fusion_recipe_id = EXCLUDED.fusion_recipe_id, fusion_material_ids = EXCLUDED.fusion_material_ids,
  fusion_energy_requirement = EXCLUDED.fusion_energy_requirement, is_active = EXCLUDED.is_active;

INSERT INTO public.market_card_listings (id, card_id, rarity, price_nexus, stock, is_available) VALUES
  ('listing-trap-typescript-shield', 'trap-typescript-shield', 'RARE', 280, NULL, true)
ON CONFLICT (id) DO UPDATE SET
  card_id = EXCLUDED.card_id, rarity = EXCLUDED.rarity, price_nexus = EXCLUDED.price_nexus,
  stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;
