-- docs/supabase/sql/021_phase_7_act2_branching_flow.sql - Configura el Acto 2 real con bifurcaciones, doble Helena y cierre BOSS de Jaku.
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
  ('story-ch2-duel-5', 2, 3, 'Ataque Vectorial', 'Jaku acelera el ritmo en la rama central.', 'opp-ch1-jaku', 'deck-opp-ch1-jaku-v1', 4, 'RANDOM', 460, 240, 'story-ch2-duel-2', false, true),
  ('story-ch2-duel-6', 2, 4, 'Escuadrón Inferior', 'Soldado Acto 01 protege la rama baja.', 'opp-ch1-soldier-act01', 'deck-opp-ch1-soldier-act01-v1', 4, 'RANDOM', 420, 220, 'story-ch2-duel-4', false, true),
  ('story-ch2-duel-7', 2, 5, 'Refuerzo de Trinchera', 'Nuevo choque contra Soldado Acto 01 en el tramo superior de la rama baja.', 'opp-ch1-soldier-act01', 'deck-opp-ch1-soldier-act01-v1', 4, 'RANDOM', 520, 280, 'story-ch2-duel-1', false, true),
  ('story-ch2-duel-8', 2, 6, 'Helena: Cierre Táctico', 'Segundo combate contra Helena para activar el puente del sector.', 'opp-ch1-helena', 'deck-opp-ch1-helena-v1', 4, 'OPPONENT', 680, 360, 'story-ch2-duel-7', false, true),
  ('story-ch2-duel-9', 2, 7, 'Boss: Jaku Overdrive', 'Duelos finales del acto 2 tras activar el puente de control.', 'opp-ch1-jaku', 'deck-opp-ch1-jaku-v1', 4, 'OPPONENT', 980, 520, 'story-ch2-duel-8', true, true)
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

update public.story_duels
set
  chapter = 2,
  duel_index = 1,
  title = 'Helena: Vanguardia Alta',
  description = 'Helena presiona la rama superior con combo de alta exigencia.',
  opponent_id = 'opp-ch1-helena',
  deck_list_id = 'deck-opp-ch1-helena-v1',
  opening_hand_size = 4,
  starter_player = 'OPPONENT',
  reward_nexus = 520,
  reward_player_experience = 280,
  unlock_requirement_duel_id = 'story-ch2-duel-4',
  is_boss_duel = false,
  is_active = true
where id = 'story-ch2-duel-1';

update public.story_duels
set
  chapter = 2,
  duel_index = 2,
  title = 'Bloqueo Central',
  description = 'Soldado Acto 01 intenta cortar la ruta principal.',
  opponent_id = 'opp-ch1-soldier-act01',
  deck_list_id = 'deck-opp-ch1-soldier-act01-v1',
  opening_hand_size = 4,
  starter_player = 'RANDOM',
  reward_nexus = 380,
  reward_player_experience = 200,
  unlock_requirement_duel_id = 'story-ch2-duel-4',
  is_boss_duel = false,
  is_active = true
where id = 'story-ch2-duel-2';
