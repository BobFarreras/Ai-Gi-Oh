-- docs/supabase/sql/094_weekly_leaderboards.sql
-- Rankings semanales (dos tableros: ACTIVITY y COMMERCIAL) que premian el juego proactivo.
--   · ACTIVITY   → combates (+20) + misiones/eventos/diarias reclamadas (+15).
--   · COMMERCIAL → cartas compradas (+10), packs (+30), evoluciones (+20).
-- Acumulación server-authoritative (identidad por auth.uid()). La semana rueda los DOMINGOS a las
-- 22:00 UTC (~medianoche en España); un job pg_cron cierra la semana, reparte premios al top-N y archiva.
-- TODO es aditivo (no toca funciones existentes): la acreditación se dispara desde el wrapper TS
-- recordProgressionEvent y desde el endpoint de claim de misiones llamando a award_weekly_points.
begin;

-- ── Configuración: cuántos puntos da cada acción en cada tablero (editable desde admin) ──────────────
create table if not exists public.weekly_leaderboard_point_rules (
  board       text not null check (board in ('ACTIVITY', 'COMMERCIAL')),
  action_type text not null,
  points      integer not null check (points >= 0),
  primary key (board, action_type)
);

insert into public.weekly_leaderboard_point_rules (board, action_type, points) values
  ('ACTIVITY',   'PLAY_DUEL',     20),
  ('ACTIVITY',   'PLAY_ARENA',    20),
  ('ACTIVITY',   'PLAY_MP_MATCH', 20),
  ('ACTIVITY',   'MISSION_CLAIM', 15),
  ('COMMERCIAL', 'BUY_CARD',      10),
  ('COMMERCIAL', 'BUY_PACK',      30),
  ('COMMERCIAL', 'EVOLVE_CARD',   20)
on conflict (board, action_type) do nothing;

-- ── Configuración: premio (Nexus) por puesto en cada tablero (editable desde admin) ─────────────────
create table if not exists public.weekly_leaderboard_prizes (
  board        text not null check (board in ('ACTIVITY', 'COMMERCIAL')),
  rank         integer not null check (rank >= 1),
  reward_nexus integer not null check (reward_nexus >= 0),
  primary key (board, rank)
);

insert into public.weekly_leaderboard_prizes (board, rank, reward_nexus) values
  ('ACTIVITY',   1, 1000), ('ACTIVITY',   2, 600), ('ACTIVITY',   3, 400), ('ACTIVITY',   4, 250), ('ACTIVITY',   5, 150),
  ('COMMERCIAL', 1, 1000), ('COMMERCIAL', 2, 600), ('COMMERCIAL', 3, 400), ('COMMERCIAL', 4, 250), ('COMMERCIAL', 5, 150)
on conflict (board, rank) do nothing;

-- ── Acumulador de puntos de la semana en curso ──────────────────────────────────────────────────────
create table if not exists public.weekly_leaderboard_points (
  player_id  uuid not null references auth.users (id) on delete cascade,
  week_key   text not null,
  board      text not null check (board in ('ACTIVITY', 'COMMERCIAL')),
  points     integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (player_id, week_key, board)
);
create index if not exists weekly_lb_points_week_board_idx
  on public.weekly_leaderboard_points (week_key, board, points desc);

-- ── Idempotencia del cierre semanal ─────────────────────────────────────────────────────────────────
create table if not exists public.weekly_leaderboard_closures (
  week_key  text primary key,
  closed_at timestamptz not null default now()
);

-- ── Archivo/auditoría de semanas cerradas (posiciones finales + premios repartidos) ─────────────────
create table if not exists public.weekly_leaderboard_history (
  id            bigint generated always as identity primary key,
  week_key      text not null,
  board         text not null,
  player_id     uuid not null,
  final_rank    integer not null,
  points        integer not null,
  awarded_nexus integer not null default 0,
  awarded_at    timestamptz not null default now()
);
create index if not exists weekly_lb_history_week_board_idx
  on public.weekly_leaderboard_history (week_key, board, final_rank);

-- ── Clave de semana: rueda los domingos a las 22:00 UTC (~medianoche España) ─────────────────────────
-- Etiqueta 'IYYY-Www' del instante desplazado +2h, de modo que cambia justo en ese corte. Se ancla a
-- UTC (at time zone 'UTC') para ser determinista, independiente del timezone de sesión.
create or replace function public.weekly_leaderboard_week_key(p_ts timestamptz)
returns text
language sql
immutable
as $$
  select to_char(date_trunc('week', ((p_ts at time zone 'UTC') + interval '2 hours')), 'IYYY"-W"IW');
$$;

-- ── Acredita puntos por acción(es) al jugador autenticado en la semana en curso ─────────────────────
create or replace function public.award_weekly_points(p_action_types text[], p_count integer default 1)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_player uuid;
  v_week   text;
  v_rule   record;
