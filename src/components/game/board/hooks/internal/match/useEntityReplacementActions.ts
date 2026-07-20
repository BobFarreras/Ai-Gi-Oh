// src/components/game/board/hooks/internal/match/useEntityReplacementActions.ts - Encapsula confirmar/cancelar reemplazo de slot en tablero.
import { useCallback } from "react";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { IUseMatchUiStateResult } from "@/components/game/board/hooks/internal/match/useMatchUiState";
import { useLocalActionEmitter } from "@/components/game/board/multiplayer/local-action-emitter";
import { sleep } from "@/components/game/board/hooks/internal/sleep";

interface IUseEntityReplacementActionsInput {
  uiState: IUseMatchUiStateResult;
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null;
}

// La carta sacrificada vuela al cementerio antes de que aparezca la nueva.
const DISCARD_TO_GRAVEYARD_MS = 900;
// Ventana para apreciar la activación de la nueva ejecución antes de resolver su efecto (como la jugada normal).
const NEW_EXECUTION_ACTIVATION_MS = 1400;

/**
 * Aísla la lógica de reemplazo para mantener `useMatchRuntime` por debajo del límite SRP/tamaño.
 */
export function useEntityReplacementActions({ uiState, applyTransition }: IUseEntityReplacementActionsInput) {
  const emitLocalAction = useLocalActionEmitter();
  // Reemplazo de zona llena en secuencia: 1) la carta sacrificada se va al cementerio (sin voltearse),
  // 2) aparece/se activa la nueva en su hueco y 3) si es ejecución activada, se ve su VFX y luego resuelve el
  // efecto. Antes era atómico e instantáneo: no se veía ni el descarte ni la activación. El estado final es
  // idéntico al de `playCardWithZoneReplacement`, así que la sincronización al rival (una sola acción) es
  // determinista.
  const confirmEntityReplacement = useCallback(async () => {
    if (!uiState.pendingEntityReplacement || !uiState.pendingEntityReplacementTargetId) return;
    const replacement = uiState.pendingEntityReplacement;
    const sacrificedId = uiState.pendingEntityReplacementTargetId;

    uiState.setIsAnimating(true);
    // Consumimos el reemplazo y cerramos el detalle de la carta a descartar: así la barra "elige carta" y el
    // botón "Eliminar" desaparecen ya al arrancar la coreografía (usamos las constantes capturadas arriba).
    uiState.setSelectedCard(null);
    uiState.setSelectedBoardEntityInstanceId(null);
    uiState.setPendingEntityReplacementTargetId(null);
    uiState.setPendingEntityReplacement(null);

    // 1) Sacrificio: la carta ocupada vuela al cementerio (la zona pasa de 3 a 2).
    const afterDiscard = applyTransition((state) =>
      GameEngine.discardBoardCardForZoneReplacement(state, state.playerA.id, sacrificedId, replacement.zone),
    );
    if (!afterDiscard) {
      uiState.setIsAnimating(false);
      return;
    }
    await sleep(DISCARD_TO_GRAVEYARD_MS);

    // 2) Se juega la carta nueva en el hueco liberado (aparece / se activa con su VFX).
    const played = applyTransition((state) =>
      GameEngine.playCard(state, state.playerA.id, replacement.cardId, replacement.mode),
    );
    if (!played) {
      uiState.setIsAnimating(false);
      return;
    }
    // Sincroniza al rival como una única jugada de reemplazo (estado final idéntico al atómico).
    emitLocalAction({
      type: "PLAY_CARD_REPLACE_ZONE",
      payload: { cardId: replacement.cardId, mode: replacement.mode, sacrificedEntityInstanceId: sacrificedId, zone: replacement.zone },
    });

    // 3) Ejecución activada: se deja ver la animación de activación y después resuelve su efecto (banner/VFX).
    if (replacement.zone === "EXECUTIONS" && replacement.mode === "ACTIVATE") {
      const activatedExecution = [...played.playerA.activeExecutions]
        .reverse()
        .find(
          (entity) =>
            entity.card.type === "EXECUTION" &&
            entity.mode === "ACTIVATE" &&
            (entity.card.runtimeId === replacement.cardId || entity.card.id === replacement.cardId),
        );
      if (activatedExecution) {
        await sleep(NEW_EXECUTION_ACTIVATION_MS);
        const resolved = applyTransition((state) => GameEngine.resolveExecution(state, state.playerA.id, activatedExecution.instanceId));
        if (resolved) emitLocalAction({ type: "RESOLVE_EXECUTION", payload: { instanceId: activatedExecution.instanceId } });
      }
    }

    uiState.clearSelection();
    uiState.setIsAnimating(false);
  }, [applyTransition, uiState, emitLocalAction]);

  const cancelEntityReplacement = useCallback(() => {
    uiState.setPendingEntityReplacement(null);
    uiState.setPendingEntityReplacementTargetId(null);
    uiState.clearSelection();
  }, [uiState]);

  return { confirmEntityReplacement, cancelEntityReplacement };
}
