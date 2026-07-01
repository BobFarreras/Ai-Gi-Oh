-- docs/supabase/sql/086_arena_opponents_guill_mouretech.sql
-- Añade dos oponentes de arena reutilizables (identidad lista también para Story):
--   - Guill: rival dedicado del Nivel 6 (APEX), reemplaza al soldado repetido que reusaba el N5.
--   - Mouretech: rival comodín que puede aparecer aleatoriamente en cualquier nivel (rotación por código).
-- Idempotente (ON CONFLICT / DELETE acotado por variant_id). No crea cartas nuevas: reusa el catálogo existente.

-- 1) Perfiles de oponente (deben existir antes de referenciarlos desde arena_tiers por FK).
INSERT INTO arena_opponents (id, code_name, display_name, avatar_url, intro_url, story_opponent_id, sort_order) VALUES
  ('training-tier-6','guill','Guill','/assets/story/opponents/opp-ch1-guill/avatar-Guill.webp','/assets/story/opponents/opp-ch1-guill/intro-Guill.webp','opp-guill',7),
  ('training-mouretech','mouretech','Mouretech','/assets/story/opponents/opp-ch1-mouretech/avatar-Mouretech.webp','/assets/story/opponents/opp-ch1-mouretech/intro-Mouretech.webp','opp-mouretech',8)
ON CONFLICT (id) DO UPDATE SET code_name=EXCLUDED.code_name, display_name=EXCLUDED.display_name, avatar_url=EXCLUDED.avatar_url, intro_url=EXCLUDED.intro_url, story_opponent_id=EXCLUDED.story_opponent_id, sort_order=EXCLUDED.sort_order, updated_at=now();

-- 2) Variantes de mazo que rotan por partidas.
INSERT INTO arena_opponent_deck_variants (id, opponent_id, label, sort_order) VALUES
  ('apex-annihilation','training-tier-6','Apex Annihilation',1),
  ('apex-lockdown','training-tier-6','Apex Lockdown',2),
  ('mouretech-offense','training-mouretech','Mouretech Offense',1),
  ('mouretech-control','training-mouretech','Mouretech Control',2)
ON CONFLICT (id) DO UPDATE SET opponent_id=EXCLUDED.opponent_id, label=EXCLUDED.label, sort_order=EXCLUDED.sort_order, updated_at=now();

-- 3) Cartas de cada variante (re-sembrado idempotente acotado a estas 4 variantes; no toca el resto).
DELETE FROM arena_deck_variant_cards WHERE variant_id IN ('apex-annihilation','apex-lockdown','mouretech-offense','mouretech-control');

INSERT INTO arena_deck_variant_cards (variant_id, card_id, zone, sort_order)
SELECT v.variant_id, c.card_id, v.zone, c.ord FROM (VALUES
  ('apex-annihilation','DECK',ARRAY['entity-chatgpt','entity-gemini','entity-claude','entity-kali-linux','entity-deepseek','entity-python','entity-postgress','entity-nextjs','entity-react','entity-openclaw','exec-fusion-gemgpt','exec-fusion-kaclauli','exec-fusion-pytgress','exec-boost-atk-400','exec-direct-damage-900','exec-llm-def-300','trap-kernel-panic','trap-atk-drain','trap-runtime-punish','trap-counter-intrusion']),
  ('apex-annihilation','FUSION',ARRAY['fusion-gemgpt','fusion-kaclauli']),
  ('apex-lockdown','DECK',ARRAY['entity-chatgpt','entity-gemini','entity-claude','entity-kali-linux','entity-deepseek','entity-python','entity-postgress','entity-nextjs','entity-react','entity-openclaw','exec-fusion-gemgpt','exec-fusion-kaclauli','exec-fusion-pytgress','exec-llm-def-300','exec-heal-700','exec-direct-damage-900','trap-kernel-panic','trap-atk-drain','trap-runtime-punish','trap-def-fragment']),
  ('apex-lockdown','FUSION',ARRAY['fusion-gemgpt','fusion-kaclauli']),
  ('mouretech-offense','DECK',ARRAY['entity-chatgpt','entity-gemini','entity-claude','entity-kali-linux','entity-deepseek','entity-python','entity-postgress','entity-nextjs','entity-react','entity-vercel','exec-fusion-gemgpt','exec-fusion-kaclauli','exec-direct-damage-900','exec-boost-atk-400','exec-framework-atk-300','exec-draw-1','trap-kernel-panic','trap-runtime-punish','trap-counter-intrusion','trap-atk-drain']),
  ('mouretech-offense','FUSION',ARRAY['fusion-gemgpt','fusion-kaclauli']),
  ('mouretech-control','DECK',ARRAY['entity-chatgpt','entity-gemini','entity-claude','entity-kali-linux','entity-deepseek','entity-python','entity-postgress','entity-nextjs','entity-react','entity-supabase','exec-fusion-gemgpt','exec-fusion-kaclauli','exec-llm-def-300','exec-heal-700','exec-framework-atk-300','exec-draw-1','trap-kernel-panic','trap-runtime-punish','trap-counter-intrusion','trap-def-fragment']),
  ('mouretech-control','FUSION',ARRAY['fusion-gemgpt','fusion-kaclauli'])
) AS v(variant_id, zone, cards)
CROSS JOIN LATERAL unnest(v.cards) WITH ORDINALITY AS c(card_id, ord);

-- 4) El Nivel 6 pasa a usar a Guill como rival base (antes reusaba 'training-tier-5' = soldado, duplicándolo).
UPDATE arena_tiers SET opponent_id = 'training-tier-6', updated_at = now() WHERE tier = 6;
