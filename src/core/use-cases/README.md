<!-- src/core/use-cases/README.md - Índice de casos de uso de aplicación y reglas de orquestación. -->
# Módulo de Casos de Uso

Capa de aplicación del dominio. Orquesta reglas del juego sin dependencias de UI.

## Archivos y submódulos

1. `GameEngine.ts`
   - Fachada pública estable del motor de juego.
   - Punto de entrada para `playCard`, `executeAttack`, `nextPhase`, etc.

2. `CombatService.ts`
   - Reglas puras de resolución de combate (ataque directo y batalla entidad vs entidad).

3. `game-engine/`
   - Casos de uso segmentados por dominio:
     - `state/`, `actions/`, `phases/`, `combat/`, `effects/`, `fusion/`, `logging/`.
   - Ver detalle en `game-engine/README.md`.

## Flujo de dependencia

1. `components` y hooks llaman a `GameEngine` (fachada).
2. `GameEngine` delega a subcasos de `game-engine/*`.
3. Los subcasos solo dependen de entidades, errores y servicios puros.

## Reglas

1. No introducir JSX ni lógica de render en esta capa.
2. Mantener inmutabilidad de `GameState`.
3. Toda regla nueva debe venir con tests unitarios/integración.



