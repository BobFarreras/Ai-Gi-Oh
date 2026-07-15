-- docs/supabase/sql/129_arena_card_equipped_objects.sql
-- Objetos equipados en cartas de oponentes de Arena. Hasta ahora las cartas del rival escalaban por
-- nivel/versión pero no podían llevar el bonus de objetos (ATK/DEF) que sí tiene el jugador. Se añade un
-- bonus agregado por carta; el admin lo rellena "equipando" objetos del catálogo (suma su valor). El resolver
-- lo pasa a applyCardProgressionToCard como un upgrade más, con las MISMAS reglas que el jugador.
begin;

alter table public.arena_deck_variant_cards
  add column if not exists attack_bonus  integer not null default 0 check (attack_bonus  >= 0),
  add column if not exists defense_bonus integer not null default 0 check (defense_bonus >= 0);

commit;
