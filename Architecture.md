<!-- Architecture.md - Descripción de la arquitectura por capas, reglas de dependencia y flujo del juego. -->
# Arquitectura del Proyecto

Arquitectura en capas orientada a dominio con separación estricta entre UI, motor de reglas, estrategia de oponente e integraciones externas.

## Estructura actual (`/src`)

```text
/src
 ├── app/                                  # Entradas Next.js (App Router)
 │   ├── layout.tsx
 │   └── page.tsx
 │
 ├── components/                           # Presentación React
 │   └── game/
 │       ├── board/
 │       │   ├── battlefield/              # Render de tablero y slots
 │       │   ├── hooks/
 │       │   │   ├── internal/             # Estado inicial, errores UI, loop oponente
 │       │   │   ├── useBoard.ts
 │       │   │   ├── useBoard.test.ts
 │       │   │   └── useBoard.integration.test.ts
 │       │   ├── ui/                       # Paneles de fase y timer
 │       │   ├── Board.test.tsx
 │       │   └── index.tsx
 │       └── card/
 │   └── hub/                              # Dashboard central (ciudad) y accesos a módulos
 │
 ├── core/
 │   ├── entities/                         # Tipos de dominio
 │   │   └── hub/                          # Entidades del mundo central
 │   ├── errors/                           # AppError + códigos tipados
 │   ├── repositories/                     # Contratos de acceso a datos de dominio
 │   ├── services/
 │   │   └── opponent/                     # IA heurística (sin LLM)
 │   │   └── hub/                          # Orquestación de progreso y desbloqueos del dashboard
 │   └── use-cases/
 │       └── hub/                          # Casos de uso del dashboard central
 │       ├── game-engine/                  # Casos de uso modulares por dominio
 │       │   ├── state/
 │       │   ├── actions/
 │       │   │   └── internal/             # Resolución de efectos de ejecución + logs
 │       │   ├── phases/
 │       │   ├── combat/
 │       │   │   └── internal/             # Validación, resolución y logging de combate
 │       │   ├── fusion/
 │       │   ├── effects/
 │       │   │   └── internal/             # Selección, resolución y logging de trampas
 │       │   └── logging/
 │       ├── CombatService.ts
 │       └── GameEngine.ts                 # Fachada estable
 │
 ├── infrastructure/                       # Integraciones externas (DB/API/adaptadores)
 │   └── repositories/                     # Implementaciones de contratos (mock/in-memory/real)
 └── lib/
```

## Reglas de dependencia

1. `app` y `components` consumen `core`.
2. `core` no depende de `components` ni de `app`.
3. `core/services/opponent` depende de `core/use-cases` y `core/entities`.
4. `infrastructure` implementa contratos del dominio cuando se conecten APIs/DB.

## Frontera Auth/BD (Fase 0)

1. `core/repositories` define contratos agnósticos de proveedor (`IAuthRepository`, `IPlayerProfileRepository`, `IPlayerProgressRepository`).
2. `core/entities` aloja entidades de sesión/perfil/progreso sin tipos de SDK externo.
3. `infrastructure/database` y `infrastructure/persistence/supabase` contendrán adaptadores concretos.
4. `app` y `components` tienen prohibido importar SDKs de Supabase o clientes de BD.
5. ADR asociada: `docs/adr/ADR-0001-auth-persistence-boundary.md`.

```text
UI (app/components) -> UseCases/Services -> Repositories (interfaces core)
                                              ^
                                              |
                                   Infrastructure Adapters
                         (InMemory actual / Supabase futuro / otro proveedor)
```

## Auth real (Fase 1)

1. `middleware.ts` protege `/hub/*` y redirige a `/login` cuando no existe sesión válida.
2. `services/auth/auth-actions.ts` expone login/logout mediante server actions.
3. `SupabaseAuthRepository` implementa `IAuthRepository` en infraestructura.
4. UI nunca importa SDK de Supabase; solo consume acciones/casos de uso.
5. Variables mínimas:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Auth UX (Fase 1.1)

1. `src/app/page.tsx` pasa a ser landing pública del proyecto.
2. Se añade alta de usuario en `src/app/register/page.tsx` con `RegisterForm`.
3. `SignUpWithEmailUseCase` aplica validaciones mínimas y delega al repositorio.
4. `middleware.ts` evita acceso a `/login` y `/register` si ya existe sesión.
5. Se mantiene desacoplamiento: UI -> `services/auth/auth-actions.ts` -> use-cases -> `IAuthRepository`.

