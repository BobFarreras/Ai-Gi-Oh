<!-- src/core/use-cases/game-engine/README.md - Descripción del módulo de motor de juego, estructura e invariantes. -->
# Módulo de Motor de Juego

Casos de uso puros del motor, organizados por responsabilidad.

## Estructura

1. `state/`
   - `types.ts`: `GameState`, fases y acciones pendientes.
   - `player-utils.ts`: utilidades de resolución/asignación de jugadores.
   - `create-initial-game-state.ts`: bootstrap de estado inicial.

2. `actions/`
   - `play-card.ts`
   - `play-card-with-entity-replacement.ts`
   - `change-entity-mode.ts`
   - `resolve-execution.ts`
   - `internal/`: resolución de efectos de ejecución y construcción de logs.

3. `phases/`
   - `next-phase.ts`
   - `resolve-pending-turn-action.ts`

4. `combat/`
   - `execute-attack.ts`
   - `internal/`: validaciones, resolución de combate/directo y logging.

5. `effects/`
   - `resolve-trap-trigger.ts`
   - `internal/`: selección de trampa, resolución de efecto y logging.
   - Soporta trampas de daño, negación de ataque con destrucción de atacante y reducción de stats rival.

6. `fusion/`
   - `fusion-recipes.ts`
   - `fuse-cards.ts`
   - `internal/`: validación de contexto, aplicación de resultado y logging.

7. `logging/`
   - `combat-log.ts`

8. Tests co-localizados por subdominio
   - `actions/*.test.ts`
   - `combat/*.test.ts`
   - `effects/*.test.ts`
   - `phases/*.test.ts`
   - `fusion/*.test.ts`
   - `state/*.test.ts`
   - `logging/*.test.ts`

## Invariantes

1. `GameState` es inmutable.
2. Solo jugador activo puede actuar.
3. Con `pendingTurnAction` no se puede avanzar turno ni jugar/atacar.
4. Excepción controlada: `SELECT_FUSION_MATERIALS` se resuelve con `resolvePendingTurnAction` hasta completar 2 materiales.
5. Errores de dominio tipados (`ValidationError`, `GameRuleError`, `NotFoundError`).

## Guía de extensión

1. Regla nueva: crear caso de uso en submódulo correcto.
2. Exponerlo vía `GameEngine.ts` (fachada).
3. Añadir test unitario + test de integración si toca flujo completo.

