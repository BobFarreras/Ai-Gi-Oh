-- docs/supabase/sql/043_phase_story_tutorial_atomic_rewards.sql - Añade funciones atómicas para resultado Story y claim final tutorial sin carreras ni estados parciales.
create or replace function public.story_register_duel_result(
  p_player_id uuid,
  p_duel_id text,
  p_did_win boolean
)
returns table (
  player_id uuid,
  duel_id text,
  wins integer,
  losses integer,
  best_result text,
  first_cleared_at timestamptz,
  last_played_at timestamptz,
  updated_at timestamptz,
  first_victory boolean
)
language plpgsql
security invoker
as $$
declare
  v_now timestamptz := now();
begin
  if auth.uid() is distinct from p_player_id then
    raise exception 'No autorizado para registrar este duelo Story.' using errcode = '42501';
  end if;

  return query
  with upserted as (
    insert into public.player_story_duel_progress (
      player_id,
      duel_id,
      wins,
      losses,
      best_result,
      first_cleared_at,
      last_played_at
    )
    values (
      p_player_id,
      p_duel_id,
      case when p_did_win then 1 else 0 end,
      case when p_did_win then 0 else 1 end,
      case when p_did_win then 'WON' else 'LOST' end,
      case when p_did_win then v_now else null end,
      v_now
    )
    on conflict (player_id, duel_id)
    do update set
      wins = public.player_story_duel_progress.wins + case when p_did_win then 1 else 0 end,
      losses = public.player_story_duel_progress.losses + case when p_did_win then 0 else 1 end,
      best_result = case
        when p_did_win then 'WON'
        when public.player_story_duel_progress.best_result = 'WON' then 'WON'
        else 'LOST'
      end,
      first_cleared_at = case
        when p_did_win then coalesce(public.player_story_duel_progress.first_cleared_at, excluded.first_cleared_at)
        else public.player_story_duel_progress.first_cleared_at
      end,
      last_played_at = excluded.last_played_at
    returning
      public.player_story_duel_progress.player_id,
      public.player_story_duel_progress.duel_id,
      public.player_story_duel_progress.wins,
      public.player_story_duel_progress.losses,
      public.player_story_duel_progress.best_result,
      public.player_story_duel_progress.first_cleared_at,
      public.player_story_duel_progress.last_played_at,
      public.player_story_duel_progress.updated_at
  )
  select
    upserted.player_id,
    upserted.duel_id,
    upserted.wins,
    upserted.losses,
    upserted.best_result,
    upserted.first_cleared_at,
    upserted.last_played_at,
    upserted.updated_at,
    (p_did_win and upserted.first_cleared_at is not null and upserted.first_cleared_at = upserted.last_played_at) as first_victory
  from upserted;
end;
$$;

create or replace function public.tutorial_claim_final_reward_nexus(
  p_player_id uuid,
  p_reward_nexus integer
)
returns table (
  applied boolean
)
language plpgsql
security invoker
as $$
declare
  v_inserted_count integer := 0;
begin
  if p_reward_nexus <= 0 then
    raise exception 'La recompensa Nexus debe ser positiva.' using errcode = '22023';
  end if;

  if auth.uid() is distinct from p_player_id then
    raise exception 'No autorizado para reclamar esta recompensa tutorial.' using errcode = '42501';
  end if;

  insert into public.player_tutorial_reward_claims (player_id, reward_kind, reward_nexus)
  values (p_player_id, 'NEXUS', p_reward_nexus)
  on conflict (player_id) do nothing;

  get diagnostics v_inserted_count = row_count;
  if v_inserted_count = 0 then
    return query select false;
    return;
  end if;

  perform public.wallet_credit_nexus(p_player_id, p_reward_nexus);

  insert into public.player_tutorial_node_progress (player_id, node_id)
  values (p_player_id, 'tutorial-final-reward')
  on conflict (player_id, node_id) do nothing;

  return query select true;
end;
$$;

grant execute on function public.story_register_duel_result(uuid, text, boolean) to authenticated;
grant execute on function public.tutorial_claim_final_reward_nexus(uuid, integer) to authenticated;