## Auth Hardening (Fase 1.2)

1. `src/app/api/auth/*` actúa como capa HTTP fina sin reglas de negocio.
2. Orquestación de login/register/logout en `src/services/auth/api/*` (servicios por endpoint).
3. Seguridad aplicada en servidor:
   - validación de `Origin` contra `Host` para mitigar CSRF básico,
   - rate-limit en memoria por IP/email para frenar fuerza bruta.
4. Persistencia de sesión/cookies sigue encapsulada en `SupabaseAuthRepository`.
5. Se añaden tests de endpoints auth (`route.test.ts`) cubriendo éxito, origen no confiable y límites de abuso.

## Persistencia jugador (Fase 2)

1. Se incorporan repositorios reales:
   - `SupabasePlayerProfileRepository`
   - `SupabasePlayerProgressRepository`
2. Se añade bootstrap de jugador autenticado:
   - `GetOrCreatePlayerProfileUseCase`
   - `GetOrCreatePlayerProgressUseCase`
3. `Hub` empieza a consumir progreso persistido vía `SupabaseHubRepository`.
4. SQL de fase:
   - `docs/supabase/sql/001_phase_2_player_profile_progress.sql`
5. Seguridad de datos:
   - RLS activa en `player_profiles` y `player_progress`,
   - políticas `SELECT/INSERT/UPDATE` solo para `auth.uid() = player_id`.

## Persistencia Home/Market (Fase 3)

1. Estado del jugador persistido en Supabase:
   - wallet Nexus,
   - colección,
   - deck por slots,
   - historial de transacciones.
2. `app/api/market/*` y `app/api/home/*` encapsulan mutaciones del cliente.
3. UI cliente consume endpoints HTTP (`services/market/market-actions.ts`, `services/home/deck-builder/deck-builder-actions.ts`).
4. Repositorios dedicados:
   - `SupabaseWalletRepository`,
   - `SupabaseCardCollectionRepository`,
   - `SupabaseDeckRepository`,
   - `SupabaseTransactionRepository`.
5. SQL de fase:
   - `docs/supabase/sql/002_phase_3_market_home_persistence.sql`.

## Flujo de turno actual

1. El duelo se inicializa con `createInitialGameState` (mazo de 20 y mano inicial configurable; en tablero actual se usa 4 por jugador).
2. Se define `startingPlayerId`; el jugador inicial no puede atacar en turno `1`.
3. El turno tiene 2 subfases: `MAIN_1` (despliegue) y `BATTLE` (combate).
4. Al cerrar `BATTLE`, `nextPhase` pasa el turno al rival, roba 1 carta para ese rival, suma energía `+2` (con tope) y limpia flags.
5. `useOpponentTurn` ejecuta pasos automáticos del oponente (`runOpponentStep`) con el mismo ciclo de 2 subfases.
6. La dificultad del rival se resuelve desde progreso de campaña (`resolveDifficultyFromCampaign`) y se inyecta en la estrategia.
7. `GameState` mantiene `combatLog` en memoria y la UI consume ese stream para historial y carteleras.
8. `Board` consume también `combatLog` para animaciones desacopladas (ej. transición al cementerio).
9. Las trampas (`TRAP`) viven en la misma zona de `activeExecutions` y se disparan por eventos del motor (no desde UI).
10. La fusión soporta flujo pendiente en motor: `startFusionSummon` crea `pendingTurnAction` y `resolvePendingTurnAction` completa selección de 2 materiales antes de invocar.
11. La UI marca materiales seleccionados de fusión (`pendingFusionSelectedEntityIds`) para mantener trazabilidad visual durante la selección.

## Diseño para evolución

1. Estrategia actual: `HeuristicOpponentStrategy` (determinista con heurísticas).
2. Extensión futura LLM: nueva implementación de `IOpponentStrategy` sin tocar UI.
3. Multijugador futuro: sustitución del controlador rival por controlador remoto sin romper el motor.

## Subdominio Hub (fase inicial)

