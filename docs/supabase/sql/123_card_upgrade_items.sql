-- docs/supabase/sql/123_card_upgrade_items.sql
-- Objetos de mejora permanente de ATK/DEF (Núcleo Overclock / Placa Blindada) — ficha 3 del paquete v1.15.
--
-- El tope lo impone el SERVIDOR: los objetos aportan hasta `presupuesto(coste_base)` por stat, de forma plana.
--   techo(stat) = base + 750 (niveles) + presupuesto(coste_base)   [600/500/400/300/200 de coste 2 a 6]
-- Si el tope solo viviera en la UI, un cliente modificado lo saltaría; por eso la comprobación está en la RPC.
--
-- La cartera y la progresión ya NO son escribibles por el jugador (migración 122): todo pasa por estas RPC
-- security definer, con auth.uid() como identidad.
begin;

-- El inventario ahora admite también objetos de mejora, no solo caramelos.
alter table public.player_inventory_items
  drop constraint if exists player_inventory_items_item_type_check;
alter table public.player_inventory_items
  add constraint player_inventory_items_item_type_check check (item_type in ('LEVEL_CANDY', 'CARD_UPGRADE'));

-- ── Catálogo de objetos de mejora (editable desde admin) ────────────────────────────────────────────
create table if not exists public.card_upgrade_items (
  id          text primary key,
  name        text    not null,
  stat        text    not null check (stat in ('ATTACK', 'DEFENSE')),
  value       integer not null check (value > 0),
  price_nexus integer not null default 0 check (price_nexus >= 0),
  image_url   text,
  is_active   boolean not null default true
);

insert into public.card_upgrade_items (id, name, stat, value, price_nexus, image_url) values
  ('item-nucleo-overclock', 'Núcleo Overclock', 'ATTACK',  100, 2000, '/assets/items/item-nucleo-overclock.webp'),
  ('item-placa-blindada',   'Placa Blindada',   'DEFENSE', 100, 2000, '/assets/items/item-placa-blindada.webp')
on conflict (id) do nothing;

-- ── Mejoras aplicadas por carta y jugador (bonus agregado por stat) ─────────────────────────────────
create table if not exists public.player_card_upgrades (
  player_id     uuid    not null references auth.users (id) on delete cascade,
  card_id       text    not null references public.cards_catalog (id) on delete cascade,
  attack_bonus  integer not null default 0 check (attack_bonus >= 0),
  defense_bonus integer not null default 0 check (defense_bonus >= 0),
  primary key (player_id, card_id)
);

-- ── Presupuesto de objetos por coste base (espejo de card-upgrade-rules.ts; mantener en sync) ───────
create or replace function public.card_upgrade_budget(p_cost integer)
returns integer
language sql
immutable
as $$
  select case
    when p_cost <= 2 then 600
    when p_cost = 3 then 500
    when p_cost = 4 then 400
    when p_cost = 5 then 300
    else 200
  end;
$$;

