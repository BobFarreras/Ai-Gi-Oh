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
2. `HubScene` y `HubSceneNode` gestionan layout de paneles, navegación por click y feedback de secciones bloqueadas.
3. Rutas activas del hub:
   - `/hub/market`
   - `/hub/home`
   - `/hub/training`
   - `/hub/story`
   - `/hub/multiplayer`
4. `getHubSectionViewModel` resuelve en servidor el estado de cada sección antes de renderizar su pantalla.
5. `HubSectionScreen` unifica la presentación base de módulos para evitar duplicación de layout.

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
