-- docs/supabase/sql/014_phase_e_story_virtual_interactions.sql - Habilita eventos de interacción narrativa y node_id virtual en historial Story.
alter table if exists public.player_story_history_events
  drop constraint if exists player_story_history_events_node_id_fkey;

alter table if exists public.player_story_history_events
  drop constraint if exists player_story_history_events_kind_check;

alter table if exists public.player_story_history_events
  add constraint player_story_history_events_kind_check
  check (kind in ('MOVE', 'NODE_RESOLVED', 'REWARD_GRANTED', 'INTERACTION'));
