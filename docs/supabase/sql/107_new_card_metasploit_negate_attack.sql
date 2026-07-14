-- docs/supabase/sql/107_new_card_metasploit_negate_attack.sql
-- Trampa "Escudo Metasploit": al declarar el rival un ataque (a una entity o directo), lo BLOQUEA (no se
-- resuelve) sin destruir al atacante. Trigger ON_OPPONENT_ATTACK_DECLARED. Idempotente. Balance provisional.
INSERT INTO public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger,
  bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active
) VALUES
  ('trap-escudo-metasploit', 'Escudo Metasploit',
   'Cuando el rival declara un ataque, lo bloqueas: ese ataque no se resuelve. El atacante no se destruye.',
   'TRAP', 'OPEN_SOURCE', 2, NULL, NULL, NULL, 'ON_OPPONENT_ATTACK_DECLARED',
   NULL, '/assets/renders/traps/trap-escudo-metasploit.webp',
   '{"action":"NEGATE_ATTACK"}', NULL, '{}', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, type = EXCLUDED.type, faction = EXCLUDED.faction,
  cost = EXCLUDED.cost, attack = EXCLUDED.attack, defense = EXCLUDED.defense, archetype = EXCLUDED.archetype,
  trigger = EXCLUDED.trigger, bg_url = EXCLUDED.bg_url, render_url = EXCLUDED.render_url, effect = EXCLUDED.effect,
  fusion_recipe_id = EXCLUDED.fusion_recipe_id, fusion_material_ids = EXCLUDED.fusion_material_ids,
  fusion_energy_requirement = EXCLUDED.fusion_energy_requirement, is_active = EXCLUDED.is_active;

INSERT INTO public.market_card_listings (id, card_id, rarity, price_nexus, stock, is_available) VALUES
  ('listing-trap-escudo-metasploit', 'trap-escudo-metasploit', 'RARE', 300, NULL, true)
ON CONFLICT (id) DO UPDATE SET
  card_id = EXCLUDED.card_id, rarity = EXCLUDED.rarity, price_nexus = EXCLUDED.price_nexus,
  stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;
