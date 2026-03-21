-- docs/supabase/sql/025_phase_onboarding_progress_flags.sql - Añade flags de onboarding para intro de Academy y salto opcional de tutorial.
alter table if exists public.player_progress
  add column if not exists has_seen_academy_intro boolean not null default false,
  add column if not exists has_skipped_tutorial boolean not null default false;
