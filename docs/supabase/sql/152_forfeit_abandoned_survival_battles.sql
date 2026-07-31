-- docs/supabase/sql/152_forfeit_abandoned_survival_battles.sql - Liquida como derrota una batalla Survival abandonada tras caducar su sesión.
begin;

create function public.forfeit_survival_battle(
  p_player_id uuid,
  p_battle_id uuid
)
returns public.player_survival_runs
language plpgsql
set search_path = ''
as $$
declare
  locked_battle public.survival_battles;
  locked_run public.player_survival_runs;
begin
  select battle.* into locked_battle
  from public.survival_battles battle
  join public.player_survival_runs run on run.id = battle.run_id
  where battle.battle_id = p_battle_id
    and run.player_id = p_player_id
  for update of battle;

  if not found then
    raise exception 'SURVIVAL_BATTLE_NOT_FOUND' using errcode = 'P0001';
  end if;

  select * into locked_run from public.player_survival_runs
  where id = locked_battle.run_id for update;

  -- Idempotencia: si otra pestaña ya liquidó la batalla, se devuelve la expedición tal cual.
  if locked_battle.status <> 'ISSUED' then
    return locked_run;
  end if;

  update public.survival_battles
  set ending_lp = 0,
      outcome = 'LOSS',
      status = 'COMPLETED',
      completed_at = now(),
      milestone_heal = 0,
      reward_json = jsonb_build_object(
        'ascensionFragments', 0,
        'definitionId', 'survival-abandoned',
        'milestoneReached', false
      )
  where battle_id = p_battle_id;

  update public.combat_sessions
  set status = 'EXPIRED'
  where battle_id = p_battle_id and player_id = p_player_id and status = 'ISSUED';

  -- El abandono no acredita Fragmentos: cierra la expedición sin pasar por credit_ascension_fragments.
  update public.player_survival_runs
  set current_lp = 0,
      status = 'COMPLETED_DEFEAT',
      completed_at = now(),
      version = version + 1
  where id = locked_run.id
  returning * into locked_run;

  return locked_run;
end;
$$;

revoke all on function public.forfeit_survival_battle(uuid, uuid)
from public, anon, authenticated;
grant execute on function public.forfeit_survival_battle(uuid, uuid) to service_role;

commit;
