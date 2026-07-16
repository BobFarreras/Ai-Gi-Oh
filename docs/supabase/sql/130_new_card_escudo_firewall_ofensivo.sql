-- docs/supabase/sql/130_new_card_escudo_firewall_ofensivo.sql
-- Magia "Escudo Firewall Ofensivo" (ficha 7): este turno, tus entidades en DEFENSA pueden atacar usando su DEF
-- (a entidades o directo), SIN cambiar de modo (siguen defendiendo con su DEF si las atacan). Efecto nuevo
-- data-driven ALLOW_DEFENSE_MODE_ATTACK: aplica un estado de turno al propio jugador; el combate usa la DEF como
-- ataque cuando la entidad ataca en modo defensa. Sin selección de objetivo (afecta a todas tus defensoras).
INSERT INTO public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger,
  bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active
) VALUES
  ('exec-escudo-firewall-ofensivo', 'Escudo Firewall Ofensivo',
   'Este turno, tus entidades en defensa pueden atacar usando su DEFENSA como ataque (a entidades o directo), sin cambiar de modo.',
   'EXECUTION', 'OPEN_SOURCE', 2, NULL, NULL, NULL, NULL,
   NULL, '/assets/renders/executions/exec-escudo-firewall-ofensivo.webp',
   '{"action":"ALLOW_DEFENSE_MODE_ATTACK"}', NULL, '{}', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, type = EXCLUDED.type, faction = EXCLUDED.faction,
  cost = EXCLUDED.cost, attack = EXCLUDED.attack, defense = EXCLUDED.defense, archetype = EXCLUDED.archetype,
  trigger = EXCLUDED.trigger, bg_url = EXCLUDED.bg_url, render_url = EXCLUDED.render_url, effect = EXCLUDED.effect,
  fusion_recipe_id = EXCLUDED.fusion_recipe_id, fusion_material_ids = EXCLUDED.fusion_material_ids,
  fusion_energy_requirement = EXCLUDED.fusion_energy_requirement, is_active = EXCLUDED.is_active;

INSERT INTO public.market_card_listings (id, card_id, rarity, price_nexus, stock, is_available) VALUES
  ('listing-exec-escudo-firewall-ofensivo', 'exec-escudo-firewall-ofensivo', 'RARE', 400, NULL, true)
ON CONFLICT (id) DO UPDATE SET
  card_id = EXCLUDED.card_id, rarity = EXCLUDED.rarity, price_nexus = EXCLUDED.price_nexus,
  stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;
