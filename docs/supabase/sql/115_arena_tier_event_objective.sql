-- docs/supabase/sql/115_arena_tier_event_objective.sql - Nuevo objetivo de estado REACH_ARENA_TIER
-- para misiones: cuenta 1 si el jugador ya ha DESBLOQUEADO el tier >= p_param (superar el nivel N
-- = desbloquear el N+1). Evaluado en vivo contra player_training_progress, así que es retroactivo:
-- quien ya superó el Nivel 5 (highest_unlocked_tier >= 6) lo tiene completado sin volver a jugar.
begin;

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
    when 'REACH_ARENA_TIER' then (select case when coalesce((select highest_unlocked_tier from public.player_training_progress where player_id = p_player), 0) >= coalesce(p_param, 0) then 1 else 0 end)
    else null
  end;
$$;
revoke all on function public.mission_state_count(uuid, text, integer) from public, anon, authenticated;

-- Misión de evento: superar el Nivel 5 de la Arena (desbloquear el Nivel 6). Recompensa en puntos de
-- evento (Fragmentos). Retroactiva por ser objetivo de estado.
insert into public.mission_definitions
  (id, scope, objective_type, target_count, objective_param, reward_type, reward_nexus, event_id, title, description, sort_order, is_active)
values
  ('evt-launch-arena-tier5', 'EVENT', 'REACH_ARENA_TIER', 1, 6, 'EVENT_POINTS', 300, 'evt-launch',
   'Domina la Arena', 'Supera el Nivel 5 de la Arena (desbloquea el Nivel 6) para llevarte 300 Fragmentos.', 3, true)
on conflict (id) do nothing;

commit;
