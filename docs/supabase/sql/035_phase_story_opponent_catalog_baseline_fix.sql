-- docs/supabase/sql/035_phase_story_opponent_catalog_baseline_fix.sql - Restaura baseline de catálogo para Soldado Acto 01 y evita acoplar dificultad de acto en story_opponents.
update public.story_opponents
set
  display_name = 'Soldado Acto 01',
  difficulty = 'ROOKIE',
  ai_profile = '{"style":"balanced","aggression":0.41}'::jsonb,
  is_active = true
where id = 'opp-ch1-soldier-act01';
