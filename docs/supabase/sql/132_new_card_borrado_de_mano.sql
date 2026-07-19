-- docs/supabase/sql/132_new_card_borrado_de_mano.sql
-- Magia "Borrado de Mano" (ficha 2 del paquete v1.17): el rival descarta HASTA 3 cartas de su mano (las más
-- antiguas, determinista). Reutiliza el efecto existente DISCARD_OPPONENT_HAND_CARD con count=3 → es solo
-- datos, sin código de motor nuevo (el handler ya clampa count > mano). Decidido (2026-07-16): tope de 3,
-- no la mano entera; subirlo luego es una migración de una línea.
INSERT INTO public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger,
  bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active
) VALUES
  ('exec-borrado-de-mano', 'Borrado de Mano',
   'El rival descarta hasta 3 cartas de su mano (las más antiguas).',
   'EXECUTION', 'NO_CODE', 6, NULL, NULL, NULL, NULL,
   NULL, '/assets/renders/executions/borrado_de_mano.webp',
   '{"action":"DISCARD_OPPONENT_HAND_CARD","count":3}', NULL, '{}', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, type = EXCLUDED.type, faction = EXCLUDED.faction,
  cost = EXCLUDED.cost, attack = EXCLUDED.attack, defense = EXCLUDED.defense, archetype = EXCLUDED.archetype,
  trigger = EXCLUDED.trigger, bg_url = EXCLUDED.bg_url, render_url = EXCLUDED.render_url, effect = EXCLUDED.effect,
  fusion_recipe_id = EXCLUDED.fusion_recipe_id, fusion_material_ids = EXCLUDED.fusion_material_ids,
  fusion_energy_requirement = EXCLUDED.fusion_energy_requirement, is_active = EXCLUDED.is_active;

INSERT INTO public.market_card_listings (id, card_id, rarity, price_nexus, stock, is_available) VALUES
  ('listing-exec-borrado-de-mano', 'exec-borrado-de-mano', 'EPIC', 900, NULL, true)
ON CONFLICT (id) DO UPDATE SET
  card_id = EXCLUDED.card_id, rarity = EXCLUDED.rarity, price_nexus = EXCLUDED.price_nexus,
  stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;
