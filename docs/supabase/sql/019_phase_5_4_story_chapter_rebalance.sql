-- docs/supabase/sql/019_phase_5_4_story_chapter_rebalance.sql - Rebalancea capítulos Story: oponentes nuevos en capítulo 1 y capítulo 2 resumido a pre-BOSS.
update public.story_opponents
set avatar_url = '/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.png'
where id = 'opp-ch1-apprentice';

update public.story_opponents
set avatar_url = '/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.png'
where id = 'opp-ch1-biglog';

update public.story_opponents
set avatar_url = '/assets/story/opponents/opp-ch1-jaku/avatar-Jaku.png'
where id = 'opp-ch1-jaku';

update public.story_opponents
set avatar_url = '/assets/story/opponents/opp-ch1-helena/avatar-Helena.png'
where id = 'opp-ch1-helena';

update public.story_opponents
set avatar_url = '/assets/story/opponents/opp-ch1-soldier-act01/avatar-Soldado-act01.png'
where id = 'opp-ch1-soldier-act01';

update public.story_opponents
set is_active = false
where id in ('opp-ch1-architect', 'opp-ch1-sysadmin');

update public.story_duels
set
  chapter = 1,
  duel_index = 2,
  title = 'Escuadrón de Asalto',
  description = 'Soldado Acto 01 intenta romper tu línea defensiva.',
  opponent_id = 'opp-ch1-soldier-act01',
  deck_list_id = 'deck-opp-ch1-soldier-act01-v1',
  starter_player = 'RANDOM',
  reward_nexus = 220,
  reward_player_experience = 110,
  unlock_requirement_duel_id = 'story-ch1-duel-1',
  is_boss_duel = false,
  is_active = true
where id = 'story-ch1-duel-2';

update public.story_duels
set
  chapter = 1,
  duel_index = 3,
  title = 'Ataque Vectorial',
  description = 'Jaku acelera el ritmo con presión ofensiva constante.',
  opponent_id = 'opp-ch1-jaku',
  deck_list_id = 'deck-opp-ch1-jaku-v1',
  starter_player = 'RANDOM',
  reward_nexus = 320,
  reward_player_experience = 170,
  unlock_requirement_duel_id = 'story-ch1-duel-2',
  is_boss_duel = false,
  is_active = true
where id = 'story-ch1-duel-3';

update public.story_duels
set
  chapter = 1,
  duel_index = 4,
  title = 'Control de Señales',
  description = 'BigLog levanta una red de trampas para castigar cada error.',
  opponent_id = 'opp-ch1-biglog',
  deck_list_id = 'deck-opp-ch1-biglog-v1',
  starter_player = 'OPPONENT',
  reward_nexus = 460,
  reward_player_experience = 250,
  unlock_requirement_duel_id = 'story-ch1-duel-3',
  is_boss_duel = false,
  is_active = true
where id = 'story-ch2-duel-3';

update public.story_duels
set
  chapter = 1,
  duel_index = 5,
  title = 'Nexo de Dominio',
  description = 'Helena despliega su build de jefe con sinergia de fusión.',
  opponent_id = 'opp-ch1-helena',
  deck_list_id = 'deck-opp-ch1-helena-v1',
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
  title = 'Cortafuegos Profundo',
  description = 'Combate de desgaste con castigo de efectos.',
  opponent_id = 'opp-ch2-warden',
  deck_list_id = 'deck-opp-ch2-warden-v1',
  starter_player = 'RANDOM',
  reward_nexus = 420,
  reward_player_experience = 220,
  unlock_requirement_duel_id = 'story-ch2-duel-4',
  is_boss_duel = false,
  is_active = true
where id = 'story-ch2-duel-1';

update public.story_duels
set
  chapter = 2,
  duel_index = 2,
  title = 'Omega Core',
  description = 'Encuentro de alta dificultad orientado a presión constante.',
  opponent_id = 'opp-ch2-omega',
  deck_list_id = 'deck-opp-ch2-omega-v1',
  starter_player = 'OPPONENT',
  reward_nexus = 900,
  reward_player_experience = 460,
  unlock_requirement_duel_id = 'story-ch2-duel-1',
  is_boss_duel = true,
  is_active = true
where id = 'story-ch2-duel-2';

update public.story_duels
set is_active = false
where id in ('story-ch2-duel-5', 'story-ch2-duel-6');

delete from public.story_duel_reward_cards
where duel_id in (
  'story-ch1-duel-2',
  'story-ch1-duel-3',
  'story-ch2-duel-3',
  'story-ch2-duel-4',
  'story-ch2-duel-1',
  'story-ch2-duel-2'
);

insert into public.story_duel_reward_cards (duel_id, card_id, copies, drop_rate, is_guaranteed)
values
  ('story-ch1-duel-2', 'entity-react', 1, 1.0000, true),
  ('story-ch1-duel-3', 'exec-direct-damage-600', 1, 1.0000, true),
  ('story-ch2-duel-3', 'trap-kernel-panic', 1, 1.0000, true),
  ('story-ch2-duel-4', 'fusion-kaclauli', 1, 1.0000, true),
  ('story-ch2-duel-1', 'trap-runtime-punish', 1, 1.0000, true),
  ('story-ch2-duel-2', 'fusion-gemgpt', 1, 1.0000, true);
