<!-- docs/supabase/README.md - Guía operativa para ejecutar scripts SQL de Supabase por fases del proyecto. -->
# Supabase SQL por Fases

## Diccionario de tablas

1. `public.player_profiles`:
   - perfil básico del jugador (`nickname`, `avatar_url`).
   - 1 fila por usuario (`player_id = auth.users.id`).
2. `public.player_progress`:
   - progreso global (`has_completed_tutorial`, `medals`, `story_chapter`).
   - 1 fila por usuario.
3. `public.player_wallets`:
   - saldo de moneda `Nexus`.
   - 1 fila por usuario.
4. `public.player_collection_cards`:
   - almacén de cartas del jugador.
   - clave compuesta (`player_id`, `card_id`) + `owned_copies`.
5. `public.player_deck_slots`:
   - deck de 20 slots persistidos por índice.
   - clave compuesta (`player_id`, `slot_index`) con `card_id` nullable.
6. `public.market_transactions`:
   - historial de compras de mercado (`BUY_CARD`, `BUY_PACK`).
   - guarda coste, item comprado y cartas obtenidas.

## Fase 2 (Perfil y Progreso)

1. Ejecuta `docs/supabase/sql/001_phase_2_player_profile_progress.sql` en el SQL Editor de Supabase.
2. Verifica que existen:
   - `public.player_profiles`
   - `public.player_progress`
3. Verifica que RLS está activa en ambas tablas.
4. Verifica creación automática tras registro:
   - crea un usuario nuevo,
   - confirma que aparecen filas en ambas tablas con `player_id = auth.users.id`.

## Fase 3 (Home + Market persistentes)

1. Ejecuta `docs/supabase/sql/002_phase_3_market_home_persistence.sql`.
2. Verifica tablas:
   - `public.player_wallets`
   - `public.player_collection_cards`
   - `public.player_deck_slots`
   - `public.market_transactions`
3. Comprueba RLS habilitada en todas.
4. Registra un usuario nuevo y valida bootstrap automático:
   - `player_wallets` con `nexus = 1000`,
   - 20 filas en `player_deck_slots` (índices 0..19).

## Notas

1. El trigger `on_auth_user_created` solo debe existir una vez.
2. Si ya tienes datos, el script es idempotente para políticas/trigger principales.
