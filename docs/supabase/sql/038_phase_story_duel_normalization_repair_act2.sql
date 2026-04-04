-- docs/supabase/sql/038_phase_story_duel_normalization_repair_act2.sql - Repara duelos faltantes del Acto 2 tras normalización de IDs y restablece perfiles IA mínimos.
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
values
  (
    'story-ch2-duel-5',
    2,
    5,
    'Refuerzo de Trinchera',
    'Nuevo choque contra Soldado Acto 01 en el tramo superior de la rama baja.',
    'opp-soldier-act01',
    'deck-opp-soldier-act01-v1',
    4,
    'RANDOM',
    520,
    280,
    'story-ch2-duel-1',
    false,
    true
  ),
  (
    'story-ch2-duel-6',
    2,
    6,
    'Helena: Cierre Táctico',
    'Segundo combate contra Helena para activar el puente del sector.',
    'opp-helena',
    'deck-opp-helena-v1',
    4,
    'OPPONENT',
    680,
    360,
    'story-ch2-duel-5',
    false,
    true
  ),
  (
    'story-ch2-duel-7',
    2,
    7,
    'Boss: Jaku Overdrive',
    'Duelos finales del acto 2 tras activar el puente de control.',
    'opp-jaku',
    'deck-opp-jaku-v1',
    4,
    'OPPONENT',
    980,
    520,
    'story-ch2-duel-6',
    true,
    true
  )
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

insert into public.story_duel_ai_profiles (duel_id, difficulty, ai_profile, is_active)
select
  duel.id,
  opponent.difficulty,
  opponent.ai_profile,
  true
from public.story_duels duel
join public.story_opponents opponent on opponent.id = duel.opponent_id
where duel.id in ('story-ch2-duel-5', 'story-ch2-duel-6', 'story-ch2-duel-7')
on conflict (duel_id) do update set
  difficulty = excluded.difficulty,
  ai_profile = excluded.ai_profile,
  is_active = excluded.is_active;

commit;
