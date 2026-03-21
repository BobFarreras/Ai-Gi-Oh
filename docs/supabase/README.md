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
15. `public.story_opponents`:
   - catálogo de oponentes de historia (dificultad, perfil IA, estado activo).
16. `public.story_deck_lists`:
   - listas de mazo versionadas por oponente.
17. `public.story_deck_list_cards`:
   - composición de mazo por slot (`card_id`, `copies`).
18. `public.story_duels`:
   - definición de cada duelo por capítulo/índice con recompensas Nexus/EXP y reglas de inicio.
19. `public.story_duel_reward_cards`:
   - cartas recompensa por duelo (garantizadas o probabilísticas).
20. `public.player_story_duel_progress`:
   - progreso por jugador y duelo (wins/losses/resultado y timestamps).
21. `public.player_progress.player_experience`:
   - experiencia global del jugador para progresión del arquitecto.
22. `public.player_fusion_deck_slots`:
   - bloque de 2 slots dedicado a cartas de tipo `FUSION`.
   - separado del deck principal de 20 slots.
23. `public.player_story_world_state`:
   - estado compacto Story por jugador (`current_node_id`, `visited_node_ids`, `interacted_node_ids`).
   - 1 fila por usuario.
24. `public.player_training_progress`:
   - progreso acumulado de entrenamiento por tier y desbloqueo más alto.
25. `public.player_training_match_claims`:
   - idempotencia por batalla para impedir doble recompensa en entrenamiento.
26. `public.player_tutorial_node_progress`:
   - progreso por nodo del tutorial (`arsenal`, `combat`, `market`, `reward`).
27. `public.player_tutorial_reward_claims`:
   - claim único de recompensa final del onboarding tutorial.
28. `public.starter_deck_template_slots`:
   - plantilla persistente del deck inicial para jugadores nuevos.
29. `public.player_progress.has_seen_academy_intro / has_skipped_tutorial`:
   - flags de onboarding para controlar intro inicial de Academy y salto opcional de tutorial.

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

## Fase 5 (Story: oponentes, duelos y recompensas)

1. Ejecuta `docs/supabase/sql/008_phase_5_story_opponents_duels.sql`.
2. Verifica tablas:
   - `public.story_opponents`
   - `public.story_deck_lists`
   - `public.story_deck_list_cards`
   - `public.story_duels`
   - `public.story_duel_reward_cards`
   - `public.player_story_duel_progress`
3. Verifica semilla inicial:
   - 5 oponentes base,
   - 5 duelos (capítulo 1 y 2),
   - recompensas de Nexus/EXP y cartas por duelo.
4. Verifica RLS:
   - catálogos de historia solo lectura para `authenticated`,
   - progreso de duelo solo propietario (`auth.uid() = player_id`).
5. Contrato de aplicación preparado:
   - `IOpponentRepository` + `IStoryDuelDefinition` para eliminar hardcode de Story en UI.

## Fase 5.2 (Ampliación de roster Story)

1. Ejecuta `docs/supabase/sql/017_phase_5_2_story_opponent_roster_expansion.sql`.
2. Ajustes principales:
   - normaliza nombre visible de `opp-ch1-apprentice` a `GenNvim`,
   - crea 4 oponentes adicionales (`BigLog`, `Jaku`, `Helena`, `Soldado Acto 01`),
   - crea mazos dedicados por oponente con perfil alineado a dificultad.
3. Alcance de esta fase:
   - solo catálogo de oponentes + deck lists.
   - la activación visual en mapa/nodos se hace en fase de layout Story.

## Fase 5.3 (Expansión de rotación de duelos Story)

1. Ejecuta `docs/supabase/sql/018_phase_5_3_story_duel_rotation_expansion.sql`.
2. Ajustes principales:
   - añade `story-ch2-duel-3` a `story-ch2-duel-6`,
   - conecta los nuevos oponentes (`Soldado Acto 01`, `Jaku`, `BigLog`, `Helena`) al flujo de capítulo 2,
   - asigna recompensas de carta garantizadas por duelo nuevo.
3. Dependencias:
   - requiere haber ejecutado `017_phase_5_2_story_opponent_roster_expansion.sql`.

## Fase 5.4 (Rebalanceo de capítulos Story)

1. Ejecuta `docs/supabase/sql/019_phase_5_4_story_chapter_rebalance.sql`.
2. Ajustes principales:
   - mueve la rotación nueva (`Soldado`, `Jaku`, `BigLog`, `Helena`) a capítulo 1,
   - simplifica capítulo 2 a flujo corto (duelo, economía/evento, boss),
   - actualiza `avatar_url` de oponentes con assets locales cargados,
   - desactiva `opp-ch1-architect` y `opp-ch1-sysadmin` en el roster activo.
3. Nota:
   - esta fase pisa configuración funcional de `018` para dejar el orden final de playtesting.

## Fase 6 (Acto 1 real con cierre BOSS)

1. Ejecuta `docs/supabase/sql/020_phase_6_act1_real_flow.sql`.
2. Ajustes principales:
   - define flujo real de acto 1 con Soldado repetido + GenNvim difícil + BOSS GenNvim,
   - crea `deck-opp-ch1-apprentice-v2` para el tramo difícil de GenNvim,
   - mantiene desbloqueo de acto 2 al ganar el BOSS del acto 1.
3. Dependencias:
   - requiere esquema Story previo (`008`) y roster ampliado (`017`).

