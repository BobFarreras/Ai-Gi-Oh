// src/components/game/board/hooks/internal/board-state/boardPendingUi.ts - Deriva pistas y selecciones pendientes de UI desde el estado y acciones obligatorias.
import { BattleMode } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { resolveSelectableFusionMaterialIds } from "./fusion-material-selection";

interface IPendingEntityReplacement {
  cardId: string;
  mode: BattleMode;
}

export interface IBoardPendingUi {
  pendingActionHint: string | null;
  pendingDiscardCardIds: string[];
  pendingEntitySelectionIds: string[];
  pendingFusionSelectedEntityIds: string[];
}

export function buildBoardPendingUi(
  gameState: GameState,
  pendingEntityReplacement: IPendingEntityReplacement | null,
): IBoardPendingUi {
  const pendingFusionMaterialsCount =
    gameState.pendingTurnAction?.playerId === gameState.playerA.id && gameState.pendingTurnAction.type === "SELECT_FUSION_MATERIALS"
      ? gameState.pendingTurnAction.selectedMaterialInstanceIds.length
      : null;
  const pendingActionHint =
    gameState.pendingTurnAction?.playerId === gameState.playerA.id
      ? gameState.pendingTurnAction.type === "DISCARD_FOR_HAND_LIMIT"
        ? "Tienes 5 cartas en mano. Elige una carta de tu mano para enviarla al cementerio."
        : `Selecciona 2 materiales para fusionar (${pendingFusionMaterialsCount ?? 0}/2).`
      : pendingFusionMaterialsCount !== null
        ? `Selecciona 2 materiales para fusionar (${pendingFusionMaterialsCount}/2).`
        : pendingEntityReplacement
          ? "Tu campo está lleno. Elige una entidad del campo para reemplazarla por la nueva invocación."
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
        ? gameState.playerA.activeEntities.map((entity) => entity.instanceId)
        : [];

  const pendingFusionSelectedEntityIds =
    gameState.pendingTurnAction?.playerId === gameState.playerA.id && gameState.pendingTurnAction.type === "SELECT_FUSION_MATERIALS"
      ? gameState.pendingTurnAction.selectedMaterialInstanceIds
      : [];

  return {
    pendingActionHint,
    pendingDiscardCardIds,
    pendingEntitySelectionIds,
    pendingFusionSelectedEntityIds,
  };
}