1. `HubService` centraliza reglas de bloqueo/desbloqueo del dashboard.
2. `HubAccessPolicy` define condiciones de acceso por progreso (tutorial/medallas).
3. `GetHubDashboardUseCase`, `GetHubMapUseCase` y `GetAvailableSectionsUseCase` exponen lecturas específicas sin lógica en UI.
4. `IHubRepository` abstrae acceso a progreso, secciones y nodos del mapa; `InMemoryHubRepository` es el adaptador temporal.

## Hub UI y navegación (fase 3 y 4)

1. `src/app/hub/page.tsx` renderiza la sala de control (HUD) como punto de entrada visual.
2. `HubScene` y `HubSceneNode3D` gestionan layout de paneles, navegación por click y feedback de secciones bloqueadas.
3. Rutas activas del hub:
   - `/hub/market`
   - `/hub/home`
   - `/hub/training`
   - `/hub/story`
   - `/hub/multiplayer`
4. `getHubSectionViewModel` resuelve en servidor el estado de cada sección antes de renderizar su pantalla.
5. `HubSectionScreen` unifica la presentación base de módulos para evitar duplicación de layout.

## Hub UI (fase 3 y 4 - optimización y hardening)

1. `HubNodeActionPanel` encapsula interacción accesible de nodos 3D (navegación y lock reason).
2. Cálculos puros de posición y color de nodo se extraen a `internal/hub-3d-node-math.ts`.
3. `MarketCore3D` se divide en submódulos (`nodes/market/*`) para reducir tamaño por archivo y aislar responsabilidades.
4. Se eliminan wrappers legacy no referenciados para evitar deuda técnica.

## Hub UI (fase 5 y 6 - fallback y resiliencia runtime)

1. Detección de capacidades gráficas en `internal/hub-webgl-support.ts`.
2. Fallback 2D (`HubSceneFallback2D`) activo cuando WebGL no está disponible.
3. `HubScene` pausa render 3D cuando la pestaña no está visible para proteger FPS/consumo.
4. Cobertura de pruebas añadida para:
   - detector WebGL,
   - fallback 2D,
   - integración de `HubScene` en modo fallback.

## Hub UI (Refactor Fase 0 - Preparación)

1. Se define nueva arquitectura visual por capas:
   - `HubShell` (composición),
   - `HubScene3D` (render y animación 3D),
   - widgets desacoplados (`HubUserSection`, `HubSessionSection`, `HubProgressSection`).
2. `CyberBackground` se reutiliza como capa base del hub para atmósfera compartida con landing.
3. El header tradicional se elimina en favor de una sección de progreso dedicada.
4. El dominio y reglas de acceso del hub no cambian:
   - UI no decide bloqueos,
   - bloqueos se resuelven en `HubAccessPolicy` y casos de uso.
5. Se prioriza un diseño extensible para nodos 3D por sección con fallback visual cuando no haya soporte WebGL.

## Hub UI (Fase 1 completada)

1. `HubShell` ya es el contenedor raíz en `/hub`.
2. Secciones desacopladas activas:
   - `HubUserSection`,
   - `HubSessionSection`,
   - `HubProgressSection`.
3. `HubScene` queda aislada para render de nodos distribuidos y navegación.
4. Los nodos de sección usan decoradores por tipo en `src/components/hub/nodes/*` para mantener SRP visual.
5. `CyberBackground` se mantiene como base visual compartida del hub.

## Combate (Bloque nuevo - Fase 0 preparada)

1. ADR base del bloque:
   - `docs/adr/2026-03-08-combat-block-banner-fusion-destroyed.md`.
2. Se define política de banners transitorios `latest-wins` para evitar backlog visual bajo spam de acciones.
3. Se fija contrato de fusión reforzada:
   - materiales + carta mágica + carta final existente en `fusionDeck`.
4. Se fija doble ubicación de `fusionDeck`:
   - **Arsenal/Home**: debajo del contenedor del deck principal.
   - **Tablero/Combate**: junto a zonas de deck/cementerio para consulta rápida.
5. Se formaliza nueva zona de juego `destroyedPile` separada de `graveyard` para futuras mecánicas.
6. Se acuerda guarda de integridad para salir de Arsenal:
   - deck principal obligatorio de `20/20`,
   - validación en UI y capa de aplicación.

## Subdominio Mi Home (Deck Builder)

1. Entidades: `IDeck`, `IDeckCardSlot`, `ICollectionCard`.
2. Contrato de datos: `IDeckRepository` (deck + colección).
3. Reglas puras en `deck-rules.ts`:
   - deck de `20` cartas,
   - máximo `3` copias por `card.id`.
