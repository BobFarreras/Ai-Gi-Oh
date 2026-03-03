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
 │
 ├── core/
 │   ├── entities/                         # Tipos de dominio
 │   ├── errors/                           # AppError + códigos tipados
 │   ├── services/
 │   │   └── opponent/                     # IA heurística (sin LLM)
 │   └── use-cases/
 │       ├── game-engine/                  # Casos de uso modulares por dominio
 │       │   ├── state/
 │       │   ├── actions/
 │       │   ├── phases/
 │       │   ├── combat/
 │       │   ├── fusion/
 │       │   ├── effects/
 │       │   └── logging/
 │       ├── CombatService.ts
 │       └── GameEngine.ts                 # Fachada estable
 │
 ├── infrastructure/                       # Integraciones externas (pendiente)
 └── lib/
```

## Reglas de dependencia

1. `app` y `components` consumen `core`.
2. `core` no depende de `components` ni de `app`.
3. `core/services/opponent` depende de `core/use-cases` y `core/entities`.
4. `infrastructure` implementa contratos del dominio cuando se conecten APIs/DB.

## Flujo de turno actual

1. El duelo se inicializa con `createInitialGameState` (mazo de 20 y mano inicial de 3 por jugador).
2. Se define `startingPlayerId`; el jugador inicial no puede atacar en turno `1`.
3. El turno tiene 2 subfases: `MAIN_1` (despliegue) y `BATTLE` (combate).
4. Al cerrar `BATTLE`, `nextPhase` pasa el turno al rival, roba 1 carta para ese rival, suma energía `+2` (con tope) y limpia flags.
5. `useOpponentTurn` ejecuta pasos automáticos del oponente (`runOpponentStep`) con el mismo ciclo de 2 subfases.
6. La dificultad del rival se resuelve desde progreso de campaña (`resolveDifficultyFromCampaign`) y se inyecta en la estrategia.
7. `GameState` mantiene `combatLog` en memoria y la UI consume ese stream para historial y carteleras.
8. `Board` consume también `combatLog` para animaciones desacopladas (ej. transición al cementerio).
9. Las trampas (`TRAP`) viven en la misma zona de `activeExecutions` y se disparan por eventos del motor (no desde UI).

## Diseño para evolución

1. Estrategia actual: `HeuristicOpponentStrategy` (determinista con heurísticas).
2. Extensión futura LLM: nueva implementación de `IOpponentStrategy` sin tocar UI.
3. Multijugador futuro: sustitución del controlador rival por controlador remoto sin romper el motor.

## Eventos y observabilidad

1. El motor añade eventos en `combatLog` desde los casos de uso (`playCard`, `executeAttack`, `nextPhase`, etc.).
2. `SidePanels` muestra historial con filtros de turno y actor.
3. `BattleBannerCenter` consume eventos críticos para mostrar carteleras centrales en tiempo real.
4. `GraveyardTransitionLayer` reutiliza eventos `CARD_TO_GRAVEYARD` para animación genérica de descarte/destrucción/sacrificio.
5. `useGameAudio` consume `combatLog` para efectos de sonido por eventos y fin de duelo.
6. `audio-catalog.ts` define rutas/volúmenes por evento y canales (`music`/`sfx`).

## Fin de partida

1. El ganador se deriva desde `healthPoints <= 0`.
2. Se bloquean acciones al finalizar.
3. `DuelResultOverlay` renderiza resultado central y reinicio de partida.

## Documentación modular

1. `game-engine/README.md`: invariantes del motor y contratos.
2. `services/opponent/README.md`: decisiones del bot y dificultad.
3. `hooks/internal/README.md`: responsabilidades internas del tablero.
