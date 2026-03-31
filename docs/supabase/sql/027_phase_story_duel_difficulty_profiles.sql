-- docs/supabase/sql/027_phase_story_duel_difficulty_profiles.sql - Añade configuración de dificultad y overrides de mazo por duelo Story sin progresión dinámica por repetición.
begin;

create table if not exists public.story_duel_ai_profiles (
  duel_id text primary key references public.story_duels(id) on delete cascade,
  difficulty text not null check (difficulty in ('ROOKIE', 'STANDARD', 'ELITE', 'BOSS', 'MYTHIC')),
  ai_profile jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.story_duel_deck_overrides (
  duel_id text not null references public.story_duels(id) on delete cascade,
  slot_index integer not null check (slot_index >= 0 and slot_index < 60),
  card_id text not null references public.cards_catalog(id) on delete restrict,
  copies integer not null default 1 check (copies > 0 and copies <= 3),
  version_tier integer not null default 0 check (version_tier >= 0 and version_tier <= 5),
  level integer not null default 0 check (level >= 0 and level <= 30),
  xp integer not null default 0 check (xp >= 0),
  attack_override integer null check (attack_override is null or attack_override >= 0),
  defense_override integer null check (defense_override is null or defense_override >= 0),
  effect_override jsonb null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (duel_id, slot_index)
);

create index if not exists idx_story_duel_ai_profiles_active on public.story_duel_ai_profiles (is_active);
create index if not exists idx_story_duel_deck_overrides_duel on public.story_duel_deck_overrides (duel_id);
create index if not exists idx_story_duel_deck_overrides_card on public.story_duel_deck_overrides (card_id);
create index if not exists idx_story_duel_deck_overrides_active on public.story_duel_deck_overrides (is_active);

drop trigger if exists story_duel_ai_profiles_set_updated_at on public.story_duel_ai_profiles;
create trigger story_duel_ai_profiles_set_updated_at
before update on public.story_duel_ai_profiles
for each row execute function public.set_updated_at();

drop trigger if exists story_duel_deck_overrides_set_updated_at on public.story_duel_deck_overrides;
create trigger story_duel_deck_overrides_set_updated_at
before update on public.story_duel_deck_overrides
for each row execute function public.set_updated_at();

alter table public.story_duel_ai_profiles enable row level security;
alter table public.story_duel_deck_overrides enable row level security;

drop policy if exists "story_duel_ai_profiles_select_public" on public.story_duel_ai_profiles;
create policy "story_duel_ai_profiles_select_public"
on public.story_duel_ai_profiles
for select
to authenticated
using (is_active = true);

drop policy if exists "story_duel_deck_overrides_select_public" on public.story_duel_deck_overrides;
create policy "story_duel_deck_overrides_select_public"
on public.story_duel_deck_overrides
for select
to authenticated
using (is_active = true);

grant select on public.story_duel_ai_profiles to authenticated;
grant all on public.story_duel_ai_profiles to service_role;
grant select on public.story_duel_deck_overrides to authenticated;
grant all on public.story_duel_deck_overrides to service_role;

insert into public.story_duel_ai_profiles (duel_id, difficulty, ai_profile, is_active)
select
  duel.id as duel_id,
  opponent.difficulty as difficulty,
  opponent.ai_profile as ai_profile,
  true as is_active
from public.story_duels duel
join public.story_opponents opponent on opponent.id = duel.opponent_id
where duel.is_active = true
on conflict (duel_id) do update set
  difficulty = excluded.difficulty,
  ai_profile = excluded.ai_profile,
  is_active = excluded.is_active;

commit;

