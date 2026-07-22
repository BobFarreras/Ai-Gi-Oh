-- docs/supabase/sql/145_story_act4_gennvim_flow.sql - Contenido del Acto 4 (Núcleo GenNvim): oponentes, decks,
-- duelos, dificultad y recompensas. Idempotente (ON CONFLICT DO UPDATE). Roster: Soldado-Terminal (centinela,
-- 5 duelos), GenNvim (boss 1) y Midutech (boss final). Los ids de duelo (story-ch4-duel-N) coinciden con los
-- objetos DUEL del tilemap del overworld (act-4). Mazos base para retocar desde el admin.
--
-- ORDEN DE DESPLIEGUE: aplicar en el release del Acto 4 (tras desplegar el código del mapa). Reutiliza cartas
-- ya existentes en el catálogo; los avatares ya están en assets.

-- ── Oponentes ────────────────────────────────────────────────────────────────
insert into public.story_opponents (id, display_name, description, avatar_url, difficulty, ai_profile, is_active)
values
  ('opp-ch4-soldado-terminal', 'Soldado-Terminal',
   'Proceso centinela del Núcleo GenNvim; patrulla los pasillos verdes del mainframe.',
   '/assets/story/opponents/opp-ch4-soldado-terminal/avatar-Soldado-terminal.webp',
   'ELITE', '{"style":"aggressive","aggression":0.6}'::jsonb, true),
  ('opp-ch4-gennvim', 'GenNvim',
   'El kernel corporativo de seguridad que compiló a la Entidad. Se defiende con daemons y golpea fuerte.',
   '/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.webp',
   'MYTHIC', '{"style":"aggressive","aggression":0.8}'::jsonb, true),
  ('opp-ch4-midutech', 'Midutech',
   'El arquitecto humano detrás de GenNvim. Guarda la llave del Core. El cierre del Acto 4.',
   '/assets/story/opponents/opp-ch1-midutech/avatar-Midutech.webp',
   'MYTHIC', '{"style":"control","aggression":0.78}'::jsonb, true)
on conflict (id) do update set
  display_name = excluded.display_name, description = excluded.description, avatar_url = excluded.avatar_url,
  difficulty = excluded.difficulty, ai_profile = excluded.ai_profile, is_active = excluded.is_active, updated_at = now();

-- ── Deck lists ───────────────────────────────────────────────────────────────
insert into public.story_deck_lists (id, opponent_id, name, description, version, is_active)
values
  ('deck-opp-ch4-soldado-terminal-v1', 'opp-ch4-soldado-terminal', 'Soldado-Terminal v1', 'Centinela del mainframe: entidades de sistema y control.', 1, true),
  ('deck-opp-ch4-gennvim-v1', 'opp-ch4-gennvim', 'GenNvim v1', 'Kernel de la fundición: entidades pesadas (>1800 ATK) y presión.', 1, true),
  ('deck-opp-ch4-midutech-v1', 'opp-ch4-midutech', 'Midutech v1', 'El arquitecto: fusiones y buffs, control de campo agresivo.', 1, true)
on conflict (id) do update set
  opponent_id = excluded.opponent_id, name = excluded.name, description = excluded.description,
  version = excluded.version, is_active = excluded.is_active, updated_at = now();

-- Soldado-Terminal (ELITE): entidades medias + control.
delete from public.story_deck_list_cards where deck_list_id = 'deck-opp-ch4-soldado-terminal-v1';
insert into public.story_deck_list_cards (deck_list_id, slot_index, card_id, copies) values
  ('deck-opp-ch4-soldado-terminal-v1', 0, 'entity-typescript', 2),
  ('deck-opp-ch4-soldado-terminal-v1', 1, 'entity-docker', 2),
  ('deck-opp-ch4-soldado-terminal-v1', 2, 'entity-mongodb', 2),
  ('deck-opp-ch4-soldado-terminal-v1', 3, 'entity-vue', 2),
  ('deck-opp-ch4-soldado-terminal-v1', 4, 'entity-javascript', 2),
  ('deck-opp-ch4-soldado-terminal-v1', 5, 'exec-docker-defense-1000', 2),
  ('deck-opp-ch4-soldado-terminal-v1', 6, 'exec-draw-1', 1),
  ('deck-opp-ch4-soldado-terminal-v1', 7, 'trap-tor-smokescreen', 2),
  ('deck-opp-ch4-soldado-terminal-v1', 8, 'trap-runtime-punish', 1);

