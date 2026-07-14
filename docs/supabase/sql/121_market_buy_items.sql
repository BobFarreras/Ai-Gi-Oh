-- docs/supabase/sql/121_market_buy_items.sql
-- Compra de objetos en el mercado (USB Raro) — ficha 2 del paquete v1.15.
--
-- Cobrar y entregar tienen que pasar juntos o no pasar: si el cobro y el alta en el inventario fueran dos
-- llamadas separadas desde TypeScript, un fallo entre medias dejaría al jugador SIN Nexus y SIN objeto. Por eso
-- toda la compra vive en una función transaccional.
begin;

create or replace function public.buy_level_candy(
  p_candy_id     text,
  p_operation_id uuid
)
returns integer               -- saldo de Nexus resultante
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_player uuid;
  v_price  integer;
  v_nexus  integer;
begin
  v_player := auth.uid();
  if v_player is null then
    raise exception 'Sesión no válida.' using errcode = '28000';
  end if;

  -- Idempotencia: un doble clic (o un reintento de red) no puede cobrar dos veces. Si la operación ya se
  -- aplicó, devolvemos el saldo actual sin tocar nada.
  insert into public.inventory_operations (operation_id, player_id)
  values (p_operation_id, v_player)
  on conflict (operation_id) do nothing;
  if not found then
    select nexus into v_nexus from public.player_wallets where player_id = v_player;
    return coalesce(v_nexus, 0);
  end if;

  -- El precio SIEMPRE sale del catálogo, nunca del cliente.
  select price_nexus into v_price
    from public.level_candies
   where id = p_candy_id and is_active = true;
  if v_price is null then
    raise exception 'Ese objeto no está a la venta.' using errcode = 'P0001';
  end if;

  -- Cobro: el propio UPDATE es la comprobación de saldo (condición atómica, sin carrera entre leer y restar).
  update public.player_wallets
     set nexus = nexus - v_price
   where player_id = v_player
     and nexus >= v_price
  returning nexus into v_nexus;

  if v_nexus is null then
    raise exception 'No tienes suficientes Nexus.' using errcode = 'P0001';
  end if;

  -- Entrega.
  insert into public.player_inventory_items as inv (player_id, item_type, item_id, quantity)
  values (v_player, 'LEVEL_CANDY', p_candy_id, 1)
  on conflict (player_id, item_type, item_id) do update
    set quantity = inv.quantity + 1;

  return v_nexus;
end;
$$;

revoke all on function public.buy_level_candy(text, uuid) from public, anon;
grant execute on function public.buy_level_candy(text, uuid) to authenticated, service_role;

commit;
