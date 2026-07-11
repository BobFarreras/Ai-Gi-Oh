-- docs/supabase/sql/090_story_act3_jaku_flow.sql - Contenido del Acto 3 (Repositorio Fantasma / Jaku): oponentes, decks, duelos, dificultad y recompensas.
-- Idempotente (ON CONFLICT DO UPDATE). Roster del acto: Soldado-Laptop (soldado del acto, oponente + deck nuevos)
-- y Jaku (aparición media + jefe, con deck rehecho). No usa BigLog (ya se combate en el Acto 2).
--
-- Decks con cartas EXCLUSIVAS del acto (no usadas por otros oponentes). Jaku lleva 5 entidades con ataque > 1800.
-- Los ids de duelo (story-ch3-duel-N) coinciden con los objetos del tilemap del overworld (act-3).

-- ── Oponente nuevo: Soldado-Laptop ───────────────────────────────────────────
insert into public.story_opponents (id, display_name, description, avatar_url, difficulty, ai_profile, is_active)
values (
  'opp-soldado-laptop',
  'Soldado-Laptop',
  'Proceso militar reconvertido en centinela del Repositorio Fantasma; patrulla los corredores del Deep Net.',
  '/assets/story/opponents/opp-ch3-soldado-laptop/avatar-Soldado-laptop.webp',
  'ELITE',
  '{"style":"aggressive","aggression":0.55}'::jsonb,
  true
)
on conflict (id) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  avatar_url = excluded.avatar_url,
  difficulty = excluded.difficulty,
  ai_profile = excluded.ai_profile,
  is_active = excluded.is_active,
  updated_at = now();

-- ── Deck lists (Soldado-Laptop nuevo; Jaku se rehace) ────────────────────────
insert into public.story_deck_lists (id, opponent_id, name, description, version, is_active)
values
  ('deck-opp-soldado-laptop-v1', 'opp-soldado-laptop', 'Soldado-Laptop v1', 'Centinela del Deep Net: entidades de sistema y control de campo.', 1, true),
  ('deck-opp-jaku-v1', 'opp-jaku', 'Jaku v1', 'Nucleo fantasma de Jaku: entidades pesadas (>1800 ATK) y presion sostenida.', 1, true)
on conflict (id) do update set
  opponent_id = excluded.opponent_id,
  name = excluded.name,
  description = excluded.description,
  version = excluded.version,
  is_active = excluded.is_active,
  updated_at = now();

-- Deck de Soldado-Laptop: cartas exclusivas (nadie mas las usa).
delete from public.story_deck_list_cards where deck_list_id = 'deck-opp-soldado-laptop-v1';
insert into public.story_deck_list_cards (deck_list_id, slot_index, card_id, copies) values
  ('deck-opp-soldado-laptop-v1', 0, 'entity-typescript', 2),
  ('deck-opp-soldado-laptop-v1', 1, 'entity-docker', 2),
  ('deck-opp-soldado-laptop-v1', 2, 'entity-mongodb', 2),
  ('deck-opp-soldado-laptop-v1', 3, 'entity-vue', 2),
  ('deck-opp-soldado-laptop-v1', 4, 'entity-javascript', 2),
  ('deck-opp-soldado-laptop-v1', 5, 'exec-docker-defense-1000', 2),
  ('deck-opp-soldado-laptop-v1', 6, 'exec-git-salvage-hand', 1),
  ('deck-opp-soldado-laptop-v1', 7, 'trap-tor-smokescreen', 2),
  ('deck-opp-soldado-laptop-v1', 8, 'trap-nullify-opponent-trap', 1);

-- Deck de Jaku rehecho: 5 entidades con ATK > 1800 + soporte exclusivo.
delete from public.story_deck_list_cards where deck_list_id = 'deck-opp-jaku-v1';
insert into public.story_deck_list_cards (deck_list_id, slot_index, card_id, copies) values
  ('deck-opp-jaku-v1', 0, 'entity-chatgpt-annihilator', 2),
  ('deck-opp-jaku-v1', 1, 'entity-rust', 2),
  ('deck-opp-jaku-v1', 2, 'entity-kubernetes', 2),
  ('deck-opp-jaku-v1', 3, 'entity-cpp', 2),
  ('deck-opp-jaku-v1', 4, 'entity-unreal-engine', 2),
  ('deck-opp-jaku-v1', 5, 'exec-direct-damage-900', 2),
  ('deck-opp-jaku-v1', 6, 'exec-framework-atk-300', 2),
  ('deck-opp-jaku-v1', 7, 'exec-drain-opponent-energy', 1),
  ('deck-opp-jaku-v1', 8, 'trap-hydra-counter', 2),
  ('deck-opp-jaku-v1', 9, 'trap-windows92-crash', 1);

