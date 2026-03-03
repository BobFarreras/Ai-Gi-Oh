# Board Hooks Internal

Submódulos internos para reducir complejidad de `useBoard`.

## Principio

`useBoard.ts` orquesta; los detalles se extraen a helpers/hooks internos cohesionados.

## Archivos

1. `boardInitialState.ts`
   - Orquesta el estado inicial de partida local.

2. `initialDeckFactory.ts`
   - Construye mazos base de 20 cartas y los baraja al crear la partida.

3. `boardError.ts`
   - Mapeo de errores de dominio a errores de UI (`IBoardUiError`).

4. `useBoardUiState.ts`
   - Estado local de UI del tablero (selección, animación, paneles, mute).
   - Expone acciones base (`clearSelection`, `previewCard`, `restartMatch`).

5. `sleep.ts`
   - Delay controlado para sincronizar animación y lógica.

6. `useOpponentTurn.ts`
   - Loop automático del turno del rival.
   - Orquesta visualmente cada acción (despliegue, activación, ataque) con delays controlados.
   - Incluye `windup` de ataque y `cooldown` post-resolución para evitar solape entre daño, efectos y siguiente acción.
   - Mantiene `activeAttackerId` y `isAnimating` para feedback en tiempo real.

7. `usePlayerActions.ts`
   - Acciones del jugador (play card, entity click, selección).
   - Validaciones de turno y animación.
   - Si hay trampa reactiva del rival, previsualiza flip de trampa antes de resolver ataque/ejecución.

8. `useBoardTurnControls.ts`
   - Callbacks de avance de fase y resolución de acciones obligatorias.
   - Maneja fallback de timer para descarte/sacrificio automático.

9. `boardPendingUi.ts` y `boardCombatFeedback.ts`
   - Proyección de estado de dominio a señales UI:
     - hints de acciones obligatorias,
     - ids resaltados,
     - deltas de daño/curación/buffs.

10. `buildUseBoardResult.ts`
   - Construye el objeto público que retorna `useBoard` para mantener el hook pequeño y legible.

11. `useGameAudio.ts`
   - Gestiona SFX y soundtrack principal.
   - Al finalizar duelo, detiene y reinicia el soundtrack base antes de reproducir resultado.

12. `trapPreview.ts`
   - Detecta trampas `SET` reactivas por trigger.
   - Utilidades para revelar/ocultar temporalmente la trampa durante la cadena visual.

## Reglas de mantenimiento

1. No meter reglas de dominio aquí; esas van a `core/use-cases`.
2. Cada archivo interno debe tener una responsabilidad concreta.
3. Si un hook interno supera 150 líneas, dividirlo nuevamente.
