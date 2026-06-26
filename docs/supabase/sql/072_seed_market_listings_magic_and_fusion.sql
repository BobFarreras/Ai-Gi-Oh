-- docs/supabase/sql/072_seed_market_listings_magic_and_fusion.sql - Listings de mercado para las nuevas mágicas y las exec-fusion del 2º lote.
-- Precios coherentes con los existentes: mágicas RARE/EPIC 280-390; exec-fusion RARE 300 (como las ya listadas).
begin;

insert into public.market_card_listings (id, card_id, rarity, price_nexus, stock, is_available)
values
  ('listing-exec-claude-recharge',   'exec-claude-recharge',    'RARE', 280, null, true),
  ('listing-exec-hydra-attack-down', 'exec-hydra-attack-down',  'EPIC', 390, null, true),
  ('listing-exec-cursor-hand-purge', 'exec-cursor-hand-purge',  'EPIC', 360, null, true),
  ('listing-exec-edge-trap-wipe',    'exec-edge-trap-wipe',     'RARE', 300, null, true),
  ('listing-exec-fusion-curshost',    'exec-fusion-curshost',    'RARE', 300, null, true),
  ('listing-exec-fusion-kuberlinnet', 'exec-fusion-kuberlinnet', 'RARE', 300, null, true),
  ('listing-exec-fusion-rustyfox',    'exec-fusion-rustyfox',    'RARE', 300, null, true),
  ('listing-exec-fusion-super-c',     'exec-fusion-super-c',     'RARE', 300, null, true)
on conflict (id) do update set
  rarity = excluded.rarity, price_nexus = excluded.price_nexus, is_available = excluded.is_available, updated_at = now();

commit;
