-- docs/supabase/sql/118_weekly_prize_seen.sql
-- Aviso del premio semanal de ranking (ficha 6 del paquete v1.15).
--
-- El reparto de premios YA existe (094): el cron cierra la semana los domingos a las 22:00 UTC, archiva las
-- posiciones en weekly_leaderboard_history y acredita los Nexus en la cartera. Lo único que faltaba es que el
-- jugador se entere: hoy gana el ranking, cobra, y nadie se lo dice.
--
-- Esto añade SOLO la marca de "ya se lo hemos enseñado", para que el diálogo salte una vez y no en bucle cada
-- vez que entra al hub. El diálogo es INFORMATIVO: no otorga nada (si pagara, se podría cobrar N veces
-- recargando la página). Todo es aditivo: no toca el reparto ni el cron.
begin;

-- OJO AL APLICARLA: en producción ya hay 1 semana cerrada con 10 premios repartidos (Nexus ya ingresados,
-- pero nunca anunciados). Como la columna nace NULL, esos jugadores verán el aviso de esa semana pasada la
-- próxima vez que entren al hub. Es lo que queremos —cobraron y no lo saben—, pero es una decisión consciente:
-- si se prefiere empezar de cero y anunciar solo a partir de la siguiente semana, ejecutar después de esta
-- migración:  update public.weekly_leaderboard_history set seen_at = now() where seen_at is null;
alter table public.weekly_leaderboard_history
  add column if not exists seen_at timestamptz;

comment on column public.weekly_leaderboard_history.seen_at is
  'Cuándo se le mostró al jugador el aviso de este premio. NULL = pendiente de avisar.';

-- Índice para la consulta del hub: "¿tengo premios sin avisar?" (solo filas con premio real).
create index if not exists weekly_lb_history_pending_idx
  on public.weekly_leaderboard_history (player_id)
  where seen_at is null and awarded_nexus > 0;

-- ── Marca como avisados los premios del jugador AUTENTICADO ─────────────────────────────────────────
-- security definer porque 'authenticated' solo tiene SELECT sobre la tabla (el reparto es del cron). El
-- filtro por auth.uid() es la frontera: aunque el cliente mande ids ajenos, solo puede marcar los suyos.
create or replace function public.ack_weekly_prizes(p_ids bigint[])
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_player uuid;
begin
  v_player := auth.uid();
  if v_player is null or p_ids is null then return; end if;
  update public.weekly_leaderboard_history
     set seen_at = now()
   where id = any(p_ids)
     and player_id = v_player
     and seen_at is null;
end;
$$;

revoke all on function public.ack_weekly_prizes(bigint[]) from public, anon;
grant execute on function public.ack_weekly_prizes(bigint[]) to authenticated, service_role;

commit;
