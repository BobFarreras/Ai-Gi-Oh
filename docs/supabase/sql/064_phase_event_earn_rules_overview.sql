-- docs/supabase/sql/064_phase_event_earn_rules_overview.sql - get_event_overview ahora incluye earnRules (cómo se ganan los puntos), para mostrarlo al jugador.
begin;

create or replace function public.get_event_overview()
returns jsonb language sql stable security definer set search_path = '' as $$
  with ev as (
    select * from public.events
    where is_active = true and now() between starts_at and ends_at
    order by ends_at asc limit 1
  )
  select jsonb_build_object(
    'eventId', ev.id, 'name', ev.name, 'description', ev.description,
    'currencyName', ev.currency_name, 'bannerUrl', ev.banner_url, 'endsAt', ev.ends_at,
    'points', coalesce(pep.points, 0),
    'spentPoints', coalesce(pep.spent_points, 0),
    'balance', coalesce(pep.points, 0) - coalesce(pep.spent_points, 0),
    'earnRules', coalesce((
      select jsonb_agg(jsonb_build_object('actionType', r.action_type, 'pointsPer', r.points_per) order by r.points_per desc)
      from public.event_point_rules r where r.event_id = ev.id
    ), '[]'::jsonb),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'itemId', i.id, 'cardId', i.card_id, 'costPoints', i.cost_points,
        'perPlayerLimit', i.per_player_limit,
        'owned', (select count(*) from public.player_event_purchases pp where pp.player_id = auth.uid() and pp.item_id = i.id)
      ) order by i.sort_order)
      from public.event_shop_items i where i.event_id = ev.id and i.is_active = true
    ), '[]'::jsonb)
  )
  from ev left join public.player_event_points pep on pep.event_id = ev.id and pep.player_id = auth.uid();
$$;

commit;
