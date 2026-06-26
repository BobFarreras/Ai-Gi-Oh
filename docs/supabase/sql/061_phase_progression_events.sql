-- docs/supabase/sql/061_phase_progression_events.sql - Eventos con moneda propia y tienda de canje (F3). Puntos otorgados por acciones (mismo bus que misiones); canje server-authoritative e idempotente por límite.
begin;

-- Evento temporal con moneda propia.
create table if not exists public.events (
  id text primary key,
  name text not null,
  description text,
  currency_name text not null default 'Puntos',
  banner_url text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true
);

-- Reglas de puntos: qué acción otorga cuántos puntos en un evento.
create table if not exists public.event_point_rules (
  event_id text not null references public.events(id) on delete cascade,
  action_type text not null,
  points_per integer not null check (points_per > 0),
  primary key (event_id, action_type)
);

-- Puntos del jugador por evento (la moneda caduca con el evento; no se mezcla con Nexus).
create table if not exists public.player_event_points (
  player_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null references public.events(id) on delete cascade,
  points integer not null default 0,
  spent_points integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (player_id, event_id)
);

-- Items de la tienda de evento (cartas canjeables por puntos).
create table if not exists public.event_shop_items (
  id text primary key,
  event_id text not null references public.events(id) on delete cascade,
  card_id text not null,
  cost_points integer not null check (cost_points > 0),
  per_player_limit integer not null default 1,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

-- Registro de canjes (para aplicar el límite por jugador y evitar doble cobro).
create table if not exists public.player_event_purchases (
  id bigint generated always as identity primary key,
  player_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references public.event_shop_items(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists idx_event_purchases_player_item on public.player_event_purchases (player_id, item_id);

alter table public.events enable row level security;
alter table public.event_point_rules enable row level security;
alter table public.player_event_points enable row level security;
alter table public.event_shop_items enable row level security;
alter table public.player_event_purchases enable row level security;

drop policy if exists "events_select_all" on public.events;
create policy "events_select_all" on public.events for select to authenticated using (true);
drop policy if exists "event_rules_select_all" on public.event_point_rules;
create policy "event_rules_select_all" on public.event_point_rules for select to authenticated using (true);
drop policy if exists "event_shop_select_all" on public.event_shop_items;
create policy "event_shop_select_all" on public.event_shop_items for select to authenticated using (true);
drop policy if exists "event_points_select_own" on public.player_event_points;
create policy "event_points_select_own" on public.player_event_points for select to authenticated using (player_id = auth.uid());
drop policy if exists "event_purchases_select_own" on public.player_event_purchases;
create policy "event_purchases_select_own" on public.player_event_purchases for select to authenticated using (player_id = auth.uid());

revoke all on public.events from anon, authenticated;
revoke all on public.event_point_rules from anon, authenticated;
revoke all on public.player_event_points from anon, authenticated;
revoke all on public.event_shop_items from anon, authenticated;
revoke all on public.player_event_purchases from anon, authenticated;
grant select on public.events to authenticated;
grant select on public.event_point_rules to authenticated;
grant select on public.player_event_points to authenticated;
grant select on public.event_shop_items to authenticated;
grant select on public.player_event_purchases to authenticated;
grant all on public.events to service_role;
grant all on public.event_point_rules to service_role;
grant all on public.player_event_points to service_role;
grant all on public.event_shop_items to service_role;
grant all on public.player_event_purchases to service_role;

-- Evento de ejemplo (14 días desde la aplicación).
insert into public.events (id, name, description, currency_name, starts_at, ends_at) values
  ('evt-launch', 'Evento de Lanzamiento', 'Consigue Fragmentos jugando y canjéalos por cartas exclusivas.', 'Fragmentos', now(), now() + interval '14 days')
on conflict (id) do nothing;

insert into public.event_point_rules (event_id, action_type, points_per) values
  ('evt-launch', 'PLAY_DUEL', 5),
  ('evt-launch', 'WIN_DUEL', 10),
  ('evt-launch', 'WIN_MP_MATCH', 30),
  ('evt-launch', 'BUY_PACK', 20),
  ('evt-launch', 'EVOLVE_CARD', 40)
on conflict (event_id, action_type) do nothing;

insert into public.event_shop_items (id, event_id, card_id, cost_points, per_player_limit, sort_order) values
  ('evt-launch-python', 'evt-launch', 'entity-python', 100, 2, 1),
  ('evt-launch-flutter', 'evt-launch', 'entity-flutter', 250, 1, 2),
  ('evt-launch-avast', 'evt-launch', 'entity-avast', 400, 1, 3)
on conflict (id) do nothing;

-- Recrea record_progression_event para otorgar también puntos de evento (mismo bus que misiones).
create or replace function public.record_progression_event(p_action_types text[], p_count integer default 1)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_player uuid;
  v_def public.mission_definitions;
  v_period text;
  v_rule record;
begin
  v_player := auth.uid();
  if v_player is null or p_count <= 0 then return; end if;
  for v_def in select * from public.mission_definitions where is_active = true and objective_type = any(p_action_types) loop
    v_period := public.progression_period_key(v_def.scope);
    insert into public.player_mission_progress (player_id, mission_id, period_key, progress, completed_at)
    values (v_player, v_def.id, v_period, least(p_count, v_def.target_count),
      case when p_count >= v_def.target_count then now() else null end)
    on conflict (player_id, mission_id, period_key) do update
      set progress = least(public.player_mission_progress.progress + p_count, v_def.target_count),
          completed_at = case
            when public.player_mission_progress.completed_at is not null then public.player_mission_progress.completed_at
            when public.player_mission_progress.progress + p_count >= v_def.target_count then now()
            else null end,
          updated_at = now();
  end loop;
  for v_rule in
    select r.event_id, r.points_per from public.event_point_rules r
    join public.events e on e.id = r.event_id
    where e.is_active = true and now() between e.starts_at and e.ends_at and r.action_type = any(p_action_types)
  loop
    insert into public.player_event_points (player_id, event_id, points)
    values (v_player, v_rule.event_id, v_rule.points_per)
    on conflict (player_id, event_id) do update
      set points = public.player_event_points.points + v_rule.points_per, updated_at = now();
  end loop;
end;
$$;

-- Snapshot del evento activo (con puntos del jugador e items de tienda). NULL si no hay evento activo.
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

-- Canjea un item de la tienda de evento: valida puntos y límite, gasta puntos y otorga la carta. Atómico.
create or replace function public.redeem_event_shop_item(p_item_id text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_player uuid;
  v_item public.event_shop_items;
  v_event public.events;
  v_balance integer;
  v_owned integer;
begin
  v_player := auth.uid();
  if v_player is null then raise exception 'Sesión no autenticada.' using errcode='42501'; end if;
  select * into v_item from public.event_shop_items where id = p_item_id and is_active = true;
  if not found then raise exception 'Item de evento no encontrado.' using errcode='P0001'; end if;
  select * into v_event from public.events where id = v_item.event_id;
  if not found or v_event.is_active = false or now() < v_event.starts_at or now() > v_event.ends_at then
    raise exception 'El evento no está activo.' using errcode='P0001';
  end if;
  select coalesce(points,0) - coalesce(spent_points,0) into v_balance
    from public.player_event_points where player_id = v_player and event_id = v_item.event_id for update;
  v_balance := coalesce(v_balance, 0);
  select count(*) into v_owned from public.player_event_purchases where player_id = v_player and item_id = p_item_id;
  if v_owned >= v_item.per_player_limit then
    raise exception 'Límite de canje alcanzado para este item.' using errcode='P0001';
  end if;
  if v_balance < v_item.cost_points then
    raise exception 'Puntos de evento insuficientes.' using errcode='P0001';
  end if;
  insert into public.player_event_points (player_id, event_id, points, spent_points)
  values (v_player, v_item.event_id, 0, v_item.cost_points)
  on conflict (player_id, event_id) do update
    set spent_points = public.player_event_points.spent_points + v_item.cost_points, updated_at = now();
  insert into public.player_event_purchases (player_id, item_id) values (v_player, p_item_id);
  insert into public.player_collection_cards (player_id, card_id, owned_copies)
  values (v_player, v_item.card_id, 1)
  on conflict (player_id, card_id) do update
    set owned_copies = public.player_collection_cards.owned_copies + 1, updated_at = now();
  return jsonb_build_object('applied', true, 'cardId', v_item.card_id, 'balance', v_balance - v_item.cost_points);
end;
$$;

revoke all on function public.get_event_overview() from public, anon;
grant execute on function public.get_event_overview() to authenticated;
revoke all on function public.redeem_event_shop_item(text) from public, anon;
grant execute on function public.redeem_event_shop_item(text) to authenticated;
revoke all on function public.record_progression_event(text[], integer) from public, anon;
grant execute on function public.record_progression_event(text[], integer) to authenticated;

commit;
