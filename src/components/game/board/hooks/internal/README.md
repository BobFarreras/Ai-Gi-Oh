# Board Hooks Internal

Submódulos internos para reducir complejidad de `useBoard` y mantener SRP.

## Estructura

1. Base
   - `boardInitialState.ts`: estado inicial local.
   - `initialDeckFactory.ts`: mazos base.
   - `boardError.ts`: mapping de error de dominio a UI.
   - `sleep.ts`: delays de animación.
   - `trapPreview.ts`: utilidades de reveal/hide de trampas reactivas.

2. `board-state/`
   - `useBoardUiState.ts`: estado UI local + acciones base.
   - `useBoardTurnControls.ts`: avance de fase y acciones obligatorias.
   - `boardPendingUi.ts`: hints/ids de acciones pendientes.
   - `boardCombatFeedback.ts`: deltas de daño/curación/buffs.
   - `buildUseBoardResult.ts`: construcción del contrato público de `useBoard`.

3. `player-actions/`
   - `useToggleCardSelection.ts`
   - `useExecutePlayAction.ts`
   - `useHandleEntityClick.ts`
   - `handleOwnEntityClick.ts`
   - `handleOpponentEntityClick.ts`
   - `constants.ts` y `types.ts`

4. `opponent-turn/`
   - `runMainPhaseStep.ts`
   - `runBattlePhaseStep.ts`
   - `autoPick.ts`
   - `types.ts`

5. Hooks fachada
   - `usePlayerActions.ts`: compone subhooks de `player-actions/`.
   - `useOpponentTurn.ts`: orquesta paso del rival con `opponent-turn/`.
   - `useGameAudio.ts`: SFX + soundtrack.

## Reglas

1. No meter reglas de dominio aquí; van en `core/use-cases`.
2. Mantener tests co-localizados al módulo que validan.
3. Si un archivo supera 150 líneas, extraer submódulos en la misma carpeta funcional.
