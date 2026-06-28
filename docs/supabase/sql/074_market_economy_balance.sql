-- docs/supabase/sql/074_market_economy_balance.sql - Balanceo de economía: rareza coherente + corrección de chollos.
-- Basado en auditoría de economía (docs/auditoria-economia-cartas.md).
-- Fórmula: precio ≈ base(coste) × mult(rareza) × (1 + bonus_efecto)
-- Rareza por budget: COMMON ≤ curva, RARE en curva+utilidad, EPIC sobre curva/efecto fuerte, LEGENDARY fusiones/efecto único.
begin;

-- 1. Fusiones batch-2: COMMON → LEGENDARY (3000/2000, coste 7 → LEGENDARY por definición)
update public.market_card_listings
set rarity = 'LEGENDARY', updated_at = now()
where card_id in ('fusion-kuberlinnet', 'fusion-rustyfox', 'fusion-super-c', 'fusion-curshost')
  and rarity = 'COMMON';  -- idempotente: solo toca si aún está en COMMON

-- 2. Chollos: subir precios de cartas con ATK≫precio para su coste
-- Flutter: 1570 ATK c4 RARE → 450 Nexus (antes 118)
update public.market_card_listings
set price_nexus = 450, updated_at = now()
where card_id = 'entity-flutter' and price_nexus < 400;

-- DigitalOcean: 1240 ATK c3 COMMON → 220 Nexus (antes 75)
update public.market_card_listings
set price_nexus = 220, updated_at = now()
where card_id = 'entity-digitalocean' and price_nexus < 200;

-- Windows 92: muro 1320 DEF c3 RARE → 280 Nexus (antes 110)
update public.market_card_listings
set price_nexus = 280, updated_at = now()
where card_id = 'entity-windows92' and price_nexus < 250;

-- 3. Rareza descorrelacionada: reetiquetar según stats reales
-- AWS/Qwen: 1800/1200 c5 → EPIC (antes COMMON a 800)
update public.market_card_listings
set rarity = 'EPIC', updated_at = now()
where card_id in ('entity-aws', 'entity-qwen') and rarity = 'COMMON';

-- Mistral/MiniMax: 1500/1300 c4 → RARE (antes COMMON)
update public.market_card_listings
set rarity = 'RARE', updated_at = now()
where card_id in ('entity-mistral', 'entity-minimax') and rarity = 'COMMON';

-- 4. Ajustar precio de fusiones batch-2 si están por debajo de LEGENDARY mínimo
update public.market_card_listings
set price_nexus = 1200, updated_at = now()
where card_id in ('fusion-kuberlinnet', 'fusion-rustyfox', 'fusion-super-c', 'fusion-curshost')
  and price_nexus < 1200;

commit;
