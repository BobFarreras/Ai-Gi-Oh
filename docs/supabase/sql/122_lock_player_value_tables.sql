-- docs/supabase/sql/122_lock_player_value_tables.sql
-- 🔴 ARREGLO DE SEGURIDAD: el jugador podía escribir sus propias tablas de valor.
--
-- Estado anterior (vivo en producción): `authenticated` tenía GRANT de INSERT/UPDATE y policies "…_own" sobre
-- sus propias filas en:
--   · player_wallets          → ponerse los Nexus que quisiera
--   · player_collection_cards → regalarse cualquier carta del catálogo
--   · player_card_progress    → ponerse todas las cartas a nivel 100 / versión 5
-- Todo ello con un PATCH directo a la API REST de Supabase desde la consola del navegador. La economía y la
-- progresión del juego eran decorativas.
--
-- Además, las RPC `wallet_debit_nexus` / `wallet_credit_nexus` NO eran security definer y `authenticated` podía
-- ejecutarlas: bastaba llamar a wallet_credit_nexus(mi_id, 999999) para acreditarse Nexus, aunque la policy de
-- la tabla estuviera cerrada. Se cierran las dos puertas.
--
-- Requisito previo (ya hecho en el código): los repositorios de cartera, colección y progresión escriben con
-- service-role (ver resolve-privileged-write-client.ts). El jugador conserva la LECTURA de sus filas.
begin;

-- ── 1) El jugador ya no escribe sus filas de valor ─────────────────────────────────────────────────
drop policy if exists "player_wallets_update_own"  on public.player_wallets;
drop policy if exists "player_wallets_insert_own"  on public.player_wallets;
revoke insert, update, delete on public.player_wallets from authenticated;

drop policy if exists "player_collection_cards_update_own" on public.player_collection_cards;
drop policy if exists "player_collection_cards_insert_own" on public.player_collection_cards;
revoke insert, update, delete on public.player_collection_cards from authenticated;

drop policy if exists "player_card_progress_update_own" on public.player_card_progress;
drop policy if exists "player_card_progress_insert_own" on public.player_card_progress;
revoke insert, update, delete on public.player_card_progress from authenticated;

-- ── 2) Las RPC de cartera dejan de estar al alcance del cliente ────────────────────────────────────
-- Solo el servidor (service_role) mueve dinero.
revoke execute on function public.wallet_debit_nexus(uuid, integer)  from public, anon, authenticated;
revoke execute on function public.wallet_credit_nexus(uuid, integer) from public, anon, authenticated;
grant  execute on function public.wallet_debit_nexus(uuid, integer)  to service_role;
grant  execute on function public.wallet_credit_nexus(uuid, integer) to service_role;

commit;

-- Comprobación posterior (debe dar todo false para authenticated):
--   select has_table_privilege('authenticated','public.player_wallets','update'),
--          has_table_privilege('authenticated','public.player_collection_cards','update'),
--          has_table_privilege('authenticated','public.player_card_progress','update'),
--          has_function_privilege('authenticated','public.wallet_credit_nexus(uuid,integer)','execute');
