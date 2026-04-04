-- docs/supabase/sql/034_phase_story_act1_biglog_video_soldier_scaling.sql - Reconfigura Acto 1 con Soldado escalado como boss y perfiles IA progresivos por duelo.
update public.story_duels
set
  chapter = 1,
  duel_index = 1,
  title = 'Explorador Corrupto',
  description = 'Primer duelo del Acto 1 para validar control de ruta principal.',
  opponent_id = 'opp-ch1-soldier-act01',
  deck_list_id = 'deck-opp-ch1-soldier-act01-v1',
  opening_hand_size = 4,
  starter_player = 'RANDOM',
  reward_nexus = 140,
  reward_player_experience = 90,
  unlock_requirement_duel_id = null,
  is_boss_duel = false,
  is_active = true
where id = 'story-ch1-duel-1';

update public.story_duels
set
  chapter = 1,
  duel_index = 2,
  title = 'Rogue Scraper',
  description = 'Duelo secundario de alto riesgo; al perder la rama queda pendiente para reintento.',
  opponent_id = 'opp-ch1-soldier-act01',
  deck_list_id = 'deck-opp-ch1-soldier-act01-v1',
  opening_hand_size = 4,
  starter_player = 'RANDOM',
  reward_nexus = 220,
  reward_player_experience = 130,
  unlock_requirement_duel_id = 'story-ch1-duel-1',
  is_boss_duel = false,
  is_active = true
where id = 'story-ch1-duel-2';

update public.story_duels
set
  chapter = 1,
  duel_index = 3,
  title = 'Asedio de Plataforma',
  description = 'Segundo filtro principal antes del cierre del acto.',
  opponent_id = 'opp-ch1-soldier-act01',
  deck_list_id = 'deck-opp-ch1-soldier-act01-v1',
  opening_hand_size = 4,
  starter_player = 'RANDOM',
  reward_nexus = 320,
  reward_player_experience = 190,
  unlock_requirement_duel_id = 'story-ch1-duel-1',
  is_boss_duel = false,
  is_active = true
where id = 'story-ch1-duel-3';

update public.story_duels
set
  chapter = 1,
  duel_index = 4,
  title = 'Cerco Persistente',
  description = 'Tramo previo al boss con presión táctica sostenida.',
  opponent_id = 'opp-ch1-soldier-act01',
  deck_list_id = 'deck-opp-ch1-soldier-act01-v1',
  opening_hand_size = 4,
  starter_player = 'OPPONENT',
  reward_nexus = 460,
  reward_player_experience = 260,
  unlock_requirement_duel_id = 'story-ch1-duel-3',
  is_boss_duel = false,
  is_active = true
where id = 'story-ch2-duel-3';

update public.story_duels
set
  chapter = 1,
  duel_index = 5,
  title = 'Boss: Soldado Acto 01',
  description = 'Cierre del Acto 1 con versión reforzada del mismo rival y deck de mayor dificultad.',
  opponent_id = 'opp-ch1-soldier-act01',
  deck_list_id = 'deck-opp-ch1-soldier-act01-v1',
  opening_hand_size = 4,
  starter_player = 'OPPONENT',
  reward_nexus = 760,
  reward_player_experience = 420,
  unlock_requirement_duel_id = 'story-ch2-duel-3',
  is_boss_duel = true,
  is_active = true
where id = 'story-ch2-duel-4';

update public.story_duels
set
  chapter = 2,
  duel_index = 1,
  unlock_requirement_duel_id = 'story-ch2-duel-4',
  is_active = true
where id = 'story-ch2-duel-1';

insert into public.story_duel_ai_profiles (duel_id, difficulty, ai_profile, is_active)
values
  ('story-ch1-duel-1', 'ROOKIE', '{"style":"balanced","aggression":0.38}'::jsonb, true),
  ('story-ch1-duel-2', 'STANDARD', '{"style":"tempo","aggression":0.46}'::jsonb, true),
  ('story-ch1-duel-3', 'ELITE', '{"style":"tempo","aggression":0.56}'::jsonb, true),
  ('story-ch2-duel-3', 'ELITE', '{"style":"control","aggression":0.61}'::jsonb, true),
  ('story-ch2-duel-4', 'BOSS', '{"style":"control","aggression":0.72}'::jsonb, true)
on conflict (duel_id) do update set
  difficulty = excluded.difficulty,
  ai_profile = excluded.ai_profile,
  is_active = excluded.is_active;

delete from public.story_duel_deck_overrides
where duel_id in ('story-ch1-duel-1', 'story-ch1-duel-2', 'story-ch1-duel-3', 'story-ch2-duel-3', 'story-ch2-duel-4');

