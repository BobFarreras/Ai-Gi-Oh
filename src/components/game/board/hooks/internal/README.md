# Board Hooks Internal

Submódulos internos para reducir complejidad de `useBoard`.

## Principio

`useBoard.ts` orquesta; los detalles se extraen a helpers/hooks internos cohesionados.

## Archivos

1. `boardInitialState.ts`
   - Orquesta el estado inicial de partida local.

2. `initialDeckFactory.ts`
   - Construye mazos base de 20 cartas y entidades iniciales del rival.

3. `boardError.ts`
   - Mapeo de errores de dominio a errores de UI (`IBoardUiError`).

4. `sleep.ts`
   - Delay controlado para sincronizar animación y lógica.

5. `useOpponentTurn.ts`
   - Loop automático del turno del rival.
   - Orquesta visualmente cada acción (despliegue, activación, ataque) con delays controlados.
   - Mantiene `activeAttackerId` y `isAnimating` para feedback en tiempo real.

6. `usePlayerActions.ts`
   - Acciones del jugador (play card, entity click, selección).
   - Validaciones de turno y animación.

## Reglas de mantenimiento

1. No meter reglas de dominio aquí; esas van a `core/use-cases`.
2. Cada archivo interno debe tener una responsabilidad concreta.
3. Si un hook interno supera 150 líneas, dividirlo nuevamente.
