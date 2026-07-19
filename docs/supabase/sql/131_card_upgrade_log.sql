-- docs/supabase/sql/131_card_upgrade_log.sql
-- Rastro visible de los objetos equipados — ficha 9b del paquete v1.17.
--
-- Origen: un jugador equipó un objeto recién canjeado sin darse cuenta y creyó haber perdido la compra
-- (el objeto se consume al aplicarse y no dejaba rastro *como objeto*). Dos piezas nuevas:
--   1. `player_card_upgrade_log` (append-only): historial de cada aplicación de objeto (mejora O caramelo).
--      Lo escribe SOLO el servidor (las RPC security definer); el jugador solo lee lo suyo.
--   2. `attack_count` / `defense_count` en `player_card_upgrades`: veces que se aplicó cada stat, para los
--      badges ×N de la cara de la carta sin depender de `bonus / valor_del_objeto` (el valor es editable
--      por admin y esa división mentiría en cuanto cambie).
-- Las RPC de 120 (consume_level_candy) y 123 (apply_card_upgrade) se reemplazan aquí con la escritura del
-- log añadida; ninguna otra migración las había tocado.
begin;

-- ── Contadores de aplicaciones por stat (badges ×N) ─────────────────────────────────────────────────
alter table public.player_card_upgrades
  add column if not exists attack_count  integer not null default 0 check (attack_count >= 0),
  add column if not exists defense_count integer not null default 0 check (defense_count >= 0);

-- ── Historial de objetos aplicados (append-only) ────────────────────────────────────────────────────
create table if not exists public.player_card_upgrade_log (
  id         bigint generated always as identity primary key,
  player_id  uuid not null references auth.users (id) on delete cascade,
  item_type  text not null check (item_type in ('CARD_UPGRADE', 'LEVEL_CANDY')),
  item_id    text not null,
  card_id    text not null references public.cards_catalog (id) on delete cascade,
  -- Stat mejorado (solo mejoras; null para caramelos).
  stat       text check (stat in ('ATTACK', 'DEFENSE')),
  -- Mejora: bonus aplicado (+100). Caramelo: nivel ALCANZADO tras consumirlo.
  value      integer not null check (value > 0),
  applied_at timestamptz not null default now()
);

create index if not exists player_card_upgrade_log_player_idx
  on public.player_card_upgrade_log (player_id, applied_at desc);

-- ── Aplicar un objeto de mejora: igual que en 123 + contador + línea de historial ───────────────────
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

  -- Aplica el bonus y cuenta la aplicación en el stat correspondiente.
  insert into public.player_card_upgrades as pcu (player_id, card_id, attack_bonus, defense_bonus, attack_count, defense_count)
  values (
    v_player, p_card_id,
    case when v_stat = 'ATTACK'  then v_value else 0 end,
    case when v_stat = 'DEFENSE' then v_value else 0 end,
    case when v_stat = 'ATTACK'  then 1 else 0 end,
    case when v_stat = 'DEFENSE' then 1 else 0 end
  )
  on conflict (player_id, card_id) do update
    set attack_bonus  = pcu.attack_bonus  + case when v_stat = 'ATTACK'  then v_value else 0 end,
        defense_bonus = pcu.defense_bonus + case when v_stat = 'DEFENSE' then v_value else 0 end,
        attack_count  = pcu.attack_count  + case when v_stat = 'ATTACK'  then 1 else 0 end,
        defense_count = pcu.defense_count + case when v_stat = 'DEFENSE' then 1 else 0 end;

  -- Línea de historial (misma transacción: o se aplica todo o nada).
  insert into public.player_card_upgrade_log (player_id, item_type, item_id, card_id, stat, value)
  values (v_player, 'CARD_UPGRADE', p_item_id, p_card_id, v_stat, v_value);
end;
$$;

-- ── Consumir un caramelo: igual que en 120 + línea de historial ─────────────────────────────────────
create or replace function public.consume_level_candy(
  p_candy_id     text,
  p_card_id      text,
  p_new_level    integer,
  p_new_xp       integer,
  p_operation_id uuid
)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_player uuid;
  v_left   integer;
