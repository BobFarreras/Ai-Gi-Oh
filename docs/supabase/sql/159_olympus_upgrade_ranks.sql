-- docs/supabase/sql/159_olympus_upgrade_ranks.sql - Convierte los nodos del árbol en mejoras acumulables por rango.
begin;

/**
 * El árbol nació con nodos de compra única: `purchase_champion_upgrade` no hacía nada si el nodo ya
 * constaba comprado. Con cuatro nodos por campeón, el árbol se agotaba en cuatro compras y el Éter se
 * quedaba sin destino. Ahora cada nodo se sube por RANGOS y acumula su efecto hasta el tope declarado.
 */
alter table public.olympus_champion_upgrade_nodes
  add column max_rank integer not null default 1 check (max_rank between 1 and 50);

-- Ranks comprados por nodo: {"gennvim-power-1": 3}. `unlocked_node_ids` se mantiene sincronizado para
-- no romper lecturas existentes (rango >= 1 implica presencia en el array).
alter table public.player_olympus_champion_progress
  add column node_ranks jsonb not null default '{}'::jsonb
    check (jsonb_typeof(node_ranks) = 'object');

update public.player_olympus_champion_progress
set node_ranks = (
  select coalesce(jsonb_object_agg(node_id, 1), '{}'::jsonb)
  from unnest(unlocked_node_ids) as node_id
)
where array_length(unlocked_node_ids, 1) > 0;

/**
 * Rangos por nodo: los justos para que el efecto pueda llegar a su tope partiendo de la escala base más
 * alta del catálogo, sin dejar rangos que ya no suman nada.
 */
update public.olympus_champion_upgrade_nodes
set max_rank = case effect_json ->> 'kind'
  when 'GLOBAL_LEVEL' then 16          -- +5 por rango: desde nivel 28 alcanza el tope de 100
  when 'STARTING_LP' then 8            -- +500 por rango: de 8000 a 12000
  when 'STARTING_ENERGY' then 3        -- +1 por rango hasta el tope de energía
  when 'GLOBAL_VERSION_TIER' then 3    -- +1 por rango: de V2 a V5
  else 1
end;

/**
 * El coste sube con el rango: `coste base × rango siguiente`. Así el primer punto es accesible y los
 * últimos exigen varias expediciones, que es lo que da recorrido largo al Éter.
 */