4. Casos de uso base:
   - `GetHomeDeckBuilderDataUseCase`,
   - `AddCardToDeckUseCase`,
   - `RemoveCardFromDeckUseCase`,
   - `MoveDeckCardUseCase`,
   - `SaveDeckUseCase`.
5. Capa `services/home/deck-builder` adapta la interacción de UI reutilizando los casos de uso sin mover lógica al componente React.

## Subdominio Market (fase 1-3)

1. Entidades base:
   - `IMarketCardListing`,
   - `IMarketPackDefinition`,
   - `IPackCardEntry`,
   - `IPlayerWallet`,
   - `IMarketTransaction`.
2. Moneda oficial del mercado: `Nexus`.
3. Contratos de repositorio:
   - `IMarketRepository`,
   - `IWalletRepository`,
   - `ICardCollectionRepository`,
   - `ITransactionRepository`.
4. Reglas puras en `core/services/market`:
   - validación de economía Nexus,
   - apertura de sobres con selección ponderada por rareza/peso.
5. Las rarezas (`COMMON`, `RARE`, `EPIC`, `LEGENDARY`) quedan preparadas en capa de mercado sin forzar cambios inmediatos en motor de combate.

## Subdominio Market (fase 4 mock)

1. `InMemoryMarketRepository` provee catálogo y pools de sobre.
2. `InMemoryWalletRepository` gestiona saldo Nexus por jugador.
3. `InMemoryCardCollectionRepository` permite inyectar compras al almacén del jugador.
4. `InMemoryTransactionRepository` registra historial de compras mock.
5. `/hub/market` consume `GetMarketCatalogUseCase` como fuente de verdad de catálogo/saldo.

## Subdominio Market (fase 5 sin BD)

1. Se introduce `IPlayerPersistenceStore` en infraestructura para centralizar estado de jugador (wallet, colección, deck y transacciones).
2. `InMemoryPlayerPersistenceStore` actúa como backend temporal compartido y sustituible por adaptador real (DB) sin cambiar casos de uso.
3. Repositorios in-memory (`Wallet`, `CardCollection`, `Deck`, `Transaction`) dependen del store y no gestionan estado aislado interno.
4. `singletons.ts` inyecta una única instancia compartida del store para mantener consistencia entre módulos `Market` y `Home`.

## Subdominio Market (auditoría UI y mantenibilidad)

1. El módulo visual se documenta en `src/components/hub/market/README.md`.
2. `MarketScene` delega estado y side-effects en `internal/useMarketSceneState.ts`.
3. La UI se divide por subcarpetas (`layout/`, `listings/`, `packs/`, `reveal/`, `vault/`) para localizar responsabilidades rápido.
4. Los paneles y overlays especializados respetan SRP y límite de tamaño por archivo.
5. Componentes legacy sin referencias activas deben eliminarse para evitar deuda técnica.
6. Endurecimiento de integridad:
   - `InMemoryWalletRepository` rechaza débito con saldo insuficiente.
   - IDs de transacción de mercado se generan con estrategia única (`generateMarketTransactionId`).

## Subdominio Market/Home (fase 5 con catálogo BD)

1. `cards_catalog` pasa a ser la fuente canónica para hidratar `ICard` en repositorios Supabase.
2. `SupabaseMarketRepository` y `SupabaseCardCollectionRepository` cargan cartas por `card_id` desde BD (sin `CARD_BY_ID` hardcodeado en flujo persistente).
3. Se mantiene fallback a in-memory solo si no está disponible el esquema completo (`market_*` + `cards_catalog`).
4. `004_phase_4_cards_catalog_integrity.sql` garantiza FKs entre market/home y catálogo maestro.

## Subdominio Market/Home (fase 5.1 rendimiento UX)

1. Endpoints de compra del market (`buy-card`, `buy-pack`) devuelven snapshot unificado (`catalog`, `transactions`, `collection`) para evitar refetch múltiple en cliente.
2. `useMarketSceneState` aplica actualización optimista al comprar carta y reconcilia con snapshot de servidor.
3. `HomeDeckBuilderScene` aplica inserción/retirada optimista de slots para respuesta visual inmediata.
4. Se cachea la validación de disponibilidad de catálogo Supabase con TTL corto para reducir round-trips repetidos de bootstrap.

