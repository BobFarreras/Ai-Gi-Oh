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

## Código fuente principal

1. `src/core/use-cases/game-engine/*`
2. `src/core/use-cases/CombatService.ts`
3. `src/core/services/opponent/*`
4. `src/services/game/match/*`