begin
  v_player := auth.uid();
  if v_player is null or p_count <= 0 or p_action_types is null then return; end if;
  v_week := public.weekly_leaderboard_week_key(now());
  for v_rule in
    select board, sum(points)::int as pts
    from public.weekly_leaderboard_point_rules
    where action_type = any(p_action_types)
    group by board
  loop
    insert into public.weekly_leaderboard_points as p (player_id, week_key, board, points)
    values (v_player, v_week, v_rule.board, v_rule.pts * p_count)
    on conflict (player_id, week_key, board) do update
      set points = p.points + excluded.points, updated_at = now();
  end loop;
end;
$$;

-- ── Cierra toda semana con puntos anterior a la actual y aún no cerrada (robusto ante runs perdidos) ─
create or replace function public.close_weekly_leaderboards()
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_current text;
  v_week    text;
  v_board   text;
  v_row     record;
  v_prize   integer;
begin
  v_current := public.weekly_leaderboard_week_key(now());
  for v_week in
    select distinct week_key from public.weekly_leaderboard_points
    where week_key < v_current
      and week_key not in (select week_key from public.weekly_leaderboard_closures)
  loop
    for v_board in
      select distinct board from public.weekly_leaderboard_points where week_key = v_week
    loop
      for v_row in
        select p.player_id, p.points,
               row_number() over (order by p.points desc, p.updated_at asc) as rnk
        from public.weekly_leaderboard_points p
        where p.week_key = v_week and p.board = v_board
      loop
        select reward_nexus into v_prize
          from public.weekly_leaderboard_prizes where board = v_board and rank = v_row.rnk;
        v_prize := coalesce(v_prize, 0);
        insert into public.weekly_leaderboard_history (week_key, board, player_id, final_rank, points, awarded_nexus)
        values (v_week, v_board, v_row.player_id, v_row.rnk, v_row.points, v_prize);
        if v_prize > 0 then
          insert into public.player_wallets (player_id, nexus) values (v_row.player_id, 1000)
            on conflict (player_id) do nothing;
          update public.player_wallets set nexus = nexus + v_prize where player_id = v_row.player_id;
        end if;
      end loop;
    end loop;
    insert into public.weekly_leaderboard_closures (week_key) values (v_week)
      on conflict (week_key) do nothing;
  end loop;
end;
$$;

-- ── RLS: lectura para autenticados; escritura solo por service_role / funciones security definer ────
alter table public.weekly_leaderboard_points   enable row level security;
alter table public.weekly_leaderboard_history  enable row level security;
alter table public.weekly_leaderboard_prizes   enable row level security;
alter table public.weekly_leaderboard_point_rules enable row level security;

drop policy if exists "weekly_lb_points_read" on public.weekly_leaderboard_points;
create policy "weekly_lb_points_read" on public.weekly_leaderboard_points for select to authenticated using (true);
drop policy if exists "weekly_lb_history_read" on public.weekly_leaderboard_history;
create policy "weekly_lb_history_read" on public.weekly_leaderboard_history for select to authenticated using (true);
drop policy if exists "weekly_lb_prizes_read" on public.weekly_leaderboard_prizes;
create policy "weekly_lb_prizes_read" on public.weekly_leaderboard_prizes for select to authenticated using (true);
drop policy if exists "weekly_lb_rules_read" on public.weekly_leaderboard_point_rules;
create policy "weekly_lb_rules_read" on public.weekly_leaderboard_point_rules for select to authenticated using (true);

revoke all on public.weekly_leaderboard_points, public.weekly_leaderboard_history,
  public.weekly_leaderboard_prizes, public.weekly_leaderboard_point_rules, public.weekly_leaderboard_closures
  from anon, authenticated;
grant select on public.weekly_leaderboard_points, public.weekly_leaderboard_history,
  public.weekly_leaderboard_prizes, public.weekly_leaderboard_point_rules to authenticated;
grant all on public.weekly_leaderboard_points, public.weekly_leaderboard_history,
  public.weekly_leaderboard_prizes, public.weekly_leaderboard_point_rules, public.weekly_leaderboard_closures
  to service_role;

-- La acreditación la invocan clientes autenticados (auth.uid()); el cierre solo el cron/service_role.
grant execute on function public.award_weekly_points(text[], integer) to authenticated, service_role;
grant execute on function public.weekly_leaderboard_week_key(timestamptz) to authenticated, service_role;
revoke all on function public.close_weekly_leaderboards() from public, anon, authenticated;
grant execute on function public.close_weekly_leaderboards() to service_role;

-- ── Cierre automático los domingos a las 22:00 UTC (guardado: no romper si pg_cron no está) ─────────
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'close_weekly_leaderboards',
    '0 22 * * 0',
    $cron$ select public.close_weekly_leaderboards() $cron$
  );
exception
  when others then raise notice 'pg_cron no disponible; programa el cierre semanal manualmente: %', sqlerrm;
end $$;

commit;
