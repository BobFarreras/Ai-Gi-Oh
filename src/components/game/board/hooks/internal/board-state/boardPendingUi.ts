// src/components/game/board/hooks/internal/board-state/boardPendingUi.ts - Deriva pistas y selecciones pendientes de UI desde el estado y acciones obligatorias.
import { GameState } from "@/core/use-cases/GameEngine";
import { resolveSelectableFusionMaterialIds } from "./fusion-material-selection";
import { IPendingZoneReplacement } from "./pending-replacement";

export interface IBoardPendingUi {
  pendingActionHint: string | null;
  pendingDiscardCardIds: string[];
  pendingEntitySelectionIds: string[];
  pendingOpponentSelectionIds: string[];
  pendingFusionSelectedEntityIds: string[];
}

export function buildBoardPendingUi(
  gameState: GameState,
  pendingEntityReplacement: IPendingZoneReplacement | null,
): IBoardPendingUi {
  const pendingFusionMaterialsCount =
    gameState.pendingTurnAction?.playerId === gameState.playerA.id && gameState.pendingTurnAction.type === "SELECT_FUSION_MATERIALS"
      ? gameState.pendingTurnAction.selectedMaterialInstanceIds.length
      : null;
  const pendingActionHint =
    gameState.pendingTurnAction?.playerId === gameState.playerA.id
      ? gameState.pendingTurnAction.type === "DISCARD_FOR_HAND_LIMIT"
        ? "Tienes 5 cartas en mano. Elige una carta de tu mano para enviarla al cementerio."
        : gameState.pendingTurnAction.type === "SELECT_GRAVEYARD_CARD"
          ? "Selecciona una carta válida de tu cementerio para resolver la ejecución."
          : gameState.pendingTurnAction.type === "SELECT_OPPONENT_GRAVEYARD_CARD"
            ? "Selecciona una carta válida del cementerio rival para resolver la ejecución."
            : gameState.pendingTurnAction.type === "SELECT_OPPONENT_SET_CARD"
              ? "Selecciona una carta seteada del rival para resolver la ejecución."
              : `Selecciona 2 materiales para fusionar (${pendingFusionMaterialsCount ?? 0}/2).`
      : pendingFusionMaterialsCount !== null
        ? `Selecciona 2 materiales para fusionar (${pendingFusionMaterialsCount}/2).`
        : pendingEntityReplacement
          ? pendingEntityReplacement.zone === "ENTITIES"
            ? "Tu zona de entidades está llena. Elige una entidad del campo para reemplazarla por la nueva invocación."
            : "Tu zona de ejecuciones está llena. Elige una ejecución del campo para reemplazarla por la nueva carta."
          : null;

  const pendingDiscardCardIds =
    gameState.pendingTurnAction?.playerId === gameState.playerA.id && gameState.pendingTurnAction.type === "DISCARD_FOR_HAND_LIMIT"
      ? gameState.playerA.hand.map((card) => card.runtimeId ?? card.id)
      : [];

  const pendingFusionSelectableIds = resolveSelectableFusionMaterialIds(gameState);
  const pendingEntitySelectionIds =
    gameState.pendingTurnAction?.playerId === gameState.playerA.id && gameState.pendingTurnAction.type === "SELECT_FUSION_MATERIALS"
        ? pendingFusionSelectableIds
        : pendingEntityReplacement
        ? pendingEntityReplacement.zone === "ENTITIES"
          ? gameState.playerA.activeEntities.map((entity) => entity.instanceId)
          : gameState.playerA.activeExecutions.map((entity) => entity.instanceId)
        : [];

  const pendingFusionSelectedEntityIds =
    gameState.pendingTurnAction?.playerId === gameState.playerA.id && gameState.pendingTurnAction.type === "SELECT_FUSION_MATERIALS"
      ? gameState.pendingTurnAction.selectedMaterialInstanceIds
      : [];

  // Cartas seteadas del rival que el jugador puede revelar (resaltadas en el campo rival).
  const pendingOpponentSelectionIds =
    gameState.pendingTurnAction?.playerId === gameState.playerA.id && gameState.pendingTurnAction.type === "SELECT_OPPONENT_SET_CARD"
      ? (() => {
          const zone = gameState.pendingTurnAction.zone;
          const entities = zone !== "EXECUTIONS"
            ? gameState.playerB.activeEntities.filter((entity) => entity.mode === "SET").map((entity) => entity.instanceId)
            : [];
          const executions = zone !== "ENTITIES"
            ? gameState.playerB.activeExecutions.filter((entity) => entity.mode === "SET").map((entity) => entity.instanceId)
            : [];
          return [...entities, ...executions];
        })()
      : [];

  return {
    pendingActionHint,
    pendingDiscardCardIds,
    pendingEntitySelectionIds,
    pendingOpponentSelectionIds,
    pendingFusionSelectedEntityIds,
  };
}
