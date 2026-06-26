-- docs/supabase/sql/068_phase_event_missions.sql - Misiones agnósticas: recompensan Nexus o puntos de evento (Fragmentos). Misiones de evento (scope EVENT) son de una sola vez y solo cuentan mientras el evento está activo (no cuentan acciones previas a su inicio).
begin;

-- Tipo de recompensa y evento asociado (null = misión normal de Nexus).
alter table public.mission_definitions add column if not exists reward_type text not null default 'NEXUS';
alter table public.mission_definitions drop constraint if exists mission_definitions_reward_type_check;
alter table public.mission_definitions add constraint mission_definitions_reward_type_check check (reward_type in ('NEXUS', 'EVENT_POINTS'));
alter table public.mission_definitions add column if not exists event_id text references public.events(id) on delete cascade;

-- Scope EVENT: la period_key es el propio evento (una sola vez por evento).
alter table public.mission_definitions drop constraint if exists mission_definitions_scope_check;
alter table public.mission_definitions add constraint mission_definitions_scope_check check (scope in ('DAILY', 'WEEKLY', 'EVENT'));

-- period_key efectiva de una misión: el evento (one-time) o la del scope temporal.
create or replace function public.mission_period_key(p_scope text, p_event_id text)
returns text language sql stable set search_path = '' as $$
  select case when p_scope = 'EVENT' then p_event_id else public.progression_period_key(p_scope) end;
$$;

-- ¿La misión está disponible ahora? Las de evento solo durante su ventana activa.
create or replace function public.mission_is_available(p_event_id text)
returns boolean language sql stable set search_path = '' as $$
  select p_event_id is null or exists (
    select 1 from public.events e where e.id = p_event_id and e.is_active = true and now() between e.starts_at and e.ends_at
  );
$$;

-- record_progression_event: las misiones de evento solo cuentan durante su ventana (gating),
-- y usan period_key = event_id (one-time). Las de acción reparten puntos de evento por reglas.
create or replace function public.record_progression_event(p_action_types text[], p_count integer default 1)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_player uuid;
  v_def public.mission_definitions;
  v_period text;
  v_rule record;
begin
  v_player := auth.uid();
  if v_player is null or p_count <= 0 then return; end if;
  for v_def in
    select * from public.mission_definitions
    where is_active = true and objective_type = any(p_action_types) and public.mission_is_available(event_id)
  loop
    v_period := public.mission_period_key(v_def.scope, v_def.event_id);
    insert into public.player_mission_progress (player_id, mission_id, period_key, progress, completed_at)
    values (v_player, v_def.id, v_period, least(p_count, v_def.target_count),
      case when p_count >= v_def.target_count then now() else null end)
    on conflict (player_id, mission_id, period_key) do update
      set progress = least(public.player_mission_progress.progress + p_count, v_def.target_count),
          completed_at = case
            when public.player_mission_progress.completed_at is not null then public.player_mission_progress.completed_at
            when public.player_mission_progress.progress + p_count >= v_def.target_count then now()
            else null end,
          updated_at = now();
  end loop;
  for v_rule in
    select r.event_id, r.points_per from public.event_point_rules r
    join public.events e on e.id = r.event_id
    where e.is_active = true and now() between e.starts_at and e.ends_at and r.action_type = any(p_action_types)
  loop
    insert into public.player_event_points (player_id, event_id, points)
    values (v_player, v_rule.event_id, v_rule.points_per)
    on conflict (player_id, event_id) do update
      set points = public.player_event_points.points + v_rule.points_per, updated_at = now();
  end loop;
end;
$$;

