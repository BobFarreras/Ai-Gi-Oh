-- docs/supabase/sql/089_overworld_player_state.sql - Añade posición del overworld (mapa + celda) al estado de mundo Story.
-- Aditivo y no destructivo: columnas nullable, sin tocar datos ni políticas existentes.

alter table if exists public.player_story_world_state
  add column if not exists overworld_map_id text null;

alter table if exists public.player_story_world_state
  add column if not exists overworld_position jsonb null;
