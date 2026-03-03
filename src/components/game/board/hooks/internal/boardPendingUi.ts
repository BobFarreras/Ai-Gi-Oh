import { BattleMode } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";

interface IPendingFusionSummon {
  cardId: string;
  mode: "ATTACK" | "DEFENSE";
  materials: string[];
}

interface IPendingEntityReplacement {
  cardId: string;
  mode: BattleMode;
}

export interface IBoardPendingUi {
  pendingActionHint: string | null;
  pendingDiscardCardIds: string[];
  pendingEntitySelectionIds: string[];
}

export function buildBoardPendingUi(
  gameState: GameState,
  pendingFusionSummon: IPendingFusionSummon | null,
  pendingEntityReplacement: IPendingEntityReplacement | null,
): IBoardPendingUi {
  const pendingActionHint =
    gameState.pendingTurnAction?.playerId === gameState.playerA.id
      ? gameState.pendingTurnAction.type === "DISCARD_FOR_HAND_LIMIT"
        ? "Tienes 5 cartas en mano. Elige una carta de tu mano para enviarla al cementerio."
        : "Tu campo de entidades está lleno. Elige una entidad de tu campo para enviarla al cementerio."
      : pendingFusionSummon
        ? `Selecciona 2 materiales para fusionar (${pendingFusionSummon.materials.length}/2).`
        : pendingEntityReplacement
          ? "Tu campo está lleno. Elige una entidad del campo para reemplazarla por la nueva invocación."
          : null;

  const pendingDiscardCardIds =
    gameState.pendingTurnAction?.playerId === gameState.playerA.id && gameState.pendingTurnAction.type === "DISCARD_FOR_HAND_LIMIT"
      ? gameState.playerA.hand.map((card) => card.id)
      : [];

  const pendingEntitySelectionIds =
    gameState.pendingTurnAction?.playerId === gameState.playerA.id && gameState.pendingTurnAction.type === "SACRIFICE_ENTITY_FOR_DRAW"
      ? gameState.playerA.activeEntities.map((entity) => entity.instanceId)
      : pendingFusionSummon || pendingEntityReplacement
        ? gameState.playerA.activeEntities.map((entity) => entity.instanceId)
        : [];

  return {
    pendingActionHint,
    pendingDiscardCardIds,
    pendingEntitySelectionIds,
  };
}
