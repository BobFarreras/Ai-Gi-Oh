-- docs/supabase/sql/004_phase_4_cards_catalog_integrity.sql - Crea catálogo maestro de cartas, backfill desde datos existentes y aplica FKs de integridad.
create table if not exists public.cards_catalog (
  id text primary key,
  name text not null,
  description text not null,
  type text not null check (type in ('ENTITY', 'EXECUTION', 'TRAP', 'FUSION', 'ENVIRONMENT')),
  faction text not null check (faction in ('OPEN_SOURCE', 'BIG_TECH', 'NO_CODE', 'NEUTRAL')),
  cost integer not null check (cost >= 0),
  attack integer null check (attack is null or attack >= 0),
  defense integer null check (defense is null or defense >= 0),
  archetype text null check (archetype is null or archetype in ('LLM', 'FRAMEWORK', 'DB', 'IDE', 'LANGUAGE', 'TOOL', 'SECURITY')),
  trigger text null check (trigger is null or trigger in ('ON_OPPONENT_ATTACK_DECLARED', 'ON_OPPONENT_EXECUTION_ACTIVATED')),
  bg_url text null,
  render_url text null,
  effect jsonb null,
  fusion_recipe_id text null,
  fusion_material_ids text[] not null default '{}',
  fusion_energy_requirement integer null check (fusion_energy_requirement is null or fusion_energy_requirement >= 0),
  is_active boolean not null default true,
  schema_version integer not null default 1 check (schema_version > 0),
  updated_at timestamptz not null default now(),
  check (type in ('ENTITY', 'FUSION') or (attack is null and defense is null)),
  check (type = 'TRAP' or trigger is null)
);

create index if not exists idx_cards_catalog_type on public.cards_catalog (type);
create index if not exists idx_cards_catalog_archetype on public.cards_catalog (archetype);

drop trigger if exists cards_catalog_set_updated_at on public.cards_catalog;
create trigger cards_catalog_set_updated_at
before update on public.cards_catalog
for each row execute function public.set_updated_at();

alter table public.cards_catalog enable row level security;

drop policy if exists "cards_catalog_select_public" on public.cards_catalog;
create policy "cards_catalog_select_public"
on public.cards_catalog
for select
to authenticated
using (is_active = true);

