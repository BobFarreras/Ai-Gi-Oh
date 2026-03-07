-- docs/supabase/sql/009_phase_5_player_progress_experience.sql - Añade experiencia de jugador persistida para recompensas de duelos Story.
alter table if exists public.player_progress
  add column if not exists player_experience integer not null default 0 check (player_experience >= 0);
