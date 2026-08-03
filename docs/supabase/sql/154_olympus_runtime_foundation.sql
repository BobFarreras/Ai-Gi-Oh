-- docs/supabase/sql/154_olympus_runtime_foundation.sql - Configura Olimpo como modo jugable: settings versionados, leyendas reales y respec con coste.
begin;

-- 1. Configuración versionada del modo. El cliente nunca decide intentos, TTL ni coste de respec.
create table public.olympus_settings (
  id uuid primary key default gen_random_uuid(),
  version integer not null unique check (version > 0),
  daily_attempt_limit integer not null check (daily_attempt_limit between 1 and 10),
  battle_ttl_minutes integer not null check (battle_ttl_minutes between 5 and 240),
  respec_free_allowance integer not null default 1 check (respec_free_allowance >= 0),
  respec_cost integer not null check (respec_cost >= 0),
  respec_refund_percent integer not null check (respec_refund_percent between 0 and 100),
  is_active boolean not null default false,
  published_at timestamptz not null default now()
);

create unique index olympus_settings_one_active_idx
on public.olympus_settings (is_active) where is_active;

alter table public.olympus_settings enable row level security;

create policy olympus_settings_read on public.olympus_settings
for select to authenticated using (is_active);

grant select on public.olympus_settings to authenticated;
revoke all on public.olympus_settings from anon;
revoke insert, update, delete on public.olympus_settings from authenticated;
grant all on public.olympus_settings to service_role;

insert into public.olympus_settings
  (version, daily_attempt_limit, battle_ttl_minutes, respec_free_allowance,
   respec_cost, respec_refund_percent, is_active)
values (1, 3, 45, 1, 60, 75, true);

-- 2. Identidad, reglas visibles y recompensas de cada leyenda pasan a ser datos administrables.
alter table public.olympus_opponents
  add column avatar_path text,
  add column intro_path text,
  add column victory_path text,
  add column defeat_path text,
  add column lore text,
  add column special_rules_json jsonb not null default '[]'::jsonb
    check (jsonb_typeof(special_rules_json) = 'array'),
  add column base_fragment_reward integer not null default 0 check (base_fragment_reward >= 0),
  add column first_victory_fragment_bonus integer not null default 0 check (first_victory_fragment_bonus >= 0),
  add column defeat_fragment_reward integer not null default 0 check (defeat_fragment_reward >= 0),
  add column sort_order integer not null default 0 check (sort_order >= 0);

-- 3. Las leyendas provisionales dan paso a Zeus, Loki y Hefes, que ya tienen arte versionado.
do $$
begin
  delete from public.olympus_opponents opponent
  where opponent.id in ('legendary-kernel', 'legendary-nexus')
    and not exists (select 1 from public.olympus_battles battle where battle.opponent_id = opponent.id);

  update public.olympus_opponents
  set is_active = false
  where id in ('legendary-kernel', 'legendary-nexus');
end;
$$;

insert into public.olympus_opponents
  (id, code, display_name, deck_template_id, ai_profile, combat_modifiers_json,
   reward_definition_id, avatar_path, intro_path, victory_path, defeat_path, lore,
   special_rules_json, base_fragment_reward, first_victory_fragment_bonus,
   defeat_fragment_reward, sort_order)
values
  ('zeus', 'ZEUS', 'Zeus', 'gokernel-ultra', 'MYTHIC',
    '{"startingLp":14000,"energyBonus":2}'::jsonb, 'olympus-v1-zeus',
    '/assets/combat/olympus/opponents/zeus/avatar.webp',
    '/assets/combat/olympus/opponents/zeus/intro.webp',
    '/assets/combat/olympus/opponents/zeus/victoria.webp',
    '/assets/combat/olympus/opponents/zeus/derrota.webp',
    'Custodio del núcleo. Nada se ejecuta en el Nexus sin que él lo permita.',
    '["Comienza con 14.000 LP","Energía máxima +2","Deck legendario a versión máxima"]'::jsonb,
    150, 400, 20, 10),
  ('loki', 'LOKI', 'Loki', 'apex-lockdown', 'MYTHIC',
    '{"startingLp":12000,"energyBonus":1}'::jsonb, 'olympus-v1-loki',
    '/assets/combat/olympus/opponents/loki/avatar.webp',
    '/assets/combat/olympus/opponents/loki/intro.webp',
    '/assets/combat/olympus/opponents/loki/victoria.webp',
    '/assets/combat/olympus/opponents/loki/derrota.webp',
    'Interrupción hecha persona. Juega con tus trampas antes que con las suyas.',
    '["Comienza con 12.000 LP","Energía máxima +1","Deck de control con trampas encadenadas"]'::jsonb,
    120, 300, 15, 20),
  ('hefes', 'HEFES', 'Hefes', 'sentinel-firewall', 'MYTHIC',
    '{"startingLp":13000,"energyBonus":1}'::jsonb, 'olympus-v1-hefes',
    '/assets/combat/olympus/opponents/hefes/avatar.webp',
    '/assets/combat/olympus/opponents/hefes/intro.webp',
    '/assets/combat/olympus/opponents/hefes/victoria.webp',
    '/assets/combat/olympus/opponents/hefes/derrota.webp',
    'La forja del firewall. Cada turno que sobrevive, su muro es más caro de romper.',
    '["Comienza con 13.000 LP","Energía máxima +1","Deck defensivo con refuerzo de DEF"]'::jsonb,
    130, 350, 18, 30)
