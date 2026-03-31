-- docs/supabase/sql/031_phase_execution_descriptions_clarity.sql - Normaliza descripciones de cartas EXECUTION con valores explícitos de efecto.
begin;

update public.cards_catalog
set description = case id
  when 'exec-antigrabity' then 'Tus entidades TOOL ganan +300 DEF.'
  when 'exec-boost-atk-400' then 'Aumenta +400 ATK de tu entidad aliada con mayor ataque.'
  when 'exec-db-def-300' then 'Todas tus entidades DB ganan +300 DEF.'
  when 'exec-direct-damage-600' then 'Inflige 600 de daño directo al rival.'
  when 'exec-direct-damage-900' then 'Inflige 900 de daño directo al rival.'
  when 'exec-discord-sync' then 'Inflige 600 de daño directo al rival.'
  when 'exec-docker-defense-1000' then 'Fija la DEF de Docker en 1000 durante este duelo.'
  when 'exec-drain-opponent-energy' then 'Reduce la energía del rival a 0.'
  when 'exec-draw-1' then 'Roba 1 carta de tu deck.'
  when 'exec-duckduckgo-power-up' then 'Ajusta DuckDuckGo a versión 5 y nivel 5 durante este duelo.'
  when 'exec-duckduckgo-scan' then 'Roba 1 carta de tu deck.'
  when 'exec-framework-atk-300' then 'Todas tus entidades FRAMEWORK ganan +300 ATK.'
  when 'exec-fusion-gemgpt' then 'Invoca GemGPT fusionando 2 materiales: ChatGPT + Gemini.'
  when 'exec-fusion-kaclauli' then 'Invoca KaClauli fusionando 2 materiales: Claude + Kali Linux.'
  when 'exec-fusion-pytgress' then 'Invoca Pytgress fusionando 2 materiales: Python + Postgress.'
  when 'exec-git-salvage-hand' then 'Recupera 1 ENTITY de tu cementerio a la mano. Si tienes 5 cartas en mano, destruye 1 antes de añadirla.'
  when 'exec-heal-700' then 'Recuperas 700 LP.'
  when 'exec-llm-def-300' then 'Todas tus entidades LLM ganan +300 DEF.'
  when 'exec-notebookllm-archive' then 'Recuperas 700 LP.'
  when 'exec-reveal-opponent-set-card' then 'Revela 1 carta SET del rival (entidad o ejecución).'
  when 'exec-rust-redeploy-field' then 'Recupera 1 ENTITY de tu cementerio al campo. Si el campo está lleno, destruye 1 entidad aliada para liberar espacio.'
  when 'exec-steal-opponent-graveyard-card' then 'Roba 1 carta ENTITY del cementerio rival y la añade a tu mano.'
  when 'exec-wrap-overclock' then 'Todas tus entidades FRAMEWORK ganan +300 ATK.'
  else description
end
where type = 'EXECUTION'
  and id in (
    'exec-antigrabity',
    'exec-boost-atk-400',
    'exec-db-def-300',
    'exec-direct-damage-600',
    'exec-direct-damage-900',
    'exec-discord-sync',
    'exec-docker-defense-1000',
    'exec-drain-opponent-energy',
    'exec-draw-1',
    'exec-duckduckgo-power-up',
    'exec-duckduckgo-scan',
    'exec-framework-atk-300',
    'exec-fusion-gemgpt',
    'exec-fusion-kaclauli',
    'exec-fusion-pytgress',
    'exec-git-salvage-hand',
    'exec-heal-700',
    'exec-llm-def-300',
    'exec-notebookllm-archive',
    'exec-reveal-opponent-set-card',
    'exec-rust-redeploy-field',
    'exec-steal-opponent-graveyard-card',
    'exec-wrap-overclock'
  );

commit;