## Subdominio Game (fase 5.2 deck persistido)

1. `Board` acepta `initialPlayerDeck` opcional para evitar dependencia rígida de mazos mock.
2. `getPlayerBoardDeck` resuelve en servidor el mazo guardado del jugador autenticado (`deck slots + colección`).
3. `/hub/training` inicializa el combate con mazo persistido cuando está completo; si no, usa fallback mock del motor.

## Subdominio Game (fase 0 refactor match desacoplado)

1. Se introduce el subdominio `match` como contrato transversal para soportar `TRAINING`, `STORY`, `MULTIPLAYER` y `TUTORIAL`.
2. Contratos base en `core/entities/match`:
   - `IMatchMode`,
   - `IMatchActionRequest`,
   - `IMatchConfig`,
   - `IMatchController`.
3. Primera implementación en aplicación:
   - `services/game/match/LocalMatchController`,
   - `services/game/match/create-match-controller`.
4. Objetivo de esta fase:
   - fijar frontera de orquestación de partida antes de extraer lógica de `useBoard`.
5. Esta fase no cambia reglas del motor (`GameEngine`), solo prepara desacoplamiento de runtime.

## Subdominio Game (fase 1 recompensas desacopladas por modo)

1. Se introduce política pura de recompensas en `core/services/match/rewards`.
2. Cálculo por modo:
   - `TUTORIAL`: sin recompensa,
   - `TRAINING`: curva base reducida,
   - `STORY`: escala por `storyOpponentTier`,
   - `MULTIPLAYER`: curva competitiva separada.
3. Esta política es agnóstica de BD y UI; solo devuelve valores dominio (`nexus`, `playerExperience`).
4. Persistencia de recompensa quedará en capa de aplicación (fase posterior), no en el motor.

## Subdominio Game (fase 2-3 runtime por modo y progresión)

1. `createMatchController` selecciona controller concreto por modo (`Training`, `Story`, `Tutorial`, `Multiplayer`) con contrato `IMatchController` compartido.
2. La persistencia post-duelo de EXP de cartas se resuelve en `services/game/match/progression` mediante fábrica por modo:
   - `TUTORIAL`: no persiste,
   - resto de modos locales actuales: persistencia remota vía API.
3. `useBoard` deja de invocar cliente HTTP de progresión de forma directa y delega en servicio de aplicación desacoplado.

## Subdominio Game (fase 4 determinismo por seed)

1. Se introduce RNG determinista en `core/services/random/seeded-rng.ts` para que el arranque de partida sea reproducible.
2. `createInitialGameState` acepta `randomSource` inyectable (sin acoplarse a `Math.random`).
3. `boardInitialState` usa `seed` de partida para:
   - barajar mazos con RNG inyectado,
   - generar `runtimeId` inicial de cartas de forma estable.
4. `useBoard` conserva `matchSeed` estable durante la partida para depuración y futuros replays/sincronización.
5. `boardInitialState` ya no define ids/nombres/decks hardcodeados; delega en `createBoardMatchConfig` por modo.

## Subdominio Story (preparación fase 5)

1. Se define `IOpponentRepository` en `core/repositories` para cargar duelos de historia desde persistencia.
2. El contrato de duelo queda tipado en `IStoryDuelDefinition` (capítulo, duelo, oponente, mazo y reglas de arranque).
3. Objetivo inmediato: conectar este repositorio a tablas `story_opponents`, `story_duels` y `story_deck_lists` sin acoplar UI.

## Subdominio Story (fase 5 implementación base)

1. El mapa Story (`/hub/story`) se alimenta desde repositorios (`IOpponentRepository` + progreso de duelo por jugador).
2. La navegación de nodos usa bloqueo por prerequisito (`unlock_requirement_duel_id`).
3. El duelo Story usa `Board` en modo `STORY` con identidad y mazo de oponente inyectados por configuración.
4. El cierre de duelo se registra vía `POST /api/story/duels/complete`.
5. Recompensa de primera victoria:
   - `Nexus` al monedero,
   - `player_experience` global,
   - cartas configuradas en `story_duel_reward_cards` (garantizadas y probabilísticas).

## Subdominio Progresión (fase 6.1)

