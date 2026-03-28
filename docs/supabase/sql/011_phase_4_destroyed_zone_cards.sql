-- docs/supabase/sql/011_phase_4_destroyed_zone_cards.sql - Inserta cartas para probar zona Destroyed y recuperación desde cementerio.
begin;

alter table public.cards_catalog
  drop constraint if exists cards_catalog_trigger_check;

alter table public.cards_catalog
  add constraint cards_catalog_trigger_check
  check (
    trigger is null
    or trigger in (
      'ON_OPPONENT_ATTACK_DECLARED',
      'ON_OPPONENT_EXECUTION_ACTIVATED',
      'ON_OPPONENT_TRAP_ACTIVATED'
    )
  );

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
  'exec-git-salvage-hand',
  'Git Salvage Hand',
  'Recupera una entidad del cementerio a tu mano. Si tienes 5 cartas en mano, destruye una antes de añadirla.',
  'EXECUTION',
  'OPEN_SOURCE',
  2,
  null,
  null,
  null,
  null,
  '/assets/bgs/bg-tech.jpg',
  '/assets/renders/git.webp',
  '{"action":"RETURN_GRAVEYARD_CARD_TO_HAND","cardType":"ENTITY"}'::jsonb,
  null,
  '{}',
  null,
  true
),
(
  'exec-rust-redeploy-field',
  'Rust Redeploy Field',
  'Recupera una entidad del cementerio al tablero. Si la zona está llena, destruye una entidad para liberar slot.',
  'EXECUTION',
  'OPEN_SOURCE',
  3,
  null,
  null,
  null,
  null,
  '/assets/bgs/bg-tech.jpg',
  '/assets/renders/rust.webp',
  '{"action":"RETURN_GRAVEYARD_CARD_TO_FIELD","cardType":"ENTITY"}'::jsonb,
  null,
  '{}',
  null,
  true
),
(
  'entity-chatgpt-annihilator',
  'ChatGPT Annihilator',
  'Si gana un combate contra una entidad, la carta derrotada se destruye en vez de ir al cementerio.',
  'ENTITY',
  'BIG_TECH',
  5,
  2000,
  1400,
  'LLM',
  null,
  '/assets/bgs/bg-tech.jpg',
  '/assets/renders/chatgpt.webp',
  '{"action":"DESTROY_ENTITY_ON_BATTLE_WIN"}'::jsonb,
  null,
  '{}',
  null,
  true
),
(
  'trap-gemini-counter-seal',
  'Gemini Counter Seal',
  'Cuando el rival activa una trampa, niega su efecto y destruye esa trampa.',
  'TRAP',
  'NEUTRAL',
  2,
  null,
  null,
  null,
  'ON_OPPONENT_TRAP_ACTIVATED',
  '/assets/bgs/bg-tech.jpg',
  '/assets/renders/gemini.webp',
  '{"action":"NEGATE_OPPONENT_TRAP_AND_DESTROY"}'::jsonb,
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

insert into public.market_card_listings (id, card_id, rarity, price_nexus, stock, is_available) values
('listing-exec-git-salvage-hand', 'exec-git-salvage-hand', 'RARE', 120, null, true),
('listing-exec-rust-redeploy-field', 'exec-rust-redeploy-field', 'EPIC', 180, null, true),
('listing-entity-chatgpt-annihilator', 'entity-chatgpt-annihilator', 'LEGENDARY', 350, null, true),
('listing-trap-gemini-counter-seal', 'trap-gemini-counter-seal', 'EPIC', 160, null, true)
on conflict (id) do update set
  card_id = excluded.card_id,
  rarity = excluded.rarity,
  price_nexus = excluded.price_nexus,
  stock = excluded.stock,
  is_available = excluded.is_available;

commit;
