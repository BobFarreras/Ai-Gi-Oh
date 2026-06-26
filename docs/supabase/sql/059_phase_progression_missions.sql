-- docs/supabase/sql/059_phase_progression_missions.sql - Motor de misiones diarias/semanales (F2). Progreso server-authoritative vía auth.uid(); claim idempotente; period_key evita resets.
begin;

-- Definiciones de misión (config editable por admin).
create table if not exists public.mission_definitions (
  id text primary key,
  scope text not null check (scope in ('DAILY', 'WEEKLY')),
  objective_type text not null,
  target_count integer not null check (target_count > 0),
  reward_nexus integer not null default 0,
  title text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

-- Progreso por jugador, periodo y misión. period_key: 'YYYY-MM-DD' (daily) / 'IYYY-Www' (weekly).
create table if not exists public.player_mission_progress (
  player_id uuid not null references auth.users(id) on delete cascade,
  mission_id text not null references public.mission_definitions(id) on delete cascade,
  period_key text not null,
  progress integer not null default 0,
  completed_at timestamptz,
  claimed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (player_id, mission_id, period_key)
);

create index if not exists idx_mission_progress_player on public.player_mission_progress (player_id);

alter table public.mission_definitions enable row level security;
alter table public.player_mission_progress enable row level security;

drop policy if exists "mission_definitions_select_active" on public.mission_definitions;
create policy "mission_definitions_select_active"
on public.mission_definitions for select to authenticated using (true);

drop policy if exists "mission_progress_select_own" on public.player_mission_progress;
create policy "mission_progress_select_own"
on public.player_mission_progress for select to authenticated using (player_id = auth.uid());

revoke all on public.mission_definitions from anon, authenticated;
revoke all on public.player_mission_progress from anon, authenticated;
grant select on public.mission_definitions to authenticated;
grant select on public.player_mission_progress to authenticated;
grant all on public.mission_definitions to service_role;
grant all on public.player_mission_progress to service_role;

-- Seed de misiones iniciales.
insert into public.mission_definitions (id, scope, objective_type, target_count, reward_nexus, title, description, sort_order) values
  ('daily-play-duels', 'DAILY', 'PLAY_DUEL', 2, 120, 'Entra en combate', 'Juega 2 duelos', 1),
  ('daily-win-duel', 'DAILY', 'WIN_DUEL', 1, 100, 'Victoria del día', 'Gana 1 duelo', 2),
  ('daily-buy-card', 'DAILY', 'BUY_CARD', 1, 80, 'Visita el mercado', 'Compra 1 carta', 3),
  ('weekly-play-duels', 'WEEKLY', 'PLAY_DUEL', 12, 500, 'Duelista incansable', 'Juega 12 duelos esta semana', 10),
  ('weekly-win-mp', 'WEEKLY', 'WIN_MP_MATCH', 3, 450, 'Rival temible', 'Gana 3 combates multijugador', 11),
  ('weekly-evolve', 'WEEKLY', 'EVOLVE_CARD', 1, 350, 'Mejora tu arsenal', 'Evoluciona 1 carta', 12)
on conflict (id) do nothing;

-- Calcula la period_key actual según el scope (UTC).
create or replace function public.progression_period_key(p_scope text)
returns text
language sql
stable
set search_path = ''
as $$
  select case p_scope
    when 'WEEKLY' then to_char((now() at time zone 'utc')::date, 'IYYY"-W"IW')
    else to_char((now() at time zone 'utc')::date, 'YYYY-MM-DD')
  end;
$$;

-- Registra una o varias acciones de progresión: incrementa las misiones activas que matcheen.
-- No lanza nunca si no hay sesión (la progresión jamás debe romper el gameplay).
create or replace function public.record_progression_event(p_action_types text[], p_count integer default 1)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player uuid;
  v_def public.mission_definitions;
  v_period text;
begin
  v_player := auth.uid();
  if v_player is null or p_count <= 0 then
    return;
  end if;

  for v_def in
    select * from public.mission_definitions
    where is_active = true and objective_type = any(p_action_types)
  loop
    v_period := public.progression_period_key(v_def.scope);
    insert into public.player_mission_progress (player_id, mission_id, period_key, progress, completed_at)
    values (
      v_player, v_def.id, v_period,
      least(p_count, v_def.target_count),
      case when p_count >= v_def.target_count then now() else null end
    )
    on conflict (player_id, mission_id, period_key) do update
      set progress = least(public.player_mission_progress.progress + p_count, v_def.target_count),
          completed_at = case
            when public.player_mission_progress.completed_at is not null then public.player_mission_progress.completed_at
            when public.player_mission_progress.progress + p_count >= v_def.target_count then now()
            else null
          end,
          updated_at = now();
  end loop;
end;
$$;

-- Devuelve las misiones del jugador (daily + weekly) del periodo actual, con su progreso.
create or replace function public.get_player_missions()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(m order by m->>'scope', (m->>'sortOrder')::int), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'missionId', d.id,
      'scope', d.scope,
      'objectiveType', d.objective_type,
      'title', d.title,
      'description', d.description,
      'targetCount', d.target_count,
      'rewardNexus', d.reward_nexus,
      'sortOrder', d.sort_order,
      'periodKey', public.progression_period_key(d.scope),
      'progress', coalesce(p.progress, 0),
      'completed', coalesce(p.completed_at is not null, false),
      'claimed', coalesce(p.claimed_at is not null, false)
    ) as m
    from public.mission_definitions d
    left join public.player_mission_progress p
      on p.mission_id = d.id
      and p.player_id = auth.uid()
      and p.period_key = public.progression_period_key(d.scope)
    where d.is_active = true
  ) rows;
$$;

-- Reclama la recompensa de una misión completada. Idempotente y server-authoritative.
create or replace function public.claim_mission_reward(p_mission_id text, p_period_key text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player uuid;
  v_progress public.player_mission_progress;
  v_def public.mission_definitions;
begin
  v_player := auth.uid();
  if v_player is null then
    raise exception 'Sesión no autenticada para reclamar misión.' using errcode = '42501';
  end if;

  select * into v_def from public.mission_definitions where id = p_mission_id and is_active = true;
  if not found then
    raise exception 'Misión no encontrada.' using errcode = 'P0001';
  end if;

  select * into v_progress from public.player_mission_progress
   where player_id = v_player and mission_id = p_mission_id and period_key = p_period_key
   for update;

  if not found or v_progress.completed_at is null then
    raise exception 'La misión aún no está completada.' using errcode = 'P0001';
  end if;

  if v_progress.claimed_at is not null then
    return jsonb_build_object('applied', false, 'alreadyClaimed', true, 'rewardNexus', v_def.reward_nexus);
  end if;

  update public.player_mission_progress
     set claimed_at = now(), updated_at = now()
   where player_id = v_player and mission_id = p_mission_id and period_key = p_period_key;

  if v_def.reward_nexus > 0 then
    insert into public.player_wallets (player_id, nexus) values (v_player, 1000)
    on conflict (player_id) do nothing;
    update public.player_wallets set nexus = nexus + v_def.reward_nexus where player_id = v_player;
  end if;

  return jsonb_build_object('applied', true, 'alreadyClaimed', false, 'rewardNexus', v_def.reward_nexus);
end;
$$;

revoke all on function public.record_progression_event(text[], integer) from public, anon;
grant execute on function public.record_progression_event(text[], integer) to authenticated;
revoke all on function public.get_player_missions() from public, anon;
grant execute on function public.get_player_missions() to authenticated;
revoke all on function public.claim_mission_reward(text, text) from public, anon;
grant execute on function public.claim_mission_reward(text, text) to authenticated;

commit;
