-- docs/supabase/sql/128_event_shop_objects.sql
-- Fase 2 de objetos: la tienda de eventos podía canjear SOLO cartas. Ahora también objetos del mercado
-- (caramelos de nivel y objetos de mejora ATK/DEF), que van al inventario del jugador.
--
-- Modelo: event_shop_items gana `reward_kind` (CARD | LEVEL_CANDY | CARD_UPGRADE) y `object_id` (id del objeto
-- cuando el premio no es una carta). `card_id` pasa a ser opcional. Un CHECK garantiza coherencia: una fila es
-- carta XOR objeto. El canje (redeem_event_shop_item) ramifica según reward_kind; el snapshot (get_event_overview)
-- expone el tipo + nombre/imagen/detalle del objeto para que el cliente lo pinte sin fetches extra.
begin;

-- ── 1) Esquema ──────────────────────────────────────────────────────────────────────────────────────
alter table public.event_shop_items add column if not exists reward_kind text not null default 'CARD';
alter table public.event_shop_items add column if not exists object_id text;
alter table public.event_shop_items alter column card_id drop not null;

alter table public.event_shop_items drop constraint if exists event_shop_items_reward_kind_check;
alter table public.event_shop_items add constraint event_shop_items_reward_kind_check check (
  (reward_kind = 'CARD' and card_id is not null and object_id is null)
  or (reward_kind in ('LEVEL_CANDY', 'CARD_UPGRADE') and object_id is not null and card_id is null)
);

-- ── 2) Canje: ramifica por tipo de premio ────────────────────────────────────────────────────────────
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

  if v_item.reward_kind = 'CARD' then
    insert into public.player_collection_cards (player_id, card_id, owned_copies)
    values (v_player, v_item.card_id, 1)
    on conflict (player_id, card_id) do update
      set owned_copies = public.player_collection_cards.owned_copies + 1, updated_at = now();
  else
    -- LEVEL_CANDY / CARD_UPGRADE coinciden con el item_type del inventario de objetos.
    insert into public.player_inventory_items as inv (player_id, item_type, item_id, quantity)
    values (v_player, v_item.reward_kind, v_item.object_id, 1)
    on conflict (player_id, item_type, item_id) do update set quantity = inv.quantity + 1;
  end if;

  return jsonb_build_object(
    'applied', true, 'rewardKind', v_item.reward_kind,
    'cardId', v_item.card_id, 'objectId', v_item.object_id,
    'balance', v_balance - v_item.cost_points
  );
end;
$$;

-- ── 3) Snapshot del evento: expone tipo + datos del objeto para pintar la tienda ────────────────────
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
        'itemId', i.id, 'rewardKind', i.reward_kind, 'cardId', i.card_id, 'objectId', i.object_id,
        'costPoints', i.cost_points, 'perPlayerLimit', i.per_player_limit,
        'objectName', coalesce(lc.name, cui.name),
        'objectImageUrl', coalesce(lc.image_url, cui.image_url),
        'objectDetail', case
          when i.reward_kind = 'LEVEL_CANDY' then '+' || lc.levels || ' niv.'
          when i.reward_kind = 'CARD_UPGRADE' then '+' || cui.value || ' ' || cui.stat
          else null end,
        'owned', (select count(*) from public.player_event_purchases pp where pp.player_id = auth.uid() and pp.item_id = i.id)
      ) order by i.sort_order)
      from public.event_shop_items i
      left join public.level_candies lc on i.reward_kind = 'LEVEL_CANDY' and lc.id = i.object_id
      left join public.card_upgrade_items cui on i.reward_kind = 'CARD_UPGRADE' and cui.id = i.object_id
      where i.event_id = ev.id and i.is_active = true
    ), '[]'::jsonb)
  )
  from ev left join public.player_event_points pep on pep.event_id = ev.id and pep.player_id = auth.uid();
$$;

-- Permisos sin cambios (siguen como en 061): authenticated ejecuta ambas.
revoke all on function public.get_event_overview() from public, anon;
grant execute on function public.get_event_overview() to authenticated, service_role;
revoke all on function public.redeem_event_shop_item(text) from public, anon;
grant execute on function public.redeem_event_shop_item(text) to authenticated, service_role;

commit;
