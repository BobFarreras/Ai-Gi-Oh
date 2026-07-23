-- docs/supabase/sql/148_story_duel_overrides_level_100.sql - Sube a 100 el techo de nivel de los overrides de
-- mazo por duelo Story (panel admin). Idempotente y NO destructivo: solo relaja un CHECK, no toca datos.
--
-- POR QUÉ: el nivel máximo de carta del juego es 100 desde la ficha de "niveles a 100" (la curva vive en
-- card-level-rules.ts). Entonces se amplió el CHECK de `player_card_progress` (migración 120) pero se olvidó
-- este, que se creó con el tope original de 30 en la 027. Resultado: al escalar una carta de un rival por
-- encima de 30 en el panel admin, el guardado reventaba. El validador de la app tenía el mismo tope caducado y
-- se corrige en el mismo cambio (validate-admin-story-deck.ts, que ahora lee getMaxCardLevel()).
--
-- ORDEN DE DESPLIEGUE: se puede aplicar ANTES del código (relajar un CHECK nunca rompe lo que ya funcionaba).

begin;

alter table public.story_duel_deck_overrides
  drop constraint if exists story_duel_deck_overrides_level_check;
alter table public.story_duel_deck_overrides
  add constraint story_duel_deck_overrides_level_check check (level >= 0 and level <= 100);

commit;
