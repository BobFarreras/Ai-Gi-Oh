-- docs/supabase/sql/010_phase_2_fusion_deck_slots.sql - Añade bloque persistido de 2 slots de fusión por jugador con RLS y bootstrap de alta.
create table if not exists public.player_fusion_deck_slots (
  player_id uuid not null references auth.users(id) on delete cascade,
  slot_index integer not null check (slot_index >= 0 and slot_index < 2),
  card_id text null,
  updated_at timestamptz not null default now(),
  primary key (player_id, slot_index)
);

drop trigger if exists player_fusion_deck_slots_set_updated_at on public.player_fusion_deck_slots;
create trigger player_fusion_deck_slots_set_updated_at
before update on public.player_fusion_deck_slots
for each row execute function public.set_updated_at();

alter table public.player_fusion_deck_slots enable row level security;

drop policy if exists "player_fusion_deck_slots_select_own" on public.player_fusion_deck_slots;
create policy "player_fusion_deck_slots_select_own" on public.player_fusion_deck_slots
for select to authenticated
using (auth.uid() = player_id);

drop policy if exists "player_fusion_deck_slots_insert_own" on public.player_fusion_deck_slots;
create policy "player_fusion_deck_slots_insert_own" on public.player_fusion_deck_slots
for insert to authenticated
with check (auth.uid() = player_id);

drop policy if exists "player_fusion_deck_slots_update_own" on public.player_fusion_deck_slots;
create policy "player_fusion_deck_slots_update_own" on public.player_fusion_deck_slots
for update to authenticated
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

  insert into public.player_wallets (player_id, nexus)
  values (new.id, 1000)
  on conflict (player_id) do nothing;

  insert into public.player_deck_slots (player_id, slot_index, card_id)
  select new.id, slot_index, null
  from generate_series(0, 19) as slot_index
  on conflict (player_id, slot_index) do nothing;

  insert into public.player_fusion_deck_slots (player_id, slot_index, card_id)
  select new.id, slot_index, null
  from generate_series(0, 1) as slot_index
  on conflict (player_id, slot_index) do nothing;

  return new;
end;
$$;
