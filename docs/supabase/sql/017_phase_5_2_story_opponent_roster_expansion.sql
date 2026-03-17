-- docs/supabase/sql/017_phase_5_2_story_opponent_roster_expansion.sql - Normaliza nombres visibles y amplía roster Story con 4 oponentes y mazos dedicados.
insert into public.story_opponents (id, display_name, description, avatar_url, difficulty, ai_profile, is_active)
values
  ('opp-ch1-apprentice', 'GenNvim', 'Duelista de iniciación del capítulo 1.', '/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.png', 'ROOKIE', '{"style":"balanced","aggression":0.35}'::jsonb, true),
  ('opp-ch1-biglog', 'BigLog', 'Especialista en trampas y control de ritmo.', null, 'ELITE', '{"style":"control","aggression":0.57}'::jsonb, true),
  ('opp-ch1-jaku', 'Jaku', 'Duelista agresivo que presiona con daño directo.', null, 'STANDARD', '{"style":"aggressive","aggression":0.62}'::jsonb, true),
  ('opp-ch1-helena', 'Helena', 'Táctica de combo con cierres explosivos.', null, 'BOSS', '{"style":"combo","aggression":0.68}'::jsonb, true),
  ('opp-ch1-soldier-act01', 'Soldado Acto 01', 'Unidad de choque del primer acto.', null, 'ROOKIE', '{"style":"balanced","aggression":0.41}'::jsonb, true)
on conflict (id) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  avatar_url = excluded.avatar_url,
  difficulty = excluded.difficulty,
  ai_profile = excluded.ai_profile,
  is_active = excluded.is_active;

insert into public.story_deck_lists (id, opponent_id, name, description, version, is_active)
values
  ('deck-opp-ch1-biglog-v1', 'opp-ch1-biglog', 'BigLog v1', 'Mazo de trampas y control con castigo reactivo.', 1, true),
  ('deck-opp-ch1-jaku-v1', 'opp-ch1-jaku', 'Jaku v1', 'Mazo ofensivo de presión con ejecuciones directas.', 1, true),
  ('deck-opp-ch1-helena-v1', 'opp-ch1-helena', 'Helena v1', 'Mazo boss de combo orientado a fusión.', 1, true),
  ('deck-opp-ch1-soldier-act01-v1', 'opp-ch1-soldier-act01', 'Soldado Acto 01 v1', 'Mazo rookie estable para curva de aprendizaje.', 1, true)
on conflict (id) do update set
  opponent_id = excluded.opponent_id,
  name = excluded.name,
  description = excluded.description,
  version = excluded.version,
  is_active = excluded.is_active;

delete from public.story_deck_list_cards
where deck_list_id in (
  'deck-opp-ch1-biglog-v1',
  'deck-opp-ch1-jaku-v1',
  'deck-opp-ch1-helena-v1',
  'deck-opp-ch1-soldier-act01-v1'
);

insert into public.story_deck_list_cards (deck_list_id, slot_index, card_id, copies)
values
  ('deck-opp-ch1-soldier-act01-v1', 0, 'entity-python', 2),
  ('deck-opp-ch1-soldier-act01-v1', 1, 'entity-react', 2),
  ('deck-opp-ch1-soldier-act01-v1', 2, 'entity-supabase', 2),
  ('deck-opp-ch1-soldier-act01-v1', 3, 'entity-postgress', 2),
  ('deck-opp-ch1-soldier-act01-v1', 4, 'exec-draw-1', 2),
  ('deck-opp-ch1-soldier-act01-v1', 5, 'exec-boost-atk-400', 2),
  ('deck-opp-ch1-soldier-act01-v1', 6, 'trap-atk-drain', 2),
  ('deck-opp-ch1-soldier-act01-v1', 7, 'trap-def-fragment', 2),
  ('deck-opp-ch1-jaku-v1', 0, 'entity-github', 2),
  ('deck-opp-ch1-jaku-v1', 1, 'entity-openclaw', 2),
  ('deck-opp-ch1-jaku-v1', 2, 'entity-kali-linux', 2),
  ('deck-opp-ch1-jaku-v1', 3, 'entity-chatgpt', 2),
  ('deck-opp-ch1-jaku-v1', 4, 'exec-direct-damage-600', 3),
  ('deck-opp-ch1-jaku-v1', 5, 'exec-boost-atk-400', 3),
  ('deck-opp-ch1-jaku-v1', 6, 'exec-draw-1', 2),
  ('deck-opp-ch1-jaku-v1', 7, 'trap-counter-intrusion', 2),
  ('deck-opp-ch1-biglog-v1', 0, 'entity-kali-linux', 2),
  ('deck-opp-ch1-biglog-v1', 1, 'entity-openclaw', 2),
  ('deck-opp-ch1-biglog-v1', 2, 'entity-github', 2),
  ('deck-opp-ch1-biglog-v1', 3, 'entity-chatgpt', 2),
  ('deck-opp-ch1-biglog-v1', 4, 'exec-llm-def-300', 3),
  ('deck-opp-ch1-biglog-v1', 5, 'exec-heal-700', 2),
  ('deck-opp-ch1-biglog-v1', 6, 'trap-runtime-punish', 3),
  ('deck-opp-ch1-biglog-v1', 7, 'trap-kernel-panic', 2),
  ('deck-opp-ch1-biglog-v1', 8, 'trap-counter-intrusion', 2),
  ('deck-opp-ch1-helena-v1', 0, 'entity-chatgpt', 2),
  ('deck-opp-ch1-helena-v1', 1, 'entity-gemini', 2),
  ('deck-opp-ch1-helena-v1', 2, 'entity-claude', 2),
  ('deck-opp-ch1-helena-v1', 3, 'entity-kali-linux', 2),
  ('deck-opp-ch1-helena-v1', 4, 'exec-fusion-gemgpt', 2),
  ('deck-opp-ch1-helena-v1', 5, 'exec-fusion-kaclauli', 2),
  ('deck-opp-ch1-helena-v1', 6, 'exec-draw-1', 2),
  ('deck-opp-ch1-helena-v1', 7, 'exec-boost-atk-400', 2),
  ('deck-opp-ch1-helena-v1', 8, 'trap-kernel-panic', 2),
  ('deck-opp-ch1-helena-v1', 9, 'trap-runtime-punish', 2);