on conflict (id) do update set
  code = excluded.code,
  display_name = excluded.display_name,
  deck_template_id = excluded.deck_template_id,
  combat_modifiers_json = excluded.combat_modifiers_json,
  reward_definition_id = excluded.reward_definition_id,
  avatar_path = excluded.avatar_path,
  intro_path = excluded.intro_path,
  victory_path = excluded.victory_path,
  defeat_path = excluded.defeat_path,
  lore = excluded.lore,
  special_rules_json = excluded.special_rules_json,
  base_fragment_reward = excluded.base_fragment_reward,
  first_victory_fragment_bonus = excluded.first_victory_fragment_bonus,
  defeat_fragment_reward = excluded.defeat_fragment_reward,
  sort_order = excluded.sort_order,
  is_active = true,
  version = public.olympus_opponents.version + 1;

delete from public.olympus_opponent_deck_entries where opponent_id in ('zeus', 'loki', 'hefes');

insert into public.olympus_opponent_deck_entries
  (opponent_id, zone, position, card_id, level, xp, version_tier, attack_bonus, defense_bonus)
select opponent.id, card.zone, card.sort_order, card.card_id, 30, 9800, 5,
  bonus.attack_bonus, bonus.defense_bonus
from public.olympus_opponents opponent
join public.arena_deck_variant_cards card on card.variant_id = opponent.deck_template_id
join (values
  ('zeus', 300, 200),
  ('loki', 200, 300),
  ('hefes', 250, 250)
) as bonus(opponent_id, attack_bonus, defense_bonus) on bonus.opponent_id = opponent.id;

-- 4. La escala base del campeón sube con su tier: el árbol mejora un deck ya competitivo, no uno vacío.
update public.olympus_champions
set base_scale_json = jsonb_build_object(
  'level', 12 + required_tier * 2,
  'versionTier', least(5, 1 + ceil(required_tier / 2.0)::integer),
  'startingLp', 8000
);

-- 5. La emisión toma el límite diario de la configuración activa y nombra el conflicto de batalla en curso.
create or replace function public.issue_olympus_battle(
  p_player_id uuid, p_battle_id uuid, p_champion_id text, p_opponent_id text,
  p_seed text, p_snapshot_hash text, p_snapshot_json jsonb, p_protocol_version integer,
  p_champion_snapshot_hash text, p_opponent_snapshot_hash text, p_expires_at timestamptz
)
returns public.olympus_battles
language plpgsql
set search_path = ''
as $$
declare
  usage_record public.olympus_daily_usage;
  issued_battle public.olympus_battles;
  configured_limit integer;
  utc_period date := (now() at time zone 'UTC')::date;
