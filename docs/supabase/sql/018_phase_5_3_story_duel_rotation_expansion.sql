-- docs/supabase/sql/018_phase_5_3_story_duel_rotation_expansion.sql - Amplía la rotación de duelos Story para incluir los nuevos oponentes en capítulo 2.
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
values
  ('story-ch2-duel-3', 2, 3, 'Escuadrón de Asalto', 'Soldado Acto 01 intenta romper tu línea defensiva.', 'opp-ch1-soldier-act01', 'deck-opp-ch1-soldier-act01-v1', 4, 'RANDOM', 320, 170, 'story-ch2-duel-2', false, true),
  ('story-ch2-duel-4', 2, 4, 'Ataque Vectorial', 'Jaku acelera el ritmo con presión ofensiva constante.', 'opp-ch1-jaku', 'deck-opp-ch1-jaku-v1', 4, 'RANDOM', 420, 220, 'story-ch2-duel-3', false, true),
  ('story-ch2-duel-5', 2, 5, 'Control de Señales', 'BigLog levanta una red de trampas para castigar cada error.', 'opp-ch1-biglog', 'deck-opp-ch1-biglog-v1', 4, 'OPPONENT', 560, 300, 'story-ch2-duel-4', false, true),
  ('story-ch2-duel-6', 2, 6, 'Nexo de Dominio', 'Helena despliega su build de jefe con sinergia de fusión.', 'opp-ch1-helena', 'deck-opp-ch1-helena-v1', 4, 'OPPONENT', 820, 420, 'story-ch2-duel-5', true, true)
on conflict (id) do update set
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

delete from public.story_duel_reward_cards
where duel_id in (
  'story-ch2-duel-3',
  'story-ch2-duel-4',
  'story-ch2-duel-5',
  'story-ch2-duel-6'
);

insert into public.story_duel_reward_cards (duel_id, card_id, copies, drop_rate, is_guaranteed)
values
  ('story-ch2-duel-3', 'entity-react', 1, 1.0000, true),
  ('story-ch2-duel-4', 'exec-direct-damage-600', 1, 1.0000, true),
  ('story-ch2-duel-5', 'trap-kernel-panic', 1, 1.0000, true),
  ('story-ch2-duel-6', 'fusion-kaclauli', 1, 1.0000, true);
