import { IPlayer } from "../../entities/IPlayer";
import { GameRuleError } from "../../errors/GameRuleError";
import { NotFoundError } from "../../errors/NotFoundError";
import { assignPlayers, getPlayerPair } from "./player-utils";
import { GameState } from "./types";

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

    return finalizeTurnStartAfterMandatoryAction(state, updatedPlayer, opponent, isPlayerA);
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

    return assignPlayers(
      {
        ...state,
        pendingTurnAction: null,
      },
      drawCard(updatedPlayer),
      opponent,
      isPlayerA,
    );
  }

  return state;
}