## Fase 7 (Acto 2 ramificado con puente de BOSS)

1. Ejecuta `docs/supabase/sql/021_phase_7_act2_branching_flow.sql`.
2. Ajustes principales:
   - define Acto 2 con tres ramas (superior, central e inferior),
   - introduce doble nodo de Helena para condicionar el acceso final,
   - configura `story-ch2-duel-9` como BOSS Jaku tras activar el puente.
3. Dependencias:
   - requiere haber aplicado `020_phase_6_act1_real_flow.sql`.

## Fase 5.1 (Experiencia global del jugador)

1. Ejecuta `docs/supabase/sql/009_phase_5_player_progress_experience.sql`.
2. Verifica columna:
   - `public.player_progress.player_experience` (default `0`, no negativo).
3. Uso previsto:
   - recompensas de Story incrementan esta columna al ganar por primera vez cada duelo.

## Fase 2.x (Bloque de fusión dedicado en Arsenal)

1. Ejecuta `docs/supabase/sql/010_phase_2_fusion_deck_slots.sql`.
2. Verifica tabla:
   - `public.player_fusion_deck_slots`.
3. Verifica bootstrap en alta de usuario:
   - 2 filas por jugador (`slot_index` 0 y 1).
4. Verifica RLS:
   - `SELECT/INSERT/UPDATE` solo para `auth.uid() = player_id`.

## Fase 8 (Estado e historial del mundo Story)

1. Ejecuta `docs/supabase/sql/013_phase_8_story_world_history.sql`.
2. Verifica tablas:
   - `public.player_story_world_state`
   - `public.player_story_history_events`
3. Verifica RLS:
   - ambas tablas solo visibles/modificables por el propio usuario (`auth.uid() = player_id`).
4. Uso previsto:
   - `player_story_world_state`: nodo actual del mapa Story.
   - `player_story_history_events`: timeline de movimiento, resolución de nodo, recompensas e interacciones.

## Fase E (Interacciones narrativas virtuales)

1. Ejecuta `docs/supabase/sql/014_phase_e_story_virtual_interactions.sql`.
2. Ajustes principales:
   - (legacy) ajustes sobre `player_story_history_events` para permitir nodos virtuales.

## Fase F (Estado compacto Story)

1. Ejecuta `docs/supabase/sql/015_phase_f_story_compact_state.sql`.
2. Ajustes principales:
   - `player_story_world_state.current_node_id` deja de depender de FK a `story_duels`.
   - se añaden `visited_node_ids` e `interacted_node_ids` en la misma tabla.
3. Uso previsto:
   - la navegación Story usa solo estado compacto (`current + visited + interacted`).
   - el historial legacy puede eliminarse con fase de cleanup.

## Fase F.1 (Cleanup historial legacy Story)

1. Ejecuta `docs/supabase/sql/016_phase_f_story_history_cleanup.sql`.
2. Resultado:
   - se elimina `public.player_story_history_events` y sus políticas/índice asociados.
   - runtime Story sigue operativo al usar solo `player_story_world_state`.

## Fase T (Progresión e idempotencia de Training)

1. Ejecuta `docs/supabase/sql/022_phase_training_progression.sql`.
2. Verifica tablas:
   - `public.player_training_progress`
   - `public.player_training_match_claims`
3. Verifica RLS:
   - ambas tablas solo accesibles por propietario (`auth.uid() = player_id`).
4. Uso previsto:
   - endpoint `POST /api/training/matches/complete` aplica recompensa una sola vez por `battle_id`.

## Fase T.1 (Progreso por nodo tutorial y recompensa final)

1. Ejecuta `docs/supabase/sql/023_phase_tutorial_node_progress_and_reward.sql`.
2. Verifica tablas:
   - `public.player_tutorial_node_progress`
   - `public.player_tutorial_reward_claims`
3. Verifica RLS:
   - ambas tablas solo accesibles por propietario (`auth.uid() = player_id`).
4. Uso previsto:
   - `POST /api/tutorial/nodes/complete` persiste completion idempotente de cada nodo.
   - `POST /api/tutorial/reward/claim` aplica una sola vez la recompensa final del tutorial.

## Fase O.1 (Plantilla de deck inicial onboarding)

1. Ejecuta `docs/supabase/sql/024_phase_onboarding_starter_deck_template.sql`.
2. Verifica tabla:
   - `public.starter_deck_template_slots`.
3. Uso previsto:
   - `GetOrCreateStarterDeckUseCase` hidrata el deck base desde plantilla activa (`academy-starter-v1`).

## Fase O.2 (Flags de intro y salto tutorial)

1. Ejecuta `docs/supabase/sql/025_phase_onboarding_progress_flags.sql`.
2. Verifica columnas:
   - `public.player_progress.has_seen_academy_intro`
   - `public.player_progress.has_skipped_tutorial`
3. Uso previsto:
   - `PATCH /api/player/onboarding` persiste decisiones de intro en Hub.

## Notas

1. El trigger `on_auth_user_created` solo debe existir una vez.
2. Si ya tienes datos, el script es idempotente para políticas/trigger principales.
3. Para alta de cartas nuevas, evita inserts manuales sueltos: usa siempre plantillas transaccionales de `templates/`.
4. Orden recomendado:
   - primero `001_market_card_bundle_template.sql` (dar de alta cartas),
   - después `002_market_pack_template.sql` (usar esos `card_id` en sobres).
