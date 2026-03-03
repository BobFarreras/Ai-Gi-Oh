import { IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { assignPlayers, getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

function drawCard(player: IPlayer): IPlayer {
  const nextCard = player.deck[0];
  if (!nextCard) {
    return player;
  }

  return {
    ...player,
    hand: [...player.hand, nextCard],
    deck: player.deck.slice(1),
  };
}

function finalizeTurnStartAfterMandatoryAction(state: GameState, player: IPlayer, opponent: IPlayer, isPlayerA: boolean): GameState {
  if (player.hand.length >= 5) {
    return assignPlayers(
      {
        ...state,
        pendingTurnAction: { type: "DISCARD_FOR_HAND_LIMIT", playerId: player.id },
      },
      player,
      opponent,
      isPlayerA,
    );
  }

  return assignPlayers(
    {
      ...state,
      pendingTurnAction: null,
    },
    drawCard(player),
    opponent,
    isPlayerA,
  );
}

export function resolvePendingTurnAction(state: GameState, playerId: string, selectedId: string): GameState {
  if (!state.pendingTurnAction) {
    throw new GameRuleError("No hay acción obligatoria pendiente.");
  }

  if (state.pendingTurnAction.playerId !== playerId || state.activePlayerId !== playerId) {
    throw new GameRuleError("Solo el jugador activo puede resolver la acción obligatoria.");
  }

  const { player, opponent, isPlayerA } = getPlayerPair(state, playerId);

  if (state.pendingTurnAction.type === "SACRIFICE_ENTITY_FOR_DRAW") {
    const entity = player.activeEntities.find((currentEntity) => currentEntity.instanceId === selectedId);
    if (!entity) {
      throw new NotFoundError("La entidad seleccionada no existe en tu campo.");
    }

    const updatedPlayer: IPlayer = {
      ...player,
      activeEntities: player.activeEntities.filter((currentEntity) => currentEntity.instanceId !== selectedId),
      graveyard: [...player.graveyard, entity.card],
    };

    const resolvedState = finalizeTurnStartAfterMandatoryAction(state, updatedPlayer, opponent, isPlayerA);
    const withMandatory = appendCombatLogEvent(resolvedState, playerId, "MANDATORY_ACTION_RESOLVED", {
      type: "SACRIFICE_ENTITY_FOR_DRAW",
      selectedId,
    });
    return appendCombatLogEvent(withMandatory, playerId, "CARD_TO_GRAVEYARD", {
      cardId: entity.card.id,
      ownerPlayerId: playerId,
      from: "BATTLEFIELD",
    });
  }

  if (state.pendingTurnAction.type === "DISCARD_FOR_HAND_LIMIT") {
    const cardIndex = player.hand.findIndex((card) => card.id === selectedId);
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

  return state;
}

