-- docs/supabase/sql/039_phase_story_act1_side_duel_unlocked.sql - Repara (si falta) el duelo lateral del Acto 1 y lo deja sin dependencia obligatoria previa.
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
  'story-ch1-duel-2',
  1,
  2,
  'Rogue Scraper',
  'Duelo secundario de alto riesgo; al perder la rama queda pendiente para reintento.',
  'opp-soldier-act01',
  'deck-opp-soldier-act01-v1',
  4,
  'RANDOM',
  220,
  130,
  null,
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
