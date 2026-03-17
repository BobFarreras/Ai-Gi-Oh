// src/core/use-cases/game-engine/phases/internal/resolve-graveyard-selection-action.ts - Resuelve selección de carta de cementerio vinculada a una ejecución pendiente.
import { CardType } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { applyReturnGraveyardCardToField, applyReturnGraveyardCardToHand } from "@/core/use-cases/game-engine/actions/internal/execution-return-effects";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { assignPlayers } from "@/core/use-cases/game-engine/state/player-utils";
import { ISelectGraveyardCardPendingTurnAction, GameState } from "@/core/use-cases/game-engine/state/types";

function resolveFieldCardType(cardType: CardType | undefined): Extract<CardType, "ENTITY" | "EXECUTION" | "TRAP"> | undefined {
  return cardType === "ENTITY" || cardType === "EXECUTION" || cardType === "TRAP" ? cardType : undefined;
}

/**
 * Ejecuta la acción de retorno desde cementerio y genera logs de resolución asociados.
 */
export function resolveGraveyardSelectionAction(
  state: GameState,
  playerId: string,
  selectedId: string,
  player: IPlayer,
  opponent: IPlayer,
  isPlayerA: boolean,
  pending: ISelectGraveyardCardPendingTurnAction,
): GameState {
  const executionEntity = player.activeExecutions.find((entity) => entity.instanceId === pending.executionInstanceId);
  if (!executionEntity || executionEntity.card.type !== "EXECUTION" || !executionEntity.card.effect) {
    throw new NotFoundError("La ejecución pendiente ya no está disponible.");
  }
  const selectedCard = player.graveyard.find((card) => (card.runtimeId ?? card.id) === selectedId);
  if (!selectedCard) throw new NotFoundError("La carta seleccionada no está en tu cementerio.");

  const effect = executionEntity.card.effect;
  const returnResult =
    pending.destination === "HAND"
      ? applyReturnGraveyardCardToHand(
          player,
          effect.action === "RETURN_GRAVEYARD_CARD_TO_HAND" ? effect : { action: "RETURN_GRAVEYARD_CARD_TO_HAND", cardType: pending.cardType },
          selectedId,
        )
      : applyReturnGraveyardCardToField(
          player,
          effect.action === "RETURN_GRAVEYARD_CARD_TO_FIELD"
            ? effect
            : { action: "RETURN_GRAVEYARD_CARD_TO_FIELD", cardType: resolveFieldCardType(pending.cardType) },
          selectedId,
          state.idFactory,
        );

  const updatedPlayer: IPlayer = {
    ...returnResult.updatedPlayer,
    activeExecutions: returnResult.updatedPlayer.activeExecutions.filter((entity) => entity.instanceId !== pending.executionInstanceId),
    graveyard: [...returnResult.updatedPlayer.graveyard, executionEntity.card],
  };
  const withPlayers = assignPlayers({ ...state, pendingTurnAction: null }, updatedPlayer, opponent, isPlayerA);
  let withLogs = appendCombatLogEvent(withPlayers, playerId, "MANDATORY_ACTION_RESOLVED", {
    type: "SELECT_GRAVEYARD_CARD",
    selectedId,
    executionCardId: executionEntity.card.id,
  });
  for (const systemEvent of returnResult.events) {
    withLogs = appendCombatLogEvent(withLogs, playerId, systemEvent.eventType, systemEvent.payload);
  }
  return appendCombatLogEvent(withLogs, playerId, "CARD_TO_GRAVEYARD", {
    cardId: executionEntity.card.id,
    ownerPlayerId: playerId,
    from: "EXECUTION_ZONE",
  });
}
