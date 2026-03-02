import { IBoardEntity, IPlayer } from "../../entities/IPlayer";
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

export function nextPhase(state: GameState): GameState {
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

    return {
      ...state,
      turn: state.turn + 1,
      phase: "MAIN_1",
      activePlayerId: nextActivePlayerId,
      hasNormalSummonedThisTurn: false,
      playerA: isNextPlayerA ? drawCard(nextPlayerA) : nextPlayerA,
      playerB: isNextPlayerA ? nextPlayerB : drawCard(nextPlayerB),
    };
  }

  return state;
}
