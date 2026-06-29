-- docs/supabase/sql/079_phase_innate_entity_passives.sql - Poderes innatos de entity: pasiva mastery activa desde V1 (escalada por versión) para 10 cartas de stats bajos (Fase 5 v1.7).

-- 1) Columna de pasiva innata en el catálogo (la pasiva se transporta desde V1 en la carta base).
ALTER TABLE cards_catalog ADD COLUMN IF NOT EXISTS innate_passive_skill_id text;

-- 2) Asignación de las 10 cartas débiles a su pasiva innata.
UPDATE cards_catalog SET innate_passive_skill_id = v.passive_skill_id
FROM (VALUES
  ('entity-vscode', 'passive-reflect-damage-200'),
  ('entity-cursor', 'passive-atk-growth-100'),
  ('entity-git', 'passive-draw-on-summon'),
  ('entity-copilot', 'passive-atk-growth-100'),
  ('entity-huggenface', 'passive-entity-attack-plus-300'),
  ('entity-n8n', 'passive-atk-drain-200'),
  ('entity-vercel', 'passive-entity-attack-plus-300'),
  ('entity-astro', 'passive-direct-hit-plus-200'),
  ('entity-perplexity', 'passive-heal-200-on-turn'),
  ('entity-make', 'passive-energy-on-death')
) AS v(card_id, passive_skill_id)
WHERE cards_catalog.id = v.card_id;

-- 3) Excluir estas cartas del mapa V5 genérico: su pasiva innata es su única identidad (sin doble poder).
DELETE FROM card_mastery_passive_map
WHERE card_id IN (
  'entity-vscode', 'entity-cursor', 'entity-git', 'entity-copilot', 'entity-huggenface',
  'entity-n8n', 'entity-vercel', 'entity-astro', 'entity-perplexity', 'entity-make'
);

-- 4) Sincroniza el progreso existente de estas cartas a su pasiva innata (evita arrastrar el fallback genérico).
UPDATE player_card_progress p
SET mastery_passive_skill_id = c.innate_passive_skill_id, updated_at = now()
FROM cards_catalog c
WHERE p.card_id = c.id
  AND c.innate_passive_skill_id IS NOT NULL
  AND p.mastery_passive_skill_id IS DISTINCT FROM c.innate_passive_skill_id;
