-- docs/supabase/sql/151_survival_idempotent_start_issue.sql - Hace idempotentes inicio y emisión Survival bajo concurrencia.
begin;

create or replace function public.start_survival_run(
  p_player_id uuid,
  p_max_lp integer,
  p_ruleset_version integer
)
returns public.player_survival_runs
language plpgsql
set search_path = ''
as $$
declare
  resolved_run public.player_survival_runs;
begin
  if p_max_lp <= 0 then raise exception 'INVALID_MAX_LP' using errcode = '22023'; end if;
  if not exists (
    select 1 from public.survival_rulesets
    where version = p_ruleset_version and is_active
  ) then
    raise exception 'RULESET_NOT_ACTIVE' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_player_id::text || ':survival-run', 0)
  );
  select * into resolved_run
  from public.player_survival_runs
  where player_id = p_player_id and status = 'ACTIVE'
  for update;
  if found then return resolved_run; end if;
  insert into public.player_survival_runs (player_id, current_lp, max_lp, ruleset_version)
  values (p_player_id, p_max_lp, p_max_lp, p_ruleset_version)
  returning * into resolved_run;
  return resolved_run;
end;
$$;

create or replace function public.issue_survival_battle(
  p_player_id uuid, p_run_id uuid, p_battle_id uuid, p_opponent_id text,
  p_effective_tier integer, p_ascension_rank integer, p_seed text,
  p_snapshot_hash text, p_snapshot_json jsonb, p_protocol_version integer,
  p_expires_at timestamptz
)
returns public.survival_battles
language plpgsql
set search_path = ''
as $$
declare
  locked_run public.player_survival_runs;
  issued_battle public.survival_battles;
  next_index integer;
begin
  select * into locked_run from public.player_survival_runs
  where id = p_run_id and player_id = p_player_id for update;
  if not found or locked_run.status <> 'ACTIVE' or locked_run.current_lp <= 0 then
    raise exception 'SURVIVAL_RUN_NOT_ACTIVE' using errcode = 'P0001';
  end if;
  select * into issued_battle from public.survival_battles
  where run_id = p_run_id and status = 'ISSUED'
  for update;
  if found then return issued_battle; end if;
  next_index := locked_run.current_battle_index + 1;
  insert into public.combat_sessions
    (battle_id, player_id, mode, seed, snapshot_hash, snapshot_json, protocol_version, expires_at)
  values
    (p_battle_id, p_player_id, 'SURVIVAL', p_seed, p_snapshot_hash, p_snapshot_json, p_protocol_version, p_expires_at);
  insert into public.survival_battles
    (battle_id, run_id, battle_index, opponent_id, effective_tier, ascension_rank, starting_lp)
  values
    (p_battle_id, p_run_id, next_index, p_opponent_id, p_effective_tier, p_ascension_rank, locked_run.current_lp)
  returning * into issued_battle;
  update public.player_survival_runs
  set current_battle_index = next_index, version = version + 1
  where id = p_run_id;
  return issued_battle;
end;
$$;

revoke all on function public.start_survival_run(uuid, integer, integer)
from public, anon, authenticated;
revoke all on function public.issue_survival_battle(
  uuid, uuid, uuid, text, integer, integer, text, text, jsonb, integer, timestamptz
) from public, anon, authenticated;
grant execute on function public.start_survival_run(uuid, integer, integer) to service_role;
grant execute on function public.issue_survival_battle(
  uuid, uuid, uuid, text, integer, integer, text, text, jsonb, integer, timestamptz
) to service_role;

commit;
