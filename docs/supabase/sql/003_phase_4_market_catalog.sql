-- docs/supabase/sql/003_phase_4_market_catalog.sql - Crea catálogo configurable de mercado en BD y carga seed inicial de listados/sobres.
create table if not exists public.market_card_listings (
  id text primary key,
  card_id text not null,
  rarity text not null check (rarity in ('COMMON', 'RARE', 'EPIC', 'LEGENDARY')),
  price_nexus integer not null check (price_nexus >= 0),
  stock integer null check (stock is null or stock >= 0),
  is_available boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.market_pack_definitions (
  id text primary key,
  name text not null,
  description text not null,
  price_nexus integer not null check (price_nexus >= 0),
  cards_per_pack integer not null check (cards_per_pack > 0),
  pack_pool_id text not null,
  preview_card_ids text[] not null default '{}',
  is_available boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.market_pack_pool_entries (
  id text primary key,
  pack_pool_id text not null,
  card_id text not null,
  rarity text not null check (rarity in ('COMMON', 'RARE', 'EPIC', 'LEGENDARY')),
  weight integer not null check (weight > 0),
  updated_at timestamptz not null default now()
);

create index if not exists idx_market_card_listings_card_id on public.market_card_listings (card_id);
create index if not exists idx_market_pack_pool_entries_pool on public.market_pack_pool_entries (pack_pool_id);
create index if not exists idx_market_pack_pool_entries_card on public.market_pack_pool_entries (card_id);

drop trigger if exists market_card_listings_set_updated_at on public.market_card_listings;
create trigger market_card_listings_set_updated_at
before update on public.market_card_listings
for each row execute function public.set_updated_at();

drop trigger if exists market_pack_definitions_set_updated_at on public.market_pack_definitions;
create trigger market_pack_definitions_set_updated_at
before update on public.market_pack_definitions
for each row execute function public.set_updated_at();

drop trigger if exists market_pack_pool_entries_set_updated_at on public.market_pack_pool_entries;
create trigger market_pack_pool_entries_set_updated_at
before update on public.market_pack_pool_entries
for each row execute function public.set_updated_at();

alter table public.market_card_listings enable row level security;
alter table public.market_pack_definitions enable row level security;
alter table public.market_pack_pool_entries enable row level security;

drop policy if exists "market_card_listings_select_public" on public.market_card_listings;
create policy "market_card_listings_select_public"
on public.market_card_listings
for select
to authenticated
using (true);

drop policy if exists "market_pack_definitions_select_public" on public.market_pack_definitions;
create policy "market_pack_definitions_select_public"
on public.market_pack_definitions
for select
to authenticated
using (true);

drop policy if exists "market_pack_pool_entries_select_public" on public.market_pack_pool_entries;
create policy "market_pack_pool_entries_select_public"
on public.market_pack_pool_entries
for select
to authenticated
using (true);

insert into public.market_card_listings (id, card_id, rarity, price_nexus, stock, is_available) values
('listing-entity-ollama', 'entity-ollama', 'COMMON', 75, null, true),
('listing-entity-python', 'entity-python', 'COMMON', 75, null, false),
('listing-entity-react', 'entity-react', 'RARE', 100, null, true),
('listing-entity-postgress', 'entity-postgress', 'RARE', 100, null, false),
('listing-entity-supabase', 'entity-supabase', 'RARE', 100, null, true),
('listing-entity-huggenface', 'entity-huggenface', 'COMMON', 75, null, true),
('listing-entity-perplexity', 'entity-perplexity', 'COMMON', 75, null, true),
('listing-entity-kali-linux', 'entity-kali-linux', 'EPIC', 125, null, true),
('listing-entity-astro', 'entity-astro', 'COMMON', 75, null, true),
('listing-entity-deepseek', 'entity-deepseek', 'RARE', 100, null, true),
('listing-entity-vscode', 'entity-vscode', 'COMMON', 50, null, true),
('listing-entity-cursor', 'entity-cursor', 'COMMON', 50, null, true),
('listing-entity-nextjs', 'entity-nextjs', 'RARE', 100, null, true),
('listing-entity-claude', 'entity-claude', 'RARE', 100, null, true),
('listing-entity-git', 'entity-git', 'COMMON', 50, null, true),
('listing-entity-github', 'entity-github', 'COMMON', 75, null, true),
('listing-entity-chatgpt', 'entity-chatgpt', 'EPIC', 125, null, true),
('listing-entity-gemini', 'entity-gemini', 'EPIC', 125, null, true),
('listing-entity-vercel', 'entity-vercel', 'COMMON', 75, null, true),
('listing-entity-openclaw', 'entity-openclaw', 'RARE', 100, null, true),
('listing-entity-n8n', 'entity-n8n', 'COMMON', 75, null, true),
('listing-entity-make', 'entity-make', 'COMMON', 75, null, true),
('listing-exec-boost-atk-400', 'exec-boost-atk-400', 'COMMON', 50, null, true),
('listing-exec-draw-1', 'exec-draw-1', 'COMMON', 50, null, true),
('listing-exec-llm-def-300', 'exec-llm-def-300', 'COMMON', 75, null, true),
('listing-exec-framework-atk-300', 'exec-framework-atk-300', 'COMMON', 75, null, true),
('listing-exec-direct-damage-900', 'exec-direct-damage-900', 'COMMON', 75, null, true),
('listing-exec-direct-damage-600', 'exec-direct-damage-600', 'COMMON', 50, null, true),
('listing-exec-heal-700', 'exec-heal-700', 'COMMON', 50, null, true),
('listing-exec-db-def-300', 'exec-db-def-300', 'COMMON', 50, null, true),
('listing-exec-fusion-gemgpt', 'exec-fusion-gemgpt', 'RARE', 100, null, true),
('listing-exec-fusion-kaclauli', 'exec-fusion-kaclauli', 'RARE', 100, null, true),
('listing-exec-fusion-pytgress', 'exec-fusion-pytgress', 'RARE', 100, null, true),
('listing-trap-counter-intrusion', 'trap-counter-intrusion', 'COMMON', 50, null, true),
('listing-trap-runtime-punish', 'trap-runtime-punish', 'COMMON', 50, null, true),
('listing-trap-kernel-panic', 'trap-kernel-panic', 'COMMON', 75, null, true),
('listing-trap-atk-drain', 'trap-atk-drain', 'COMMON', 50, null, true),
('listing-trap-def-fragment', 'trap-def-fragment', 'COMMON', 50, null, true),
('listing-fusion-gemgpt', 'fusion-gemgpt', 'LEGENDARY', 275, null, true),
('listing-fusion-kaclauli', 'fusion-kaclauli', 'LEGENDARY', 275, null, true),
('listing-fusion-pytgress', 'fusion-pytgress', 'LEGENDARY', 250, null, false)
on conflict (id) do update set
  card_id = excluded.card_id,
  rarity = excluded.rarity,
  price_nexus = excluded.price_nexus,
  stock = excluded.stock,
  is_available = excluded.is_available;

insert into public.market_pack_definitions (id, name, description, price_nexus, cards_per_pack, pack_pool_id, preview_card_ids, is_available) values
('pack-core-alpha', 'Core Alpha Pack', 'Pack básico de 5 cartas de la rotación actual.', 220, 5, 'pool-core-alpha', array['entity-vscode', 'entity-react', 'entity-ollama', 'exec-draw-1', 'trap-counter-intrusion'], true),
('pack-fusion-lab', 'Fusion Lab: Pytgress', 'Sobre premium con núcleo Python + Postgress + Pytgress.', 480, 5, 'pool-fusion-lab', array['entity-python', 'entity-postgress', 'fusion-pytgress', 'exec-fusion-pytgress', 'entity-git'], true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price_nexus = excluded.price_nexus,
  cards_per_pack = excluded.cards_per_pack,
  pack_pool_id = excluded.pack_pool_id,
  preview_card_ids = excluded.preview_card_ids,
  is_available = excluded.is_available;

insert into public.market_pack_pool_entries (id, pack_pool_id, card_id, rarity, weight) values
('pool-core-alpha-entity-ollama', 'pool-core-alpha', 'entity-ollama', 'COMMON', 70),
('pool-core-alpha-entity-python', 'pool-core-alpha', 'entity-python', 'COMMON', 70),
('pool-core-alpha-entity-react', 'pool-core-alpha', 'entity-react', 'RARE', 20),
('pool-core-alpha-entity-postgress', 'pool-core-alpha', 'entity-postgress', 'RARE', 20),
('pool-core-alpha-entity-supabase', 'pool-core-alpha', 'entity-supabase', 'RARE', 20),
('pool-core-alpha-entity-huggenface', 'pool-core-alpha', 'entity-huggenface', 'COMMON', 70),
('pool-core-alpha-entity-perplexity', 'pool-core-alpha', 'entity-perplexity', 'COMMON', 70),
('pool-core-alpha-entity-kali-linux', 'pool-core-alpha', 'entity-kali-linux', 'EPIC', 8),
('pool-core-alpha-entity-astro', 'pool-core-alpha', 'entity-astro', 'COMMON', 70),
('pool-core-alpha-entity-deepseek', 'pool-core-alpha', 'entity-deepseek', 'RARE', 20),
('pool-core-alpha-entity-vscode', 'pool-core-alpha', 'entity-vscode', 'COMMON', 70),
('pool-core-alpha-entity-cursor', 'pool-core-alpha', 'entity-cursor', 'COMMON', 70),
('pool-core-alpha-entity-nextjs', 'pool-core-alpha', 'entity-nextjs', 'RARE', 20),
('pool-core-alpha-entity-claude', 'pool-core-alpha', 'entity-claude', 'RARE', 20),
('pool-core-alpha-entity-git', 'pool-core-alpha', 'entity-git', 'COMMON', 70),
('pool-core-alpha-entity-github', 'pool-core-alpha', 'entity-github', 'COMMON', 70),
('pool-core-alpha-entity-chatgpt', 'pool-core-alpha', 'entity-chatgpt', 'EPIC', 8),
('pool-core-alpha-entity-gemini', 'pool-core-alpha', 'entity-gemini', 'EPIC', 8),
('pool-core-alpha-entity-vercel', 'pool-core-alpha', 'entity-vercel', 'COMMON', 70),
('pool-core-alpha-entity-openclaw', 'pool-core-alpha', 'entity-openclaw', 'RARE', 20),
('pool-fusion-lab-entity-python', 'pool-fusion-lab', 'entity-python', 'COMMON', 36),
('pool-fusion-lab-entity-postgress', 'pool-fusion-lab', 'entity-postgress', 'RARE', 36),
('pool-fusion-lab-fusion-pytgress', 'pool-fusion-lab', 'fusion-pytgress', 'LEGENDARY', 8),
('pool-fusion-lab-exec-fusion-pytgress', 'pool-fusion-lab', 'exec-fusion-pytgress', 'RARE', 18),
('pool-fusion-lab-entity-git', 'pool-fusion-lab', 'entity-git', 'COMMON', 36)
on conflict (id) do update set
  pack_pool_id = excluded.pack_pool_id,
  card_id = excluded.card_id,
  rarity = excluded.rarity,
  weight = excluded.weight;
