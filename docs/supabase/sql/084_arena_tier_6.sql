-- docs/supabase/sql/084_arena_tier_6.sql - Crea el Nivel 6 de arena (todas las cartas a nivel 30 + V5), reusando el oponente de N5 por defecto.
INSERT INTO arena_tiers (tier, code, required_wins_in_previous_tier, ai_difficulty, opponent_id, reward_multiplier, is_active, default_version_tier, default_level, default_xp)
VALUES (6, 'APEX', 5, 'MYTHIC', 'training-tier-5', 2.5, true, 5, 30, 9800)
ON CONFLICT (tier) DO UPDATE SET
  code = EXCLUDED.code, required_wins_in_previous_tier = EXCLUDED.required_wins_in_previous_tier, ai_difficulty = EXCLUDED.ai_difficulty,
  opponent_id = EXCLUDED.opponent_id, reward_multiplier = EXCLUDED.reward_multiplier, is_active = EXCLUDED.is_active,
  default_version_tier = EXCLUDED.default_version_tier, default_level = EXCLUDED.default_level, default_xp = EXCLUDED.default_xp, updated_at = now();
