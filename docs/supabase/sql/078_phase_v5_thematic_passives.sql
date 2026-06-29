-- docs/supabase/sql/078_phase_v5_thematic_passives.sql - Catálogo de 10 pasivas mastery V5 y mapeo temático por arquetipo de las 67 entities (Fase 4 v1.7).

-- 1) Catálogo de pasivas: reconcilia la 4ª (Turbo Ofensivo) y añade las 6 nuevas. Idempotente.
INSERT INTO card_passive_skills (id, name, description, is_active) VALUES
  ('passive-attack-energy-plus-1', 'Turbo Ofensivo', 'En ataque, gana +1 energía al inicio del turno propio.', true),
  ('passive-draw-on-summon', 'Caja de Herramientas', 'Al invocarse, su dueño roba 1 carta.', true),
  ('passive-atk-growth-100', 'Aprendizaje Continuo', '+100 ATK al inicio de cada turno propio (hasta +500 acumulado).', true),
  ('passive-energy-on-death', 'Autoguardado', 'Al ser destruida, devuelve 1 energía a su dueño.', true),
  ('passive-reflect-damage-200', 'Cortafuegos Reactivo', 'Al ser atacada, refleja 200 de daño directo al rival.', true),
  ('passive-heal-200-on-turn', 'Regeneración', 'Al inicio de cada turno propio, el dueño cura 200 HP.', true),
  ('passive-entity-attack-plus-300', 'Sobrecarga', 'Al atacar a una entity rival, gana +300 ATK en ese ataque.', true)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active, updated_at = now();

-- 2) Mapa temático: una fila por entity. Pasiva primaria por arquetipo, con variantes para cartas insignia.
--    Solo type='ENTITY' (las fusiones quedan excluidas por decisión de diseño).
DELETE FROM card_mastery_passive_map;
INSERT INTO card_mastery_passive_map (card_id, passive_skill_id, priority)
SELECT c.id, COALESCE(v.passive_skill_id, primary_map.passive_skill_id), 1
FROM cards_catalog c
JOIN (VALUES
  ('SECURITY', 'passive-reflect-damage-200'),
  ('FRAMEWORK', 'passive-entity-attack-plus-300'),
  ('DB', 'passive-heal-200-on-turn'),
  ('LANGUAGE', 'passive-attack-energy-plus-1'),
  ('TOOL', 'passive-draw-on-summon'),
  ('LLM', 'passive-atk-growth-100'),
  ('IDE', 'passive-energy-on-death')
) AS primary_map(archetype, passive_skill_id) ON primary_map.archetype = c.archetype
LEFT JOIN (VALUES
  ('entity-kali-linux', 'passive-atk-drain-200'),
  ('entity-react', 'passive-direct-hit-plus-200'),
  ('entity-supabase', 'passive-defense-energy-plus-1'),
  ('entity-postgress', 'passive-defense-energy-plus-1')
) AS v(card_id, passive_skill_id) ON v.card_id = c.id
WHERE c.type = 'ENTITY';

-- 3) Re-sincroniza el progreso V5 ya existente para sustituir el fallback genérico por la pasiva temática.
UPDATE player_card_progress p
SET mastery_passive_skill_id = m.passive_skill_id, updated_at = now()
FROM card_mastery_passive_map m
WHERE p.card_id = m.card_id
  AND p.version_tier >= 5
  AND p.mastery_passive_skill_id IS DISTINCT FROM m.passive_skill_id;
