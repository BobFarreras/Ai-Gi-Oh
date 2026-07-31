-- docs/supabase/sql/153_combat_session_journal_checkpoint.sql - Persiste el journal en curso para que reanudar no reinicie el combate.
begin;

alter table public.combat_sessions
add column journal_json jsonb not null default '[]'::jsonb
  check (jsonb_typeof(journal_json) = 'array');

create function public.checkpoint_combat_session(
  p_player_id uuid,
  p_battle_id uuid,
  p_journal jsonb
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  locked_session public.combat_sessions;
  stored_length integer;
  incoming_length integer;
begin
  if jsonb_typeof(p_journal) <> 'array' then
    raise exception 'INVALID_JOURNAL' using errcode = '22023';
  end if;

  select * into locked_session
  from public.combat_sessions
  where battle_id = p_battle_id and player_id = p_player_id
  for update;

  if not found then
    raise exception 'COMBAT_SESSION_NOT_FOUND' using errcode = 'P0001';
  end if;
  if locked_session.status <> 'ISSUED' then
    raise exception 'COMBAT_SESSION_NOT_ISSUED' using errcode = 'P0001';
  end if;

  stored_length := jsonb_array_length(locked_session.journal_json);
  incoming_length := jsonb_array_length(p_journal);

  -- El historial solo crece: un journal más corto o igual sería un intento de reescribir lo ya jugado.
  if incoming_length <= stored_length then
    return stored_length;
  end if;

  update public.combat_sessions
  set journal_json = p_journal
  where battle_id = p_battle_id;

  return incoming_length;
end;
$$;

revoke all on function public.checkpoint_combat_session(uuid, uuid, jsonb)
from public, anon, authenticated;
grant execute on function public.checkpoint_combat_session(uuid, uuid, jsonb) to service_role;

commit;