begin
  v_player := auth.uid();
  if v_player is null then
    raise exception 'Sesión no válida.' using errcode = '28000';
  end if;

  -- Idempotencia: si la operación ya se aplicó, no se hace nada (y no se gasta otro caramelo).
  insert into public.inventory_operations (operation_id, player_id)
  values (p_operation_id, v_player)
  on conflict (operation_id) do nothing;
  if not found then
    return;
  end if;

  -- Descuenta el caramelo solo si el jugador lo tiene de verdad.
  update public.player_inventory_items
     set quantity = quantity - 1
   where player_id = v_player
     and item_type = 'LEVEL_CANDY'
     and item_id = p_candy_id
     and quantity > 0
  returning quantity into v_left;

  if v_left is null then
    raise exception 'No tienes ese caramelo.' using errcode = 'P0001';
  end if;

  -- Aplica la progresión. `greatest` es el cinturón de seguridad: pase lo que pase, la XP nunca retrocede.
  insert into public.player_card_progress as pcp (player_id, card_id, level, xp, version_tier)
  values (v_player, p_card_id, p_new_level, p_new_xp, 0)
  on conflict (player_id, card_id) do update
    set xp         = greatest(pcp.xp, excluded.xp),
        level      = greatest(pcp.level, excluded.level),
        updated_at = now();

  -- Línea de historial: para caramelos, `value` es el nivel alcanzado.
  insert into public.player_card_upgrade_log (player_id, item_type, item_id, card_id, stat, value)
  values (v_player, 'LEVEL_CANDY', p_candy_id, p_card_id, null, p_new_level);
end;
$$;

-- ── Backfill de lo ya aplicado (solo si el log está vacío: correr dos veces no duplica) ─────────────
-- Contadores: hoy los dos objetos de mejora valen 100, así que `bonus / 100` es exacto. Historial: se
-- generan filas sintéticas con el objeto inferido por stat y fecha = la de esta migración (la real no
-- existe). Los caramelos ya consumidos no se pueden reconstruir (la XP de duelo y la de caramelo se
-- mezclan en player_card_progress): el historial de caramelos empieza hoy.
do $$
begin
  if exists (select 1 from public.player_card_upgrade_log) then
    return;
  end if;

  update public.player_card_upgrades
     set attack_count  = ceil(attack_bonus  / 100.0)::integer,
         defense_count = ceil(defense_bonus / 100.0)::integer
   where attack_bonus > 0 or defense_bonus > 0;

  insert into public.player_card_upgrade_log (player_id, item_type, item_id, card_id, stat, value)
  select pcu.player_id, 'CARD_UPGRADE', 'item-nucleo-overclock', pcu.card_id, 'ATTACK', pcu.attack_bonus / pcu.attack_count
    from public.player_card_upgrades pcu, generate_series(1, pcu.attack_count)
   where pcu.attack_count > 0;

  insert into public.player_card_upgrade_log (player_id, item_type, item_id, card_id, stat, value)
  select pcu.player_id, 'CARD_UPGRADE', 'item-placa-blindada', pcu.card_id, 'DEFENSE', pcu.defense_bonus / pcu.defense_count
    from public.player_card_upgrades pcu, generate_series(1, pcu.defense_count)
   where pcu.defense_count > 0;
end;
$$;

-- ── RLS: el jugador LEE su historial; NADIE escribe desde el cliente (solo las RPC security definer) ─
alter table public.player_card_upgrade_log enable row level security;

drop policy if exists "player_card_upgrade_log_read" on public.player_card_upgrade_log;
create policy "player_card_upgrade_log_read" on public.player_card_upgrade_log
  for select to authenticated using (player_id = (select auth.uid()));

revoke all on public.player_card_upgrade_log from anon, authenticated;
grant select on public.player_card_upgrade_log to authenticated;
grant all on public.player_card_upgrade_log to service_role;

commit;
