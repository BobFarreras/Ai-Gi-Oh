-- docs/supabase/sql/156_olympus_deck_level_100.sql - Alinea el deck legendario con el nivel máximo vigente (100), que quedó congelado en 30.
begin;

/**
 * El tope de nivel del juego subió a 100 hace tiempo, pero la fundación de Olimpo se escribió cuando eran
 * 30 y dejó el CHECK a medias: el panel admin ofrecía hasta 100 y la base de datos rechazaba el guardado.
 */
alter table public.olympus_opponent_deck_entries
  drop constraint olympus_opponent_deck_entries_level_check;

alter table public.olympus_opponent_deck_entries
  add constraint olympus_opponent_deck_entries_level_check check (level between 1 and 100);

-- Las tres leyendas prometen "deck legendario a versión máxima": con el tope viejo se quedaban a un tercio.
-- 149800 es la XP acumulada real del nivel 100 según `getTotalXpRequiredToReachLevel`.
update public.olympus_opponent_deck_entries
set level = 100, xp = 149800
where opponent_id in ('zeus', 'loki', 'hefes') and level = 30;

commit;