-- GenNvim (MYTHIC): 5 entidades con ATK > 1800 + soporte.
delete from public.story_deck_list_cards where deck_list_id = 'deck-opp-ch4-gennvim-v1';
insert into public.story_deck_list_cards (deck_list_id, slot_index, card_id, copies) values
  ('deck-opp-ch4-gennvim-v1', 0, 'entity-chatgpt-annihilator', 2),
  ('deck-opp-ch4-gennvim-v1', 1, 'entity-rust', 2),
  ('deck-opp-ch4-gennvim-v1', 2, 'entity-kubernetes', 2),
  ('deck-opp-ch4-gennvim-v1', 3, 'entity-cpp', 2),
  ('deck-opp-ch4-gennvim-v1', 4, 'entity-unreal-engine', 2),
  ('deck-opp-ch4-gennvim-v1', 5, 'exec-direct-damage-900', 2),
  ('deck-opp-ch4-gennvim-v1', 6, 'exec-framework-atk-300', 2),
  ('deck-opp-ch4-gennvim-v1', 7, 'trap-hydra-counter', 2),
  ('deck-opp-ch4-gennvim-v1', 8, 'trap-kernel-panic', 1);

-- Midutech (MYTHIC final): entidades LLM + fusiones + buffs/daño.
delete from public.story_deck_list_cards where deck_list_id = 'deck-opp-ch4-midutech-v1';
insert into public.story_deck_list_cards (deck_list_id, slot_index, card_id, copies) values
  ('deck-opp-ch4-midutech-v1', 0, 'entity-chatgpt', 2),
  ('deck-opp-ch4-midutech-v1', 1, 'entity-gemini', 2),
  ('deck-opp-ch4-midutech-v1', 2, 'entity-claude', 2),
  ('deck-opp-ch4-midutech-v1', 3, 'entity-deepseek', 2),
  ('deck-opp-ch4-midutech-v1', 4, 'entity-nextjs', 2),
  ('deck-opp-ch4-midutech-v1', 5, 'exec-fusion-gemgpt', 1),
  ('deck-opp-ch4-midutech-v1', 6, 'exec-fusion-kaclauli', 1),
  ('deck-opp-ch4-midutech-v1', 7, 'exec-boost-atk-400', 2),
  ('deck-opp-ch4-midutech-v1', 8, 'exec-direct-damage-900', 2),
  ('deck-opp-ch4-midutech-v1', 9, 'trap-counter-intrusion', 2);

-- ── Duelos del capítulo 4 ────────────────────────────────────────────────────
-- 1-5: Soldado-Terminal (centinelas). 6: GenNvim (boss 1). 7: Midutech (boss final).
insert into public.story_duels
  (id, chapter, duel_index, title, description, opponent_id, deck_list_id, opening_hand_size,
   starter_player, reward_nexus, reward_player_experience, unlock_requirement_duel_id, is_boss_duel, is_active)
