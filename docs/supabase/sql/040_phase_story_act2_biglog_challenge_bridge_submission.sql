-- docs/supabase/sql/040_phase_story_act2_biglog_challenge_bridge_submission.sql - Añade duelo BigLog de subruta en Acto 2 para activar puente al boss.
begin;

insert into public.story_duels (
  id,
  chapter,
  duel_index,
  title,
  description,
  opponent_id,
  deck_list_id,
  opening_hand_size,
  starter_player,
  reward_nexus,
  reward_player_experience,
  unlock_requirement_duel_id,
  is_boss_duel,
  is_active
)
values (
  'story-ch2-duel-8',
  2,
  8,
  'Evaluación BigLog',
  'Duelo de validación táctica para confirmar que el jugador domina rutas, recursos y presión de tablero.',
  'opp-biglog',
  'deck-opp-biglog-v1',
  4,
  'RANDOM',
  760,
  420,
  'story-ch2-duel-1',
  false,
  true
)
on conflict (id) do update
set
  chapter = excluded.chapter,
  duel_index = excluded.duel_index,
  title = excluded.title,
  description = excluded.description,
  opponent_id = excluded.opponent_id,
  deck_list_id = excluded.deck_list_id,
  opening_hand_size = excluded.opening_hand_size,
  starter_player = excluded.starter_player,
  reward_nexus = excluded.reward_nexus,
  reward_player_experience = excluded.reward_player_experience,
  unlock_requirement_duel_id = excluded.unlock_requirement_duel_id,
  is_boss_duel = excluded.is_boss_duel,
  is_active = excluded.is_active;

insert into public.story_duel_ai_profiles (duel_id, difficulty, ai_profile, is_active)
values (
  'story-ch2-duel-8',
  'ELITE',
  '{"style":"control","aggression":0.58}'::jsonb,
  true
)
on conflict (duel_id) do update
set
  difficulty = excluded.difficulty,
  ai_profile = excluded.ai_profile,
  is_active = excluded.is_active;

commit;
