-- docs/supabase/sql/082_arena_opponents_seed.sql - Siembra los presets/variantes/tiers de arena actuales 1:1 (espejo de los constantes de training en código).
INSERT INTO arena_opponents (id, code_name, display_name, avatar_url, intro_url, story_opponent_id, sort_order) VALUES
  ('training-tier-1','gen-nvim','GenNvim','/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.webp','/assets/story/opponents/opp-ch1-apprentice/intro-GenNvim.webp','opp-gennvim',1),
  ('training-tier-1-alt','helena-alt','Helena','/assets/story/opponents/opp-ch1-helena/avatar-Helena.webp','/assets/story/opponents/opp-ch1-helena/intro-Helena.webp','opp-helena',2),
  ('training-tier-2','helena','Helena','/assets/story/opponents/opp-ch1-helena/avatar-Helena.webp','/assets/story/opponents/opp-ch1-helena/intro-Helena.webp','opp-helena',3),
  ('training-tier-3','jaku','Jaku','/assets/story/opponents/opp-ch1-jaku/avatar-Jaku.webp','/assets/story/opponents/opp-ch1-jaku/intro-Jaku.webp','opp-jaku',4),
  ('training-tier-4','biglog','BigLog','/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp','/assets/story/opponents/opp-ch1-biglog/intro-BigLog.webp','opp-biglog',5),
  ('training-tier-5','soldado','Soldado','/assets/story/opponents/opp-ch1-soldier-act01/avatar-Soldado-act01.webp','/assets/story/opponents/opp-ch1-soldier-act01/intro-Soldado-act01.webp','opp-soldier-act01',6)
ON CONFLICT (id) DO UPDATE SET code_name=EXCLUDED.code_name, display_name=EXCLUDED.display_name, avatar_url=EXCLUDED.avatar_url, intro_url=EXCLUDED.intro_url, story_opponent_id=EXCLUDED.story_opponent_id, sort_order=EXCLUDED.sort_order, updated_at=now();

INSERT INTO arena_opponent_deck_variants (id, opponent_id, label, sort_order) VALUES
  ('starter-tools','training-tier-1','Starter Tools',1),
  ('starter-control','training-tier-1','Starter Control',2),
  ('starter-alt-ops','training-tier-1-alt','Starter Alt Ops',1),
  ('framework-burst','training-tier-2','Framework Burst',1),
  ('framework-tempo','training-tier-2','Framework Tempo',2),
  ('fusion-pressure','training-tier-3','Fusion Pressure',1),
  ('fusion-attrition','training-tier-3','Fusion Attrition',2),
  ('biglog-offense','training-tier-4','BigLog Offense',1),
  ('biglog-control','training-tier-4','BigLog Control',2),
  ('sentinel-apex','training-tier-5','Sentinel Apex',1),
  ('sentinel-lock','training-tier-5','Sentinel Lock',2)
ON CONFLICT (id) DO UPDATE SET opponent_id=EXCLUDED.opponent_id, label=EXCLUDED.label, sort_order=EXCLUDED.sort_order, updated_at=now();

INSERT INTO arena_tiers (tier, code, required_wins_in_previous_tier, ai_difficulty, opponent_id, reward_multiplier) VALUES
  (1,'BOOT',0,'EASY','training-tier-1',1),
  (2,'SPARK',5,'NORMAL','training-tier-2',1.2),
  (3,'CORE',5,'NORMAL','training-tier-3',1.4),
  (4,'ASCENT',5,'HARD','training-tier-4',1.7),
  (5,'NEXUS',5,'BOSS','training-tier-5',2.1)
ON CONFLICT (tier) DO UPDATE SET code=EXCLUDED.code, required_wins_in_previous_tier=EXCLUDED.required_wins_in_previous_tier, ai_difficulty=EXCLUDED.ai_difficulty, opponent_id=EXCLUDED.opponent_id, reward_multiplier=EXCLUDED.reward_multiplier, updated_at=now();

DELETE FROM arena_deck_variant_cards;