values
  ('story-ch4-duel-1', 4, 1, 'Centinela de Entrada', 'Un Soldado-Terminal vigila la boca del mainframe.',
   'opp-ch4-soldado-terminal', 'deck-opp-ch4-soldado-terminal-v1', 4, 'RANDOM', 640, 340, 'story-ch3-duel-6', false, true),
  ('story-ch4-duel-2', 4, 2, 'Guardia de la Rama', 'Otro centinela bloquea el acceso a una rama del núcleo.',
   'opp-ch4-soldado-terminal', 'deck-opp-ch4-soldado-terminal-v1', 4, 'RANDOM', 660, 350, 'story-ch4-duel-1', false, true),
  ('story-ch4-duel-3', 4, 3, 'Corredor del Flujo', 'La ruta de las pasarelas está patrullada por un Soldado-Terminal.',
   'opp-ch4-soldado-terminal', 'deck-opp-ch4-soldado-terminal-v1', 4, 'RANDOM', 700, 370, 'story-ch4-duel-2', false, true),
  ('story-ch4-duel-4', 4, 4, 'Guardián del Laberinto', 'Un centinela custodia el laberinto de cajas y cintas.',
   'opp-ch4-soldado-terminal', 'deck-opp-ch4-soldado-terminal-v1', 4, 'RANDOM', 720, 380, 'story-ch4-duel-3', false, true),
  ('story-ch4-duel-5', 4, 5, 'Antesala del Núcleo', 'El último centinela antes del terminal del núcleo.',
   'opp-ch4-soldado-terminal', 'deck-opp-ch4-soldado-terminal-v1', 4, 'RANDOM', 760, 400, 'story-ch4-duel-4', false, true),
  ('story-ch4-duel-6', 4, 6, 'GenNvim: Kernel de la Fundición', 'GenNvim se manifiesta para expulsarte. Boss del núcleo.',
   'opp-ch4-gennvim', 'deck-opp-ch4-gennvim-v1', 4, 'OPPONENT', 1100, 600, 'story-ch4-duel-5', true, true),
  ('story-ch4-duel-7', 4, 7, 'Midutech: El Arquitecto', 'El humano tras el sistema. Vencerlo da la llave del Core. Cierre del Acto 4.',
   'opp-ch4-midutech', 'deck-opp-ch4-midutech-v1', 4, 'OPPONENT', 1500, 800, 'story-ch4-duel-6', true, true)
on conflict (id) do update set
  chapter = excluded.chapter, duel_index = excluded.duel_index, title = excluded.title, description = excluded.description,
  opponent_id = excluded.opponent_id, deck_list_id = excluded.deck_list_id, opening_hand_size = excluded.opening_hand_size,
  starter_player = excluded.starter_player, reward_nexus = excluded.reward_nexus,
  reward_player_experience = excluded.reward_player_experience, unlock_requirement_duel_id = excluded.unlock_requirement_duel_id,
  is_boss_duel = excluded.is_boss_duel, is_active = excluded.is_active, updated_at = now();

-- ── Dificultad por aparición (perfil de IA) ──────────────────────────────────
insert into public.story_duel_ai_profiles (duel_id, difficulty, ai_profile, is_active)
values
  ('story-ch4-duel-1', 'ELITE',  '{"style":"aggressive","aggression":0.62}'::jsonb, true),
  ('story-ch4-duel-2', 'ELITE',  '{"style":"aggressive","aggression":0.66}'::jsonb, true),
  ('story-ch4-duel-3', 'ELITE',  '{"style":"control","aggression":0.64}'::jsonb, true),
  ('story-ch4-duel-4', 'ELITE',  '{"style":"aggressive","aggression":0.70}'::jsonb, true),
  ('story-ch4-duel-5', 'ELITE',  '{"style":"combo","aggression":0.72}'::jsonb, true),
  ('story-ch4-duel-6', 'MYTHIC', '{"style":"aggressive","aggression":0.85}'::jsonb, true),
  ('story-ch4-duel-7', 'MYTHIC', '{"style":"control","aggression":0.88}'::jsonb, true)
on conflict (duel_id) do update set
  difficulty = excluded.difficulty, ai_profile = excluded.ai_profile, is_active = excluded.is_active, updated_at = now();

-- ── Recompensas de carta garantizadas (reutilizan el catálogo existente) ─────
insert into public.story_duel_reward_cards (duel_id, card_id, copies, drop_rate, is_guaranteed)
values
  ('story-ch4-duel-3', 'fusion-rustyfox',    1, 1.0000, true),
  ('story-ch4-duel-5', 'fusion-kuberlinnet', 1, 1.0000, true),
  ('story-ch4-duel-6', 'fusion-gemgpt',      1, 1.0000, true),
  ('story-ch4-duel-7', 'fusion-super-c',     1, 1.0000, true)
on conflict (duel_id, card_id) do update set
  copies = excluded.copies, drop_rate = excluded.drop_rate, is_guaranteed = excluded.is_guaranteed, updated_at = now();
