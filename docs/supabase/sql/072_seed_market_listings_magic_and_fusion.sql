-- docs/supabase/sql/072_seed_market_listings_magic_and_fusion.sql - Listings de mercado para las nuevas mágicas del 2º lote.
-- Exec-fusion de batch-2 ya se definen en 070_seed_fusion_cards_batch2.sql.
-- Precios coherentes: mágicas RARE/EPIC 280-390.
begin;

insert into public.market_card_listings (id, card_id, rarity, price_nexus, stock, is_available)
values
  ('listing-exec-claude-recharge',   'exec-claude-recharge',    'RARE', 280, null, true),
  ('listing-exec-hydra-attack-down', 'exec-hydra-attack-down',  'EPIC', 390, null, true),
  ('listing-exec-cursor-hand-purge', 'exec-cursor-hand-purge',  'EPIC', 360, null, true),
  ('listing-exec-edge-trap-wipe',    'exec-edge-trap-wipe',     'RARE', 300, null, true)
on conflict (id) do update set
  rarity = excluded.rarity, price_nexus = excluded.price_nexus, is_available = excluded.is_available, updated_at = now();

commit;
