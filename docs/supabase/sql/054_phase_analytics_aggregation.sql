-- docs/supabase/sql/054_phase_analytics_aggregation.sql - Fase 4 de analytics: agregación server-side (RPC) que elimina el tope de 1000 filas + retención automática vía pg_cron.
begin;

-- Función de agregación del dashboard: calcula todos los KPIs en el servidor en una sola llamada.
-- SECURITY INVOKER + search_path vacío: corre con los privilegios del llamante (RLS admin aplica),
-- evitando los avisos de "security definer" del linter. service_role bypassa RLS igualmente.
create or replace function public.analytics_dashboard(p_since timestamptz)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'dau', coalesce((
      select jsonb_agg(jsonb_build_object('date', d.day, 'count', d.cnt) order by d.day)
      from (
        select date(created_at) as day,
               count(distinct coalesce(user_id::text, 'anon:' || session_id)) as cnt
        from public.analytics_events
        where created_at >= p_since
        group by date(created_at)
      ) d
    ), '[]'::jsonb),
    'totalEvents30d', (
      select count(*) from public.analytics_events where created_at >= p_since
    ),
    'totalSessions30d', (
      select count(*) from public.analytics_sessions where started_at >= p_since
    ),
    'avgSessionDurationSeconds', (
      select round(avg(extract(epoch from (ended_at - started_at))))::int
      from public.analytics_sessions
      where started_at >= p_since and ended_at is not null and ended_at >= started_at
    ),
    'topEvents', coalesce((
      select jsonb_agg(jsonb_build_object('eventName', t.event_name, 'count', t.cnt) order by t.cnt desc)
      from (
        select event_name, count(*) as cnt
        from public.analytics_events
        where created_at >= p_since
        group by event_name
        order by count(*) desc
        limit 10
      ) t
    ), '[]'::jsonb),
    'deviceDistribution', coalesce((
      select jsonb_agg(jsonb_build_object('deviceType', dd.device_type, 'count', dd.cnt) order by dd.cnt desc)
      from (
        select coalesce(device_type, 'unknown') as device_type, count(*) as cnt
        from public.analytics_sessions
        where started_at >= p_since
        group by coalesce(device_type, 'unknown')
      ) dd
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.analytics_dashboard(timestamptz) from public, anon;
grant execute on function public.analytics_dashboard(timestamptz) to authenticated, service_role;

-- Retención: pg_cron borra eventos y sesiones de más de 90 días (GDPR + coste de almacenamiento).
create extension if not exists pg_cron;

-- Reprogramación idempotente del job de retención.
select cron.unschedule('analytics-retention-90d')
where exists (select 1 from cron.job where jobname = 'analytics-retention-90d');

select cron.schedule(
  'analytics-retention-90d',
  '17 3 * * *',  -- cada día a las 03:17 UTC
  $job$
    delete from public.analytics_events where created_at < now() - interval '90 days';
    delete from public.analytics_sessions where started_at < now() - interval '90 days';
  $job$
);

commit;
