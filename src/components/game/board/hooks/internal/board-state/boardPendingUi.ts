// src/components/game/board/hooks/internal/board-state/boardPendingUi.ts - Deriva pistas y selecciones pendientes de UI desde el estado y acciones obligatorias.
import { GameState } from "@/core/use-cases/GameEngine";
import { IPendingTurnAction } from "@/core/use-cases/game-engine/state/types";
import { resolveSelectableFusionMaterialIds } from "./fusion-material-selection";
import { IPendingZoneReplacement } from "./pending-replacement";

export interface IBoardPendingUi {
  pendingActionHint: string | null;
  pendingDiscardCardIds: string[];
  pendingEntitySelectionIds: string[];
  pendingOpponentSelectionIds: string[];
  pendingFusionSelectedEntityIds: string[];
}

/** Pista textual para la acción obligatoria del jugador (mensajes por tipo, con fallback a fusión). */
function resolvePlayerPendingHint(pending: IPendingTurnAction, fusionMaterialsCount: number | null): string {
  switch (pending.type) {
    case "DISCARD_FOR_HAND_LIMIT":
      return "Tienes 5 cartas en mano. Elige una carta de tu mano para enviarla al cementerio.";
    case "SELECT_GRAVEYARD_CARD":
      return "Selecciona una carta válida de tu cementerio para resolver la ejecución.";
    case "SELECT_OPPONENT_GRAVEYARD_CARD":
      return "Selecciona una carta válida del cementerio rival para resolver la ejecución.";
    case "SELECT_OPPONENT_SET_CARD":
      return "Selecciona una carta seteada del rival para resolver la ejecución.";
    case "SELECT_OPPONENT_ENTITY_TO_LOCK":
      return "Selecciona una entity del rival para bloquearla.";
    case "SELECT_OPPONENT_ENTITY_TO_DESTROY":
      return "Selecciona una entity del rival para destruirla.";
    case "SELECT_OPPONENT_ENTITY_TO_FLIP_DEFENSE":
      return "Selecciona una entity del rival para voltearla a defensa.";
    case "SELECT_OWN_ENTITY_TO_SACRIFICE":
      return "Selecciona una entity de tu campo para sacrificarla y ganar su energía.";
    case "SELECT_OPPONENT_ENTITY_TO_STEAL":
      return "Selecciona una entity del rival para robarla a tu campo.";
    case "SELECT_OPPONENT_EXECUTION_TO_STEAL":
      return "Selecciona una magia/trampa del rival para robarla a tu campo.";
    default:
      return `Selecciona 2 materiales para fusionar (${fusionMaterialsCount ?? 0}/2).`;
  }
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
      ? resolvePlayerPendingHint(gameState.pendingTurnAction, pendingFusionMaterialsCount)
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
        : gameState.pendingTurnAction?.playerId === gameState.playerA.id && gameState.pendingTurnAction.type === "SELECT_OWN_ENTITY_TO_SACRIFICE"
        ? gameState.playerA.activeEntities.map((entity) => entity.instanceId)
        : pendingEntityReplacement
        ? pendingEntityReplacement.zone === "ENTITIES"
          ? gameState.playerA.activeEntities.map((entity) => entity.instanceId)
          : gameState.playerA.activeExecutions.map((entity) => entity.instanceId)
        : [];

  const pendingFusionSelectedEntityIds =
    gameState.pendingTurnAction?.playerId === gameState.playerA.id && gameState.pendingTurnAction.type === "SELECT_FUSION_MATERIALS"
      ? gameState.pendingTurnAction.selectedMaterialInstanceIds
      : [];

  // Cartas del rival que el jugador puede seleccionar ahora (resaltadas en el campo rival):
  // cartas seteadas (revelar) o cualquier entity (bloquear).
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
      : gameState.pendingTurnAction?.playerId === gameState.playerA.id && (gameState.pendingTurnAction.type === "SELECT_OPPONENT_ENTITY_TO_LOCK" || gameState.pendingTurnAction.type === "SELECT_OPPONENT_ENTITY_TO_DESTROY" || gameState.pendingTurnAction.type === "SELECT_OPPONENT_ENTITY_TO_FLIP_DEFENSE" || gameState.pendingTurnAction.type === "SELECT_OPPONENT_ENTITY_TO_STEAL")
        ? gameState.playerB.activeEntities.map((entity) => entity.instanceId)
        : gameState.pendingTurnAction?.playerId === gameState.playerA.id && gameState.pendingTurnAction.type === "SELECT_OPPONENT_EXECUTION_TO_STEAL"
          ? gameState.playerB.activeExecutions.map((entity) => entity.instanceId)
          : [];

  return {
    pendingActionHint,
    pendingDiscardCardIds,
    pendingEntitySelectionIds,
    pendingOpponentSelectionIds,
    pendingFusionSelectedEntityIds,
  };
}