-- ── Comprar un objeto de mejora (va al inventario) ──────────────────────────────────────────────────
create or replace function public.buy_card_upgrade_item(
  p_item_id      text,
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
  if v_player is null then raise exception 'Sesión no válida.' using errcode = '28000'; end if;

  insert into public.inventory_operations (operation_id, player_id)
  values (p_operation_id, v_player)
  on conflict (operation_id) do nothing;
  if not found then
    select nexus into v_nexus from public.player_wallets where player_id = v_player;
    return coalesce(v_nexus, 0);
  end if;

  select price_nexus into v_price from public.card_upgrade_items where id = p_item_id and is_active = true;
  if v_price is null then raise exception 'Ese objeto no está a la venta.' using errcode = 'P0001'; end if;

  update public.player_wallets set nexus = nexus - v_price
   where player_id = v_player and nexus >= v_price
  returning nexus into v_nexus;
  if v_nexus is null then raise exception 'No tienes suficientes Nexus.' using errcode = 'P0001'; end if;

  insert into public.player_inventory_items as inv (player_id, item_type, item_id, quantity)
  values (v_player, 'CARD_UPGRADE', p_item_id, 1)
  on conflict (player_id, item_type, item_id) do update set quantity = inv.quantity + 1;

  return v_nexus;
end;
$$;

-- ── Aplicar un objeto de mejora a una carta (respeta el tope) ───────────────────────────────────────
create or replace function public.apply_card_upgrade(
  p_item_id      text,
  p_card_id      text,
  p_operation_id uuid
)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_player  uuid;
  v_stat    text;
  v_value   integer;
  v_cost    integer;
  v_budget  integer;
  v_current integer;
  v_left    integer;
begin
  v_player := auth.uid();
  if v_player is null then raise exception 'Sesión no válida.' using errcode = '28000'; end if;

  insert into public.inventory_operations (operation_id, player_id)
  values (p_operation_id, v_player)
  on conflict (operation_id) do nothing;
  if not found then return; end if;

  select stat, value into v_stat, v_value from public.card_upgrade_items where id = p_item_id and is_active = true;
  if v_stat is null then raise exception 'Ese objeto no existe.' using errcode = 'P0001'; end if;

  -- El tope depende del coste BASE de la carta (nunca del efectivo, que baja con el nivel 50).
  select cost into v_cost from public.cards_catalog where id = p_card_id;
  if v_cost is null then raise exception 'La carta no existe.' using errcode = 'P0001'; end if;
  v_budget := public.card_upgrade_budget(v_cost);

  -- Bonus ya acumulado en ese stat para esta carta.
  select case when v_stat = 'ATTACK' then attack_bonus else defense_bonus end
    into v_current
    from public.player_card_upgrades
   where player_id = v_player and card_id = p_card_id;
  v_current := coalesce(v_current, 0);

  if v_current + v_value > v_budget then
    raise exception 'La carta ya no admite más mejora en ese atributo (tope alcanzado).' using errcode = 'P0001';
  end if;

  -- Consume el objeto del inventario (falla si no lo tiene).
  update public.player_inventory_items
     set quantity = quantity - 1
   where player_id = v_player and item_type = 'CARD_UPGRADE' and item_id = p_item_id and quantity > 0
  returning quantity into v_left;
  if v_left is null then raise exception 'No tienes ese objeto.' using errcode = 'P0001'; end if;

  -- Aplica el bonus al stat correspondiente.
  insert into public.player_card_upgrades as pcu (player_id, card_id, attack_bonus, defense_bonus)
  values (
    v_player, p_card_id,
    case when v_stat = 'ATTACK'  then v_value else 0 end,
    case when v_stat = 'DEFENSE' then v_value else 0 end
  )
  on conflict (player_id, card_id) do update
    set attack_bonus  = pcu.attack_bonus  + case when v_stat = 'ATTACK'  then v_value else 0 end,
        defense_bonus = pcu.defense_bonus + case when v_stat = 'DEFENSE' then v_value else 0 end;
end;
$$;

-- ── RLS: el jugador LEE lo suyo; nadie escribe desde el cliente (solo las RPC security definer) ──────
alter table public.player_card_upgrades enable row level security;
alter table public.card_upgrade_items   enable row level security;

drop policy if exists "player_card_upgrades_read" on public.player_card_upgrades;
create policy "player_card_upgrades_read" on public.player_card_upgrades
  for select to authenticated using (player_id = (select auth.uid()));

drop policy if exists "card_upgrade_items_read" on public.card_upgrade_items;
create policy "card_upgrade_items_read" on public.card_upgrade_items
  for select to authenticated using (true);

revoke all on public.player_card_upgrades, public.card_upgrade_items from anon, authenticated;
grant select on public.player_card_upgrades, public.card_upgrade_items to authenticated;
grant all on public.player_card_upgrades, public.card_upgrade_items to service_role;

revoke all on function public.card_upgrade_budget(integer) from public, anon;
grant execute on function public.card_upgrade_budget(integer) to authenticated, service_role;
revoke all on function public.buy_card_upgrade_item(text, uuid) from public, anon;
grant execute on function public.buy_card_upgrade_item(text, uuid) to authenticated, service_role;
revoke all on function public.apply_card_upgrade(text, text, uuid) from public, anon;
grant execute on function public.apply_card_upgrade(text, text, uuid) to authenticated, service_role;

commit;
