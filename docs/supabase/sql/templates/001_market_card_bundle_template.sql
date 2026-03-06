-- docs/supabase/sql/templates/001_market_card_bundle_template.sql - Plantilla transaccional para alta atómica de carta y su listing de mercado.
begin;

-- 1) Catálogo maestro de carta (obligatorio)
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
) values (
  'entity-sample-card',                         -- id único global
  'Sample Card',                                -- nombre visible
  'Descripción de ejemplo para la nueva carta',
  'ENTITY',                                     -- ENTITY | EXECUTION | TRAP | FUSION | ENVIRONMENT
  'OPEN_SOURCE',                                -- OPEN_SOURCE | BIG_TECH | NO_CODE | NEUTRAL
  3,                                            -- coste/energía base
  1400,                                         -- ENTITY/FUSION: ataque; resto: null
  1100,                                         -- ENTITY/FUSION: defensa; resto: null
  'LANGUAGE',                                   -- opcional: LLM | FRAMEWORK | DB | IDE | LANGUAGE | TOOL | SECURITY
  null,                                         -- TRAP: trigger; resto: null
  '/assets/bgs/bg-tech.jpg',                    -- recomendado: fondo por defecto del juego
  '/assets/renders/sample-card.png',            -- render de carta (local o storage público)
  null,                                         -- jsonb opcional para effect (estructura del motor)
  null,                                         -- opcional para tipo FUSION
  '{}',                                         -- opcional para tipo FUSION (array text)
  null,                                         -- opcional para tipo FUSION
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

-- 2) Listing de mercado (opcional si no se vende suelta)
insert into public.market_card_listings (
  id,
  card_id,
  rarity,
  price_nexus,
  stock,
  is_available
) values (
  'listing-entity-sample-card',                 -- id único del listing
  'entity-sample-card',                         -- referencia a cards_catalog.id
  'COMMON',                                     -- COMMON | RARE | EPIC | LEGENDARY
  100,                                          -- precio en Nexus
  null,                                         -- null = stock infinito
  true
)
on conflict (id) do update set
  card_id = excluded.card_id,
  rarity = excluded.rarity,
  price_nexus = excluded.price_nexus,
  stock = excluded.stock,
  is_available = excluded.is_available;

commit;
