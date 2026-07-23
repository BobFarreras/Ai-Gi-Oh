-- docs/supabase/sql/147_story_act4_patrol_duel.sql - Duelo EXTRA del Acto 4: el CENTINELA que patrulla el
-- laberinto 1 (hub) del Núcleo GenNvim. Idempotente (ON CONFLICT DO UPDATE). Sigue el patrón de
-- 146_story_act4_hydra_duel.sql. El id (story-ch4-duel-9) coincide con el objeto DUEL del tilemap (act-4) y con
-- duelHref /hub/story/chapter/4/duel/9. Es un duelo OPCIONAL: el centinela no bloquea ninguna casilla, así que
-- se le puede esquivar; sólo salta si su haz de visión te pilla cruzando el corredor de salida del laberinto.
--
-- ORDEN DE DESPLIEGUE: aplicar en/tras el release del Acto 4 (después de 145 y 146). Reutiliza el oponente
-- Soldado-Terminal (opp-ch4-soldado-terminal) creado en 145, pero con deck propio: al ser una patrulla que se
-- puede evitar, premia al que decide plantarle cara con un rival algo más duro que los centinelas fijos.

-- ── Deck list (el oponente opp-ch4-soldado-terminal ya existe desde 145) ─────
insert into public.story_deck_lists (id, opponent_id, name, description, version, is_active)
values
  ('deck-opp-ch4-soldado-patrulla-v1', 'opp-ch4-soldado-terminal', 'Soldado-Terminal (patrulla) v1',
   'Centinela móvil del laberinto: control de tablero y castigo al que cruza sin mirar.', 1, true)
on conflict (id) do update set
  opponent_id = excluded.opponent_id, name = excluded.name, description = excluded.description,
  version = excluded.version, is_active = excluded.is_active, updated_at = now();

delete from public.story_deck_list_cards where deck_list_id = 'deck-opp-ch4-soldado-patrulla-v1';
insert into public.story_deck_list_cards (deck_list_id, slot_index, card_id, copies) values
  ('deck-opp-ch4-soldado-patrulla-v1', 0, 'entity-typescript', 2),
  ('deck-opp-ch4-soldado-patrulla-v1', 1, 'entity-kubernetes', 2),
  ('deck-opp-ch4-soldado-patrulla-v1', 2, 'entity-docker', 2),
  ('deck-opp-ch4-soldado-patrulla-v1', 3, 'entity-rust', 2),
  ('deck-opp-ch4-soldado-patrulla-v1', 4, 'entity-javascript', 2),
  ('deck-opp-ch4-soldado-patrulla-v1', 5, 'exec-docker-defense-1000', 2),
  ('deck-opp-ch4-soldado-patrulla-v1', 6, 'exec-framework-atk-300', 2),
  ('deck-opp-ch4-soldado-patrulla-v1', 7, 'trap-runtime-punish', 2),
  ('deck-opp-ch4-soldado-patrulla-v1', 8, 'trap-tor-smokescreen', 1);

-- ── Duelo 9 del capítulo 4 ───────────────────────────────────────────────────
-- Se puede topar nada más entrar al laberinto 1 → basta con haber pasado el centinela de entrada (duel-1).
insert into public.story_duels
  (id, chapter, duel_index, title, description, opponent_id, deck_list_id, opening_hand_size,
   starter_player, reward_nexus, reward_player_experience, unlock_requirement_duel_id, is_boss_duel, is_active)
values
  ('story-ch4-duel-9', 4, 9, 'Centinela de Ronda',
   'Un Soldado-Terminal patrulla los pasillos del primer laberinto. Si su haz te pilla cruzando, no hay huida.',
   'opp-ch4-soldado-terminal', 'deck-opp-ch4-soldado-patrulla-v1', 4, 'RANDOM', 720, 380, 'story-ch4-duel-1', false, true)
on conflict (id) do update set
  chapter = excluded.chapter, duel_index = excluded.duel_index, title = excluded.title, description = excluded.description,
  opponent_id = excluded.opponent_id, deck_list_id = excluded.deck_list_id, opening_hand_size = excluded.opening_hand_size,
  starter_player = excluded.starter_player, reward_nexus = excluded.reward_nexus,
  reward_player_experience = excluded.reward_player_experience, unlock_requirement_duel_id = excluded.unlock_requirement_duel_id,
  is_boss_duel = excluded.is_boss_duel, is_active = excluded.is_active, updated_at = now();

-- ── Dificultad por aparición (perfil de IA) ──────────────────────────────────
insert into public.story_duel_ai_profiles (duel_id, difficulty, ai_profile, is_active)
values
  ('story-ch4-duel-9', 'ELITE', '{"style":"balanced","aggression":0.7}'::jsonb, true)
on conflict (duel_id) do update set
  difficulty = excluded.difficulty, ai_profile = excluded.ai_profile, is_active = excluded.is_active, updated_at = now();
