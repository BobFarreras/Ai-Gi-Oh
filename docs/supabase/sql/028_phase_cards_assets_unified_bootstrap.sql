-- docs/supabase/sql/028_phase_cards_assets_unified_bootstrap.sql - Unifica alta de entidades faltantes y normalización de assets/render para ejecución única en entornos nuevos.
begin;

insert into public.cards_catalog (
  id,
  name,
  description,
  type,
  faction,
  cost,
  attack,
  defense,
  archetype,
  trigger,
  bg_url,
  render_url,
  effect,
  fusion_recipe_id,
  fusion_material_ids,
  fusion_energy_requirement,
  is_active
) values
(
  'entity-hydra',
  'Hydra',
  'Agente multicapa con presión ofensiva y respuesta distribuida.',
  'ENTITY',
  'OPEN_SOURCE',
  4,
  1580,
  1180,
  'SECURITY',
  null,
  '/assets/bgs/bg-tech.jpg',
  '/assets/renders/hydra.webp',
  null,
  null,
  '{}',
  null,
  true
),
(
  'entity-tor',
  'Tor',
  'Nodo de anonimato táctico que protege líneas críticas.',
  'ENTITY',
  'OPEN_SOURCE',
  3,
  1220,
  1220,
  'SECURITY',
  null,
  '/assets/bgs/bg-tech.jpg',
  '/assets/renders/tor.webp',
  null,
  null,
  '{}',
  null,
  true
),
(
  'entity-windows92',
  'Windows 92',
  'Sistema legacy impredecible con alta capacidad de bloqueo.',
  'ENTITY',
  'NEUTRAL',
  3,
  1180,
  1320,
  'TOOL',
  null,
  '/assets/bgs/bg-tech.jpg',
  '/assets/renders/windows92.webp',
  null,
  null,
  '{}',
  null,
  true
),
(
  'entity-midjourney',
  'Midjourney',
  'Motor creativo de prototipado visual para control de tempo.',
  'ENTITY',
  'NO_CODE',
  4,
  1490,
  1160,
  'TOOL',
  null,
  '/assets/bgs/bg-tech.jpg',
  '/assets/renders/midjourney.webp',
  null,
  null,
  '{}',
  null,
  true
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  type = excluded.type,
  faction = excluded.faction,
  cost = excluded.cost,
  attack = excluded.attack,
  defense = excluded.defense,
  archetype = excluded.archetype,
  trigger = excluded.trigger,
  bg_url = excluded.bg_url,
  render_url = excluded.render_url,
  effect = excluded.effect,
  fusion_recipe_id = excluded.fusion_recipe_id,
  fusion_material_ids = excluded.fusion_material_ids,
  fusion_energy_requirement = excluded.fusion_energy_requirement,
  is_active = excluded.is_active;

insert into public.market_card_listings (
  id,
  card_id,
  rarity,
  price_nexus,
  stock,
  is_available
) values
('listing-entity-hydra', 'entity-hydra', 'RARE', 115, null, true),
('listing-entity-tor', 'entity-tor', 'COMMON', 80, null, true),
('listing-entity-windows92', 'entity-windows92', 'RARE', 110, null, true),
('listing-entity-midjourney', 'entity-midjourney', 'RARE', 120, null, true)
on conflict (id) do update set
  card_id = excluded.card_id,
  rarity = excluded.rarity,
  price_nexus = excluded.price_nexus,
  stock = excluded.stock,
  is_available = excluded.is_available;

update public.cards_catalog
set render_url = regexp_replace(render_url, '\.png$', '.webp')
where render_url like '/assets/renders/%.png';

update public.cards_catalog
set
  render_url = case id
    when 'exec-antigrabity' then '/assets/renders/executions/exec-antigrabity.webp'
    when 'exec-boost-atk-400' then '/assets/renders/executions/exec-boost-atk-400.webp'
    when 'exec-db-def-300' then '/assets/renders/executions/exec-db-def-300.webp'
    when 'exec-direct-damage-600' then '/assets/renders/executions/exec-direct-damage-600.webp'
    when 'exec-direct-damage-900' then '/assets/renders/executions/exec-direct-damage-900.webp'
    when 'exec-discord-sync' then '/assets/renders/executions/exec-discord-sync.webp'
    when 'exec-draw-1' then '/assets/renders/executions/exec-draw-1.webp'
    when 'exec-duckduckgo-scan' then '/assets/renders/executions/exec-duckduckgo-scan.webp'
    when 'exec-framework-atk-300' then '/assets/renders/executions/exec-framework-atk-300.webp'
    when 'exec-fusion-gemgpt' then '/assets/renders/executions/exec-fusion-gemgpt.webp'
    when 'exec-fusion-kaclauli' then '/assets/renders/executions/exec-fusion-kaclauli.webp'
    when 'exec-fusion-pytgress' then '/assets/renders/executions/exec-fusion-pytgress.webp'
    when 'exec-git-salvage-hand' then '/assets/renders/executions/exec-git-salvage-hand.webp'
    when 'exec-heal-700' then '/assets/renders/executions/exec-heal-700.webp'
    when 'exec-llm-def-300' then '/assets/renders/executions/exec-llm-def-300.webp'
    when 'exec-notebookllm-archive' then '/assets/renders/executions/exec-notebookllm-archive.webp'
    when 'exec-rust-redeploy-field' then '/assets/renders/executions/exec-rust-redeploy-field.webp'
    when 'exec-wrap-overclock' then '/assets/renders/executions/exec-wrap-overclock.webp'
    when 'trap-atk-drain' then '/assets/renders/traps/trap-atk-drain.webp'
    when 'trap-counter-intrusion' then '/assets/renders/traps/trap-counter-intrusion.webp'
    when 'trap-def-fragment' then '/assets/renders/traps/trap-def-fragment.webp'
    when 'trap-gemini-counter-seal' then '/assets/renders/traps/trap-gemini-counter-seal.webp'
    when 'trap-hydra-counter' then '/assets/renders/traps/trap-hydra-counter.webp'
    when 'trap-kernel-panic' then '/assets/renders/traps/trap-kernel-panic.webp'
    when 'trap-runtime-punish' then '/assets/renders/traps/trap-runtime-punish.webp'
    when 'trap-tor-smokescreen' then '/assets/renders/traps/trap-tor-smokescreen.webp'
    when 'trap-windows92-crash' then '/assets/renders/traps/trap-windows92-crash.webp'
    else render_url
  end,
  bg_url = case when type in ('EXECUTION', 'TRAP') then null else bg_url end
where type in ('EXECUTION', 'TRAP');

commit;
