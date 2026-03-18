-- docs/supabase/sql/023_phase_tutorial_node_progress_and_reward.sql - Añade progreso de nodos tutorial y claim idempotente de recompensa final.
create table if not exists public.player_tutorial_node_progress (
  player_id uuid not null references auth.users(id) on delete cascade,
  node_id text not null,
  completed_at timestamptz not null default now(),
  primary key (player_id, node_id)
);

create table if not exists public.player_tutorial_reward_claims (
  player_id uuid primary key references auth.users(id) on delete cascade,
  reward_kind text not null check (reward_kind in ('NEXUS')),
  reward_nexus integer not null check (reward_nexus > 0),
  claimed_at timestamptz not null default now()
);

create index if not exists idx_player_tutorial_nodes_player_completed
on public.player_tutorial_node_progress (player_id, completed_at desc);

alter table public.player_tutorial_node_progress enable row level security;
alter table public.player_tutorial_reward_claims enable row level security;

drop policy if exists "player_tutorial_node_progress_select_own" on public.player_tutorial_node_progress;
create policy "player_tutorial_node_progress_select_own"
on public.player_tutorial_node_progress
for select to authenticated
using (auth.uid() = player_id);

drop policy if exists "player_tutorial_node_progress_insert_own" on public.player_tutorial_node_progress;
create policy "player_tutorial_node_progress_insert_own"
on public.player_tutorial_node_progress
for insert to authenticated
with check (auth.uid() = player_id);

drop policy if exists "player_tutorial_node_progress_update_own" on public.player_tutorial_node_progress;
create policy "player_tutorial_node_progress_update_own"
on public.player_tutorial_node_progress
for update to authenticated
using (auth.uid() = player_id)
with check (auth.uid() = player_id);

drop policy if exists "player_tutorial_reward_claims_select_own" on public.player_tutorial_reward_claims;
create policy "player_tutorial_reward_claims_select_own"
on public.player_tutorial_reward_claims
for select to authenticated
using (auth.uid() = player_id);

drop policy if exists "player_tutorial_reward_claims_insert_own" on public.player_tutorial_reward_claims;
create policy "player_tutorial_reward_claims_insert_own"
on public.player_tutorial_reward_claims
for insert to authenticated
with check (auth.uid() = player_id);
