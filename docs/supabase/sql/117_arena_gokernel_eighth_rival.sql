-- docs/supabase/sql/117_arena_gokernel_eighth_rival.sql
-- Amplía el roster del ladder de Arena a 8 rivales añadiendo a Gokernel (guerrero núcleo, homenaje cyber):
-- 8º y ÚLTIMO combate de CADA nivel. El roster pasa de 7 a 8 → completar un nivel exige 8 victorias.
--   - required_wins_in_previous_tier pasa de 7 a 8 en los niveles 2+. El suelo monótono de progreso
--     (resolveTrainingTierAccess) evita que nadie se re-bloquee.
--   - El Nivel 8 (SINGULARITY) pasa a mostrar a Gokernel como rival base (informativo; el roster es global).
-- Deck provisional (a mejorar): beatdown agresivo con fusiones y presión directa. Idempotente.

-- 1) Perfil del oponente (debe existir antes de referenciarlo desde arena_tiers por FK).
INSERT INTO arena_opponents (id, code_name, display_name, avatar_url, intro_url, story_opponent_id, sort_order) VALUES
  ('training-gokernel','gokernel','Gokernel','/assets/story/opponents/opp-ch3-gokernel/avatar-Gokernel.webp','/assets/story/opponents/opp-ch3-gokernel/intro-Gokernel.webp','opp-gokernel',10)
ON CONFLICT (id) DO UPDATE SET code_name=EXCLUDED.code_name, display_name=EXCLUDED.display_name, avatar_url=EXCLUDED.avatar_url, intro_url=EXCLUDED.intro_url, story_opponent_id=EXCLUDED.story_opponent_id, sort_order=EXCLUDED.sort_order, updated_at=now();

-- 2) Variantes de mazo que rotan por partidas (coinciden con los presets en código).
INSERT INTO arena_opponent_deck_variants (id, opponent_id, label, sort_order) VALUES
  ('gokernel-overdrive','training-gokernel','Gokernel Overdrive',1),
  ('gokernel-ultra','training-gokernel','Gokernel Ultra',2)
ON CONFLICT (id) DO UPDATE SET opponent_id=EXCLUDED.opponent_id, label=EXCLUDED.label, sort_order=EXCLUDED.sort_order, updated_at=now();

-- 3) Cartas de cada variante (re-sembrado idempotente acotado a estas 2 variantes; no toca el resto).
DELETE FROM arena_deck_variant_cards WHERE variant_id IN ('gokernel-overdrive','gokernel-ultra');

INSERT INTO arena_deck_variant_cards (variant_id, card_id, zone, sort_order)
SELECT v.variant_id, c.card_id, v.zone, c.ord FROM (VALUES
  ('gokernel-overdrive','DECK',ARRAY['entity-chatgpt','entity-gemini','entity-claude','entity-kali-linux','entity-deepseek','entity-python','entity-postgress','entity-nextjs','entity-react','entity-openclaw','exec-fusion-gemgpt','exec-fusion-kaclauli','exec-fusion-pytgress','exec-boost-atk-400','exec-direct-damage-900','exec-direct-damage-600','trap-kernel-panic','trap-runtime-punish','trap-counter-intrusion','trap-atk-drain']),
  ('gokernel-overdrive','FUSION',ARRAY['fusion-gemgpt','fusion-kaclauli']),
  ('gokernel-ultra','DECK',ARRAY['entity-chatgpt','entity-gemini','entity-claude','entity-kali-linux','entity-deepseek','entity-python','entity-postgress','entity-nextjs','entity-react','entity-vercel','exec-fusion-gemgpt','exec-fusion-kaclauli','exec-fusion-pytgress','exec-boost-atk-400','exec-llm-def-300','exec-direct-damage-900','trap-firewall-counter-magic','trap-kernel-panic','trap-runtime-punish','trap-atk-drain']),
  ('gokernel-ultra','FUSION',ARRAY['fusion-gemgpt','fusion-kaclauli'])
) AS v(variant_id, zone, cards)
CROSS JOIN LATERAL unnest(v.cards) WITH ORDINALITY AS c(card_id, ord);

-- 4) Los niveles 2+ pasan a exigir 8 victorias (roster de 8). No re-bloquea (suelo monótono en código).
UPDATE arena_tiers SET required_wins_in_previous_tier = 8, updated_at = now()
WHERE tier >= 2 AND required_wins_in_previous_tier <> 8;

-- 5) El Nivel 8 muestra a Gokernel como rival base (informativo; el roster es global y se resuelve en código).
UPDATE arena_tiers SET opponent_id = 'training-gokernel', updated_at = now() WHERE tier = 8;
