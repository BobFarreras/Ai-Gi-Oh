-- docs/supabase/sql/069_fix_mission_progress_least_null.sql - Fix: el progreso de misiones de acción salía siempre al máximo.
-- Causa: `least(s.sc, target)` con s.sc NULL (objetivos de acción no son de estado) devuelve `target`
-- en Postgres (LEAST ignora NULL), tapando el coalesce hacia p.progress. Resultado: la barra salía
-- llena (2/2, 12/12…) aunque no hubiera progreso real del periodo, mientras `completed` decía "En progreso".
-- Solución: usar el state_count solo cuando NO es NULL; si no, el progreso del periodo (p.progress).
begin;

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
        -- Objetivos de estado (colección): least(state, target). Acciones: el progreso del periodo.
        'progress', case when s.sc is not null then least(s.sc, d.target_count) else coalesce(p.progress, 0) end,
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

commit;
