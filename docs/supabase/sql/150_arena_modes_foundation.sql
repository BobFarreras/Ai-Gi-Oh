-- docs/supabase/sql/150_arena_modes_foundation.sql - Funda persistencia, RLS y mutaciones server-side para Supervivencia y Olimpo.
begin;

create table public.survival_rulesets (
  id uuid primary key default gen_random_uuid(),
  version integer not null unique check (version > 0),
  start_tier integer not null check (start_tier > 0),
  battles_per_tier integer not null check (battles_per_tier > 0),
  roster_json jsonb not null check (jsonb_typeof(roster_json) = 'array' and jsonb_array_length(roster_json) > 0),
  milestone_interval integer not null check (milestone_interval > 0),
  milestone_heal integer not null check (milestone_heal >= 0),
  is_active boolean not null default false,
  published_at timestamptz not null default now()
);

create unique index survival_rulesets_one_active_idx
on public.survival_rulesets (is_active) where is_active;

create table public.survival_scaling_stages (
  id uuid primary key default gen_random_uuid(),
  ruleset_id uuid not null references public.survival_rulesets(id) on delete cascade,
  from_battle integer not null check (from_battle > 0),
  ai_profile text not null check (ai_profile in ('HARD', 'BOSS', 'MASTER', 'MYTHIC')),
  card_scale_json jsonb not null default '{}'::jsonb check (jsonb_typeof(card_scale_json) = 'object'),
  ascension_modifiers_json jsonb not null default '{}'::jsonb check (jsonb_typeof(ascension_modifiers_json) = 'object'),
  reward_definition_id text not null,
  unique (ruleset_id, from_battle)
);

create table public.olympus_champions (
  id text primary key,
  arena_opponent_id text not null references public.arena_opponents(id),
  required_tier integer not null check (required_tier > 0),
  required_ladder_position integer not null check (required_ladder_position > 0),
  base_deck_variant_id text not null references public.arena_opponent_deck_variants(id),
  base_scale_json jsonb not null default '{}'::jsonb check (jsonb_typeof(base_scale_json) = 'object'),
  is_active boolean not null default true,
  version integer not null default 1 check (version > 0),
  unique (required_tier, required_ladder_position)
);

create table public.olympus_champion_upgrade_nodes (
  id text primary key,
  champion_id text not null references public.olympus_champions(id) on delete cascade,
  branch text not null check (branch in ('POWER', 'RESILIENCE', 'IDENTITY')),
  prerequisite_node_ids text[] not null default '{}',
  effect_json jsonb not null check (jsonb_typeof(effect_json) = 'object'),
  fragment_cost integer not null check (fragment_cost > 0),
  sort_order integer not null check (sort_order >= 0),
  is_active boolean not null default true,
  version integer not null default 1 check (version > 0),
  unique (champion_id, sort_order)
);

create table public.olympus_opponents (
  id text primary key,
  code text not null unique,
  display_name text not null,
  deck_template_id text not null references public.arena_opponent_deck_variants(id),
  ai_profile text not null check (ai_profile in ('MASTER', 'MYTHIC')),
  combat_modifiers_json jsonb not null default '{}'::jsonb check (jsonb_typeof(combat_modifiers_json) = 'object'),
  reward_definition_id text not null,
  available_from timestamptz,
  available_until timestamptz,
  is_active boolean not null default true,
  version integer not null default 1 check (version > 0),
  check (available_until is null or available_from is null or available_until > available_from)
);

create table public.olympus_opponent_deck_entries (
  id bigint generated always as identity primary key,
  opponent_id text not null references public.olympus_opponents(id) on delete cascade,
  zone text not null check (zone in ('DECK', 'FUSION')),
  position integer not null check (position > 0),
  card_id text not null,
  level integer not null check (level between 1 and 30),
  xp integer not null default 0 check (xp >= 0),
  version_tier integer not null check (version_tier between 1 and 5),
  attack_bonus integer not null default 0 check (attack_bonus >= 0),
  defense_bonus integer not null default 0 check (defense_bonus >= 0),
  unique (opponent_id, zone, position)
);

