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
              : gameState.pendingTurnAction.type === "SELECT_OPPONENT_ENTITY_TO_LOCK"
                ? "Selecciona una entity del rival para bloquearla."
                : gameState.pendingTurnAction.type === "SELECT_OPPONENT_ENTITY_TO_DESTROY"
                  ? "Selecciona una entity del rival para destruirla."
                  : gameState.pendingTurnAction.type === "SELECT_OPPONENT_ENTITY_TO_FLIP_DEFENSE"
                    ? "Selecciona una entity del rival para voltearla a defensa."
                    : gameState.pendingTurnAction.type === "SELECT_OWN_ENTITY_TO_SACRIFICE"
                      ? "Selecciona una entity de tu campo para sacrificarla y ganar su energía."
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
      : gameState.pendingTurnAction?.playerId === gameState.playerA.id && (gameState.pendingTurnAction.type === "SELECT_OPPONENT_ENTITY_TO_LOCK" || gameState.pendingTurnAction.type === "SELECT_OPPONENT_ENTITY_TO_DESTROY" || gameState.pendingTurnAction.type === "SELECT_OPPONENT_ENTITY_TO_FLIP_DEFENSE")
        ? gameState.playerB.activeEntities.map((entity) => entity.instanceId)
        : [];

  return {
    pendingActionHint,
    pendingDiscardCardIds,
    pendingEntitySelectionIds,
    pendingOpponentSelectionIds,
    pendingFusionSelectedEntityIds,
  };
}
