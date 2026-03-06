-- docs/supabase/sql/006_phase_6_1_card_progression_foundation.sql - Crea base persistente de progresión de cartas (versiones, niveles y pasivas de mastery).
create table if not exists public.card_passive_skills (
  id text primary key,
  name text not null,
  description text not null,
  effect jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.card_mastery_passive_map (
  card_id text not null references public.cards_catalog(id) on delete cascade,
  passive_skill_id text not null references public.card_passive_skills(id) on delete restrict,
  priority integer not null default 1 check (priority > 0),
  updated_at timestamptz not null default now(),
  primary key (card_id, passive_skill_id)
);

create table if not exists public.player_card_progress (
  player_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null references public.cards_catalog(id) on delete cascade,
  version_tier integer not null default 0 check (version_tier >= 0 and version_tier <= 5),
  level integer not null default 0 check (level >= 0 and level <= 30),
  xp integer not null default 0 check (xp >= 0),
  mastery_passive_skill_id text null references public.card_passive_skills(id) on delete restrict,
  updated_at timestamptz not null default now(),
  primary key (player_id, card_id),
  check (version_tier < 5 or mastery_passive_skill_id is not null)
);

create index if not exists idx_card_mastery_passive_map_card on public.card_mastery_passive_map (card_id);
create index if not exists idx_player_card_progress_player on public.player_card_progress (player_id);
create index if not exists idx_player_card_progress_card on public.player_card_progress (card_id);

drop trigger if exists card_passive_skills_set_updated_at on public.card_passive_skills;
create trigger card_passive_skills_set_updated_at
before update on public.card_passive_skills
for each row execute function public.set_updated_at();

drop trigger if exists card_mastery_passive_map_set_updated_at on public.card_mastery_passive_map;
create trigger card_mastery_passive_map_set_updated_at
before update on public.card_mastery_passive_map
for each row execute function public.set_updated_at();

drop trigger if exists player_card_progress_set_updated_at on public.player_card_progress;
create trigger player_card_progress_set_updated_at
before update on public.player_card_progress
for each row execute function public.set_updated_at();

alter table public.card_passive_skills enable row level security;
alter table public.card_mastery_passive_map enable row level security;
alter table public.player_card_progress enable row level security;

drop policy if exists "card_passive_skills_select_public" on public.card_passive_skills;
create policy "card_passive_skills_select_public"
on public.card_passive_skills
for select
to authenticated
using (is_active = true);

drop policy if exists "card_mastery_passive_map_select_public" on public.card_mastery_passive_map;
create policy "card_mastery_passive_map_select_public"
on public.card_mastery_passive_map
for select
to authenticated
using (true);

drop policy if exists "player_card_progress_select_own" on public.player_card_progress;
create policy "player_card_progress_select_own"
on public.player_card_progress
for select
to authenticated
using (auth.uid() = player_id);

drop policy if exists "player_card_progress_insert_own" on public.player_card_progress;
create policy "player_card_progress_insert_own"
on public.player_card_progress
for insert
to authenticated
with check (auth.uid() = player_id);

drop policy if exists "player_card_progress_update_own" on public.player_card_progress;
create policy "player_card_progress_update_own"
on public.player_card_progress
for update
to authenticated
using (auth.uid() = player_id)
with check (auth.uid() = player_id);

insert into public.card_passive_skills (id, name, description, effect, is_active) values
('passive-atk-drain-200', 'Drenaje de ATK', 'Cuando esta carta es atacada, reduce 200 ATK del atacante.', '{"trigger":"ON_THIS_CARD_TARGETED_BY_ATTACK","action":"REDUCE_ATTACKER_ATTACK","value":200}'::jsonb, true),
('passive-defense-energy-plus-1', 'Núcleo Defensivo', 'Si la carta está en defensa, gana +1 energía al inicio del turno propio.', '{"trigger":"ON_TURN_START_WHILE_DEFENDING","action":"GAIN_ENERGY","value":1}'::jsonb, true),
('passive-direct-hit-plus-200', 'Carga Letal', 'Los golpes directos de esta carta infligen +200 daño.', '{"trigger":"ON_DIRECT_HIT","action":"BONUS_DIRECT_DAMAGE","value":200}'::jsonb, true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  effect = excluded.effect,
  is_active = excluded.is_active;

insert into public.card_mastery_passive_map (card_id, passive_skill_id, priority) values
('entity-python', 'passive-defense-energy-plus-1', 1),
('entity-kali-linux', 'passive-atk-drain-200', 1),
('entity-react', 'passive-direct-hit-plus-200', 1)
on conflict (card_id, passive_skill_id) do update set
  priority = excluded.priority;

insert into public.player_card_progress (player_id, card_id, version_tier, level, xp, mastery_passive_skill_id)
select
  collection.player_id,
  collection.card_id,
  0,
  0,
  0,
  null
from public.player_collection_cards as collection
where collection.owned_copies > 0
on conflict (player_id, card_id) do nothing;