create table public.combat_sessions (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null unique,
  player_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('SURVIVAL', 'OLYMPUS')),
  seed text not null,
  snapshot_hash text not null check (length(snapshot_hash) between 32 and 128),
  snapshot_json jsonb not null check (jsonb_typeof(snapshot_json) = 'object'),
  protocol_version integer not null check (protocol_version > 0),
  status text not null default 'ISSUED' check (status in ('ISSUED', 'COMPLETED', 'EXPIRED')),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  completed_at timestamptz,
  check (expires_at > issued_at),
  check ((status = 'COMPLETED') = (completed_at is not null))
);

create table public.player_survival_runs (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'COMPLETED_DEFEAT', 'ABANDONED')),
  current_lp integer not null check (current_lp between 0 and max_lp),
  max_lp integer not null check (max_lp > 0),
  wins integer not null default 0 check (wins >= 0),
  current_battle_index integer not null default 0 check (current_battle_index >= 0),
  ruleset_version integer not null references public.survival_rulesets(version),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  version integer not null default 1 check (version > 0),
  check ((status = 'ACTIVE') = (completed_at is null))
);

create unique index player_survival_runs_one_active_idx
on public.player_survival_runs (player_id) where status = 'ACTIVE';

create table public.survival_battles (
  battle_id uuid primary key references public.combat_sessions(battle_id) on delete restrict,
  run_id uuid not null references public.player_survival_runs(id) on delete cascade,
  battle_index integer not null check (battle_index > 0),
  opponent_id text not null references public.arena_opponents(id),
  effective_tier integer not null check (effective_tier > 0),
  ascension_rank integer not null default 0 check (ascension_rank >= 0),
  starting_lp integer not null check (starting_lp > 0),
  ending_lp integer check (ending_lp >= 0),
  status text not null default 'ISSUED' check (status in ('ISSUED', 'COMPLETED', 'EXPIRED')),
  outcome text check (outcome in ('WIN', 'LOSS', 'DRAW')),
  milestone_heal integer not null default 0 check (milestone_heal >= 0),
  reward_json jsonb check (reward_json is null or jsonb_typeof(reward_json) = 'object'),
  completed_at timestamptz,
  unique (run_id, battle_index),
  check ((status = 'COMPLETED') = (completed_at is not null)),
  check ((status = 'COMPLETED') = (outcome is not null))
);

create unique index survival_battles_one_issued_idx
on public.survival_battles (run_id) where status = 'ISSUED';

create table public.combat_mode_wallets (
  player_id uuid primary key references auth.users(id) on delete cascade,
  ascension_fragments integer not null default 0 check (ascension_fragments >= 0),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0)
);

create table public.combat_mode_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  operation_id text not null,
  amount integer not null check (amount <> 0),
  reason text not null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  unique (player_id, operation_id)
);

create table public.player_olympus_champion_unlocks (
  player_id uuid not null references auth.users(id) on delete cascade,
  champion_id text not null references public.olympus_champions(id) on delete cascade,
  source_tier integer not null check (source_tier > 0),
  source_battle_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (player_id, champion_id)
);

create table public.player_olympus_champion_progress (
  player_id uuid not null references auth.users(id) on delete cascade,
  champion_id text not null references public.olympus_champions(id) on delete cascade,
  unlocked_node_ids text[] not null default '{}',
  respec_count integer not null default 0 check (respec_count >= 0),
  version integer not null default 1 check (version > 0),
  primary key (player_id, champion_id)
);

create table public.olympus_daily_usage (
  player_id uuid not null references auth.users(id) on delete cascade,
  period_key date not null,
  attempts_used integer not null default 0 check (attempts_used >= 0 and attempts_used <= daily_limit),
  daily_limit integer not null default 3 check (daily_limit between 1 and 10),
  primary key (player_id, period_key)
);

create table public.olympus_battles (
  battle_id uuid primary key references public.combat_sessions(battle_id) on delete restrict,
  player_id uuid not null references auth.users(id) on delete cascade,
  champion_id text not null references public.olympus_champions(id),
  opponent_id text not null references public.olympus_opponents(id),
  champion_snapshot_hash text not null,
  opponent_snapshot_hash text not null,
  period_key date not null,
  attempt_number integer not null check (attempt_number > 0),
  status text not null default 'ISSUED' check (status in ('ISSUED', 'COMPLETED', 'EXPIRED')),
  outcome text check (outcome in ('WIN', 'LOSS', 'DRAW')),
  reward_json jsonb check (reward_json is null or jsonb_typeof(reward_json) = 'object'),
  completed_at timestamptz,
  unique (player_id, period_key, attempt_number),
  check ((status = 'COMPLETED') = (completed_at is not null)),
  check ((status = 'COMPLETED') = (outcome is not null))
);

