-- docs/supabase/sql/067_seed_flawless_mission.sql - Misión de ejemplo de victoria sin perder LP (multijugador). La sección es configurable en el admin (WIN_FLAWLESS_MP/STORY/TRAINING).
begin;

insert into public.mission_definitions (id, scope, objective_type, target_count, reward_nexus, title, description, sort_order, objective_param, is_active) values
  ('weekly-flawless-mp', 'WEEKLY', 'WIN_FLAWLESS_MP', 1, 500, 'Victoria impecable', 'Gana un combate multijugador sin perder ni un punto de LP', 17, null, true)
on conflict (id) do nothing;

commit;
