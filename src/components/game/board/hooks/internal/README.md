<!-- src/components/game/board/hooks/internal/README.md - Documenta la arquitectura interna de hooks del tablero tras la extracción por subdominios. -->
# Hooks Internos del Board

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

3. `match/`
   - `useMatchUiState.ts`: agrega estado UI y derivados de HUD/feedback.
   - `useMatchRuntime.ts`: transiciones del motor, turnos y acciones del jugador.
   - `useMatchProgression.ts`: persistencia/proyección de EXP de cartas post-duelo.
   - `useMatchAudio.ts`: fachada de audio del duelo (SFX + soundtrack).
   - `board-derived-state.ts`: utilidades puras de ganador y estado derivado de ejecución.

4. `player-actions/`
   - `useToggleCardSelection.ts`
   - `useExecutePlayAction.ts`
   - `useHandleEntityClick.ts`
   - `handleOwnEntityClick.ts`
   - `handleOpponentEntityClick.ts`
   - `constants.ts` y `types.ts`

5. `opponent-turn/`
   - `runMainPhaseStep.ts`
   - `runBattlePhaseStep.ts`
   - `autoPick.ts`
   - `types.ts`

6. Hooks fachada
   - `usePlayerActions.ts`: compone subhooks de `player-actions/`.
   - `useOpponentTurn.ts`: orquesta paso del rival con `opponent-turn/`.
   - `useGameAudio.ts`: SFX + soundtrack.
   - `useBoard.ts` (nivel superior): compositor fino que integra `match/*`.

## Reglas

1. No meter reglas de dominio aquí; van en `core/use-cases`.
2. Mantener tests co-localizados al módulo que validan.
3. Si un archivo supera 150 líneas, extraer submódulos en la misma carpeta funcional.