-- ── Duelos del capítulo 3 ────────────────────────────────────────────────────
-- 1-4: Soldado-Laptop (centinelas). 5: Jaku (aparicion media, pre-jefe). 6: Jaku (JEFE).
insert into public.story_duels
  (id, chapter, duel_index, title, description, opponent_id, deck_list_id, opening_hand_size,
   starter_player, reward_nexus, reward_player_experience, unlock_requirement_duel_id, is_boss_duel, is_active)
values
  ('story-ch3-duel-1', 3, 1, 'Centinela del Umbral',
   'Un Soldado-Laptop vigila la entrada a oscuras del repositorio fantasma.',
   'opp-soldado-laptop', 'deck-opp-soldado-laptop-v1', 4, 'RANDOM', 560, 300, 'story-ch2-duel-7', false, true),
  ('story-ch3-duel-2', 3, 2, 'Guardia del Hub',
   'Otro centinela bloquea el nodo central del Deep Net.',
   'opp-soldado-laptop', 'deck-opp-soldado-laptop-v1', 4, 'RANDOM', 540, 280, 'story-ch3-duel-1', false, true),
  ('story-ch3-duel-3', 3, 3, 'Corredor Vigilado',
   'La ruta hacia el nucleo esta patrullada por un Soldado-Laptop.',
   'opp-soldado-laptop', 'deck-opp-soldado-laptop-v1', 4, 'RANDOM', 600, 320, 'story-ch3-duel-2', false, true),
  ('story-ch3-duel-4', 3, 4, 'Centinela de la Cache',
   'Un centinela guarda una cache de datos en una rama sellada del repositorio.',
   'opp-soldado-laptop', 'deck-opp-soldado-laptop-v1', 4, 'RANDOM', 640, 340, 'story-ch3-duel-2', false, true),
  ('story-ch3-duel-5', 3, 5, 'Jaku: Eco del Nucleo',
   'Jaku se manifiesta en un eco para frenarte antes del nucleo. Su deck ya golpea con fuerza.',
   'opp-jaku', 'deck-opp-jaku-v1', 4, 'OPPONENT', 820, 440, 'story-ch3-duel-3', false, true),
  ('story-ch3-duel-6', 3, 6, 'Jaku: Nucleo Fantasma',
   'Jaku consolida los forks en su nucleo. El cierre del Acto 3.',
   'opp-jaku', 'deck-opp-jaku-v1', 4, 'OPPONENT', 1200, 640, 'story-ch3-duel-5', true, true)
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
  is_active = excluded.is_active,
  updated_at = now();

-- ── Dificultad por aparición (perfil de IA) ──────────────────────────────────
insert into public.story_duel_ai_profiles (duel_id, difficulty, ai_profile, is_active)
values
  ('story-ch3-duel-1', 'ELITE',  '{"style":"aggressive","aggression":0.58}'::jsonb, true),
  ('story-ch3-duel-2', 'ELITE',  '{"style":"aggressive","aggression":0.62}'::jsonb, true),
  ('story-ch3-duel-3', 'ELITE',  '{"style":"aggressive","aggression":0.66}'::jsonb, true),
  ('story-ch3-duel-4', 'ELITE',  '{"style":"control","aggression":0.60}'::jsonb, true),
  ('story-ch3-duel-5', 'ELITE',  '{"style":"combo","aggression":0.72}'::jsonb, true),
  ('story-ch3-duel-6', 'MYTHIC', '{"style":"aggressive","aggression":0.84}'::jsonb, true)
on conflict (duel_id) do update set
  difficulty = excluded.difficulty,
  ai_profile = excluded.ai_profile,
  is_active = excluded.is_active,
  updated_at = now();

-- ── Recompensas de carta garantizadas (reutilizan el catálogo existente) ─────
insert into public.story_duel_reward_cards (duel_id, card_id, copies, drop_rate, is_guaranteed)
values
  ('story-ch3-duel-1', 'trap-runtime-punish', 1, 1.0000, true),
  ('story-ch3-duel-3', 'fusion-rustyfox',     1, 1.0000, true),
  ('story-ch3-duel-4', 'fusion-kuberlinnet',  1, 1.0000, true),
  ('story-ch3-duel-6', 'fusion-super-c',      1, 1.0000, true)
on conflict (duel_id, card_id) do update set
  copies = excluded.copies,
  drop_rate = excluded.drop_rate,
  is_guaranteed = excluded.is_guaranteed,
  updated_at = now();
