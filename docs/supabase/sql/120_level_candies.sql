-- docs/supabase/sql/120_level_candies.sql
-- USB Raro: caramelos de nivel (+1 a +5) — ficha 2 del paquete v1.15.
--
-- Un caramelo NO regala niveles: regala la XP exacta que separa el nivel actual de la carta del nivel destino.
-- Esa cuenta la hace el SERVIDOR en TypeScript (level-candy-rules.ts), que es donde vive la curva; aquí no se
-- duplica la fórmula (dos fuentes de verdad para el nivel es justo el bug que queremos evitar). Esta función
-- solo pone la frontera de seguridad: que tengas el caramelo, que sea tuyo, que se gaste UNA vez y que la XP
-- nunca baje.
begin;

-- ── ¡IMPRESCINDIBLE! El techo de nivel también vive en la BD ────────────────────────────────────────
-- `player_card_progress` tenía CHECK (level >= 0 AND level <= 30). Sin esto, la primera carta que superara el
-- nivel 30 reventaría al guardar: la ficha 4 (niveles a 100) NO está completa sin ampliar este check. Se
-- descubrió inspeccionando producción, no estaba documentado en ningún sitio.
alter table public.player_card_progress
  drop constraint if exists player_card_progress_level_check;
alter table public.player_card_progress
  add constraint player_card_progress_level_check check (level >= 0 and level <= 100);

-- ── Catálogo de caramelos (editable desde admin) ───────────────────────────────────────────────────
create table if not exists public.level_candies (
  id          text primary key,
  name        text    not null,
  levels      integer not null check (levels between 1 and 5),
  price_nexus integer not null default 0 check (price_nexus >= 0),
  image_url   text,
  is_active   boolean not null default true
);

insert into public.level_candies (id, name, levels, price_nexus, image_url) values
  ('candy-usb-raro-1', 'USB Raro +1', 1,  1500, '/assets/items/candy-usb-raro.webp'),
  ('candy-usb-raro-2', 'USB Raro +2', 2,  3500, '/assets/items/candy-usb-raro.webp'),
  ('candy-usb-raro-3', 'USB Raro +3', 3,  6000, '/assets/items/candy-usb-raro.webp'),
  ('candy-usb-raro-4', 'USB Raro +4', 4,  9000, '/assets/items/candy-usb-raro.webp'),
  ('candy-usb-raro-5', 'USB Raro +5', 5, 13000, '/assets/items/candy-usb-raro.webp')
on conflict (id) do nothing;

-- ── Inventario del jugador ─────────────────────────────────────────────────────────────────────────
create table if not exists public.player_inventory_items (
  player_id uuid    not null references auth.users (id) on delete cascade,
  item_type text    not null check (item_type in ('LEVEL_CANDY')),
  item_id   text    not null,
  quantity  integer not null default 0 check (quantity >= 0),
  primary key (player_id, item_type, item_id)
);

-- ── Idempotencia: un doble clic (o un reintento de red) NO puede gastar dos caramelos ──────────────
create table if not exists public.inventory_operations (
  operation_id uuid primary key,
  player_id    uuid not null references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now()
);

-- ── Consumir un caramelo sobre una carta ───────────────────────────────────────────────────────────
-- p_new_level / p_new_xp los calcula el servidor con la curva (nunca el cliente). La función valida la
-- posesión, descuenta y escribe la progresión en UNA sola transacción, y se niega a bajar la XP.
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
end;
$$;

-- ── RLS: cada jugador solo ve lo suyo; el catálogo lo lee cualquiera autenticado ───────────────────
alter table public.player_inventory_items enable row level security;
alter table public.inventory_operations  enable row level security;
alter table public.level_candies         enable row level security;

drop policy if exists "inventory_own_read" on public.player_inventory_items;
create policy "inventory_own_read" on public.player_inventory_items
  for select to authenticated using (player_id = (select auth.uid()));

drop policy if exists "level_candies_read" on public.level_candies;
create policy "level_candies_read" on public.level_candies
  for select to authenticated using (true);

-- Escrituras: NADIE desde el cliente. Solo las funciones security definer y el service_role. Si el inventario
-- fuera escribible por el dueño, cualquiera se regalaría caramelos desde la consola del navegador.
revoke all on public.player_inventory_items, public.inventory_operations, public.level_candies
  from anon, authenticated;
grant select on public.player_inventory_items, public.level_candies to authenticated;
grant all on public.player_inventory_items, public.inventory_operations, public.level_candies to service_role;

revoke all on function public.consume_level_candy(text, text, integer, integer, uuid) from public, anon;
grant execute on function public.consume_level_candy(text, text, integer, integer, uuid) to authenticated, service_role;

commit;