create unique index olympus_battles_one_issued_idx
on public.olympus_battles (player_id) where status = 'ISSUED';

create table public.olympus_first_victories (
  player_id uuid not null references auth.users(id) on delete cascade,
  opponent_id text not null references public.olympus_opponents(id) on delete cascade,
  battle_id uuid not null unique references public.olympus_battles(battle_id),
  claimed_at timestamptz not null default now(),
  primary key (player_id, opponent_id)
);

create index combat_sessions_player_status_idx on public.combat_sessions (player_id, status);
create index combat_sessions_expires_idx on public.combat_sessions (expires_at) where status = 'ISSUED';
create unique index combat_sessions_one_issued_per_mode_idx
on public.combat_sessions (player_id, mode) where status = 'ISSUED';
create index survival_battles_run_status_idx on public.survival_battles (run_id, status);
create index wallet_transactions_player_created_idx on public.combat_mode_wallet_transactions (player_id, created_at desc);
create index olympus_unlocks_player_idx on public.player_olympus_champion_unlocks (player_id);
create index olympus_progress_player_idx on public.player_olympus_champion_progress (player_id);
create index olympus_battles_player_status_idx on public.olympus_battles (player_id, status);

alter table public.survival_rulesets enable row level security;
alter table public.survival_scaling_stages enable row level security;
alter table public.olympus_champions enable row level security;
alter table public.olympus_champion_upgrade_nodes enable row level security;
alter table public.olympus_opponents enable row level security;
alter table public.olympus_opponent_deck_entries enable row level security;
alter table public.combat_sessions enable row level security;
alter table public.player_survival_runs enable row level security;
alter table public.survival_battles enable row level security;
alter table public.combat_mode_wallets enable row level security;
alter table public.combat_mode_wallet_transactions enable row level security;
alter table public.player_olympus_champion_unlocks enable row level security;
alter table public.player_olympus_champion_progress enable row level security;
alter table public.olympus_daily_usage enable row level security;
alter table public.olympus_battles enable row level security;
alter table public.olympus_first_victories enable row level security;

create policy survival_rulesets_read on public.survival_rulesets for select to authenticated using (is_active);
create policy survival_scaling_read on public.survival_scaling_stages for select to authenticated
using (exists (select 1 from public.survival_rulesets r where r.id = ruleset_id and r.is_active));
create policy olympus_champions_read on public.olympus_champions for select to authenticated using (is_active);
create policy olympus_nodes_read on public.olympus_champion_upgrade_nodes for select to authenticated using (is_active);
create policy olympus_opponents_read on public.olympus_opponents for select to authenticated
using (is_active and (available_from is null or available_from <= now()) and (available_until is null or available_until > now()));
create policy olympus_decks_read on public.olympus_opponent_deck_entries for select to authenticated
using (exists (select 1 from public.olympus_opponents o where o.id = opponent_id and o.is_active));

create policy combat_sessions_read_own on public.combat_sessions for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = player_id);
create policy survival_runs_read_own on public.player_survival_runs for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = player_id);
create policy survival_battles_read_own on public.survival_battles for select to authenticated
using (exists (select 1 from public.player_survival_runs r where r.id = run_id and r.player_id = (select auth.uid())));
create policy combat_wallets_read_own on public.combat_mode_wallets for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = player_id);
create policy combat_wallet_ledger_read_own on public.combat_mode_wallet_transactions for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = player_id);
create policy olympus_unlocks_read_own on public.player_olympus_champion_unlocks for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = player_id);
create policy olympus_progress_read_own on public.player_olympus_champion_progress for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = player_id);
create policy olympus_usage_read_own on public.olympus_daily_usage for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = player_id);
create policy olympus_battles_read_own on public.olympus_battles for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = player_id);
create policy olympus_first_victories_read_own on public.olympus_first_victories for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = player_id);