create or replace function public.purchase_champion_upgrade(
  p_player_id uuid, p_champion_id text, p_node_id text, p_operation_id text
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  node_record public.olympus_champion_upgrade_nodes;
  progress_record public.player_olympus_champion_progress;
  current_rank integer;
  next_rank integer;
  rank_cost integer;
  new_balance integer;
begin
  select * into node_record from public.olympus_champion_upgrade_nodes
  where id = p_node_id and champion_id = p_champion_id and is_active;
  if not found then raise exception 'UPGRADE_NODE_NOT_FOUND' using errcode = '22023'; end if;

  -- Idempotencia: el operation_id incluye el rango, así que reintentar la MISMA compra no cobra dos veces.
  if exists (
    select 1 from public.combat_mode_wallet_transactions
    where player_id = p_player_id and operation_id = p_operation_id
  ) then
    select ascension_fragments into new_balance
    from public.combat_mode_wallets where player_id = p_player_id;
    return new_balance;
  end if;

  insert into public.combat_mode_wallets (player_id) values (p_player_id)
  on conflict (player_id) do nothing;
  perform 1 from public.combat_mode_wallets where player_id = p_player_id for update;

  select * into progress_record from public.player_olympus_champion_progress
  where player_id = p_player_id and champion_id = p_champion_id for update;
  if not found then raise exception 'CHAMPION_NOT_UNLOCKED' using errcode = 'P0001'; end if;

  current_rank := coalesce((progress_record.node_ranks ->> p_node_id)::integer, 0);
  if current_rank >= node_record.max_rank then
    raise exception 'UPGRADE_MAX_RANK_REACHED' using errcode = 'P0001';
  end if;
  -- Los prerrequisitos solo se comprueban en el primer rango: subir lo ya abierto no vuelve a exigirlos.
  if current_rank = 0 and not node_record.prerequisite_node_ids <@ progress_record.unlocked_node_ids then
    raise exception 'UPGRADE_PREREQUISITES_NOT_MET' using errcode = 'P0001';
  end if;

  next_rank := current_rank + 1;
  rank_cost := node_record.fragment_cost * next_rank;

  update public.combat_mode_wallets
  set ascension_fragments = ascension_fragments - rank_cost,
      updated_at = now(), version = version + 1
  where player_id = p_player_id and ascension_fragments >= rank_cost
  returning ascension_fragments into new_balance;
  if not found then raise exception 'INSUFFICIENT_FRAGMENTS' using errcode = 'P0001'; end if;

  insert into public.combat_mode_wallet_transactions (player_id, operation_id, amount, reason, metadata)
  values (p_player_id, p_operation_id, -rank_cost, 'CHAMPION_UPGRADE',
    jsonb_build_object('championId', p_champion_id, 'nodeId', p_node_id, 'rank', next_rank));

  update public.player_olympus_champion_progress
  set node_ranks = node_ranks || jsonb_build_object(p_node_id, next_rank),
      unlocked_node_ids = case
        when p_node_id = any(unlocked_node_ids) then unlocked_node_ids
        else array_append(unlocked_node_ids, p_node_id)
      end,
      version = version + 1
  where player_id = p_player_id and champion_id = p_champion_id;
  return new_balance;
end;
$$;

/** El reembolso cubre TODOS los rangos pagados: base × (1+2+…+rango). */
create or replace function public.respec_champion_upgrades(
  p_player_id uuid, p_champion_id text, p_operation_id text
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  progress_record public.player_olympus_champion_progress;
  settings_record public.olympus_settings;
  invested integer;
  refund integer;
  charge integer;
  new_balance integer;
begin
  if exists (
    select 1 from public.combat_mode_wallet_transactions
    where player_id = p_player_id and operation_id = p_operation_id
  ) then
    select ascension_fragments into new_balance
    from public.combat_mode_wallets where player_id = p_player_id;
    return new_balance;
  end if;

  select * into settings_record from public.olympus_settings where is_active;
  if not found then raise exception 'OLYMPUS_SETTINGS_NOT_ACTIVE' using errcode = 'P0001'; end if;

  insert into public.combat_mode_wallets (player_id) values (p_player_id)
  on conflict (player_id) do nothing;
  perform 1 from public.combat_mode_wallets where player_id = p_player_id for update;

  select * into progress_record from public.player_olympus_champion_progress
  where player_id = p_player_id and champion_id = p_champion_id for update;
  if not found then raise exception 'CHAMPION_NOT_UNLOCKED' using errcode = 'P0001'; end if;

  select coalesce(sum(node.fragment_cost * (rank.value::integer * (rank.value::integer + 1)) / 2), 0)
  into invested
  from jsonb_each_text(progress_record.node_ranks) as rank(key, value)
  join public.olympus_champion_upgrade_nodes node on node.id = rank.key;

  refund := floor(invested * settings_record.respec_refund_percent / 100.0)::integer;
  if refund <= 0 then raise exception 'NO_UPGRADES_TO_RESPEC' using errcode = 'P0001'; end if;

  charge := case
    when progress_record.respec_count < settings_record.respec_free_allowance then 0
    else settings_record.respec_cost
  end;

  update public.combat_mode_wallets
  set ascension_fragments = ascension_fragments + refund - charge,
      updated_at = now(), version = version + 1
  where player_id = p_player_id and ascension_fragments + refund >= charge
  returning ascension_fragments into new_balance;
  if not found then raise exception 'INSUFFICIENT_FRAGMENTS' using errcode = 'P0001'; end if;

  insert into public.combat_mode_wallet_transactions (player_id, operation_id, amount, reason, metadata)
  values (p_player_id, p_operation_id, refund, 'CHAMPION_RESPEC',
    jsonb_build_object('championId', p_champion_id, 'refundPercent', settings_record.respec_refund_percent));
  if charge > 0 then
    insert into public.combat_mode_wallet_transactions (player_id, operation_id, amount, reason, metadata)
    values (p_player_id, p_operation_id || ':cost', -charge, 'CHAMPION_RESPEC_COST',
      jsonb_build_object('championId', p_champion_id, 'respecCount', progress_record.respec_count));
  end if;

  update public.player_olympus_champion_progress
  set node_ranks = '{}'::jsonb, unlocked_node_ids = '{}', respec_count = respec_count + 1, version = version + 1
  where player_id = p_player_id and champion_id = p_champion_id;
  return new_balance;
end;
$$;

commit;
