-- docs/supabase/sql/002_phase_3_market_home_persistence.sql - Crea persistencia de wallet, colección, deck y transacciones con RLS.
create table if not exists public.player_wallets (
  player_id uuid primary key references auth.users(id) on delete cascade,
  nexus integer not null default 1000 check (nexus >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_collection_cards (
  player_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null,
  owned_copies integer not null default 0 check (owned_copies >= 0),
  updated_at timestamptz not null default now(),
  primary key (player_id, card_id)
);

create table if not exists public.player_deck_slots (
  player_id uuid not null references auth.users(id) on delete cascade,
  slot_index integer not null check (slot_index >= 0 and slot_index < 20),
  card_id text null,
  updated_at timestamptz not null default now(),
  primary key (player_id, slot_index)
);

create table if not exists public.market_transactions (
  id text primary key,
  player_id uuid not null references auth.users(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('BUY_CARD', 'BUY_PACK')),
  amount_nexus integer not null check (amount_nexus >= 0),
  purchased_item_id text not null,
  purchased_card_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_market_transactions_player_created_at
  on public.market_transactions (player_id, created_at desc);

drop trigger if exists player_wallets_set_updated_at on public.player_wallets;
create trigger player_wallets_set_updated_at
before update on public.player_wallets
for each row execute function public.set_updated_at();

drop trigger if exists player_collection_cards_set_updated_at on public.player_collection_cards;
create trigger player_collection_cards_set_updated_at
before update on public.player_collection_cards
for each row execute function public.set_updated_at();

drop trigger if exists player_deck_slots_set_updated_at on public.player_deck_slots;
create trigger player_deck_slots_set_updated_at
before update on public.player_deck_slots
for each row execute function public.set_updated_at();

alter table public.player_wallets enable row level security;
alter table public.player_collection_cards enable row level security;
alter table public.player_deck_slots enable row level security;
alter table public.market_transactions enable row level security;

drop policy if exists "player_wallets_select_own" on public.player_wallets;
create policy "player_wallets_select_own" on public.player_wallets
for select to authenticated
using (auth.uid() = player_id);

drop policy if exists "player_wallets_insert_own" on public.player_wallets;
create policy "player_wallets_insert_own" on public.player_wallets
for insert to authenticated
with check (auth.uid() = player_id);

drop policy if exists "player_wallets_update_own" on public.player_wallets;
create policy "player_wallets_update_own" on public.player_wallets
for update to authenticated
using (auth.uid() = player_id)
with check (auth.uid() = player_id);

drop policy if exists "player_collection_cards_select_own" on public.player_collection_cards;
create policy "player_collection_cards_select_own" on public.player_collection_cards
for select to authenticated
using (auth.uid() = player_id);

drop policy if exists "player_collection_cards_insert_own" on public.player_collection_cards;
create policy "player_collection_cards_insert_own" on public.player_collection_cards
for insert to authenticated
with check (auth.uid() = player_id);

drop policy if exists "player_collection_cards_update_own" on public.player_collection_cards;
create policy "player_collection_cards_update_own" on public.player_collection_cards
for update to authenticated
using (auth.uid() = player_id)
with check (auth.uid() = player_id);

drop policy if exists "player_deck_slots_select_own" on public.player_deck_slots;
create policy "player_deck_slots_select_own" on public.player_deck_slots
for select to authenticated
using (auth.uid() = player_id);

drop policy if exists "player_deck_slots_insert_own" on public.player_deck_slots;
create policy "player_deck_slots_insert_own" on public.player_deck_slots
for insert to authenticated
with check (auth.uid() = player_id);

drop policy if exists "player_deck_slots_update_own" on public.player_deck_slots;
create policy "player_deck_slots_update_own" on public.player_deck_slots
for update to authenticated
using (auth.uid() = player_id)
with check (auth.uid() = player_id);

drop policy if exists "market_transactions_select_own" on public.market_transactions;
create policy "market_transactions_select_own" on public.market_transactions
for select to authenticated
using (auth.uid() = player_id);

drop policy if exists "market_transactions_insert_own" on public.market_transactions;
create policy "market_transactions_insert_own" on public.market_transactions
for insert to authenticated
with check (auth.uid() = player_id);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  computed_nickname text;
begin
  computed_nickname := split_part(coalesce(new.email, 'operador@aigi.local'), '@', 1);
  if computed_nickname is null or char_length(trim(computed_nickname)) < 3 then
    computed_nickname := 'Operador';
  end if;

  insert into public.player_profiles (player_id, nickname)
  values (new.id, left(trim(computed_nickname), 24))
  on conflict (player_id) do nothing;

  insert into public.player_progress (player_id)
  values (new.id)
  on conflict (player_id) do nothing;

  insert into public.player_wallets (player_id, nexus)
  values (new.id, 1000)
  on conflict (player_id) do nothing;

  insert into public.player_deck_slots (player_id, slot_index, card_id)
  select new.id, slot_index, null
  from generate_series(0, 19) as slot_index
  on conflict (player_id, slot_index) do nothing;

  return new;
end;
$$;
