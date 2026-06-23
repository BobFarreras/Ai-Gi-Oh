-- docs/supabase/sql/055_phase_analytics_product_insights.sql - Fase 5: amplía analytics_dashboard con insights de producto (top jugadores, cartas usadas/compradas, usuarios conectados).
begin;

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
    ), '[]'::jsonb),
    -- Top 10 jugadores por duelos terminados (solo usuarios logueados), con nickname.
    'topPlayers', coalesce((
      select jsonb_agg(jsonb_build_object('userId', p.user_id, 'nickname', coalesce(pr.nickname, 'Anónimo'), 'duels', p.cnt) order by p.cnt desc)
      from (
        select user_id, count(*) as cnt
        from public.analytics_events
        where created_at >= p_since and event_name = 'duel_ended' and user_id is not null
        group by user_id
        order by count(*) desc
        limit 10
      ) p
      left join public.player_profiles pr on pr.player_id = p.user_id
    ), '[]'::jsonb),
    -- Top 10 cartas más usadas (jugadas + invocadas) en duelo. Nombre vía join al catálogo.
    'topCardsUsed', coalesce((
      select jsonb_agg(jsonb_build_object('cardId', c.card_id, 'cardName', coalesce(cc.name, c.card_id), 'count', c.cnt) order by c.cnt desc)
      from (
        select properties->>'cardId' as card_id, count(*) as cnt
        from public.analytics_events
        where created_at >= p_since
          and event_name in ('card_played', 'card_summoned')
          and properties->>'cardId' is not null
        group by properties->>'cardId'
        order by count(*) desc
        limit 10
      ) c
      left join public.cards_catalog cc on cc.id = c.card_id
    ), '[]'::jsonb),
    -- Top 10 cartas más compradas (market directo + cartas obtenidas en sobres).
    'topCardsPurchased', coalesce((
      select jsonb_agg(jsonb_build_object('cardId', x.card_id, 'cardName', coalesce(cc.name, x.card_id), 'count', x.cnt) order by x.cnt desc)
      from (
        select card_id, count(*) as cnt
        from (
          select properties->>'cardId' as card_id
          from public.analytics_events
          where created_at >= p_since and event_name = 'card_purchased' and properties->>'cardId' is not null
          union all
          select jsonb_array_elements_text(properties->'openedCardIds') as card_id
          from public.analytics_events
          where created_at >= p_since and event_name = 'pack_purchased'
            and jsonb_typeof(properties->'openedCardIds') = 'array'
        ) u
        group by card_id
        order by count(*) desc
        limit 10
      ) x
      left join public.cards_catalog cc on cc.id = x.card_id
    ), '[]'::jsonb),
    -- Usuarios conectados recientemente (logueados): nickname, última sesión, nº sesiones, dispositivo.
    'recentUsers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', s.user_id,
        'nickname', coalesce(pr.nickname, 'Anónimo'),
        'lastSession', s.last_session,
        'sessions', s.cnt,
        'deviceType', s.device_type
      ) order by s.last_session desc)
      from (
        select user_id,
               max(started_at) as last_session,
               count(*) as cnt,
               (array_agg(device_type order by started_at desc))[1] as device_type
        from public.analytics_sessions
        where started_at >= p_since and user_id is not null
        group by user_id
        order by max(started_at) desc
        limit 20
      ) s
      left join public.player_profiles pr on pr.player_id = s.user_id
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.analytics_dashboard(timestamptz) from public, anon;
grant execute on function public.analytics_dashboard(timestamptz) to authenticated, service_role;

commit;
