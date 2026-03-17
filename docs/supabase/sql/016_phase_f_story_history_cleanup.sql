-- docs/supabase/sql/016_phase_f_story_history_cleanup.sql - Elimina infraestructura legacy de historial Story ya no usada por runtime.
drop policy if exists "player_story_history_events_select_own" on public.player_story_history_events;
drop policy if exists "player_story_history_events_insert_own" on public.player_story_history_events;
drop index if exists idx_player_story_history_events_player_created_at;
drop table if exists public.player_story_history_events;
