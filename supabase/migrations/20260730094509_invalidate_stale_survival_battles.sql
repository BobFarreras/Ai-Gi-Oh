-- supabase/migrations/20260730094509_invalidate_stale_survival_battles.sql - Invalida snapshots Survival obsoletos sin saltar encuentros.
begin;

create function public.invalidate_survival_battle(
  p_player_id uuid,
  p_battle_id uuid
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  locked_battle public.survival_battles;
begin
  select battle.* into locked_battle
  from public.survival_battles battle
  join public.player_survival_runs run on run.id = battle.run_id
  where battle.battle_id = p_battle_id
    and battle.status = 'ISSUED'
    and run.player_id = p_player_id
    and run.status = 'ACTIVE'
  for update of battle;

  if not found then
    raise exception 'SURVIVAL_BATTLE_NOT_ISSUED' using errcode = 'P0001';
  end if;

  update public.combat_sessions
  set status = 'EXPIRED'
  where battle_id = p_battle_id and player_id = p_player_id and status = 'ISSUED';

  update public.survival_battles
  set status = 'EXPIRED'
  where battle_id = p_battle_id and status = 'ISSUED';

  update public.player_survival_runs
  set current_battle_index = greatest(0, locked_battle.battle_index - 1),
      version = version + 1
  where id = locked_battle.run_id
    and player_id = p_player_id
    and current_battle_index = locked_battle.battle_index;
end;
$$;

revoke all on function public.invalidate_survival_battle(uuid, uuid)
from public, anon, authenticated;
grant execute on function public.invalidate_survival_battle(uuid, uuid) to service_role;

commit;
