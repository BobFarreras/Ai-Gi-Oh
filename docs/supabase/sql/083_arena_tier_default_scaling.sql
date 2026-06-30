-- docs/supabase/sql/083_arena_tier_default_scaling.sql - Escalado de cartas por tier (version/level/xp) editable; null = cae al escalado por dificultad.
ALTER TABLE arena_tiers ADD COLUMN IF NOT EXISTS default_version_tier int;
ALTER TABLE arena_tiers ADD COLUMN IF NOT EXISTS default_level int;
ALTER TABLE arena_tiers ADD COLUMN IF NOT EXISTS default_xp int;

UPDATE arena_tiers SET default_version_tier = v.vt, default_level = v.lv, default_xp = v.xp
FROM (VALUES
  (2, 0, 10, 980),
  (3, 3, 10, 980),
  (4, 3, 20, 2800),
  (5, 3, 30, 5600)
) AS v(tier, vt, lv, xp)
WHERE arena_tiers.tier = v.tier;