grant select on public.survival_rulesets, public.survival_scaling_stages,
  public.olympus_champions, public.olympus_champion_upgrade_nodes,
  public.olympus_opponents, public.olympus_opponent_deck_entries to authenticated;
grant select on public.combat_sessions, public.player_survival_runs, public.survival_battles,
  public.combat_mode_wallets, public.combat_mode_wallet_transactions,
  public.player_olympus_champion_unlocks, public.player_olympus_champion_progress,
  public.olympus_daily_usage, public.olympus_battles, public.olympus_first_victories to authenticated;
revoke all on public.survival_rulesets, public.survival_scaling_stages,
  public.olympus_champions, public.olympus_champion_upgrade_nodes,
  public.olympus_opponents, public.olympus_opponent_deck_entries,
  public.combat_sessions, public.player_survival_runs, public.survival_battles,
  public.combat_mode_wallets, public.combat_mode_wallet_transactions,
  public.player_olympus_champion_unlocks, public.player_olympus_champion_progress,
  public.olympus_daily_usage, public.olympus_battles, public.olympus_first_victories from anon;
revoke insert, update, delete on public.survival_rulesets, public.survival_scaling_stages,
  public.olympus_champions, public.olympus_champion_upgrade_nodes,
  public.olympus_opponents, public.olympus_opponent_deck_entries,
  public.combat_sessions, public.player_survival_runs, public.survival_battles,
  public.combat_mode_wallets, public.combat_mode_wallet_transactions,
  public.player_olympus_champion_unlocks, public.player_olympus_champion_progress,
  public.olympus_daily_usage, public.olympus_battles, public.olympus_first_victories from authenticated;
grant all on public.survival_rulesets, public.survival_scaling_stages,
  public.olympus_champions, public.olympus_champion_upgrade_nodes,
  public.olympus_opponents, public.olympus_opponent_deck_entries,
  public.combat_sessions, public.player_survival_runs, public.survival_battles,
  public.combat_mode_wallets, public.combat_mode_wallet_transactions,
  public.player_olympus_champion_unlocks, public.player_olympus_champion_progress,
  public.olympus_daily_usage, public.olympus_battles, public.olympus_first_victories to service_role;
grant usage, select on sequence public.olympus_opponent_deck_entries_id_seq to service_role;

create function public.start_survival_run(p_player_id uuid, p_max_lp integer, p_ruleset_version integer)
returns public.player_survival_runs
language plpgsql
set search_path = ''
as $$
declare
  created_run public.player_survival_runs;
begin
  if p_max_lp <= 0 then raise exception 'INVALID_MAX_LP' using errcode = '22023'; end if;
  if not exists (select 1 from public.survival_rulesets where version = p_ruleset_version and is_active) then
    raise exception 'RULESET_NOT_ACTIVE' using errcode = '22023';
  end if;
  insert into public.player_survival_runs (player_id, current_lp, max_lp, ruleset_version)
  values (p_player_id, p_max_lp, p_max_lp, p_ruleset_version)
  returning * into created_run;
  return created_run;
end;
$$;

create function public.abandon_survival_run(p_player_id uuid, p_run_id uuid)
returns public.player_survival_runs
language plpgsql
set search_path = ''
as $$
declare
  locked_run public.player_survival_runs;
begin
  select * into locked_run from public.player_survival_runs
  where id = p_run_id and player_id = p_player_id for update;
  if not found or locked_run.status <> 'ACTIVE' then
    raise exception 'SURVIVAL_RUN_NOT_ACTIVE' using errcode = 'P0001';
  end if;
  update public.player_survival_runs
  set status = 'ABANDONED', completed_at = now(), version = version + 1
  where id = p_run_id returning * into locked_run;
  return locked_run;
end;
$$;

create function public.issue_survival_battle(
  p_player_id uuid, p_run_id uuid, p_battle_id uuid, p_opponent_id text,
  p_effective_tier integer, p_ascension_rank integer, p_seed text,
  p_snapshot_hash text, p_snapshot_json jsonb, p_protocol_version integer, p_expires_at timestamptz
)
returns public.survival_battles
language plpgsql
set search_path = ''
as $$
declare
  locked_run public.player_survival_runs;
  issued_battle public.survival_battles;
  next_index integer;
