-- docs/supabase/sql/098_antigrabity_revive_passive.sql
-- Pasiva innata de Antigrabity: "Reactivación" (revive del cementerio al inicio de su turno).
-- Espejo en código: INNATE_PASSIVE_SKILL_BY_CARD_ID (innate-passive-map.ts). La lógica del motor la
-- resuelve applyScheduledRevivals en next-phase. Idempotente.
UPDATE public.cards_catalog
SET innate_passive_skill_id = 'passive-revive-next-turn'
WHERE id = 'entity-antigrabity';
