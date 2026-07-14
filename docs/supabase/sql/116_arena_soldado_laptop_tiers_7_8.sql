-- docs/supabase/sql/116_arena_soldado_laptop_tiers_7_8.sql
-- Amplía la Arena:
--   1) Nuevo rival Soldado-Laptop (centinela del Acto 3): 7º y ÚLTIMO combate del roster fijo del ladder
--      (ver ARENA_LADDER_ROSTER en código). Estrena las trampas nuevas del evento (Escudo Firewall,
--      Flutter Enjambre). El roster pasa de 6 a 7 → completar un nivel exige 7 victorias.
--   2) required_wins_in_previous_tier pasa de 6 a 7 en los niveles 2+ (coherente con el roster de 7).
--      El suelo monótono de progreso (resolveTrainingTierAccess) evita que nadie se re-bloquee.
--   3) Nuevos niveles 7 (ZENITH) y 8 (SINGULARITY): de prestigio, MYTHIC ya está en el techo de escalado
--      (versión 5 / nivel 30), así que aportan MÁS RECOMPENSA sobre ese máximo (x2.9 y x3.3).
-- Idempotente (ON CONFLICT / DELETE acotado por variant_id). No crea cartas nuevas: reusa el catálogo.

-- 1) Perfil del oponente (debe existir antes de referenciarlo desde arena_tiers por FK).
INSERT INTO arena_opponents (id, code_name, display_name, avatar_url, intro_url, story_opponent_id, sort_order) VALUES
  ('training-soldado-laptop','soldado-laptop','Soldado-Laptop','/assets/story/opponents/opp-ch3-soldado-laptop/avatar-Soldado-laptop.webp','/assets/story/opponents/opp-ch3-soldado-laptop/intro-Soldado-laptop.webp','opp-soldado-laptop',9)
ON CONFLICT (id) DO UPDATE SET code_name=EXCLUDED.code_name, display_name=EXCLUDED.display_name, avatar_url=EXCLUDED.avatar_url, intro_url=EXCLUDED.intro_url, story_opponent_id=EXCLUDED.story_opponent_id, sort_order=EXCLUDED.sort_order, updated_at=now();

-- 2) Variantes de mazo que rotan por partidas (coinciden con los presets en código).
INSERT INTO arena_opponent_deck_variants (id, opponent_id, label, sort_order) VALUES
  ('sentinel-firewall','training-soldado-laptop','Sentinel Firewall',1),
  ('sentinel-swarm','training-soldado-laptop','Sentinel Swarm',2)
ON CONFLICT (id) DO UPDATE SET opponent_id=EXCLUDED.opponent_id, label=EXCLUDED.label, sort_order=EXCLUDED.sort_order, updated_at=now();

-- 3) Cartas de cada variante (re-sembrado idempotente acotado a estas 2 variantes; no toca el resto).
DELETE FROM arena_deck_variant_cards WHERE variant_id IN ('sentinel-firewall','sentinel-swarm');

INSERT INTO arena_deck_variant_cards (variant_id, card_id, zone, sort_order)
SELECT v.variant_id, c.card_id, v.zone, c.ord FROM (VALUES
  ('sentinel-firewall','DECK',ARRAY['entity-chatgpt','entity-gemini','entity-claude','entity-kali-linux','entity-deepseek','entity-python','entity-postgress','entity-nextjs','entity-react','entity-openclaw','exec-fusion-gemgpt','exec-fusion-kaclauli','exec-fusion-pytgress','exec-direct-damage-900','exec-llm-def-300','trap-firewall-counter-magic','trap-flutter-reflect','trap-kernel-panic','trap-runtime-punish','trap-counter-intrusion']),
  ('sentinel-firewall','FUSION',ARRAY['fusion-gemgpt','fusion-kaclauli']),
  ('sentinel-swarm','DECK',ARRAY['entity-chatgpt','entity-gemini','entity-claude','entity-kali-linux','entity-deepseek','entity-python','entity-postgress','entity-nextjs','entity-react','entity-vercel','exec-fusion-gemgpt','exec-fusion-kaclauli','exec-fusion-pytgress','exec-boost-atk-400','exec-direct-damage-900','trap-firewall-counter-magic','trap-flutter-reflect','trap-kernel-panic','trap-atk-drain','trap-runtime-punish']),
  ('sentinel-swarm','FUSION',ARRAY['fusion-gemgpt','fusion-kaclauli'])
) AS v(variant_id, zone, cards)
CROSS JOIN LATERAL unnest(v.cards) WITH ORDINALITY AS c(card_id, ord);

-- 4) Los niveles 2+ pasan a exigir 7 victorias (roster de 7). No re-bloquea (suelo monótono en código).
UPDATE arena_tiers SET required_wins_in_previous_tier = 7, updated_at = now()
WHERE tier >= 2 AND required_wins_in_previous_tier <> 7;

-- 5) Nuevos niveles 7 (ZENITH) y 8 (SINGULARITY): prestigio sobre el techo MYTHIC, mayor recompensa.
INSERT INTO arena_tiers (tier, code, required_wins_in_previous_tier, ai_difficulty, opponent_id, reward_multiplier, is_active, default_version_tier, default_level, default_xp) VALUES
  (7, 'ZENITH', 7, 'MYTHIC', 'training-soldado-laptop', 2.9, true, 5, 30, 9800),
  (8, 'SINGULARITY', 7, 'MYTHIC', 'training-soldado-laptop', 3.3, true, 5, 30, 9800)
ON CONFLICT (tier) DO UPDATE SET
  code = EXCLUDED.code, required_wins_in_previous_tier = EXCLUDED.required_wins_in_previous_tier, ai_difficulty = EXCLUDED.ai_difficulty,
  opponent_id = EXCLUDED.opponent_id, reward_multiplier = EXCLUDED.reward_multiplier, is_active = EXCLUDED.is_active,
  default_version_tier = EXCLUDED.default_version_tier, default_level = EXCLUDED.default_level, default_xp = EXCLUDED.default_xp, updated_at = now();