1. Se incorpora `player_card_progress` como estado canónico de progresión por carta (`version_tier`, `level`, `xp`).
2. Versionado base de cartas:
   - inicio en `V0`,
   - tope en `V5`,
   - costes: `4, 8, 16, 32, 64`.
3. Las pasivas de mastery (`V5`) se modelan con:
   - `card_passive_skills` (catálogo reutilizable),
   - `card_mastery_passive_map` (asignación por carta).
4. La lógica de evolución se basa en copias del almacén (`player_collection_cards`), sin contar slots de deck.

## Subdominio Progresión (fase 6.2 evolución de versión)

1. Caso de uso `EvolveCardVersionUseCase` orquesta:
   - validación de copias requeridas por tier,
   - consumo de copias del almacén,
   - actualización de `player_card_progress`.
2. Endpoint `POST /api/home/collection/evolve` expone la operación y devuelve snapshot (`progress`, `collection`, `consumedCopies`).
3. Se mantiene separación de responsabilidades:
   - reglas puras en `core/services/progression`,
   - orquestación en `core/use-cases/home`,
   - persistencia en repositorios (`ICardCollectionRepository`, `IPlayerCardProgressRepository`).

## Subdominio Progresión (fase 6.3 integración Home UI)

1. `HomeDeckActionBar` reemplaza el botón de compilar por `Evolucionar` cuando la carta seleccionada cumple copias requeridas.
2. `HomeDeckBuilderScene` mantiene estado de colección/progreso para reflejar consumo de copias tras evolución sin recargar pantalla.
3. `Card` y `CardFrame` aceptan metadatos de progreso (`versionTier`, `level`) y los renderizan junto al bloque de energía.
4. `HomeCollectionPanel` muestra simultáneamente copias usadas en deck y unidades disponibles en almacén para guiar evolución.
5. `HomeEvolutionOverlay` visualiza la fusión de copias y subida de versión en capa central con feedback cinemático.

## Eventos y observabilidad

1. El motor añade eventos en `combatLog` desde los casos de uso (`playCard`, `executeAttack`, `nextPhase`, etc.).
2. `SidePanels` muestra historial con filtros de turno y actor.
3. `BattleBannerCenter` consume eventos críticos para mostrar carteleras centrales en tiempo real.
4. `GraveyardTransitionLayer` reutiliza eventos `CARD_TO_GRAVEYARD` para animación genérica de descarte/destrucción/sacrificio.
5. `useGameAudio` consume `combatLog` para efectos de sonido por eventos y fin de duelo.
6. `audio-catalog.ts` define rutas/volúmenes por evento y canales (`music`/`sfx`).
7. `FusionCinematicLayer` consume `FUSION_SUMMONED` para reproducir vídeo por carta de fusión y bloquear interacción temporal.
8. Tras el vídeo, `FusionCinematicLayer` ejecuta una segunda animación de invocación: carta desde centro hasta el slot final en tablero.

## Fin de partida

1. El ganador se deriva desde `healthPoints <= 0`.
2. Se bloquean acciones al finalizar.
3. `DuelResultOverlay` renderiza resultado central y reinicio de partida.

## Documentación modular

1. `game-engine/README.md`: invariantes del motor y contratos.
2. `services/opponent/README.md`: decisiones del bot y dificultad.
3. `hooks/internal/README.md`: responsabilidades internas del tablero.
4. `board/README.md`: mapa de interacción del tablero y UX.
5. `board/hooks/README.md`: fachada de hooks públicos del tablero.
6. `board/ui/README.md`: componentes visuales y capas de layout.
7. `board/battlefield/README.md`: zonas de campo, slots y VFX.
8. `core/use-cases/README.md`: capa de aplicación y fachada `GameEngine`.
9. `core/entities/README.md`: tipos de dominio (`ICard`, `IPlayer`, `ICombatLog`).
10. `core/errors/README.md`: catálogo de errores tipados.
11. `core/data/mock-cards/README.md`: dataset de cartas mock para pruebas.
12. `core/config/README.md`: configuración central (audio y futuros catálogos).

## Convención documental obligatoria

1. Todo archivo del proyecto debe empezar con una primera línea comentada que incluya:
   - ruta del archivo,
   - descripción breve de su responsabilidad.
2. Esta convención aplica tanto a código como a documentación para mantener trazabilidad homogénea en PR y revisiones técnicas.
