-- docs/supabase/sql/149_buy_item_commercial_ranking.sql - Puntúa compras de objetos en ranking comercial.
begin;

insert into public.weekly_leaderboard_point_rules (board, action_type, points)
values ('COMMERCIAL', 'BUY_ITEM', 10)
on conflict (board, action_type) do update set points = excluded.points;

-- La progresión se acredita dentro de la misma ruta idempotente que cobra y entrega el objeto. Dejarla en
-- Next.js permitiría repetir el mismo operationId para sumar ranking sin volver a pagar.
create or replace function public.buy_level_candy(
  p_candy_id text,
  p_operation_id uuid
)
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_player uuid;
  v_price integer;
  v_nexus integer;
begin
  v_player := auth.uid();
  if v_player is null then
    raise exception 'Sesión no válida.' using errcode = '28000';
  end if;

  insert into public.inventory_operations (operation_id, player_id)
  values (p_operation_id, v_player)
  on conflict (operation_id) do nothing;
  if not found then
    select nexus into v_nexus from public.player_wallets where player_id = v_player;
    return coalesce(v_nexus, 0);
  end if;

  select price_nexus into v_price
    from public.level_candies
   where id = p_candy_id and is_active = true;
  if v_price is null then
    raise exception 'Ese objeto no está a la venta.' using errcode = 'P0001';
  end if;

  update public.player_wallets
     set nexus = nexus - v_price
   where player_id = v_player and nexus >= v_price
  returning nexus into v_nexus;
  if v_nexus is null then
    raise exception 'No tienes suficientes Nexus.' using errcode = 'P0001';
  end if;

  insert into public.player_inventory_items as inv (player_id, item_type, item_id, quantity)
  values (v_player, 'LEVEL_CANDY', p_candy_id, 1)
  on conflict (player_id, item_type, item_id) do update set quantity = inv.quantity + 1;

  begin
    perform public.record_progression_event_for(v_player, array['BUY_ITEM']::text[], 1);
    perform public.award_weekly_points(array['BUY_ITEM']::text[], 1);
  exception when others then
    null;
  end;
  return v_nexus;
end;
$$;

create or replace function public.buy_card_upgrade_item(
  p_item_id text,
  p_operation_id uuid
)
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_player uuid;
  v_price integer;
  v_nexus integer;
begin
  v_player := auth.uid();
  if v_player is null then
    raise exception 'Sesión no válida.' using errcode = '28000';
  end if;

  insert into public.inventory_operations (operation_id, player_id)
  values (p_operation_id, v_player)
  on conflict (operation_id) do nothing;
  if not found then
    select nexus into v_nexus from public.player_wallets where player_id = v_player;
    return coalesce(v_nexus, 0);
  end if;

  select price_nexus into v_price
    from public.card_upgrade_items
   where id = p_item_id and is_active = true;
  if v_price is null then
    raise exception 'Ese objeto no está a la venta.' using errcode = 'P0001';
  end if;

  update public.player_wallets
     set nexus = nexus - v_price
   where player_id = v_player and nexus >= v_price
  returning nexus into v_nexus;
  if v_nexus is null then
    raise exception 'No tienes suficientes Nexus.' using errcode = 'P0001';
  end if;

  insert into public.player_inventory_items as inv (player_id, item_type, item_id, quantity)
  values (v_player, 'CARD_UPGRADE', p_item_id, 1)
  on conflict (player_id, item_type, item_id) do update set quantity = inv.quantity + 1;

  begin
    perform public.record_progression_event_for(v_player, array['BUY_ITEM']::text[], 1);
    perform public.award_weekly_points(array['BUY_ITEM']::text[], 1);
  exception when others then
    null;
  end;
  return v_nexus;
end;
$$;

commit;
