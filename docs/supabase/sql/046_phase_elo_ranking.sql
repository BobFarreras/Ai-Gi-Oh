-- docs/supabase/sql/046_phase_elo_ranking.sql - Añade ELO y estadísticas de victoria/derrota a player_profiles.

alter table public.player_profiles
  add column if not exists elo_rating  integer not null default 1200,
  add column if not exists wins        integer not null default 0,
  add column if not exists losses      integer not null default 0;

-- Índice para consultas de ranking ordenadas por ELO descendente.
create index if not exists idx_player_profiles_elo_rating
  on public.player_profiles (elo_rating desc);
