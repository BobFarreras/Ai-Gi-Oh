# Game Engine Module

Este módulo contiene los casos de uso puros del motor.

## Objetivo

1. Mantener reglas de juego sin dependencias de React.
2. Exponer operaciones atómicas sobre `GameState`.
3. Permitir testeo unitario/integración con entrada-salida determinista.

## Archivos clave

1. `types.ts`: contrato de `GameState` y fases.
2. `play-card.ts`: validación y despliegue de cartas.
3. `execute-attack.ts`: resolución de combate.
4. `resolve-execution.ts`: efectos de ejecución.
5. `next-phase.ts`: progresión de subfases (`MAIN_1`, `BATTLE`) y paso de turno.
6. `change-entity-mode.ts`: cambios de modo en tablero.
7. `player-utils.ts`: utilidades de asignación por jugador.

## Invariantes

1. `GameState` es inmutable: siempre retorna nuevo estado.
2. Solo el jugador activo puede ejecutar acciones de turno.
3. Se respetan límites de zonas y energía.
4. Errores de dominio tipados (`ValidationError`, `GameRuleError`, `NotFoundError`).

## Evolución segura

1. Nuevas reglas deben entrar como casos de uso pequeños, no en `GameEngine.ts` directamente.
2. `GameEngine.ts` funciona como fachada estable para UI y tests.
3. Cada nueva regla requiere test unitario y, si afecta flujo, test de integración.
