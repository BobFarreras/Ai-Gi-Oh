// src/core/use-cases/game-engine/phases/resolve-pending-turn-action.ts - Resuelve acciones obligatorias de turno (descartar o seleccionar materiales).
import { IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { CardType } from "@/core/entities/ICard";
import { applyReturnGraveyardCardToField, applyReturnGraveyardCardToHand } from "@/core/use-cases/game-engine/actions/internal/execution-return-effects";
import { fuseCards } from "@/core/use-cases/game-engine/fusion/fuse-cards";
import { fuseCardsFromExecution } from "@/core/use-cases/game-engine/fusion/fuse-cards-from-execution";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { assignPlayers, getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

function drawCard(player: IPlayer): IPlayer {
  const nextCard = player.deck[0];
  if (!nextCard) return player;
  return { ...player, hand: [...player.hand, nextCard], deck: player.deck.slice(1) };
}

export function resolvePendingTurnAction(state: GameState, playerId: string, selectedId: string): GameState {
  if (!state.pendingTurnAction) {
    throw new GameRuleError("No hay acción obligatoria pendiente.");
  }

  if (state.pendingTurnAction.playerId !== playerId || state.activePlayerId !== playerId) {
    throw new GameRuleError("Solo el jugador activo puede resolver la acción obligatoria.");
  }

  const { player, opponent, isPlayerA } = getPlayerPair(state, playerId);

  if (state.pendingTurnAction.type === "DISCARD_FOR_HAND_LIMIT") {
    const cardIndex = player.hand.findIndex((card) => card.runtimeId === selectedId || card.id === selectedId);
    if (cardIndex === -1) {
      throw new NotFoundError("La carta seleccionada no está en tu mano.");
    }

    const card = player.hand[cardIndex];
    const updatedPlayer: IPlayer = {
      ...player,
      hand: player.hand.filter((_, index) => index !== cardIndex),
      graveyard: [...player.graveyard, card],
    };

    const resolvedState = assignPlayers(
      {
        ...state,
        pendingTurnAction: null,
      },
      drawCard(updatedPlayer),
      opponent,
      isPlayerA,
    );
    const withMandatory = appendCombatLogEvent(resolvedState, playerId, "MANDATORY_ACTION_RESOLVED", {
      type: "DISCARD_FOR_HAND_LIMIT",
      selectedId,
    });
    return appendCombatLogEvent(withMandatory, playerId, "CARD_TO_GRAVEYARD", {
      cardId: card.id,
      ownerPlayerId: playerId,
      from: "HAND",
    });
  }

  if (state.pendingTurnAction.type === "SELECT_FUSION_MATERIALS") {
    const fusionPending = state.pendingTurnAction;
    const entityExists = player.activeEntities.some((entity) => entity.instanceId === selectedId);
    if (!entityExists) {
      throw new NotFoundError("La entidad seleccionada no existe en tu campo.");
    }
    const wasSelected = fusionPending.selectedMaterialInstanceIds.includes(selectedId);
    const selectedMaterialInstanceIds = wasSelected
      ? fusionPending.selectedMaterialInstanceIds.filter((id) => id !== selectedId)
      : [...fusionPending.selectedMaterialInstanceIds, selectedId].slice(0, 2);

    if (selectedMaterialInstanceIds.length < 2) {
      return {
        ...state,
        pendingTurnAction: {
          ...fusionPending,
          selectedMaterialInstanceIds,
        },
      };
    }

    const withoutPending: GameState = {
      ...state,
      pendingTurnAction: null,
    };
    if (fusionPending.fusionFromExecutionInstanceId && fusionPending.fusionFromExecutionRecipeId) {
      return fuseCardsFromExecution(
        withoutPending,
        playerId,
        fusionPending.fusionFromExecutionInstanceId,
        fusionPending.fusionFromExecutionRecipeId,
        [selectedMaterialInstanceIds[0], selectedMaterialInstanceIds[1]],
      );
    }
    if (!fusionPending.fusionCardId) {
      throw new GameRuleError("No se encontró carta de fusión asociada a la acción pendiente.");
    }
    return fuseCards(
      withoutPending,
      playerId,
      fusionPending.fusionCardId,
      [selectedMaterialInstanceIds[0], selectedMaterialInstanceIds[1]],
      fusionPending.mode,
    );
  }

  if (state.pendingTurnAction.type === "SELECT_GRAVEYARD_CARD") {
    const pending = state.pendingTurnAction;
    const executionEntity = player.activeExecutions.find((entity) => entity.instanceId === pending.executionInstanceId);
    if (!executionEntity || executionEntity.card.type !== "EXECUTION" || !executionEntity.card.effect) {
      throw new NotFoundError("La ejecución pendiente ya no está disponible.");
    }
    const selectedCard = player.graveyard.find((card) => (card.runtimeId ?? card.id) === selectedId);
    if (!selectedCard) throw new NotFoundError("La carta seleccionada no está en tu cementerio.");
    const effect = executionEntity.card.effect;
    const fieldCardType: Extract<CardType, "ENTITY" | "EXECUTION" | "TRAP"> | undefined =
      pending.cardType === "ENTITY" || pending.cardType === "EXECUTION" || pending.cardType === "TRAP"
        ? pending.cardType
        : undefined;
    const returnResult =
      pending.destination === "HAND"
        ? applyReturnGraveyardCardToHand(player, effect.action === "RETURN_GRAVEYARD_CARD_TO_HAND" ? effect : { action: "RETURN_GRAVEYARD_CARD_TO_HAND", cardType: pending.cardType }, selectedId)
        : applyReturnGraveyardCardToField(player, effect.action === "RETURN_GRAVEYARD_CARD_TO_FIELD" ? effect : { action: "RETURN_GRAVEYARD_CARD_TO_FIELD", cardType: fieldCardType }, selectedId);

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

  return state;
}