insert into public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger, bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active
) values
('entity-ollama', 'Ollama', 'Modelo local de respuesta estable.', 'ENTITY', 'OPEN_SOURCE', 3, 1200, 1100, 'LLM', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/ollama.webp', null, null, '{}', null, true),
('entity-python', 'Python', 'Lenguaje flexible para combos de scripts.', 'ENTITY', 'OPEN_SOURCE', 3, 1200, 1100, 'LANGUAGE', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/python.webp', null, null, '{}', null, true),
('entity-react', 'React', 'Framework de interfaz con presión constante.', 'ENTITY', 'BIG_TECH', 4, 1500, 1100, 'FRAMEWORK', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/react.webp', null, null, '{}', null, true),
('entity-postgress', 'Postgress', 'Base de datos robusta con defensa sólida.', 'ENTITY', 'OPEN_SOURCE', 4, 1500, 1100, 'DB', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/postgress.webp', null, null, '{}', null, true),
('entity-supabase', 'Supabase', 'Backend rápido para control de recursos.', 'ENTITY', 'OPEN_SOURCE', 4, 1500, 1100, 'DB', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/supabase.webp', null, null, '{}', null, true),
('entity-huggenface', 'HuggenFace', 'Hub de modelos con soporte de equipo.', 'ENTITY', 'OPEN_SOURCE', 3, 1200, 1100, 'LLM', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/huggenface.webp', null, null, '{}', null, true),
('entity-perplexity', 'Perplexity', 'Búsqueda ágil para responder amenazas.', 'ENTITY', 'NO_CODE', 3, 1200, 1100, 'TOOL', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/perplexity.webp', null, null, '{}', null, true),
('entity-kali-linux', 'Kali Linux', 'Especialista ofensivo de alto impacto.', 'ENTITY', 'OPEN_SOURCE', 5, 1850, 1250, 'SECURITY', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/kali-linux.webp', null, null, '{}', null, true),
('entity-astro', 'Astro', 'Render eficiente de ataque táctico.', 'ENTITY', 'OPEN_SOURCE', 3, 1200, 1100, 'FRAMEWORK', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/astro.webp', null, null, '{}', null, true),
('entity-deepseek', 'DeepSeek', 'Modelo analítico para duelos largos.', 'ENTITY', 'OPEN_SOURCE', 4, 1500, 1100, 'LLM', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/deepseek.webp', null, null, '{}', null, true),
('entity-vscode', 'VSCode', 'IDE versátil para desplegar cartas rápido.', 'ENTITY', 'BIG_TECH', 2, 800, 1000, 'IDE', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/vscode.webp', null, null, '{}', null, true),
('entity-cursor', 'Cursor', 'Asistencia inteligente de ejecución rápida.', 'ENTITY', 'NO_CODE', 2, 800, 1000, 'IDE', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/cursor.webp', null, null, '{}', null, true),
('entity-nextjs', 'Next.js', 'Framework full-stack de presión media.', 'ENTITY', 'BIG_TECH', 4, 1500, 1100, 'FRAMEWORK', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/nextjs.webp', null, null, '{}', null, true),
('entity-claude', 'Claude', 'Modelo estratégico con control defensivo.', 'ENTITY', 'NO_CODE', 4, 1500, 1100, 'LLM', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/claude.webp', null, null, '{}', null, true),
('entity-git', 'Git', 'Control de versión para jugar seguro.', 'ENTITY', 'OPEN_SOURCE', 2, 800, 1000, 'TOOL', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/git.webp', null, null, '{}', null, true),
('entity-github', 'GitHub', 'Repositorio global con soporte táctico.', 'ENTITY', 'BIG_TECH', 3, 1200, 1100, 'TOOL', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/github.webp', null, null, '{}', null, true),
('entity-chatgpt', 'ChatGPT', 'Modelo multimodal para cierre de duelo.', 'ENTITY', 'BIG_TECH', 5, 1850, 1250, 'LLM', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/chatgpt.webp', null, null, '{}', null, true),
('entity-gemini', 'Gemini', 'Entidad de alto nivel para sinergias LLM.', 'ENTITY', 'BIG_TECH', 5, 1850, 1250, 'LLM', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/gemini.webp', null, null, '{}', null, true),
('entity-vercel', 'Vercel', 'Plataforma de despliegue con tempo agresivo.', 'ENTITY', 'BIG_TECH', 3, 1200, 1100, 'FRAMEWORK', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/vercel.webp', null, null, '{}', null, true),
('entity-openclaw', 'OpenClaw', 'Agente autónomo con presión de mesa.', 'ENTITY', 'OPEN_SOURCE', 4, 1500, 1100, 'TOOL', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/openclaw.webp', null, null, '{}', null, true),
('entity-n8n', 'n8n', 'Automatización de flujos para ganar ventaja.', 'ENTITY', 'OPEN_SOURCE', 3, 1200, 1100, 'TOOL', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/n8n.webp', null, null, '{}', null, true),
('entity-make', 'Make', 'Orquestador visual de alto valor táctico.', 'ENTITY', 'NO_CODE', 3, 1200, 1100, 'TOOL', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/make.webp', null, null, '{}', null, true),
('exec-boost-atk-400', 'Refactor Burst', 'Aumenta +400 el ATK de tu mejor entidad en campo.', 'EXECUTION', 'NO_CODE', 2, null, null, null, null, '/assets/bgs/bg-tech.jpg', '/assets/renders/make.webp', '{"action":"BOOST_ATTACK_ALLIED_ENTITY","value":400}'::jsonb, null, '{}', null, true),
('exec-draw-1', 'Knowledge Pull', 'Roba 1 carta del deck.', 'EXECUTION', 'OPEN_SOURCE', 2, null, null, null, null, '/assets/bgs/bg-tech.jpg', '/assets/renders/openclaw.webp', '{"action":"DRAW_CARD","cards":1}'::jsonb, null, '{}', null, true),
('exec-llm-def-300', 'Prompt Shield', 'Todas tus cartas LLM ganan +300 DEF.', 'EXECUTION', 'BIG_TECH', 3, null, null, null, null, '/assets/bgs/bg-tech.jpg', '/assets/renders/chatgpt.webp', '{"action":"BOOST_DEFENSE_BY_ARCHETYPE","archetype":"LLM","value":300}'::jsonb, null, '{}', null, true),
('exec-framework-atk-300', 'Framework Sprint', 'Todas tus cartas FRAMEWORK ganan +300 ATK.', 'EXECUTION', 'BIG_TECH', 3, null, null, null, null, '/assets/bgs/bg-tech.jpg', '/assets/renders/vercel.webp', '{"action":"BOOST_ATTACK_BY_ARCHETYPE","archetype":"FRAMEWORK","value":300}'::jsonb, null, '{}', null, true),
('exec-direct-damage-900', 'Packet Storm', 'Inflige 900 de daño directo al rival.', 'EXECUTION', 'NO_CODE', 3, null, null, null, null, '/assets/bgs/bg-tech.jpg', '/assets/renders/n8n.webp', '{"action":"DAMAGE","target":"OPPONENT","value":900}'::jsonb, null, '{}', null, true),
('exec-direct-damage-600', 'Exploit Ping', 'Inflige 600 de daño directo al rival.', 'EXECUTION', 'OPEN_SOURCE', 2, null, null, null, null, '/assets/bgs/bg-tech.jpg', '/assets/renders/kali-linux.webp', '{"action":"DAMAGE","target":"OPPONENT","value":600}'::jsonb, null, '{}', null, true),
('exec-heal-700', 'Recovery Patch', 'Recuperas 700 LP.', 'EXECUTION', 'BIG_TECH', 2, null, null, null, null, '/assets/bgs/bg-tech.jpg', '/assets/renders/supabase.webp', '{"action":"HEAL","target":"PLAYER","value":700}'::jsonb, null, '{}', null, true),
('exec-db-def-300', 'Transaction Wall', 'Todas tus cartas DB ganan +300 DEF.', 'EXECUTION', 'OPEN_SOURCE', 2, null, null, null, null, '/assets/bgs/bg-tech.jpg', '/assets/renders/postgress.webp', '{"action":"BOOST_DEFENSE_BY_ARCHETYPE","archetype":"DB","value":300}'::jsonb, null, '{}', null, true),
('exec-fusion-gemgpt', 'Fusion Compiler', 'Inicia fusión GemGPT: selecciona 2 materiales válidos en tu campo.', 'EXECUTION', 'BIG_TECH', 4, null, null, null, null, '/assets/bgs/bg-tech.jpg', '/assets/renders/gemgpt.webp', '{"action":"FUSION_SUMMON","recipeId":"fusion-gemgpt","materialsRequired":2}'::jsonb, null, '{}', null, true),
('exec-fusion-kaclauli', 'Fusion Compiler: KaClauli', 'Inicia fusión KaClauli: selecciona 2 materiales válidos en tu campo.', 'EXECUTION', 'OPEN_SOURCE', 4, null, null, null, null, '/assets/bgs/bg-tech.jpg', '/assets/renders/kaclauli.webp', '{"action":"FUSION_SUMMON","recipeId":"fusion-kaclauli","materialsRequired":2}'::jsonb, null, '{}', null, true),
('exec-fusion-pytgress', 'Fusion Compiler: Pytgress', 'Inicia fusión Pytgress: selecciona 2 materiales válidos en tu campo.', 'EXECUTION', 'OPEN_SOURCE', 4, null, null, null, null, '/assets/bgs/bg-tech.jpg', '/assets/renders/pytgress.webp', '{"action":"FUSION_SUMMON","recipeId":"fusion-pytgress","materialsRequired":2}'::jsonb, null, '{}', null, true),
('trap-counter-intrusion', 'Counter Intrusion', 'Cuando el rival declara ataque, inflige 500 de daño al rival.', 'TRAP', 'OPEN_SOURCE', 2, null, null, null, 'ON_OPPONENT_ATTACK_DECLARED', '/assets/bgs/bg-tech.jpg', '/assets/renders/kali-linux.webp', '{"action":"DAMAGE","target":"OPPONENT","value":500}'::jsonb, null, '{}', null, true),
('trap-runtime-punish', 'Runtime Punish', 'Cuando el rival activa una ejecución, inflige 400 de daño al rival.', 'TRAP', 'NO_CODE', 2, null, null, null, 'ON_OPPONENT_EXECUTION_ACTIVATED', '/assets/bgs/bg-tech.jpg', '/assets/renders/openclaw.webp', '{"action":"DAMAGE","target":"OPPONENT","value":400}'::jsonb, null, '{}', null, true),
('trap-kernel-panic', 'Kernel Panic', 'Cuando el rival declara ataque, anula el ataque y destruye la carta atacante.', 'TRAP', 'OPEN_SOURCE', 3, null, null, null, 'ON_OPPONENT_ATTACK_DECLARED', '/assets/bgs/bg-tech.jpg', '/assets/renders/kali-linux.webp', '{"action":"NEGATE_ATTACK_AND_DESTROY_ATTACKER"}'::jsonb, null, '{}', null, true),
('trap-atk-drain', 'ATK Drain', 'Cuando el rival declara ataque, reduce 300 ATQ de sus entidades.', 'TRAP', 'NO_CODE', 2, null, null, null, 'ON_OPPONENT_ATTACK_DECLARED', '/assets/bgs/bg-tech.jpg', '/assets/renders/n8n.webp', '{"action":"REDUCE_OPPONENT_ATTACK","value":300}'::jsonb, null, '{}', null, true),
('trap-def-fragment', 'DEF Fragment', 'Cuando el rival activa ejecución, reduce 300 DEF de sus entidades.', 'TRAP', 'BIG_TECH', 2, null, null, null, 'ON_OPPONENT_EXECUTION_ACTIVATED', '/assets/bgs/bg-tech.jpg', '/assets/renders/openclaw.webp', '{"action":"REDUCE_OPPONENT_DEFENSE","value":300}'::jsonb, null, '{}', null, true),
('fusion-gemgpt', 'GemGPT', 'Requiere ChatGPT + Gemini. Fusión LLM de alto impacto para cierre de partida.', 'FUSION', 'BIG_TECH', 7, 3200, 2600, 'LLM', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/gemgpt.webp', null, 'fusion-gemgpt', '{"entity-chatgpt","entity-gemini"}', 10, true),
('fusion-kaclauli', 'KaClauli', 'Requiere Claude + Kali Linux. Fusión de presión ofensiva y control táctico.', 'FUSION', 'OPEN_SOURCE', 7, 3100, 2400, 'SECURITY', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/kaclauli.webp', null, 'fusion-kaclauli', '{"entity-claude","entity-kali-linux"}', 9, true),
('fusion-pytgress', 'Pytgress', 'Requiere Python + Postgress. Fusión técnica para control de recursos y mesa.', 'FUSION', 'OPEN_SOURCE', 6, 2900, 2700, 'LANGUAGE', null, '/assets/bgs/bg-tech.jpg', '/assets/renders/pytgress.webp', null, 'fusion-pytgress', '{"entity-python","entity-postgress"}', 8, true)
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

with known_card_ids as (
  select card_id as id from public.market_card_listings
  union
  select card_id as id from public.market_pack_pool_entries
  union
  select card_id as id from public.player_collection_cards
  union
  select card_id as id from public.player_deck_slots where card_id is not null
)
insert into public.cards_catalog (
  id, name, description, type, faction, cost, attack, defense, archetype, trigger, bg_url, render_url, effect, fusion_recipe_id, fusion_material_ids, fusion_energy_requirement, is_active
)
select
  source.id,
  initcap(replace(regexp_replace(source.id, '^[^-]+-', ''), '-', ' ')),
  'Carta migrada automáticamente. Completar ficha en cards_catalog.',
  case split_part(source.id, '-', 1)
    when 'entity' then 'ENTITY'
    when 'exec' then 'EXECUTION'
    when 'trap' then 'TRAP'
    when 'fusion' then 'FUSION'
    when 'environment' then 'ENVIRONMENT'
    else 'ENTITY'
  end,
  'NEUTRAL',
  0,
  case when split_part(source.id, '-', 1) in ('entity', 'fusion') then 0 else null end,
  case when split_part(source.id, '-', 1) in ('entity', 'fusion') then 0 else null end,
  null,
  case when split_part(source.id, '-', 1) = 'trap' then 'ON_OPPONENT_ATTACK_DECLARED' else null end,
  '/assets/bgs/bg-tech.jpg',
  null,
  null,
  null,
  '{}',
  null,
  true
from known_card_ids as source
left join public.cards_catalog as catalog on catalog.id = source.id
where catalog.id is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'market_card_listings_card_id_fkey_catalog'
  ) then
    alter table public.market_card_listings
      add constraint market_card_listings_card_id_fkey_catalog
      foreign key (card_id) references public.cards_catalog(id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'market_pack_pool_entries_card_id_fkey_catalog'
  ) then
    alter table public.market_pack_pool_entries
      add constraint market_pack_pool_entries_card_id_fkey_catalog
      foreign key (card_id) references public.cards_catalog(id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'player_collection_cards_card_id_fkey_catalog'
  ) then
    alter table public.player_collection_cards
      add constraint player_collection_cards_card_id_fkey_catalog
      foreign key (card_id) references public.cards_catalog(id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'player_deck_slots_card_id_fkey_catalog'
  ) then
    alter table public.player_deck_slots
      add constraint player_deck_slots_card_id_fkey_catalog
      foreign key (card_id) references public.cards_catalog(id);
  end if;
end $$;
