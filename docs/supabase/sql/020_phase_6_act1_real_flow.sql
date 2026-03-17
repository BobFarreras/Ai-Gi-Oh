-- docs/supabase/sql/020_phase_6_act1_real_flow.sql - Activa flujo real del Acto 1 con bifurcaciones, Soldado repetido y cierre BOSS de GenNvim.
insert into public.story_deck_lists (id, opponent_id, name, description, version, is_active)
values
  ('deck-opp-ch1-apprentice-v2', 'opp-ch1-apprentice', 'GenNvim v2', 'Versión difícil de GenNvim para cierre de acto.', 2, true)
on conflict (id) do update set
  opponent_id = excluded.opponent_id,
  name = excluded.name,
  description = excluded.description,
  version = excluded.version,
  is_active = excluded.is_active;

delete from public.story_deck_list_cards
where deck_list_id in ('deck-opp-ch1-apprentice-v2');

insert into public.story_deck_list_cards (deck_list_id, slot_index, card_id, copies)
values
  ('deck-opp-ch1-apprentice-v2', 0, 'entity-chatgpt', 2),
  ('deck-opp-ch1-apprentice-v2', 1, 'entity-gemini', 2),
  ('deck-opp-ch1-apprentice-v2', 2, 'entity-claude', 2),
  ('deck-opp-ch1-apprentice-v2', 3, 'entity-kali-linux', 2),
  ('deck-opp-ch1-apprentice-v2', 4, 'exec-fusion-gemgpt', 2),
  ('deck-opp-ch1-apprentice-v2', 5, 'exec-fusion-kaclauli', 2),
  ('deck-opp-ch1-apprentice-v2', 6, 'exec-boost-atk-400', 3),
  ('deck-opp-ch1-apprentice-v2', 7, 'trap-kernel-panic', 2),
  ('deck-opp-ch1-apprentice-v2', 8, 'trap-runtime-punish', 2);

update public.story_opponents
set
  display_name = 'GenNvim',
  difficulty = 'ELITE',
  ai_profile = '{"style":"combo","aggression":0.66}'::jsonb,
  is_active = true
where id = 'opp-ch1-apprentice';

update public.story_duels
set
  chapter = 1,
  duel_index = 1,
  title = 'Entrenamiento de Asalto',
  description = 'Primer choque contra Soldado Acto 01.',
  opponent_id = 'opp-ch1-soldier-act01',
  deck_list_id = 'deck-opp-ch1-soldier-act01-v1',
  starter_player = 'RANDOM',
  reward_nexus = 120,
  reward_player_experience = 70,
  unlock_requirement_duel_id = null,
  is_boss_duel = false,
  is_active = true
where id = 'story-ch1-duel-1';

update public.story_duels
set
  chapter = 1,
  duel_index = 2,
  title = 'Presión de Escuadrón',
  description = 'Segundo enfrentamiento contra Soldado Acto 01.',
  opponent_id = 'opp-ch1-soldier-act01',
  deck_list_id = 'deck-opp-ch1-soldier-act01-v1',
  starter_player = 'RANDOM',
  reward_nexus = 180,
  reward_player_experience = 110,
  unlock_requirement_duel_id = 'story-ch1-duel-1',
  is_boss_duel = false,
  is_active = true
where id = 'story-ch1-duel-2';

update public.story_duels
set
  chapter = 1,
  duel_index = 3,
  title = 'GenNvim: Modo Difícil',
  description = 'GenNvim sube el nivel con una build de alta presión.',
  opponent_id = 'opp-ch1-apprentice',
  deck_list_id = 'deck-opp-ch1-apprentice-v2',
  starter_player = 'OPPONENT',
  reward_nexus = 320,
  reward_player_experience = 180,
  unlock_requirement_duel_id = 'story-ch1-duel-2',
  is_boss_duel = false,
  is_active = true
where id = 'story-ch1-duel-3';

update public.story_duels
set
  chapter = 1,
  duel_index = 4,
  title = 'Asalto Persistente',
  description = 'Tercer combate contra Soldado Acto 01 antes del cierre.',
  opponent_id = 'opp-ch1-soldier-act01',
  deck_list_id = 'deck-opp-ch1-soldier-act01-v1',
  starter_player = 'RANDOM',
  reward_nexus = 420,
  reward_player_experience = 240,
  unlock_requirement_duel_id = 'story-ch1-duel-3',
  is_boss_duel = false,
  is_active = true
where id = 'story-ch2-duel-3';

update public.story_duels
set
  chapter = 1,
  duel_index = 5,
  title = 'Boss Final: GenNvim',
  description = 'Enfrentamiento final del acto 1 contra GenNvim en modo difícil.',
  opponent_id = 'opp-ch1-apprentice',
  deck_list_id = 'deck-opp-ch1-apprentice-v2',
  starter_player = 'OPPONENT',
  reward_nexus = 700,
  reward_player_experience = 360,
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

update public.story_duels
set
  chapter = 2,
  duel_index = 2,
  unlock_requirement_duel_id = 'story-ch2-duel-1',
  is_active = true
where id = 'story-ch2-duel-2';

update public.story_duels
set is_active = false
where id in ('story-ch2-duel-5', 'story-ch2-duel-6');
