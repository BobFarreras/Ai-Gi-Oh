# Mock Cards Module

Dataset local de cartas para desarrollo y tests de juego sin backend.

## Archivos

1. `entities.ts`
   - Cartas de entidad (`ENTITY`) con ataque/defensa/energía/arquetipo.

2. `executions.ts`
   - Cartas de ejecución (`EXECUTION`) con efectos activos (daño, curación, robo, buff y fusión).

3. `traps.ts`
   - Cartas trampa (`TRAP`) con trigger reactivo.

4. `fusions.ts`
   - Cartas de fusión (`FUSION`) y resultados disponibles.

## Uso

1. `boardInitialState` construye mazos de prueba con estas cartas.
2. Permite validar reglas del motor, UI y animaciones antes de integrar BD.

## Reglas

1. Nombres/ids estables para no romper tests.
2. Tipado estricto con `ICard`.
3. Si cambian tipos/efectos, actualizar también documentación de motor y tests.
