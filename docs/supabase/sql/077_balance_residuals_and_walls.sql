-- docs/supabase/sql/077_balance_residuals_and_walls.sql
-- Cierre de incoherencias residuales de la auditoría (docs/auditoria-economia-cartas.md):
--   Punto 1: rareza/precio de mágicas y trampas descorrelacionados.
--   Punto 2: muros con DEF por encima del presupuesto de su coste → subir coste (decisión de diseño).
--   Punto 3: ids legacy de event_shop_items que no corresponden a su carta.
-- Todas las sentencias son idempotentes (guardas en WHERE) y transaccionales.
begin;

-- ──────────────────────────────────────────────────────────────────────────
-- PUNTO 1 · Mágicas/trampas: alinear rareza y precio con el poder real del efecto.
-- ──────────────────────────────────────────────────────────────────────────

-- Kernel Panic: mismo efecto que "Open Crash" (NEGATE_ATTACK_AND_DESTROY_ATTACKER, RARE 650).
-- Estaba COMMON a 600 → RARE 650 (regla §5.1: mismo efecto, mismo precio).
update public.market_card_listings
set rarity = 'RARE', price_nexus = 650, updated_at = now()
where card_id = 'trap-kernel-panic' and (rarity = 'COMMON' or price_nexus <> 650);

-- Rust Redeploy Field: revivir ENTITY del cementerio AL CAMPO (recursión fuerte). EPIC a precio EPIC.
-- Estaba EPIC a 280 → EPIC 480.
update public.market_card_listings
set price_nexus = 480, updated_at = now()
where card_id = 'exec-rust-redeploy-field' and price_nexus < 480;

-- Graveyard Hijack: roba ENTITY del cementerio rival (disrupción + valor). EPIC a precio EPIC.
-- Estaba EPIC a 200 → EPIC 420.
update public.market_card_listings
set price_nexus = 420, updated_at = now()
where card_id = 'exec-steal-opponent-graveyard-card' and price_nexus < 420;

-- DuckDuckGo Power Upgrade: build-around de una sola carta (set V5/L5). Es utilidad de nicho,
-- no una EPIC genérica → RARE 340 (rareza alineada al impacto real, no inflada).
update public.market_card_listings
set rarity = 'RARE', price_nexus = 340, updated_at = now()
where card_id = 'exec-duckduckgo-power-up' and (rarity = 'EPIC' or price_nexus < 340);

-- ──────────────────────────────────────────────────────────────────────────
-- PUNTO 2 · Muros por encima de presupuesto → subir coste (mantiene la DEF alta, la hace justa).
--   Presupuesto ATK+DEF por coste: c3=2400, c5=3200, c6=3600.
--   Firebase 1200/2000 (3200) c4→c5 · Ubuntu 1500/2200 (3700) c5→c6 · DuckDuckGo 1000/1700 (2700) c2→c3
-- ──────────────────────────────────────────────────────────────────────────
update public.cards_catalog set cost = 5, updated_at = now() where id = 'entity-firebase'   and cost = 4;
update public.cards_catalog set cost = 6, updated_at = now() where id = 'entity-ubuntu'     and cost = 5;
update public.cards_catalog set cost = 3, updated_at = now() where id = 'entity-duckduckgo' and cost = 2;

-- ──────────────────────────────────────────────────────────────────────────
-- PUNTO 3 (datos) · Renombrar ids legacy de event_shop_items a la forma derivada `${event}-${card}`.
--   Seguro: player_event_purchases está vacío (FK sin filas referenciando). En adelante el panel
--   admin genera el id derivado automáticamente (ver AdminEventEditor).
-- ──────────────────────────────────────────────────────────────────────────
update public.event_shop_items set id = 'evt-launch-entity-cursor'    where id = 'evt-launch-python' and card_id = 'entity-cursor';
update public.event_shop_items set id = 'evt-launch-entity-hostinger' where id = 'evt-launch-flutter' and card_id = 'entity-hostinger';
update public.event_shop_items set id = 'evt-launch-fusion-curshost'  where id = 'evt-launch-avast'  and card_id = 'fusion-curshost';

commit;