insert into public.story_duel_deck_overrides (
  duel_id,
  slot_index,
  card_id,
  copies,
  version_tier,
  level,
  xp,
  attack_override,
  defense_override,
  effect_override,
  is_active
)
values
  ('story-ch1-duel-1', 0, 'entity-python', 2, 0, 0, 0, null, null, null, true),
  ('story-ch1-duel-1', 1, 'entity-react', 2, 0, 0, 0, null, null, null, true),
  ('story-ch1-duel-1', 2, 'entity-supabase', 2, 0, 0, 0, null, null, null, true),
  ('story-ch1-duel-1', 3, 'entity-postgress', 2, 0, 0, 0, null, null, null, true),
  ('story-ch1-duel-1', 4, 'exec-draw-1', 2, 0, 0, 0, null, null, null, true),
  ('story-ch1-duel-1', 5, 'exec-boost-atk-400', 2, 0, 0, 0, null, null, null, true),
  ('story-ch1-duel-1', 6, 'trap-atk-drain', 2, 0, 0, 0, null, null, null, true),
  ('story-ch1-duel-1', 7, 'trap-def-fragment', 2, 0, 0, 0, null, null, null, true),

  ('story-ch1-duel-2', 0, 'entity-python', 2, 1, 2, 120, null, null, null, true),
  ('story-ch1-duel-2', 1, 'entity-react', 2, 1, 2, 120, null, null, null, true),
  ('story-ch1-duel-2', 2, 'entity-supabase', 2, 1, 2, 120, null, null, null, true),
  ('story-ch1-duel-2', 3, 'entity-postgress', 2, 1, 2, 120, null, null, null, true),
  ('story-ch1-duel-2', 4, 'exec-draw-1', 2, 1, 2, 120, null, null, null, true),
  ('story-ch1-duel-2', 5, 'exec-boost-atk-400', 2, 1, 2, 120, null, null, null, true),
  ('story-ch1-duel-2', 6, 'trap-atk-drain', 2, 1, 2, 120, null, null, null, true),
  ('story-ch1-duel-2', 7, 'trap-def-fragment', 2, 1, 2, 120, null, null, null, true),

  ('story-ch1-duel-3', 0, 'entity-python', 2, 2, 4, 260, null, null, null, true),
  ('story-ch1-duel-3', 1, 'entity-react', 2, 2, 4, 260, null, null, null, true),
  ('story-ch1-duel-3', 2, 'entity-supabase', 2, 2, 4, 260, null, null, null, true),
  ('story-ch1-duel-3', 3, 'entity-postgress', 2, 2, 4, 260, null, null, null, true),
  ('story-ch1-duel-3', 4, 'exec-draw-1', 2, 2, 4, 260, null, null, null, true),
  ('story-ch1-duel-3', 5, 'exec-boost-atk-400', 2, 2, 4, 260, null, null, null, true),
  ('story-ch1-duel-3', 6, 'trap-atk-drain', 2, 2, 4, 260, null, null, null, true),
  ('story-ch1-duel-3', 7, 'trap-def-fragment', 2, 2, 4, 260, null, null, null, true),

  ('story-ch2-duel-3', 0, 'entity-python', 2, 3, 6, 420, null, null, null, true),
  ('story-ch2-duel-3', 1, 'entity-react', 2, 3, 6, 420, null, null, null, true),
  ('story-ch2-duel-3', 2, 'entity-supabase', 2, 3, 6, 420, null, null, null, true),
  ('story-ch2-duel-3', 3, 'entity-postgress', 2, 3, 6, 420, null, null, null, true),
  ('story-ch2-duel-3', 4, 'exec-draw-1', 2, 3, 6, 420, null, null, null, true),
  ('story-ch2-duel-3', 5, 'exec-boost-atk-400', 2, 3, 6, 420, null, null, null, true),
  ('story-ch2-duel-3', 6, 'trap-atk-drain', 2, 3, 6, 420, null, null, null, true),
  ('story-ch2-duel-3', 7, 'trap-def-fragment', 2, 3, 6, 420, null, null, null, true),

  ('story-ch2-duel-4', 0, 'entity-python', 2, 4, 8, 600, null, null, null, true),
  ('story-ch2-duel-4', 1, 'entity-react', 2, 4, 8, 600, null, null, null, true),
  ('story-ch2-duel-4', 2, 'entity-supabase', 2, 4, 8, 600, null, null, null, true),
  ('story-ch2-duel-4', 3, 'entity-postgress', 2, 4, 8, 600, null, null, null, true),
  ('story-ch2-duel-4', 4, 'exec-draw-1', 2, 4, 8, 600, null, null, null, true),
  ('story-ch2-duel-4', 5, 'exec-boost-atk-400', 2, 4, 8, 600, null, null, null, true),
  ('story-ch2-duel-4', 6, 'trap-atk-drain', 2, 4, 8, 600, null, null, null, true),
  ('story-ch2-duel-4', 7, 'trap-def-fragment', 2, 4, 8, 600, null, null, null, true),
  ('story-ch2-duel-4', 8, 'trap-runtime-punish', 1, 4, 8, 600, null, null, null, true),
  ('story-ch2-duel-4', 9, 'exec-fusion-gemgpt', 1, 4, 8, 600, null, null, null, true)
on conflict (duel_id, slot_index) do update set
  card_id = excluded.card_id,
  copies = excluded.copies,
  version_tier = excluded.version_tier,
  level = excluded.level,
  xp = excluded.xp,
  attack_override = excluded.attack_override,
  defense_override = excluded.defense_override,
  effect_override = excluded.effect_override,
  is_active = excluded.is_active;

