<!-- docs/architecture/03-domain-game.md - Describe arquitectura funcional del dominio de combate y tablero. -->
# Dominio Game

## Bloques principales

1. `core/use-cases/game-engine/*`: reglas del motor por subdominio (`actions`, `phases`, `combat`, `fusion`, `effects`, `logging`).
2. `components/game/board/*`: composición visual, capas y feedback.
3. `components/game/board/hooks/*`: runtime de tablero y control de turnos.

## Contratos clave

1. `GameState` como snapshot de estado de partida.
2. `combatLog` como fuente única de historial y eventos de feedback.
3. `GameEngine` como fachada estable sobre casos de uso internos.

## Decisiones activas

1. Separación estricta entre reglas de juego y render UI.
2. Reglas de combate/fusión/trampas no viven en componentes React.
3. Submódulos internos para piezas visuales complejas (`battlefield/internal`, `ui/internal`, `internal/player-hand`).
4. Tests de integración del hook `useBoard` divididos por escenarios (core/battle-rules).
