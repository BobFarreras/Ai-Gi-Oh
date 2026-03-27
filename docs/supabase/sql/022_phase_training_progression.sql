-- docs/supabase/sql/022_phase_training_progression.sql - Añade progreso e idempotencia del modo entrenamiento con políticas RLS.
create table if not exists public.player_training_progress (
  player_id uuid primary key references auth.users(id) on delete cascade,
  highest_unlocked_tier integer not null default 1 check (highest_unlocked_tier >= 1),
  total_wins integer not null default 0 check (total_wins >= 0),
  total_matches integer not null default 0 check (total_matches >= 0),
  tier_stats jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.player_training_match_claims (
  player_id uuid not null references auth.users(id) on delete cascade,
  battle_id text not null,
  tier integer not null check (tier >= 1),
  created_at timestamptz not null default now(),
  primary key (player_id, battle_id)
);

create index if not exists idx_player_training_match_claims_player_created
on public.player_training_match_claims (player_id, created_at desc);

drop trigger if exists player_training_progress_set_updated_at on public.player_training_progress;
create trigger player_training_progress_set_updated_at
before update on public.player_training_progress
for each row execute function public.set_updated_at();

alter table public.player_training_progress enable row level security;
alter table public.player_training_match_claims enable row level security;

drop policy if exists "player_training_progress_select_own" on public.player_training_progress;
create policy "player_training_progress_select_own"
on public.player_training_progress
for select to authenticated
using (auth.uid() = player_id);

drop policy if exists "player_training_progress_insert_own" on public.player_training_progress;
create policy "player_training_progress_insert_own"
on public.player_training_progress
for insert to authenticated
with check (auth.uid() = player_id);

drop policy if exists "player_training_progress_update_own" on public.player_training_progress;
create policy "player_training_progress_update_own"
on public.player_training_progress
for update to authenticated
using (auth.uid() = player_id)
with check (auth.uid() = player_id);

drop policy if exists "player_training_match_claims_select_own" on public.player_training_match_claims;
create policy "player_training_match_claims_select_own"
on public.player_training_match_claims
for select to authenticated
using (auth.uid() = player_id);

drop policy if exists "player_training_match_claims_insert_own" on public.player_training_match_claims;
create policy "player_training_match_claims_insert_own"
on public.player_training_match_claims
for insert to authenticated
with check (auth.uid() = player_id);