begin
  if not exists (
    select 1 from public.player_olympus_champion_unlocks
    where player_id = p_player_id and champion_id = p_champion_id
  ) then raise exception 'CHAMPION_NOT_UNLOCKED' using errcode = 'P0001'; end if;
  if not exists (
    select 1 from public.olympus_opponents
    where id = p_opponent_id and is_active
      and (available_from is null or available_from <= now())
      and (available_until is null or available_until > now())
  ) then raise exception 'OLYMPUS_OPPONENT_UNAVAILABLE' using errcode = 'P0001'; end if;
  if exists (
    select 1 from public.olympus_battles where player_id = p_player_id and status = 'ISSUED'
  ) then raise exception 'OLYMPUS_BATTLE_ALREADY_ISSUED' using errcode = 'P0001'; end if;

  select daily_attempt_limit into configured_limit from public.olympus_settings where is_active;
  if configured_limit is null then
    raise exception 'OLYMPUS_SETTINGS_NOT_ACTIVE' using errcode = 'P0001';
  end if;

  insert into public.olympus_daily_usage (player_id, period_key, daily_limit)
  values (p_player_id, utc_period, configured_limit)
  on conflict (player_id, period_key) do nothing;
  select * into usage_record from public.olympus_daily_usage
  where player_id = p_player_id and period_key = utc_period for update;
  if usage_record.attempts_used >= usage_record.daily_limit then
    raise exception 'OLYMPUS_DAILY_LIMIT_REACHED' using errcode = 'P0001';
  end if;
  update public.olympus_daily_usage set attempts_used = attempts_used + 1
  where player_id = p_player_id and period_key = utc_period
  returning * into usage_record;

  insert into public.combat_sessions
    (battle_id, player_id, mode, seed, snapshot_hash, snapshot_json, protocol_version, expires_at)
  values
    (p_battle_id, p_player_id, 'OLYMPUS', p_seed, p_snapshot_hash, p_snapshot_json, p_protocol_version, p_expires_at);
  insert into public.olympus_battles
    (battle_id, player_id, champion_id, opponent_id, champion_snapshot_hash,
     opponent_snapshot_hash, period_key, attempt_number)
  values
    (p_battle_id, p_player_id, p_champion_id, p_opponent_id, p_champion_snapshot_hash,
     p_opponent_snapshot_hash, utc_period, usage_record.attempts_used)
  returning * into issued_battle;
  return issued_battle;
end;
$$;

-- 6. El respec deja de ser gratis: la primera reasignación por campeón sí, las siguientes cuestan.
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

  select floor(coalesce(sum(fragment_cost), 0) * settings_record.respec_refund_percent / 100.0)::integer
  into refund
  from public.olympus_champion_upgrade_nodes where id = any(progress_record.unlocked_node_ids);
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
  set unlocked_node_ids = '{}', respec_count = respec_count + 1, version = version + 1
  where player_id = p_player_id and champion_id = p_champion_id;
  return new_balance;
end;
$$;

-- 7. Abandono e incompatibilidad: uno castiga, el otro devuelve el intento porque la culpa es nuestra.
create function public.forfeit_olympus_battle(p_player_id uuid, p_battle_id uuid)
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
  if locked_battle.status <> 'ISSUED' then return locked_battle; end if;

  update public.olympus_battles
  set outcome = 'LOSS', status = 'COMPLETED', completed_at = now(),
      reward_json = jsonb_build_object(
        'ascensionFragments', 0, 'definitionId', 'olympus-abandoned', 'firstVictory', false
      )
  where battle_id = p_battle_id returning * into locked_battle;
  update public.combat_sessions
  set status = 'EXPIRED' where battle_id = p_battle_id and status = 'ISSUED';
  return locked_battle;
end;
$$;

create function public.invalidate_olympus_battle(p_player_id uuid, p_battle_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  locked_battle public.olympus_battles;
begin
  select * into locked_battle from public.olympus_battles
  where battle_id = p_battle_id and player_id = p_player_id for update;
  if not found then raise exception 'OLYMPUS_BATTLE_NOT_FOUND' using errcode = 'P0001'; end if;
  if locked_battle.status <> 'ISSUED' then return; end if;

  delete from public.olympus_battles where battle_id = p_battle_id;
  update public.combat_sessions
  set status = 'EXPIRED' where battle_id = p_battle_id and status = 'ISSUED';
  -- El snapshot incompatible es deuda nuestra: se devuelve el intento consumido.
  update public.olympus_daily_usage
  set attempts_used = greatest(0, attempts_used - 1)
  where player_id = p_player_id and period_key = locked_battle.period_key;
end;
$$;

revoke all on function public.forfeit_olympus_battle(uuid, uuid) from public, anon, authenticated;
revoke all on function public.invalidate_olympus_battle(uuid, uuid) from public, anon, authenticated;
grant execute on function public.forfeit_olympus_battle(uuid, uuid) to service_role;
grant execute on function public.invalidate_olympus_battle(uuid, uuid) to service_role;

commit;
