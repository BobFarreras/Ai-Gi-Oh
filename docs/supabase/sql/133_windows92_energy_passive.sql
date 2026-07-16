-- docs/supabase/sql/133_windows92_energy_passive.sql
-- Ficha 1 v1.17: pasiva innata "Sobrecarga Energética" en Windows 92 (entity-windows92).
-- Al ganar un combate a una entity rival (destruirla y sobrevivir), su dueño gana +1 energía al empezar su
-- siguiente turno; a V5 sube a +2 (magnitud en mastery-passive-magnitude.ts). El motor ya está en el repo
-- (commit f1336075); esta migración solo asigna la portadora. Mismo patrón que la 079: la innata sustituye
-- a la pasiva V5 de arquetipo (sin doble poder). Idempotente.
begin;

-- 1) Registrar las pasivas de "ganar combate" en el catálogo (FK de player_card_progress las exige si el
--    progreso las referencia; la de Recaudación se registra ya de paso para su Fase B).
INSERT INTO public.card_passive_skills (id, name, description, is_active) VALUES
  ('passive-energy-on-battle-win', 'Sobrecarga Energética',
   'Al ganar un combate a una entity rival, +1 de energía al empezar tu siguiente turno (+2 a V5).', true),
  ('passive-nexus-on-battle-win', 'Recaudación',
   'Al ganar un combate a una entity rival, ganas 200 Nexus (solo Story y Arena, con tope diario).', true)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active, updated_at = now();

-- 2) Windows 92 pasa a llevar la innata (activa desde V0; espejo en código: innate-passive-map.ts).
UPDATE public.cards_catalog
SET innate_passive_skill_id = 'passive-energy-on-battle-win'
WHERE id = 'entity-windows92';

-- 3) Fuera del mapa V5 genérico (TOOL → Caja de Herramientas): su innata es su única identidad.
DELETE FROM public.card_mastery_passive_map WHERE card_id = 'entity-windows92';

-- 4) Sincroniza el progreso existente (jugadores con Windows 92, cualquier tier) a la innata,
--    como hizo la 079 con las 10 primeras.
UPDATE public.player_card_progress p
SET mastery_passive_skill_id = 'passive-energy-on-battle-win', updated_at = now()
WHERE p.card_id = 'entity-windows92'
  AND p.mastery_passive_skill_id IS DISTINCT FROM 'passive-energy-on-battle-win';

commit;
