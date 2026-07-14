-- docs/supabase/sql/096_new_cards_batch1_antigrabity_boost.sql
-- Lote 1 de cartas nuevas (Fase 1 de la guía docs/features/new-cards-magic-trap-guide.md):
--   · entity-antigrabity (3 energía, 1200/1200). Su pasiva innata "revivir" se cablea en código en una
--     fase posterior; aquí solo se sella la carta base en el catálogo.
--   · 3 magias BOOST_ATTACK_BY_CARD_ID (+1000 ATK a su entity): figma→figma, copilot→copilot, arch→antigrabity.
-- Idempotente (ON CONFLICT). Balance (coste/precio) provisional y ajustable.
INSERT INTO public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger,
  bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active
) VALUES
  ('entity-antigrabity', 'Antigrabity', 'Núcleo antigravedad que desafía la caída.', 'ENTITY', 'NEUTRAL', 3, 1200, 1200, NULL, NULL,
   '/assets/bgs/bg-tech.webp', '/assets/renders/antigrabity.webp', NULL, NULL, '{}', NULL, true),
  ('exec-figma-boost', 'Figma Overdrive', 'Sube +1000 ATK a tu Figma en campo.', 'EXECUTION', 'NO_CODE', 2, NULL, NULL, NULL, NULL,
   '/assets/bgs/bg-tech.webp', '/assets/renders/executions/exec-figma-boost.webp',
   '{"action":"BOOST_ATTACK_BY_CARD_ID","targetCardId":"entity-figma","value":1000}', NULL, '{}', NULL, true),
  ('exec-copilot-boost', 'Copilot Overdrive', 'Sube +1000 ATK a tu Copilot en campo.', 'EXECUTION', 'BIG_TECH', 2, NULL, NULL, NULL, NULL,
   '/assets/bgs/bg-tech.webp', '/assets/renders/executions/exec-copilot-boost.webp',
   '{"action":"BOOST_ATTACK_BY_CARD_ID","targetCardId":"entity-copilot","value":1000}', NULL, '{}', NULL, true),
  ('exec-arch-boost', 'Arch Overdrive', 'Sube +1000 ATK a tu Antigrabity en campo.', 'EXECUTION', 'OPEN_SOURCE', 2, NULL, NULL, NULL, NULL,
   '/assets/bgs/bg-tech.webp', '/assets/renders/executions/exec-arch-boost.webp',
   '{"action":"BOOST_ATTACK_BY_CARD_ID","targetCardId":"entity-antigrabity","value":1000}', NULL, '{}', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, type = EXCLUDED.type, faction = EXCLUDED.faction,
  cost = EXCLUDED.cost, attack = EXCLUDED.attack, defense = EXCLUDED.defense, archetype = EXCLUDED.archetype,
  trigger = EXCLUDED.trigger, bg_url = EXCLUDED.bg_url, render_url = EXCLUDED.render_url, effect = EXCLUDED.effect,
  fusion_recipe_id = EXCLUDED.fusion_recipe_id, fusion_material_ids = EXCLUDED.fusion_material_ids,
  fusion_energy_requirement = EXCLUDED.fusion_energy_requirement, is_active = EXCLUDED.is_active;

-- Listings de mercado (comprables). Precios provisionales.
INSERT INTO public.market_card_listings (id, card_id, rarity, price_nexus, stock, is_available) VALUES
  ('listing-entity-antigrabity', 'entity-antigrabity', 'EPIC', 700, NULL, true),
  ('listing-exec-figma-boost', 'exec-figma-boost', 'RARE', 320, NULL, true),
  ('listing-exec-copilot-boost', 'exec-copilot-boost', 'RARE', 320, NULL, true),
  ('listing-exec-arch-boost', 'exec-arch-boost', 'RARE', 320, NULL, true)
ON CONFLICT (id) DO UPDATE SET
  card_id = EXCLUDED.card_id, rarity = EXCLUDED.rarity, price_nexus = EXCLUDED.price_nexus,
  stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;
