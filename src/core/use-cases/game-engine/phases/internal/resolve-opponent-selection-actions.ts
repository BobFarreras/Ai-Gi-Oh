// src/core/use-cases/game-engine/phases/internal/resolve-opponent-selection-actions.ts - Resuelve selecciones pendientes sobre cartas del rival (cementerio o cartas seteadas).
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { assignPlayers } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState, ISelectOpponentGraveyardCardPendingTurnAction, ISelectOpponentSetCardPendingTurnAction } from "@/core/use-cases/game-engine/state/types";

function resolvePendingExecution(player: IPlayer, executionInstanceId: string): { executionCard: ICard; updatedPlayer: IPlayer } {
  const executionEntity = player.activeExecutions.find((entity) => entity.instanceId === executionInstanceId);
  if (!executionEntity || executionEntity.card.type !== "EXECUTION") throw new NotFoundError("La ejecución pendiente ya no está disponible.");
  return {
    executionCard: executionEntity.card,
    updatedPlayer: {
      ...player,
      activeExecutions: player.activeExecutions.filter((entity) => entity.instanceId !== executionInstanceId),
      graveyard: [...player.graveyard, executionEntity.card],
    },
  };
}

export function resolveOpponentGraveyardSelectionAction(
  state: GameState,
  playerId: string,
  selectedId: string,
  player: IPlayer,
  opponent: IPlayer,
  isPlayerA: boolean,
  pending: ISelectOpponentGraveyardCardPendingTurnAction,
): GameState {
  const selectedIndex = opponent.graveyard.findIndex((card) => (card.runtimeId ?? card.id) === selectedId);
  const selectedCard = selectedIndex >= 0 ? opponent.graveyard[selectedIndex] : null;
  if (!selectedCard) throw new NotFoundError("La carta seleccionada no está en el cementerio rival.");
  if (pending.cardType && selectedCard.type !== pending.cardType) throw new NotFoundError("La carta seleccionada no cumple el tipo permitido.");
  const execution = resolvePendingExecution(player, pending.executionInstanceId);
  const updatedOpponent: IPlayer = { ...opponent, graveyard: opponent.graveyard.filter((_, index) => index !== selectedIndex) };
  const updatedPlayer: IPlayer = { ...execution.updatedPlayer, hand: [...execution.updatedPlayer.hand, selectedCard] };
  const withPlayers = assignPlayers({ ...state, pendingTurnAction: null }, updatedPlayer, updatedOpponent, isPlayerA);
  const withMandatoryLog = appendCombatLogEvent(withPlayers, playerId, "MANDATORY_ACTION_RESOLVED", {
    type: "SELECT_OPPONENT_GRAVEYARD_CARD",
    selectedId,
    selectedCardId: selectedCard.id,
    executionCardId: execution.executionCard.id,
  });
  return appendCombatLogEvent(withMandatoryLog, playerId, "CARD_TO_GRAVEYARD", {
    cardId: execution.executionCard.id,
    ownerPlayerId: playerId,
    from: "EXECUTION_ZONE",
  });
}

export function resolveOpponentSetCardSelectionAction(
  state: GameState,
  playerId: string,
  selectedId: string,
  player: IPlayer,
  opponent: IPlayer,
  isPlayerA: boolean,
  pending: ISelectOpponentSetCardPendingTurnAction,
): GameState {
  const setEntities = pending.zone !== "EXECUTIONS" ? opponent.activeEntities.filter((entity) => entity.mode === "SET") : [];
  const setExecutions = pending.zone !== "ENTITIES" ? opponent.activeExecutions.filter((entity) => entity.mode === "SET") : [];
  const selectedSetCard = [...setEntities, ...setExecutions].find((entity) => entity.instanceId === selectedId);
  if (!selectedSetCard) throw new NotFoundError("La carta seleccionada no está seteada en el campo rival.");
  const execution = resolvePendingExecution(player, pending.executionInstanceId);
  const withPlayers = assignPlayers({ ...state, pendingTurnAction: null }, execution.updatedPlayer, opponent, isPlayerA);
  const withMandatoryLog = appendCombatLogEvent(withPlayers, playerId, "MANDATORY_ACTION_RESOLVED", {
    type: "SELECT_OPPONENT_SET_CARD",
    selectedId,
    selectedCardId: selectedSetCard.card.id,
    selectedCardName: selectedSetCard.card.name,
    selectedCardType: selectedSetCard.card.type,
    executionCardId: execution.executionCard.id,
  });
  return appendCombatLogEvent(withMandatoryLog, playerId, "CARD_TO_GRAVEYARD", {
    cardId: execution.executionCard.id,
    ownerPlayerId: playerId,
    from: "EXECUTION_ZONE",
  });
}
