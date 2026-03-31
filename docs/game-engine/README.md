<!-- docs/game-engine/README.md - Índice modular de documentación funcional del motor de juego. -->
# Motor de Juego - Índice Modular

Esta sección sustituye la documentación monolítica previa y describe el estado funcional real del motor.

## Mapa de documentos

1. [01-state-and-turns.md](./01-state-and-turns.md)
   - Estado global, fases, turnos y acciones obligatorias.
2. [02-card-play-and-zones.md](./02-card-play-and-zones.md)
   - Reglas de juego de cartas y límites por zona.
3. [03-combat-and-traps.md](./03-combat-and-traps.md)
   - Resolución de ataque, daño y activación de trampas.
4. [04-executions-and-fusion.md](./04-executions-and-fusion.md)
   - Resolución de ejecuciones y flujo de invocación por fusión.
5. [05-opponent-ai-and-match-runtime.md](./05-opponent-ai-and-match-runtime.md)
   - IA heurística rival y contratos de runtime de match.
6. [06-logs-audio-and-cinematics.md](./06-logs-audio-and-cinematics.md)
   - `combatLog`, eventos de audio, overlays y cinemática.
7. [07-roadmap-and-pending.md](./07-roadmap-and-pending.md)
   - Pendientes y diseño objetivo de siguientes fases.
8. [09-effects-vfx-audio-inventory.md](./09-effects-vfx-audio-inventory.md)
   - Inventario de efectos de ejecución/trampa con estado real de animación y sonido.

## Código fuente principal

1. `src/core/use-cases/game-engine/*`
2. `src/core/use-cases/CombatService.ts`
3. `src/core/services/opponent/*`
4. `src/services/game/match/*`

## Glosario rápido del motor

- **`GameState`**: estado completo e inmutable de la partida en tiempo de ejecución.
  - Referencia: `src/core/use-cases/game-engine/state/types.ts`
- **`pendingTurnAction`**: acción obligatoria que bloquea flujo hasta resolverse.
  - Referencia: `src/core/use-cases/game-engine/phases/resolve-pending-turn-action.ts`
- **`MAIN_1` / `BATTLE`**: fases principales de turno gestionadas por `nextPhase`.
  - Referencia: `src/core/use-cases/game-engine/phases/next-phase.ts`
- **`combatLog`**: fuente única de historial, feedback y trazabilidad de combate.
  - Referencia: `src/core/use-cases/game-engine/logging/combat-log.ts`
- **`EXECUTION`**: carta de efecto activo resuelta por `resolveExecution`.
  - Referencia: `src/core/use-cases/game-engine/actions/resolve-execution.ts`
- **`TRAP`**: carta reactiva disparada por triggers de combate/ejecución.
  - Referencia: `src/core/use-cases/game-engine/effects/resolve-trap-trigger.ts`
- **`FUSION`**: invocación resultante de materiales con receta válida.
  - Referencias: `src/core/use-cases/game-engine/fusion/start-fusion-summon.ts`, `src/core/use-cases/game-engine/fusion/fuse-cards.ts`
- **`idFactory`**: estrategia inyectable para IDs/timestamps deterministas.
  - Referencia: `src/core/use-cases/game-engine/state/id-factory.ts`
