-- docs/supabase/sql/001_phase_2_player_profile_progress.sql - Crea tablas de perfil/progreso y políticas RLS para fase 2.
create extension if not exists pgcrypto;

create table if not exists public.player_profiles (
  player_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(trim(nickname)) between 3 and 24),
  avatar_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_progress (
  player_id uuid primary key references auth.users(id) on delete cascade,
  has_completed_tutorial boolean not null default false,
  medals integer not null default 0 check (medals >= 0),
  story_chapter integer not null default 1 check (story_chapter >= 1),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists player_profiles_set_updated_at on public.player_profiles;
create trigger player_profiles_set_updated_at
before update on public.player_profiles
for each row execute function public.set_updated_at();

drop trigger if exists player_progress_set_updated_at on public.player_progress;
create trigger player_progress_set_updated_at
before update on public.player_progress
for each row execute function public.set_updated_at();

alter table public.player_profiles enable row level security;
alter table public.player_progress enable row level security;

drop policy if exists "player_profiles_select_own" on public.player_profiles;
create policy "player_profiles_select_own"
on public.player_profiles
for select
to authenticated
using (auth.uid() = player_id);

drop policy if exists "player_profiles_insert_own" on public.player_profiles;
create policy "player_profiles_insert_own"
on public.player_profiles
for insert
to authenticated
with check (auth.uid() = player_id);

drop policy if exists "player_profiles_update_own" on public.player_profiles;
create policy "player_profiles_update_own"
on public.player_profiles
for update
to authenticated
using (auth.uid() = player_id)
with check (auth.uid() = player_id);

drop policy if exists "player_progress_select_own" on public.player_progress;
create policy "player_progress_select_own"
on public.player_progress
for select
to authenticated
using (auth.uid() = player_id);

drop policy if exists "player_progress_insert_own" on public.player_progress;
create policy "player_progress_insert_own"
on public.player_progress
for insert
to authenticated
with check (auth.uid() = player_id);

drop policy if exists "player_progress_update_own" on public.player_progress;
create policy "player_progress_update_own"
on public.player_progress
for update
to authenticated
using (auth.uid() = player_id)
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

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();
