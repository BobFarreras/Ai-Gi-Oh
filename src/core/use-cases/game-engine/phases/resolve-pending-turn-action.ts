// src/core/use-cases/game-engine/phases/resolve-pending-turn-action.ts - Resuelve acciones obligatorias de turno (descartar o seleccionar materiales).
import { GameRuleError } from "@/core/errors/GameRuleError";
import { resolveDiscardForHandLimitAction } from "@/core/use-cases/game-engine/phases/internal/resolve-discard-for-hand-limit-action";
import { resolveFusionMaterialsAction } from "@/core/use-cases/game-engine/phases/internal/resolve-fusion-materials-action";
import { resolveGraveyardSelectionAction } from "@/core/use-cases/game-engine/phases/internal/resolve-graveyard-selection-action";
import { resolveOpponentGraveyardSelectionAction, resolveOpponentSetCardSelectionAction } from "@/core/use-cases/game-engine/phases/internal/resolve-opponent-selection-actions";
import { getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState, IPendingTurnAction } from "@/core/use-cases/game-engine/state/types";

function assertPendingTurnActionOwnership(state: GameState, playerId: string, pendingTurnAction: IPendingTurnAction): void {
  if (pendingTurnAction.playerId !== playerId || state.activePlayerId !== playerId) {
    throw new GameRuleError("Solo el jugador activo puede resolver la acción obligatoria.");
  }
}

export function resolvePendingTurnAction(state: GameState, playerId: string, selectedId: string): GameState {
  const pendingTurnAction = state.pendingTurnAction;
  if (!pendingTurnAction) {
    throw new GameRuleError("No hay acción obligatoria pendiente.");
  }

  assertPendingTurnActionOwnership(state, playerId, pendingTurnAction);
  const { player, opponent, isPlayerA } = getPlayerPair(state, playerId);

  switch (pendingTurnAction.type) {
    case "DISCARD_FOR_HAND_LIMIT":
      return resolveDiscardForHandLimitAction(state, playerId, selectedId, player, opponent, isPlayerA);
    case "SELECT_FUSION_MATERIALS":
      return resolveFusionMaterialsAction(state, playerId, selectedId, player, pendingTurnAction);
    case "SELECT_GRAVEYARD_CARD":
      return resolveGraveyardSelectionAction(state, playerId, selectedId, player, opponent, isPlayerA, pendingTurnAction);
    case "SELECT_OPPONENT_GRAVEYARD_CARD":
      return resolveOpponentGraveyardSelectionAction(state, playerId, selectedId, player, opponent, isPlayerA, pendingTurnAction);
    case "SELECT_OPPONENT_SET_CARD":
      return resolveOpponentSetCardSelectionAction(state, playerId, selectedId, player, opponent, isPlayerA, pendingTurnAction);
    default:
      throw new GameRuleError("Tipo de acción obligatoria no soportado.");
  }
}