INSERT INTO arena_deck_variant_cards (variant_id, card_id, zone, sort_order)
SELECT v.variant_id, c.card_id, v.zone, c.ord FROM (VALUES
  ('starter-tools','DECK',ARRAY['entity-vscode','entity-git','entity-react','entity-astro','entity-perplexity','entity-python','entity-ollama','entity-n8n','entity-make','entity-github','exec-draw-1','exec-boost-atk-400','exec-direct-damage-600','exec-heal-700','trap-atk-drain','trap-counter-intrusion','entity-nextjs','entity-openclaw','entity-supabase','entity-postgress']),
  ('starter-tools','FUSION',ARRAY['fusion-pytgress','fusion-gemgpt']),
  ('starter-control','DECK',ARRAY['entity-vscode','entity-git','entity-react','entity-astro','entity-perplexity','entity-python','entity-ollama','entity-n8n','entity-make','entity-openclaw','exec-draw-1','exec-heal-700','exec-framework-atk-300','exec-llm-def-300','trap-atk-drain','trap-counter-intrusion','trap-def-fragment','entity-nextjs','entity-supabase','entity-postgress']),
  ('starter-control','FUSION',ARRAY['fusion-pytgress','fusion-gemgpt']),
  ('starter-alt-ops','DECK',ARRAY['entity-vscode','entity-git','entity-react','entity-astro','entity-perplexity','entity-python','entity-ollama','entity-n8n','entity-make','entity-github','exec-draw-1','exec-framework-atk-300','exec-direct-damage-600','exec-heal-700','trap-atk-drain','trap-counter-intrusion','trap-def-fragment','entity-nextjs','entity-supabase','entity-postgress']),
  ('starter-alt-ops','FUSION',ARRAY['fusion-pytgress','fusion-gemgpt']),
  ('framework-burst','DECK',ARRAY['entity-react','entity-nextjs','entity-astro','entity-huggenface','entity-vercel','entity-chatgpt','entity-gemini','entity-python','entity-postgress','entity-supabase','exec-framework-atk-300','exec-llm-def-300','exec-draw-1','exec-direct-damage-900','exec-heal-700','trap-runtime-punish','trap-def-fragment','trap-atk-drain','entity-openclaw','entity-github']),
  ('framework-burst','FUSION',ARRAY['fusion-gemgpt','fusion-pytgress']),
  ('framework-tempo','DECK',ARRAY['entity-react','entity-nextjs','entity-astro','entity-vercel','entity-github','entity-chatgpt','entity-gemini','entity-python','entity-postgress','entity-supabase','exec-framework-atk-300','exec-boost-atk-400','exec-draw-1','exec-direct-damage-600','exec-heal-700','trap-runtime-punish','trap-def-fragment','trap-counter-intrusion','entity-openclaw','entity-claude']),
  ('framework-tempo','FUSION',ARRAY['fusion-gemgpt','fusion-pytgress']),
  ('fusion-pressure','DECK',ARRAY['entity-kali-linux','entity-claude','entity-deepseek','entity-chatgpt','entity-gemini','entity-python','entity-postgress','entity-nextjs','entity-react','entity-openclaw','exec-fusion-gemgpt','exec-fusion-kaclauli','exec-direct-damage-900','exec-direct-damage-600','exec-llm-def-300','exec-framework-atk-300','trap-kernel-panic','trap-counter-intrusion','trap-runtime-punish','trap-atk-drain']),
  ('fusion-pressure','FUSION',ARRAY['fusion-kaclauli','fusion-gemgpt']),
  ('fusion-attrition','DECK',ARRAY['entity-kali-linux','entity-claude','entity-deepseek','entity-chatgpt','entity-gemini','entity-python','entity-postgress','entity-nextjs','entity-react','entity-openclaw','exec-fusion-gemgpt','exec-fusion-kaclauli','exec-draw-1','exec-heal-700','exec-llm-def-300','exec-boost-atk-400','trap-kernel-panic','trap-counter-intrusion','trap-runtime-punish','trap-def-fragment']),
  ('fusion-attrition','FUSION',ARRAY['fusion-kaclauli','fusion-gemgpt']),
  ('biglog-offense','DECK',ARRAY['entity-chatgpt','entity-gemini','entity-claude','entity-kali-linux','entity-python','entity-postgress','entity-react','entity-nextjs','entity-openclaw','entity-deepseek','exec-fusion-gemgpt','exec-fusion-kaclauli','exec-fusion-pytgress','exec-draw-1','exec-boost-atk-400','exec-direct-damage-900','trap-kernel-panic','trap-runtime-punish','trap-counter-intrusion','trap-atk-drain']),
  ('biglog-offense','FUSION',ARRAY['fusion-gemgpt','fusion-kaclauli']),
  ('biglog-control','DECK',ARRAY['entity-chatgpt','entity-gemini','entity-claude','entity-kali-linux','entity-python','entity-postgress','entity-react','entity-nextjs','entity-openclaw','entity-deepseek','exec-fusion-gemgpt','exec-fusion-kaclauli','exec-fusion-pytgress','exec-heal-700','exec-llm-def-300','exec-framework-atk-300','trap-kernel-panic','trap-runtime-punish','trap-counter-intrusion','trap-def-fragment']),
  ('biglog-control','FUSION',ARRAY['fusion-gemgpt','fusion-kaclauli']),
  ('sentinel-apex','DECK',ARRAY['entity-chatgpt','entity-chatgpt','entity-gemini','entity-claude','entity-kali-linux','entity-python','entity-postgress','entity-deepseek','entity-nextjs','entity-react','exec-fusion-gemgpt','exec-fusion-kaclauli','exec-fusion-pytgress','exec-llm-def-300','exec-boost-atk-400','exec-direct-damage-900','trap-kernel-panic','trap-counter-intrusion','trap-runtime-punish','trap-atk-drain']),
  ('sentinel-apex','FUSION',ARRAY['fusion-gemgpt','fusion-kaclauli']),
  ('sentinel-lock','DECK',ARRAY['entity-chatgpt','entity-gemini','entity-claude','entity-kali-linux','entity-python','entity-postgress','entity-deepseek','entity-nextjs','entity-react','entity-openclaw','exec-fusion-gemgpt','exec-fusion-kaclauli','exec-fusion-pytgress','exec-draw-1','exec-heal-700','exec-direct-damage-900','trap-kernel-panic','trap-counter-intrusion','trap-runtime-punish','trap-def-fragment']),
  ('sentinel-lock','FUSION',ARRAY['fusion-gemgpt','fusion-kaclauli'])
) AS v(variant_id, zone, cards)
CROSS JOIN LATERAL unnest(v.cards) WITH ORDINALITY AS c(card_id, ord);
