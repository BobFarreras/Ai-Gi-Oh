# Board Hooks Module

Hooks públicos del tablero. Este módulo actúa como fachada para la lógica de UI/orquestación del duelo.

## Archivos

1. `useBoard.ts`
   - Hook principal consumido por `Board`.
   - Conecta UI con `GameEngine`.
   - No define reglas de dominio; delega en `core/use-cases`.

2. `useBoard.test.ts`
   - Pruebas unitarias del contrato del hook.

3. `useBoard.integration.test.ts`
   - Pruebas de integración del flujo UI + motor.

4. `internal/`
   - Submódulos SRP para estado UI, acciones de jugador, turno rival, audio y feedback.
   - Ver guía: `internal/README.md`.

## Flujo

1. Inicializa estado (`boardInitialState`).
2. Expone handlers de interacción (`play`, `attack`, `endTurn`, selección de carta/slot).
3. Orquesta acciones automáticas del rival (`useOpponentTurn`).
4. Deriva feedback visual/sonoro desde `combatLog`.

## Invariantes

1. `useBoard` no contiene reglas de negocio puras del juego.
2. Errores del motor se traducen a mensajes UI.
3. La fuente de verdad de acciones y resultado es `GameState`.