begin
  select * into locked_run from public.player_survival_runs
  where id = p_run_id and player_id = p_player_id for update;
  if not found or locked_run.status <> 'ACTIVE' or locked_run.current_lp <= 0 then
    raise exception 'SURVIVAL_RUN_NOT_ACTIVE' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.survival_battles where run_id = p_run_id and status = 'ISSUED') then
    raise exception 'SURVIVAL_BATTLE_ALREADY_ISSUED' using errcode = 'P0001';
  end if;
  next_index := locked_run.current_battle_index + 1;
  insert into public.combat_sessions
    (battle_id, player_id, mode, seed, snapshot_hash, snapshot_json, protocol_version, expires_at)
  values
    (p_battle_id, p_player_id, 'SURVIVAL', p_seed, p_snapshot_hash, p_snapshot_json, p_protocol_version, p_expires_at);
  insert into public.survival_battles
    (battle_id, run_id, battle_index, opponent_id, effective_tier, ascension_rank, starting_lp)
  values
    (p_battle_id, p_run_id, next_index, p_opponent_id, p_effective_tier, p_ascension_rank, locked_run.current_lp)
  returning * into issued_battle;
  update public.player_survival_runs
  set current_battle_index = next_index, version = version + 1 where id = p_run_id;
  return issued_battle;
end;
$$;

