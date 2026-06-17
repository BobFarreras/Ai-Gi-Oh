-- docs/supabase/sql/045_phase_multiplayer_infrastructure.sql - Infraestructura de base de datos para el modo multijugador: sesiones de partida, log de acciones e invitaciones.

-- ─────────────────────────────────────────────
-- SESIONES DE PARTIDA
-- ─────────────────────────────────────────────
create table public.match_sessions (
  id                uuid primary key default gen_random_uuid(),
  player_a_id       uuid not null references auth.users(id) on delete cascade,
  player_b_id       uuid not null references auth.users(id) on delete cascade,
  status            text not null default 'WAITING'
                    check (status in ('WAITING', 'ACTIVE', 'FINISHED', 'ABANDONED')),
  winner_id         uuid references auth.users(id),
  deck_a_ids        text[] not null default '{}',
  deck_b_ids        text[] not null default '{}',
  started_at        timestamptz,
  finished_at       timestamptz,
  created_at        timestamptz not null default now()
);

alter table public.match_sessions enable row level security;

create policy "match_sessions_select_participants" on public.match_sessions
  for select using (auth.uid() = player_a_id or auth.uid() = player_b_id);

create policy "match_sessions_insert_as_player_a" on public.match_sessions
  for insert with check (auth.uid() = player_a_id);

create policy "match_sessions_update_participants" on public.match_sessions
  for update using (auth.uid() = player_a_id or auth.uid() = player_b_id);

-- ─────────────────────────────────────────────
-- LOG INMUTABLE DE ACCIONES
-- ─────────────────────────────────────────────
create table public.match_actions (
  id          bigint generated always as identity primary key,
  match_id    uuid not null references public.match_sessions(id) on delete cascade,
  player_id   uuid not null references auth.users(id),
  sequence    int not null,
  action_type text not null,
  payload     jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  unique (match_id, sequence)
);

alter table public.match_actions enable row level security;

create policy "match_actions_select_participants" on public.match_actions
  for select using (
    exists (
      select 1 from public.match_sessions ms
      where ms.id = match_id
        and (ms.player_a_id = auth.uid() or ms.player_b_id = auth.uid())
    )
  );

create policy "match_actions_insert_own" on public.match_actions
  for insert with check (
    auth.uid() = player_id
    and exists (
      select 1 from public.match_sessions ms
      where ms.id = match_id
        and (ms.player_a_id = auth.uid() or ms.player_b_id = auth.uid())
        and ms.status = 'ACTIVE'
    )
  );

-- ─────────────────────────────────────────────
-- INVITACIONES
-- ─────────────────────────────────────────────
create table public.player_invitations (
  id          uuid primary key default gen_random_uuid(),
  from_id     uuid not null references auth.users(id) on delete cascade,
  to_id       uuid not null references auth.users(id) on delete cascade,
  status      text not null default 'PENDING'
              check (status in ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED')),
  match_id    uuid references public.match_sessions(id),
  deck_ids    text[] not null default '{}',
  expires_at  timestamptz not null default (now() + interval '2 minutes'),
  created_at  timestamptz not null default now()
);

alter table public.player_invitations enable row level security;

create policy "invitations_select_own" on public.player_invitations
  for select using (auth.uid() = from_id or auth.uid() = to_id);

create policy "invitations_insert_from_self" on public.player_invitations
  for insert with check (auth.uid() = from_id);

create policy "invitations_update_to" on public.player_invitations
  for update using (auth.uid() = to_id or auth.uid() = from_id);

-- ─────────────────────────────────────────────
-- REALTIME: habilitar retransmisión de cambios
-- ─────────────────────────────────────────────
alter table public.match_sessions replica identity full;
alter table public.match_actions replica identity full;
alter table public.player_invitations replica identity full;

alter publication supabase_realtime add table public.match_sessions;
alter publication supabase_realtime add table public.match_actions;
alter publication supabase_realtime add table public.player_invitations;
