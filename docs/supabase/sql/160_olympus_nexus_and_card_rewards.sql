-- docs/supabase/sql/160_olympus_nexus_and_card_rewards.sql - Olimpo pasa a repartir Nexus y una carta, no solo Éter.
begin;

/**
 * Hasta ahora derrotar a una leyenda solo daba Éter, que únicamente sirve dentro del propio Olimpo.
 * El modo era el final del recorrido y no devolvía nada a la economía general. Cada leyenda gana dos
 * recompensas más, ambas administrables: Nexus por victoria y una carta de botín.
 *
 * La carta se limita por defecto a la PRIMERA victoria (`card_reward_first_victory_only`): con tres
 * intentos diarios, repartir una carta fuerte en cada victoria convertiría el modo en una fábrica de
 * copias. El interruptor queda expuesto para las leyendas que sí quieran repetir botín.
 */
alter table public.olympus_opponents
  add column nexus_reward integer not null default 0 check (nexus_reward >= 0),
  -- FK real contra el catálogo: un id mal escrito en el panel debe fallar al guardar, no al repartir.
  add column card_reward_id text references public.cards_catalog(id),
  add column card_reward_first_victory_only boolean not null default true;

comment on column public.olympus_opponents.nexus_reward is
  'Nexus acreditado al jugador por cada victoria contra esta leyenda.';
comment on column public.olympus_opponents.card_reward_id is
  'Carta añadida a la colección al ganar. Null = esta leyenda no reparte carta.';

-- Botín inicial de las tres leyendas sembradas en la 154. Solo toca las que siguen con el default.
update public.olympus_opponents set nexus_reward = 300, card_reward_id = 'fusion-gemgpt'
where id = 'zeus' and nexus_reward = 0;
update public.olympus_opponents set nexus_reward = 220, card_reward_id = 'fusion-kaclauli'
where id = 'loki' and nexus_reward = 0;
update public.olympus_opponents set nexus_reward = 180, card_reward_id = 'fusion-super-c'
where id = 'hefes' and nexus_reward = 0;

/**
 * La liquidación crece con dos parámetros. Se recrea con firma nueva (no `create or replace`) porque
 * cambiar el número de argumentos dejaría dos sobrecargas y la llamada de 5 argumentos quedaría
 * ambigua. El importe y la carta los decide el dominio: la RPC solo los aplica, igual que ya hacía
 * con el Éter.
 */
drop function if exists public.complete_olympus_battle(uuid, uuid, text, jsonb, integer);

create function public.complete_olympus_battle(
  p_player_id uuid, p_battle_id uuid, p_outcome text, p_reward_json jsonb,
  p_fragment_amount integer, p_nexus_amount integer, p_card_reward_id text
)
returns public.olympus_battles
language plpgsql
set search_path = ''
as $$
declare
  locked_battle public.olympus_battles;
begin
  select * into locked_battle from public.olympus_battles
  where battle_id = p_battle_id and player_id = p_player_id for update;
  if not found then raise exception 'OLYMPUS_BATTLE_NOT_FOUND' using errcode = 'P0001'; end if;
  -- El candado + esta salida temprana son lo que impide cobrar dos veces el botín de una batalla.
  if locked_battle.status = 'COMPLETED' then return locked_battle; end if;
  if locked_battle.status <> 'ISSUED' or p_outcome not in ('WIN', 'LOSS', 'DRAW') then
    raise exception 'INVALID_OLYMPUS_RESULT' using errcode = '22023';
  end if;
  update public.olympus_battles
  set outcome = p_outcome, reward_json = coalesce(p_reward_json, '{}'::jsonb),
      status = 'COMPLETED', completed_at = now()
  where battle_id = p_battle_id returning * into locked_battle;
  update public.combat_sessions
  set status = 'COMPLETED', completed_at = now() where battle_id = p_battle_id and status = 'ISSUED';
  if p_outcome = 'WIN' then
    insert into public.olympus_first_victories (player_id, opponent_id, battle_id)
    values (p_player_id, locked_battle.opponent_id, p_battle_id)
    on conflict (player_id, opponent_id) do nothing;
  end if;
  if p_fragment_amount > 0 then
    perform public.credit_ascension_fragments(
      p_player_id, 'olympus-battle:' || p_battle_id, p_fragment_amount, 'OLYMPUS_BATTLE', p_reward_json
    );
  end if;
  if p_nexus_amount > 0 then
    perform public.wallet_credit_nexus(p_player_id, p_nexus_amount);
  end if;
  if p_card_reward_id is not null then
    insert into public.player_collection_cards (player_id, card_id, owned_copies)
    values (p_player_id, p_card_reward_id, 1)
    on conflict (player_id, card_id) do update
      set owned_copies = public.player_collection_cards.owned_copies + 1, updated_at = now();
  end if;
  return locked_battle;
end;
$$;

-- Mismo candado que la firma anterior: mover dinero y colección es exclusivo del servidor.
revoke all on function public.complete_olympus_battle(uuid, uuid, text, jsonb, integer, integer, text)
  from public, anon, authenticated;
grant execute on function public.complete_olympus_battle(uuid, uuid, text, jsonb, integer, integer, text)
  to service_role;

commit;
