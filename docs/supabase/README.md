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
7. `public.cards_catalog`:
   - catálogo maestro de cartas del juego (datos de dominio + metadatos render/effect).
   - fuente canónica para garantizar integridad referencial entre market/home y cartas.
8. `public.market_card_listings`:
   - listado de cartas vendibles en mercado (precio Nexus, stock, disponibilidad, rareza comercial).
9. `public.market_pack_definitions`:
   - definición de sobres (precio, tamaño de pack, pool objetivo, cartas preview).
10. `public.market_pack_pool_entries`:
   - entradas del pool de cada sobre con peso de aparición por carta.
11. `public.card_passive_skills`:
   - catálogo de pasivas reutilizables para mastery de cartas (V5).
12. `public.card_mastery_passive_map`:
   - mapea qué pasivas puede desbloquear cada carta al llegar a mastery.
13. `public.player_card_progress`:
   - progreso por carta y jugador (`version_tier`, `level`, `xp`, pasiva de mastery).
14. `public.player_card_xp_batches`:
   - registro idempotente por batalla para evitar aplicar la EXP del mismo duelo más de una vez.

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

## Fase 4 (Catálogo de Mercado)

1. Ejecuta `docs/supabase/sql/003_phase_4_market_catalog.sql`.
2. Verifica tablas:
   - `public.market_card_listings`
   - `public.market_pack_definitions`
   - `public.market_pack_pool_entries`
3. Comprueba que puedes leer catálogo desde `/api/market/catalog` autenticado.

## Fase 4.1 (Integridad de Catálogo Maestro)

1. Ejecuta `docs/supabase/sql/004_phase_4_cards_catalog_integrity.sql`.
2. Verifica tabla:
   - `public.cards_catalog`
3. Comprueba que existen FKs activas hacia `cards_catalog` desde:
   - `market_card_listings.card_id`
   - `market_pack_pool_entries.card_id`
   - `player_collection_cards.card_id`
   - `player_deck_slots.card_id`
4. Después del script, usa plantillas atómicas para nuevas altas:
   - `docs/supabase/sql/templates/001_market_card_bundle_template.sql` (carta + listing).
   - `docs/supabase/sql/templates/002_market_pack_template.sql` (pack + pool).

## Seed opcional (Lote extra de cartas)

1. Ejecuta `docs/supabase/sql/005_seed_extra_cards_and_market.sql`.
2. Este script inserta:
   - nuevas `ENTITY`,
   - varias `EXECUTION` (mágicas),
   - varias `TRAP`,
   - y sus listados en `market_card_listings`.

## Fase 5 (Catálogo real consumido por repositorios)

1. Aplicar previamente `003` y `004`.
2. Los repositorios Supabase (`Market` y `Collection`) hidratan cartas desde `public.cards_catalog`.
3. El fallback a modo mock solo se usa cuando no existe esquema completo de catálogo en BD.

## Fase 6.1 (Base de progresión por carta)

1. Ejecuta `docs/supabase/sql/006_phase_6_1_card_progression_foundation.sql`.
2. Verifica tablas:
   - `public.card_passive_skills`
   - `public.card_mastery_passive_map`
   - `public.player_card_progress`
3. Verifica RLS:
   - lectura pública autenticada para catálogo de pasivas y mapeo de mastery,
   - `player_card_progress` solo accesible por `auth.uid() = player_id`.
4. Costes de versión definidos para evolución:
   - `V0 -> V1: 4`
   - `V1 -> V2: 8`
   - `V2 -> V3: 16`
   - `V3 -> V4: 32`
   - `V4 -> V5: 64`
5. Nota de reglas:
   - las copias válidas para evolución se calculan con copias libres de almacén: `player_collection_cards.owned_copies - copias_en_player_deck_slots`.
6. Persistencia de experiencia de cartas:
   - la EXP de combate se agrega en memoria durante el duelo y se persiste en batch al finalizar, evitando escrituras por evento.
   - endpoint: `POST /api/game/progression/apply-battle-exp`.

## Fase 7.5.1 (Idempotencia de EXP por batalla)

1. Ejecuta `docs/supabase/sql/007_phase_7_5_1_battle_exp_idempotency.sql`.
2. Verifica tabla:
   - `public.player_card_xp_batches`
3. Verifica RLS:
   - lectura e inserción solo para `auth.uid() = player_id`.
4. Flujo esperado:
   - el endpoint `POST /api/game/progression/apply-battle-exp` requiere `battleId`.
   - si se repite el mismo `battleId`, la respuesta es vacía y no duplica EXP.

## Notas

1. El trigger `on_auth_user_created` solo debe existir una vez.
2. Si ya tienes datos, el script es idempotente para políticas/trigger principales.
3. Para alta de cartas nuevas, evita inserts manuales sueltos: usa siempre plantillas transaccionales de `templates/`.
4. Orden recomendado:
   - primero `001_market_card_bundle_template.sql` (dar de alta cartas),
   - después `002_market_pack_template.sql` (usar esos `card_id` en sobres).
