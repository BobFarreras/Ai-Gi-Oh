-- docs/supabase/sql/087_arena_six_combats_ladder.sql
-- Arena "6 combates por nivel": cada nivel = los MISMOS 6 rivales (roster fijo definido en código,
-- ARENA_LADDER_ROSTER), enfrentados EN ORDEN por victorias, y más fuertes a cada nivel. Se avanza al
-- ganar los 6 → required_wins_in_previous_tier pasa de 5 a 6 en los niveles 2..6.
--
-- NOTA: el rival de cada combate ya NO lo elige el tier (el roster es global, resuelto en código); la
-- columna `opponent_id` de arena_tiers queda como valor informativo/compatibilidad. La dificultad y el
-- escalado (default_version_tier/level/xp) de cada tier ya reflejan la curva deseada y no se tocan aquí.
UPDATE arena_tiers
SET required_wins_in_previous_tier = 6, updated_at = now()
WHERE tier >= 2 AND required_wins_in_previous_tier <> 6;
