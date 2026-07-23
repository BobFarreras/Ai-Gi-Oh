-- docs/supabase/sql/146_story_act4_hydra_duel.sql - Duelo EXTRA del Acto 4 (PASO 4): GenNvim custodia la carta
-- Hydra al fondo del maze de la sala izquierda alta (leftUp). Idempotente (ON CONFLICT DO UPDATE). Sigue el
-- patrón de 145_story_act4_gennvim_flow.sql. El id de duelo (story-ch4-duel-8) coincide con el objeto DUEL del
-- tilemap (act-4) y con duelHref /hub/story/chapter/4/duel/8. La CARTA Hydra NO es recompensa del duelo: se coge
-- aparte como REWARD_CARD (story-ch4-card-hydra). Recompensa del duelo: nexus/XP.
--
-- ORDEN DE DESPLIEGUE: aplicar en/tras el release del Acto 4 (después de 145). Reutiliza el avatar de GenNvim.

-- ── Oponente ─────────────────────────────────────────────────────────────────
insert into public.story_opponents (id, display_name, description, avatar_url, difficulty, ai_profile, is_active)
values
  ('opp-ch4-gennvim-hydra', 'GenNvim',
   'Una instancia de GenNvim que custodia la carta Hydra, forjada con código oscuro. Golpea fuerte.',
   '/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.webp',
   'MYTHIC', '{"style":"aggressive","aggression":0.82}'::jsonb, true)
on conflict (id) do update set
  display_name = excluded.display_name, description = excluded.description, avatar_url = excluded.avatar_url,
  difficulty = excluded.difficulty, ai_profile = excluded.ai_profile, is_active = excluded.is_active, updated_at = now();

-- ── Deck list ────────────────────────────────────────────────────────────────
insert into public.story_deck_lists (id, opponent_id, name, description, version, is_active)
values
  ('deck-opp-ch4-gennvim-hydra-v1', 'opp-ch4-gennvim-hydra', 'GenNvim (Hydra) v1', 'Guardián de la Hydra: entidades pesadas (>1800 ATK) y presión.', 1, true)
on conflict (id) do update set
  opponent_id = excluded.opponent_id, name = excluded.name, description = excluded.description,
  version = excluded.version, is_active = excluded.is_active, updated_at = now();

-- GenNvim (Hydra, MYTHIC): entidades ATK alto + soporte (mismo suelo que el boss GenNvim).
delete from public.story_deck_list_cards where deck_list_id = 'deck-opp-ch4-gennvim-hydra-v1';
insert into public.story_deck_list_cards (deck_list_id, slot_index, card_id, copies) values
  ('deck-opp-ch4-gennvim-hydra-v1', 0, 'entity-chatgpt-annihilator', 2),
  ('deck-opp-ch4-gennvim-hydra-v1', 1, 'entity-rust', 2),
  ('deck-opp-ch4-gennvim-hydra-v1', 2, 'entity-kubernetes', 2),
  ('deck-opp-ch4-gennvim-hydra-v1', 3, 'entity-cpp', 2),
  ('deck-opp-ch4-gennvim-hydra-v1', 4, 'entity-unreal-engine', 2),
  ('deck-opp-ch4-gennvim-hydra-v1', 5, 'exec-direct-damage-900', 2),
  ('deck-opp-ch4-gennvim-hydra-v1', 6, 'exec-framework-atk-300', 2),
  ('deck-opp-ch4-gennvim-hydra-v1', 7, 'trap-hydra-counter', 2),
  ('deck-opp-ch4-gennvim-hydra-v1', 8, 'trap-kernel-panic', 1);

-- ── Duelo 8 del capítulo 4 ───────────────────────────────────────────────────
-- Se alcanza físicamente tras duel-4 (guardia de la entrada al maze leftUp) → unlock_requirement_duel_id.
insert into public.story_duels
  (id, chapter, duel_index, title, description, opponent_id, deck_list_id, opening_hand_size,
   starter_player, reward_nexus, reward_player_experience, unlock_requirement_duel_id, is_boss_duel, is_active)
values
  ('story-ch4-duel-8', 4, 8, 'Guardián de la Hydra', 'GenNvim custodia la carta Hydra al fondo del laberinto. Vencerlo la deja a tu alcance.',
   'opp-ch4-gennvim-hydra', 'deck-opp-ch4-gennvim-hydra-v1', 4, 'OPPONENT', 900, 500, 'story-ch4-duel-4', false, true)
on conflict (id) do update set
  chapter = excluded.chapter, duel_index = excluded.duel_index, title = excluded.title, description = excluded.description,
  opponent_id = excluded.opponent_id, deck_list_id = excluded.deck_list_id, opening_hand_size = excluded.opening_hand_size,
  starter_player = excluded.starter_player, reward_nexus = excluded.reward_nexus,
  reward_player_experience = excluded.reward_player_experience, unlock_requirement_duel_id = excluded.unlock_requirement_duel_id,
  is_boss_duel = excluded.is_boss_duel, is_active = excluded.is_active, updated_at = now();

-- ── Dificultad por aparición (perfil de IA) ──────────────────────────────────
insert into public.story_duel_ai_profiles (duel_id, difficulty, ai_profile, is_active)
values
  ('story-ch4-duel-8', 'MYTHIC', '{"style":"aggressive","aggression":0.84}'::jsonb, true)
on conflict (duel_id) do update set
  difficulty = excluded.difficulty, ai_profile = excluded.ai_profile, is_active = excluded.is_active, updated_at = now();
