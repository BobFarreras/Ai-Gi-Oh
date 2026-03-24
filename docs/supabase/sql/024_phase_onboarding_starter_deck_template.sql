-- docs/supabase/sql/024_phase_onboarding_starter_deck_template.sql - Crea plantilla persistente de deck inicial para onboarding de jugadores nuevos.
begin;

create table if not exists public.starter_deck_template_slots (
  template_key text not null,
  slot_index smallint not null check (slot_index >= 0 and slot_index < 20),
  card_id text not null references public.cards_catalog(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (template_key, slot_index)
);

create index if not exists idx_starter_deck_template_slots_active
  on public.starter_deck_template_slots (template_key, is_active, slot_index);

drop trigger if exists starter_deck_template_slots_set_updated_at on public.starter_deck_template_slots;
create trigger starter_deck_template_slots_set_updated_at
before update on public.starter_deck_template_slots
for each row execute function public.set_updated_at();

alter table public.starter_deck_template_slots enable row level security;

drop policy if exists "starter_deck_template_slots_select_authenticated" on public.starter_deck_template_slots;
create policy "starter_deck_template_slots_select_authenticated"
on public.starter_deck_template_slots
for select
to authenticated
using (is_active = true);

insert into public.starter_deck_template_slots (template_key, slot_index, card_id, is_active) values
('academy-starter-v1', 0, 'entity-vscode', true),
('academy-starter-v1', 1, 'entity-cursor', true),
('academy-starter-v1', 2, 'entity-git', true),
('academy-starter-v1', 3, 'entity-edge', true),
('academy-starter-v1', 4, 'entity-firefox', true),
('academy-starter-v1', 5, 'entity-safari', true),
('academy-starter-v1', 6, 'entity-brave', true),
('academy-starter-v1', 7, 'entity-sqlite', true),
('academy-starter-v1', 8, 'entity-python', true),
('academy-starter-v1', 9, 'entity-hostinger', true),
('academy-starter-v1', 10, 'entity-digitalocean', true),
('academy-starter-v1', 11, 'entity-javascript', true),
('academy-starter-v1', 12, 'entity-vercel', true),
('academy-starter-v1', 13, 'trap-atk-drain', true),
('academy-starter-v1', 14, 'trap-tor-smokescreen', true),
('academy-starter-v1', 15, 'trap-hydra-counter', true),
('academy-starter-v1', 16, 'exec-draw-1', true),
('academy-starter-v1', 17, 'exec-heal-700', true),
('academy-starter-v1', 18, 'exec-direct-damage-600', true),
('academy-starter-v1', 19, 'exec-boost-atk-400', true)
on conflict (template_key, slot_index) do update set
  card_id = excluded.card_id,
  is_active = excluded.is_active;

commit;

