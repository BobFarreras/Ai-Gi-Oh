-- docs/supabase/sql/007_phase_7_5_1_battle_exp_idempotency.sql - Añade idempotencia por batalla para evitar aplicar EXP duplicada.
create table if not exists public.player_card_xp_batches (
  player_id uuid not null references auth.users(id) on delete cascade,
  battle_id text not null check (char_length(trim(battle_id)) > 0),
  events_count integer not null default 0 check (events_count >= 0),
  created_at timestamptz not null default now(),
  primary key (player_id, battle_id)
);

create index if not exists idx_player_card_xp_batches_player on public.player_card_xp_batches (player_id);

alter table public.player_card_xp_batches enable row level security;

drop policy if exists "player_card_xp_batches_select_own" on public.player_card_xp_batches;
create policy "player_card_xp_batches_select_own"
on public.player_card_xp_batches
for select
to authenticated
using (auth.uid() = player_id);

drop policy if exists "player_card_xp_batches_insert_own" on public.player_card_xp_batches;
create policy "player_card_xp_batches_insert_own"
on public.player_card_xp_batches
for insert
to authenticated
with check (auth.uid() = player_id);

