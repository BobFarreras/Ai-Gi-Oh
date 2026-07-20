// src/components/game/board/hooks/internal/board-state/useHandleTimerExpired.ts - Resuelve timeout de turno sin diálogos y con auto-selección en acciones obligatorias.
import { MutableRefObject, useCallback } from "react";
import { resolveWinnerPlayerId } from "@/core/services/turn/resolve-winner-player-id";
import { GameState } from "@/core/use-cases/GameEngine";

interface IUseHandleTimerExpiredParams {
  gameStateRef: MutableRefObject<GameState>;
  isAnimating: boolean;
  executeAdvancePhase: () => void;
  resolvePendingTurnAction: (selectedId: string) => void;
  /** Multi: al expirar el reloj se cede el turno ENTERO al rival (no solo una fase); ver decisión de diseño. */
  endEntireTurn?: boolean;
}

type TimeoutStepResult = "PROGRESSED" | "BLOCKED" | "DONE";

export function useHandleTimerExpired({ gameStateRef, isAnimating, executeAdvancePhase, resolvePendingTurnAction, endEntireTurn = false }: IUseHandleTimerExpiredParams) {
  return useCallback(() => {
    // Un "paso" de timeout: auto-resuelve la acción obligatoria del jugador local, o avanza una fase.
    // applyTransition (dentro de resolvePendingTurnAction/executeAdvancePhase) actualiza gameStateRef de forma
    // SÍNCRONA, así que el bucle de abajo puede releer el estado tras cada paso.
    const runStep = (): TimeoutStepResult => {
      const currentState = gameStateRef.current;
      const hasWinnerNow = resolveWinnerPlayerId(currentState) !== null;
      if (hasWinnerNow || currentState.activePlayerId !== currentState.playerA.id || isAnimating) return "DONE";
      const pendingAction = currentState.pendingTurnAction;
      if (pendingAction?.playerId === currentState.playerA.id) {
        if (pendingAction.type === "DISCARD_FOR_HAND_LIMIT") {
          const leftmostCard = currentState.playerA.hand[0];
          if (!leftmostCard) return "BLOCKED";
          resolvePendingTurnAction(leftmostCard.runtimeId ?? leftmostCard.id);
          return "PROGRESSED";
        }
        if (pendingAction.type === "SELECT_FUSION_MATERIALS") {
          const available = currentState.playerA.activeEntities
            .map((entity) => entity.instanceId)
            .filter((instanceId) => !pendingAction.selectedMaterialInstanceIds.includes(instanceId));
          const autoPick = available.slice(0, 2 - pendingAction.selectedMaterialInstanceIds.length);
          if (autoPick.length === 0) return "BLOCKED";
          autoPick.forEach((instanceId) => resolvePendingTurnAction(instanceId));
          return "PROGRESSED";
        }
        if (pendingAction.type === "SELECT_GRAVEYARD_CARD") {
          const candidate = [...currentState.playerA.graveyard].reverse().find((card) => !pendingAction.cardType || card.type === pendingAction.cardType);
          if (!candidate) return "BLOCKED";
          resolvePendingTurnAction(candidate.runtimeId ?? candidate.id);
          return "PROGRESSED";
        }
        return "BLOCKED";
      }
      executeAdvancePhase();
      return "PROGRESSED";
    };

    if (!endEntireTurn) {
      runStep();
      return;
    }

    // Multi: repite pasos hasta ceder el turno al rival (cambia activePlayerId) o quedar bloqueado.
    // El guard evita bucles infinitos: un turno son como mucho ~3 pasos (pendiente + MAIN_1→BATTLE→rival).
    const localPlayerId = gameStateRef.current.playerA.id;
    for (let step = 0; step < 8; step += 1) {
      const result = runStep();
      if (result !== "PROGRESSED") break;
      if (gameStateRef.current.activePlayerId !== localPlayerId) break;
    }
  }, [executeAdvancePhase, gameStateRef, isAnimating, resolvePendingTurnAction, endEntireTurn]);
}
