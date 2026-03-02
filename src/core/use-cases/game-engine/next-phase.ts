import { IBoardEntity, IPlayer } from "../../entities/IPlayer";
import { GameRuleError } from "../../errors/GameRuleError";
import { GameState } from "./types";

function resetEntitiesForNewTurn(entities: IBoardEntity[]): IBoardEntity[] {
  return entities.map((entity) => ({
    ...entity,
    hasAttackedThisTurn: false,
    isNewlySummoned: false,
  }));
}

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

function resolveTurnStartForPlayer(player: IPlayer, playerId: string): { player: IPlayer; pendingTurnAction: GameState["pendingTurnAction"] } {
  if (player.activeEntities.length >= 3) {
    return {
      player,
      pendingTurnAction: { type: "SACRIFICE_ENTITY_FOR_DRAW", playerId },
    };
  }

  if (player.hand.length >= 5) {
    return {
      player,
      pendingTurnAction: { type: "DISCARD_FOR_HAND_LIMIT", playerId },
    };
  }

  return {
    player: drawCard(player),
    pendingTurnAction: null,
  };
}

export function nextPhase(state: GameState): GameState {
  if (state.pendingTurnAction) {
    throw new GameRuleError("Debes resolver la acción obligatoria de inicio de turno antes de avanzar.");
  }

  if (state.phase === "MAIN_1") {
    return {
      ...state,
      phase: "BATTLE",
    };
  }

  if (state.phase === "BATTLE") {
    const nextActivePlayerId = state.activePlayerId === state.playerA.id ? state.playerB.id : state.playerA.id;
    const isNextPlayerA = nextActivePlayerId === state.playerA.id;
    const nextPlayerA = {
      ...state.playerA,
      currentEnergy: state.playerA.maxEnergy,
      activeEntities: resetEntitiesForNewTurn(state.playerA.activeEntities),
    };
    const nextPlayerB = {
      ...state.playerB,
      currentEnergy: state.playerB.maxEnergy,
      activeEntities: resetEntitiesForNewTurn(state.playerB.activeEntities),
    };
    const turnStartResolution = isNextPlayerA
      ? resolveTurnStartForPlayer(nextPlayerA, nextActivePlayerId)
      : resolveTurnStartForPlayer(nextPlayerB, nextActivePlayerId);

    return {
      ...state,
      turn: state.turn + 1,
      phase: "MAIN_1",
      activePlayerId: nextActivePlayerId,
      hasNormalSummonedThisTurn: false,
      pendingTurnAction: turnStartResolution.pendingTurnAction,
      playerA: isNextPlayerA ? turnStartResolution.player : nextPlayerA,
      playerB: isNextPlayerA ? nextPlayerB : turnStartResolution.player,
    };
  }

  return state;
}
