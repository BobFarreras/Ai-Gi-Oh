-- docs/supabase/sql/066_phase_collection_objectives.sql - Objetivos de colección/estado en misiones (tener N cartas a nivel/versión/cantidad). Progreso evaluado en vivo contra la colección, no por contador de acciones.
begin;

-- Umbral del objetivo (nivel/versión). Null para objetivos sin umbral (cantidad).
alter table public.mission_definitions add column if not exists objective_param integer;

-- Cuenta el estado actual del jugador para un objetivo de colección. Null si el objetivo
-- es de acción (no de estado). SECURITY DEFINER: solo lo invocan las funciones de misiones.
create or replace function public.mission_state_count(p_player uuid, p_objective text, p_param integer)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case p_objective
    when 'OWN_CARDS_AT_LEVEL' then (select count(*)::int from public.player_card_progress where player_id = p_player and level >= coalesce(p_param, 0))
    when 'OWN_CARDS_AT_VERSION' then (select count(*)::int from public.player_card_progress where player_id = p_player and version_tier >= coalesce(p_param, 0))
    when 'OWN_CARDS_TOTAL' then (select coalesce(sum(owned_copies), 0)::int from public.player_collection_cards where player_id = p_player)
    when 'OWN_DISTINCT_CARDS' then (select count(*)::int from public.player_collection_cards where player_id = p_player)
    else null
  end;
$$;
revoke all on function public.mission_state_count(uuid, text, integer) from public, anon, authenticated;

-- get_player_missions: progreso en vivo para objetivos de estado; contador para los de acción.
create or replace function public.get_player_missions()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(m order by scope, sort_order), '[]'::jsonb)
  from (
    select d.scope, d.sort_order,
      jsonb_build_object(
        'missionId', d.id, 'scope', d.scope, 'objectiveType', d.objective_type,
        'title', d.title, 'description', d.description, 'targetCount', d.target_count,
        'rewardNexus', d.reward_nexus, 'sortOrder', d.sort_order,
        'periodKey', public.progression_period_key(d.scope),
        'progress', coalesce(least(s.sc, d.target_count), p.progress, 0),
        'completed', case when s.sc is not null then s.sc >= d.target_count else coalesce(p.completed_at is not null, false) end,
        'claimed', coalesce(p.claimed_at is not null, false)
      ) as m
    from public.mission_definitions d
    left join public.player_mission_progress p
      on p.mission_id = d.id and p.player_id = auth.uid() and p.period_key = public.progression_period_key(d.scope)
    cross join lateral (select public.mission_state_count(auth.uid(), d.objective_type, d.objective_param) as sc) s
    where d.is_active = true
  ) rows;
$$;

-- claim_mission_reward: para objetivos de estado, recalcula en vivo y crea la fila de periodo al reclamar.
create or replace function public.claim_mission_reward(p_mission_id text, p_period_key text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player uuid;
  v_def public.mission_definitions;
  v_progress public.player_mission_progress;
  v_state integer;
begin
  v_player := auth.uid();
  if v_player is null then
    raise exception 'Sesión no autenticada para reclamar misión.' using errcode = '42501';
  end if;

  select * into v_def from public.mission_definitions where id = p_mission_id and is_active = true;
  if not found then
    raise exception 'Misión no encontrada.' using errcode = 'P0001';
  end if;

  v_state := public.mission_state_count(v_player, v_def.objective_type, v_def.objective_param);

  if v_state is not null then
    -- Objetivo de estado: verifica el umbral en vivo y asegura fila de periodo para el claim.
    if v_state < v_def.target_count then
      raise exception 'La misión aún no está completada.' using errcode = 'P0001';
    end if;
    insert into public.player_mission_progress (player_id, mission_id, period_key, progress, completed_at)
    values (v_player, p_mission_id, p_period_key, least(v_state, v_def.target_count), now())
    on conflict (player_id, mission_id, period_key) do update
      set progress = least(v_state, v_def.target_count),
          completed_at = coalesce(public.player_mission_progress.completed_at, now()),
          updated_at = now();
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

-- Misiones de ejemplo de colección.
insert into public.mission_definitions (id, scope, objective_type, target_count, reward_nexus, title, description, sort_order, objective_param, is_active) values
  ('weekly-cards-level-10', 'WEEKLY', 'OWN_CARDS_AT_LEVEL', 3, 600, 'Élite de combate', 'Ten 3 cartas a nivel 10 o más', 14, 10, true),
  ('weekly-cards-version-4', 'WEEKLY', 'OWN_CARDS_AT_VERSION', 2, 700, 'Maestría de versión', 'Ten 2 cartas a versión 4 o más', 15, 4, true),
  ('weekly-collection-50', 'WEEKLY', 'OWN_CARDS_TOTAL', 50, 400, 'Coleccionista', 'Acumula 50 cartas en tu almacén', 16, null, true)
on conflict (id) do nothing;

commit;