-- get_player_missions: period_key por misión, solo misiones disponibles, con tipo/moneda de recompensa.
create or replace function public.get_player_missions()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(m order by scope, sort_order), '[]'::jsonb)
  from (
    select d.scope, d.sort_order,
      jsonb_build_object(
        'missionId', d.id, 'scope', d.scope, 'objectiveType', d.objective_type,
        'title', d.title, 'description', d.description, 'targetCount', d.target_count,
        'rewardNexus', d.reward_nexus, 'sortOrder', d.sort_order,
        'rewardType', d.reward_type,
        'rewardCurrency', case when d.reward_type = 'EVENT_POINTS'
          then coalesce((select e.currency_name from public.events e where e.id = d.event_id), 'Puntos')
          else 'Nexus' end,
        'eventId', d.event_id,
        'periodKey', public.mission_period_key(d.scope, d.event_id),
        'progress', coalesce(least(s.sc, d.target_count), p.progress, 0),
        'completed', case when s.sc is not null then s.sc >= d.target_count else coalesce(p.completed_at is not null, false) end,
        'claimed', coalesce(p.claimed_at is not null, false)
      ) as m
    from public.mission_definitions d
    left join public.player_mission_progress p
      on p.mission_id = d.id and p.player_id = auth.uid() and p.period_key = public.mission_period_key(d.scope, d.event_id)
    cross join lateral (select public.mission_state_count(auth.uid(), d.objective_type, d.objective_param) as sc) s
    where d.is_active = true and public.mission_is_available(d.event_id)
  ) rows;
$$;

-- claim_mission_reward: recompensa en Nexus o en puntos de evento según reward_type.
create or replace function public.claim_mission_reward(p_mission_id text, p_period_key text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_player uuid;
  v_def public.mission_definitions;
  v_progress public.player_mission_progress;
  v_state integer;
  v_currency text;
begin
  v_player := auth.uid();
  if v_player is null then raise exception 'Sesión no autenticada para reclamar misión.' using errcode = '42501'; end if;
  select * into v_def from public.mission_definitions where id = p_mission_id and is_active = true;
  if not found then raise exception 'Misión no encontrada.' using errcode = 'P0001'; end if;
  if not public.mission_is_available(v_def.event_id) then
    raise exception 'El evento de la misión no está activo.' using errcode = 'P0001';
  end if;
  v_currency := case when v_def.reward_type = 'EVENT_POINTS'
    then coalesce((select currency_name from public.events where id = v_def.event_id), 'Puntos') else 'Nexus' end;
  v_state := public.mission_state_count(v_player, v_def.objective_type, v_def.objective_param);
  if v_state is not null then
    if v_state < v_def.target_count then raise exception 'La misión aún no está completada.' using errcode = 'P0001'; end if;
    insert into public.player_mission_progress (player_id, mission_id, period_key, progress, completed_at)
    values (v_player, p_mission_id, p_period_key, least(v_state, v_def.target_count), now())
    on conflict (player_id, mission_id, period_key) do update
      set progress = least(v_state, v_def.target_count),
          completed_at = coalesce(public.player_mission_progress.completed_at, now()), updated_at = now();
  end if;
  select * into v_progress from public.player_mission_progress
   where player_id = v_player and mission_id = p_mission_id and period_key = p_period_key for update;
  if not found or v_progress.completed_at is null then raise exception 'La misión aún no está completada.' using errcode = 'P0001'; end if;
  if v_progress.claimed_at is not null then
    return jsonb_build_object('applied', false, 'alreadyClaimed', true, 'rewardNexus', v_def.reward_nexus, 'rewardType', v_def.reward_type, 'rewardCurrency', v_currency);
  end if;
  update public.player_mission_progress set claimed_at = now(), updated_at = now()
   where player_id = v_player and mission_id = p_mission_id and period_key = p_period_key;
  if v_def.reward_type = 'EVENT_POINTS' and v_def.event_id is not null then
    insert into public.player_event_points (player_id, event_id, points) values (v_player, v_def.event_id, v_def.reward_nexus)
    on conflict (player_id, event_id) do update set points = public.player_event_points.points + v_def.reward_nexus, updated_at = now();
  elsif v_def.reward_nexus > 0 then
    insert into public.player_wallets (player_id, nexus) values (v_player, 1000) on conflict (player_id) do nothing;
    update public.player_wallets set nexus = nexus + v_def.reward_nexus where player_id = v_player;
  end if;
  return jsonb_build_object('applied', true, 'alreadyClaimed', false, 'rewardNexus', v_def.reward_nexus, 'rewardType', v_def.reward_type, 'rewardCurrency', v_currency);
end;
$$;

commit;