create function public.credit_ascension_fragments(
  p_player_id uuid, p_operation_id text, p_amount integer, p_reason text, p_metadata jsonb default '{}'::jsonb
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  new_balance integer;
begin
  if p_amount <= 0 or btrim(p_operation_id) = '' or btrim(p_reason) = '' then
    raise exception 'INVALID_FRAGMENT_CREDIT' using errcode = '22023';
  end if;
  insert into public.combat_mode_wallets (player_id) values (p_player_id)
  on conflict (player_id) do nothing;
  perform 1 from public.combat_mode_wallets where player_id = p_player_id for update;
  insert into public.combat_mode_wallet_transactions (player_id, operation_id, amount, reason, metadata)
  values (p_player_id, p_operation_id, p_amount, p_reason, coalesce(p_metadata, '{}'::jsonb))
  on conflict (player_id, operation_id) do nothing;
  if found then
    update public.combat_mode_wallets
    set ascension_fragments = ascension_fragments + p_amount, updated_at = now(), version = version + 1
    where player_id = p_player_id returning ascension_fragments into new_balance;
  else
    select ascension_fragments into new_balance from public.combat_mode_wallets where player_id = p_player_id;
  end if;
  return new_balance;
end;
$$;

create function public.complete_survival_battle(
  p_player_id uuid, p_battle_id uuid, p_outcome text, p_ending_lp integer,
  p_reward_json jsonb, p_fragment_amount integer
)
returns public.player_survival_runs
language plpgsql
set search_path = ''
as $$
declare
  locked_battle public.survival_battles;
  locked_run public.player_survival_runs;
  interval_wins integer;
  heal_amount integer := 0;
  next_wins integer;
begin
  select battle.* into locked_battle
  from public.survival_battles battle
  join public.player_survival_runs run on run.id = battle.run_id
  where battle.battle_id = p_battle_id and run.player_id = p_player_id
  for update of battle;
  if not found then raise exception 'SURVIVAL_BATTLE_NOT_FOUND' using errcode = 'P0001'; end if;
  select * into locked_run from public.player_survival_runs where id = locked_battle.run_id for update;
  if locked_battle.status = 'COMPLETED' then return locked_run; end if;
  if locked_battle.status <> 'ISSUED' or locked_run.status <> 'ACTIVE' then
    raise exception 'SURVIVAL_BATTLE_NOT_ISSUED' using errcode = 'P0001';
  end if;
  if p_outcome not in ('WIN', 'LOSS', 'DRAW') or p_ending_lp < 0 or p_ending_lp > locked_run.max_lp then
    raise exception 'INVALID_SURVIVAL_RESULT' using errcode = '22023';
  end if;
  next_wins := locked_run.wins + case when p_outcome = 'WIN' then 1 else 0 end;
  select milestone_interval, milestone_heal into interval_wins, heal_amount
  from public.survival_rulesets where version = locked_run.ruleset_version;
  if p_outcome <> 'WIN' or next_wins % interval_wins <> 0 then heal_amount := 0; end if;
  update public.survival_battles
  set ending_lp = p_ending_lp, outcome = p_outcome, milestone_heal = heal_amount,
      reward_json = coalesce(p_reward_json, '{}'::jsonb), status = 'COMPLETED',
      completed_at = now()
  where battle_id = p_battle_id;
  update public.combat_sessions
  set status = 'COMPLETED', completed_at = now() where battle_id = p_battle_id and status = 'ISSUED';
  update public.player_survival_runs
  set wins = next_wins,
      current_lp = case when p_outcome = 'WIN' then least(max_lp, p_ending_lp + heal_amount) else 0 end,
      status = case when p_outcome = 'WIN' then 'ACTIVE' else 'COMPLETED_DEFEAT' end,
      completed_at = case when p_outcome = 'WIN' then null else now() end,
      version = version + 1
  where id = locked_run.id returning * into locked_run;
  if p_fragment_amount > 0 then
    perform public.credit_ascension_fragments(
      p_player_id, 'survival-battle:' || p_battle_id, p_fragment_amount, 'SURVIVAL_BATTLE', p_reward_json
    );
  end if;
  return locked_run;
end;
$$;

create function public.grant_champion_unlock_from_arena_win(
  p_player_id uuid, p_champion_id text, p_source_tier integer, p_source_battle_id text
)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  if not exists (
    select 1 from public.olympus_champions
    where id = p_champion_id and required_tier = p_source_tier and is_active
  ) then
    raise exception 'CHAMPION_TIER_MISMATCH' using errcode = '22023';
  end if;
  insert into public.player_olympus_champion_unlocks
    (player_id, champion_id, source_tier, source_battle_id)
  values (p_player_id, p_champion_id, p_source_tier, p_source_battle_id)
  on conflict (player_id, champion_id) do nothing;
  get diagnostics inserted_count = row_count;
  insert into public.player_olympus_champion_progress (player_id, champion_id)
  values (p_player_id, p_champion_id)
  on conflict (player_id, champion_id) do nothing;
  return inserted_count = 1;
end;
$$;

create function public.issue_olympus_battle(
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
  insert into public.olympus_daily_usage (player_id, period_key) values (p_player_id, utc_period)
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

create function public.complete_olympus_battle(
  p_player_id uuid, p_battle_id uuid, p_outcome text, p_reward_json jsonb, p_fragment_amount integer
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
  return locked_battle;
end;
$$;

create function public.purchase_champion_upgrade(
  p_player_id uuid, p_champion_id text, p_node_id text, p_operation_id text
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  node_record public.olympus_champion_upgrade_nodes;
  progress_record public.player_olympus_champion_progress;
  new_balance integer;
begin
  select * into node_record from public.olympus_champion_upgrade_nodes
  where id = p_node_id and champion_id = p_champion_id and is_active;
  if not found then raise exception 'UPGRADE_NODE_NOT_FOUND' using errcode = '22023'; end if;
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
  if p_node_id = any(progress_record.unlocked_node_ids) then
    select ascension_fragments into new_balance from public.combat_mode_wallets where player_id = p_player_id;
    return new_balance;
  end if;
  if not node_record.prerequisite_node_ids <@ progress_record.unlocked_node_ids then
    raise exception 'UPGRADE_PREREQUISITES_NOT_MET' using errcode = 'P0001';
  end if;
  update public.combat_mode_wallets
  set ascension_fragments = ascension_fragments - node_record.fragment_cost,
      updated_at = now(), version = version + 1
  where player_id = p_player_id and ascension_fragments >= node_record.fragment_cost
  returning ascension_fragments into new_balance;
  if not found then raise exception 'INSUFFICIENT_FRAGMENTS' using errcode = 'P0001'; end if;
  insert into public.combat_mode_wallet_transactions (player_id, operation_id, amount, reason, metadata)
  values (p_player_id, p_operation_id, -node_record.fragment_cost, 'CHAMPION_UPGRADE',
    jsonb_build_object('championId', p_champion_id, 'nodeId', p_node_id));
  update public.player_olympus_champion_progress
  set unlocked_node_ids = array_append(unlocked_node_ids, p_node_id), version = version + 1
  where player_id = p_player_id and champion_id = p_champion_id;
  return new_balance;
end;
$$;

create function public.respec_champion_upgrades(
  p_player_id uuid, p_champion_id text, p_operation_id text
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  progress_record public.player_olympus_champion_progress;
  refund integer;
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
  select * into progress_record from public.player_olympus_champion_progress
  where player_id = p_player_id and champion_id = p_champion_id for update;
  if not found then raise exception 'CHAMPION_NOT_UNLOCKED' using errcode = 'P0001'; end if;
  select floor(coalesce(sum(fragment_cost), 0) * 0.75)::integer into refund
  from public.olympus_champion_upgrade_nodes where id = any(progress_record.unlocked_node_ids);
  if refund <= 0 then raise exception 'NO_UPGRADES_TO_RESPEC' using errcode = 'P0001'; end if;
  perform public.credit_ascension_fragments(
    p_player_id, p_operation_id, refund, 'CHAMPION_RESPEC',
    jsonb_build_object('championId', p_champion_id, 'refundRate', 0.75)
  );
  update public.player_olympus_champion_progress
  set unlocked_node_ids = '{}', respec_count = respec_count + 1, version = version + 1
  where player_id = p_player_id and champion_id = p_champion_id;
  select ascension_fragments into new_balance
  from public.combat_mode_wallets where player_id = p_player_id;
  return new_balance;
end;
$$;

revoke all on function public.start_survival_run(uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.abandon_survival_run(uuid, uuid) from public, anon, authenticated;
revoke all on function public.issue_survival_battle(uuid, uuid, uuid, text, integer, integer, text, text, jsonb, integer, timestamptz) from public, anon, authenticated;
revoke all on function public.credit_ascension_fragments(uuid, text, integer, text, jsonb) from public, anon, authenticated;
revoke all on function public.complete_survival_battle(uuid, uuid, text, integer, jsonb, integer) from public, anon, authenticated;
revoke all on function public.grant_champion_unlock_from_arena_win(uuid, text, integer, text) from public, anon, authenticated;
revoke all on function public.issue_olympus_battle(uuid, uuid, text, text, text, text, jsonb, integer, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.complete_olympus_battle(uuid, uuid, text, jsonb, integer) from public, anon, authenticated;
revoke all on function public.purchase_champion_upgrade(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.respec_champion_upgrades(uuid, text, text) from public, anon, authenticated;
grant execute on function public.start_survival_run(uuid, integer, integer) to service_role;
grant execute on function public.abandon_survival_run(uuid, uuid) to service_role;
grant execute on function public.issue_survival_battle(uuid, uuid, uuid, text, integer, integer, text, text, jsonb, integer, timestamptz) to service_role;
grant execute on function public.credit_ascension_fragments(uuid, text, integer, text, jsonb) to service_role;
grant execute on function public.complete_survival_battle(uuid, uuid, text, integer, jsonb, integer) to service_role;
grant execute on function public.grant_champion_unlock_from_arena_win(uuid, text, integer, text) to service_role;
grant execute on function public.issue_olympus_battle(uuid, uuid, text, text, text, text, jsonb, integer, text, text, timestamptz) to service_role;
grant execute on function public.complete_olympus_battle(uuid, uuid, text, jsonb, integer) to service_role;
grant execute on function public.purchase_champion_upgrade(uuid, text, text, text) to service_role;
grant execute on function public.respec_champion_upgrades(uuid, text, text) to service_role;

insert into public.survival_rulesets
  (version, start_tier, battles_per_tier, roster_json, milestone_interval, milestone_heal, is_active)
values (
  1, 4, 2,
  '["training-tier-1","training-tier-2","training-tier-3","training-tier-4","training-tier-5","training-tier-6","training-soldado-laptop","training-gokernel"]',
  5, 2000, true
);

insert into public.survival_scaling_stages
  (ruleset_id, from_battle, ai_profile, card_scale_json, ascension_modifiers_json, reward_definition_id)
select id, stage.from_battle, stage.ai_profile, stage.card_scale, stage.ascension, stage.reward_id
from public.survival_rulesets
cross join (values
  (1, 'HARD', '{"maxTier":5}'::jsonb, '{"maxLpBonus":0}'::jsonb, 'survival-v1-base'),
  (5, 'BOSS', '{"maxTier":8}'::jsonb, '{"maxLpBonus":1000}'::jsonb, 'survival-v1-boss'),
  (11, 'MYTHIC', '{"maxTier":8}'::jsonb, '{"maxLpBonus":2000}'::jsonb, 'survival-v1-ascension')
) as stage(from_battle, ai_profile, card_scale, ascension, reward_id)
where version = 1;

insert into public.olympus_champions
  (id, arena_opponent_id, required_tier, required_ladder_position, base_deck_variant_id)
values
  ('gennvim', 'training-tier-1', 1, 1, 'starter-tools'),
  ('helena', 'training-tier-2', 2, 2, 'framework-burst'),
  ('jaku', 'training-tier-3', 3, 3, 'fusion-pressure'),
  ('biglog', 'training-tier-4', 4, 4, 'biglog-offense'),
  ('soldado', 'training-tier-5', 5, 5, 'sentinel-apex'),
  ('guill', 'training-tier-6', 6, 6, 'apex-annihilation'),
  ('soldado-laptop', 'training-soldado-laptop', 7, 7, 'sentinel-firewall'),
  ('gokernel', 'training-gokernel', 8, 8, 'gokernel-overdrive');

insert into public.olympus_champion_upgrade_nodes
  (id, champion_id, branch, prerequisite_node_ids, effect_json, fragment_cost, sort_order)
select champion.id || '-power-1', champion.id, 'POWER', '{}'::text[],
  '{"kind":"GLOBAL_LEVEL","amount":5,"cap":30}'::jsonb, 40, 10
from public.olympus_champions champion
union all
select champion.id || '-resilience-1', champion.id, 'RESILIENCE', '{}'::text[],
  '{"kind":"STARTING_LP","amount":500,"cap":12000}'::jsonb, 40, 20
from public.olympus_champions champion
union all
select champion.id || '-identity-1', champion.id, 'IDENTITY', '{}'::text[],
  jsonb_build_object('kind', 'SIGNATURE_CARD_LEVEL', 'amount', 5, 'cap', 30), 60, 30
from public.olympus_champions champion;

insert into public.olympus_opponents
  (id, code, display_name, deck_template_id, ai_profile, combat_modifiers_json, reward_definition_id)
values
  ('legendary-kernel', 'LEGENDARY_KERNEL', 'Kernel Primigenio', 'gokernel-ultra', 'MYTHIC',
    '{"startingLp":12000,"startingEnergy":5}', 'olympus-v1-kernel'),
  ('legendary-nexus', 'LEGENDARY_NEXUS', 'Nexo Eterno', 'apex-lockdown', 'MYTHIC',
    '{"startingLp":14000,"startingEnergy":5}', 'olympus-v1-nexus');

insert into public.olympus_opponent_deck_entries
  (opponent_id, zone, position, card_id, level, xp, version_tier)
select opponent.id, card.zone, card.sort_order, card.card_id,
  coalesce(card.level, 30), coalesce(card.xp, 9800), coalesce(card.version_tier, 5)
from public.olympus_opponents opponent
join public.arena_deck_variant_cards card on card.variant_id = opponent.deck_template_id;

-- La reconstrucción es conservadora: solo acredita al rival N cuando tier_stats confirma N victorias en su tier.
insert into public.player_olympus_champion_unlocks
  (player_id, champion_id, source_tier, source_battle_id)
select progress.player_id, champion.id, champion.required_tier, 'historical-tier-' || champion.required_tier
from public.player_training_progress progress
join public.olympus_champions champion on champion.is_active
where exists (
  select 1
  from jsonb_array_elements(
    case when jsonb_typeof(progress.tier_stats) = 'array' then progress.tier_stats else '[]'::jsonb end
  ) stat
  where stat ->> 'tier' ~ '^[0-9]+$'
    and stat ->> 'wins' ~ '^[0-9]+$'
    and (stat ->> 'tier')::integer = champion.required_tier
    and (stat ->> 'wins')::integer >= champion.required_ladder_position
)
on conflict (player_id, champion_id) do nothing;

insert into public.player_olympus_champion_progress (player_id, champion_id)
select player_id, champion_id from public.player_olympus_champion_unlocks
on conflict (player_id, champion_id) do nothing;

commit;
