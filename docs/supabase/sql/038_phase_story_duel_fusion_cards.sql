-- docs/supabase/sql/038_phase_story_duel_fusion_cards.sql - Crea bloque de fusión (2 slots) por duelo Story con RLS de lectura pública autenticada.
create table if not exists public.story_duel_fusion_cards (
  duel_id text not null,
  slot_index smallint not null,
  card_id text not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint story_duel_fusion_cards_pkey primary key (duel_id, slot_index),
  constraint story_duel_fusion_cards_slot_index_check check (slot_index >= 0 and slot_index < 2)
);

create index if not exists idx_story_duel_fusion_cards_duel on public.story_duel_fusion_cards (duel_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'story_duel_fusion_cards_duel_id_fkey'
  ) then
    alter table public.story_duel_fusion_cards
      add constraint story_duel_fusion_cards_duel_id_fkey
      foreign key (duel_id) references public.story_duels(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'story_duel_fusion_cards_card_id_fkey'
  ) then
    alter table public.story_duel_fusion_cards
      add constraint story_duel_fusion_cards_card_id_fkey
      foreign key (card_id) references public.cards_catalog(id) on delete restrict;
  end if;
end $$;

drop trigger if exists story_duel_fusion_cards_set_updated_at on public.story_duel_fusion_cards;
create trigger story_duel_fusion_cards_set_updated_at
before update on public.story_duel_fusion_cards
for each row execute function public.set_updated_at();

alter table public.story_duel_fusion_cards enable row level security;

drop policy if exists "story_duel_fusion_cards_select_public" on public.story_duel_fusion_cards;
create policy "story_duel_fusion_cards_select_public"
on public.story_duel_fusion_cards
for select
to authenticated
using (is_active = true);

grant select on public.story_duel_fusion_cards to authenticated;
grant all on public.story_duel_fusion_cards to service_role;
