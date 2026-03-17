-- docs/supabase/sql/013_phase_8_story_world_history.sql - Añade estado de nodo actual e historial Story persistido por jugador.
create table if not exists public.player_story_world_state (
  player_id uuid primary key references auth.users(id) on delete cascade,
  current_node_id text null references public.story_duels(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.player_story_history_events (
  event_id text primary key,
  player_id uuid not null references auth.users(id) on delete cascade,
  node_id text not null references public.story_duels(id) on delete cascade,
  kind text not null check (kind in ('MOVE', 'NODE_RESOLVED', 'REWARD_GRANTED')),
  details text not null default '',
  created_at timestamptz not null,
  inserted_at timestamptz not null default now()
);

create index if not exists idx_player_story_history_events_player_created_at
  on public.player_story_history_events (player_id, created_at desc);

drop trigger if exists player_story_world_state_set_updated_at on public.player_story_world_state;
create trigger player_story_world_state_set_updated_at
before update on public.player_story_world_state
for each row execute function public.set_updated_at();

alter table public.player_story_world_state enable row level security;
alter table public.player_story_history_events enable row level security;

drop policy if exists "player_story_world_state_select_own" on public.player_story_world_state;
create policy "player_story_world_state_select_own"
on public.player_story_world_state
for select
to authenticated
using (auth.uid() = player_id);

drop policy if exists "player_story_world_state_insert_own" on public.player_story_world_state;
create policy "player_story_world_state_insert_own"
on public.player_story_world_state
for insert
to authenticated
with check (auth.uid() = player_id);

drop policy if exists "player_story_world_state_update_own" on public.player_story_world_state;
create policy "player_story_world_state_update_own"
on public.player_story_world_state
for update
to authenticated
using (auth.uid() = player_id)
with check (auth.uid() = player_id);

drop policy if exists "player_story_history_events_select_own" on public.player_story_history_events;
create policy "player_story_history_events_select_own"
on public.player_story_history_events
for select
to authenticated
using (auth.uid() = player_id);

drop policy if exists "player_story_history_events_insert_own" on public.player_story_history_events;
create policy "player_story_history_events_insert_own"
on public.player_story_history_events
for insert
to authenticated
with check (auth.uid() = player_id);
