<!-- docs/game-engine/01-state-and-turns.md - Estado global del duelo y reglas de transición por fase/turno. -->
# Estado, Fases y Turnos

## Estado global (`GameState`)

1. `playerA`, `playerB`.
2. `activePlayerId`.
3. `startingPlayerId`.
4. `turn`.
5. `phase`: `MAIN_1 | BATTLE`.
6. `hasNormalSummonedThisTurn`.
7. `combatLog`.

## Reglas de fase (`nextPhase`)

1. Orden fijo: `MAIN_1 -> BATTLE -> siguiente jugador en MAIN_1`.
2. Al cerrar `BATTLE`:
   - cambia jugador activo,
   - incrementa turno,
   - fase vuelve a `MAIN_1`,
   - valida acciones obligatorias,
   - suma `+2` de energía (con tope `maxEnergy`),
   - limpia flags de invocación/ataque.

## Acciones obligatorias

1. Campo lleno (3 entidades): `SACRIFICE_ENTITY_FOR_DRAW`.
2. Límite de mano (5 cartas): `DISCARD_FOR_HAND_LIMIT`.
3. El robo de turno ocurre tras resolver la acción obligatoria pendiente.

## Guardas de turno

1. Solo el jugador activo puede actuar.
2. En turno 1, el jugador inicial no puede atacar.
