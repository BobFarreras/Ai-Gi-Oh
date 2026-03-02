import { IBoardEntity, IPlayer } from "../../entities/IPlayer";
import { GameState, TurnPhase } from "./types";

const PHASES: TurnPhase[] = ["DRAW", "MAIN_1", "BATTLE", "MAIN_2", "END"];

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
  const currentIndex = PHASES.indexOf(state.phase);

  if (state.phase === "DRAW") {
    if (state.activePlayerId === state.playerA.id) {
      return {
        ...state,
        phase: "MAIN_1",
        playerA: drawCard(state.playerA),
      };
    }

    return {
      ...state,
      phase: "MAIN_1",
      playerB: drawCard(state.playerB),
    };
  }

  if (state.phase === "END") {
    const nextActivePlayerId = state.activePlayerId === state.playerA.id ? state.playerB.id : state.playerA.id;

    return {
      ...state,
      turn: state.turn + 1,
      phase: "DRAW",
      activePlayerId: nextActivePlayerId,
      hasNormalSummonedThisTurn: false,
      playerA: {
        ...state.playerA,
        currentEnergy: state.playerA.maxEnergy,
        activeEntities: resetEntitiesForNewTurn(state.playerA.activeEntities),
      },
      playerB: {
        ...state.playerB,
        currentEnergy: state.playerB.maxEnergy,
        activeEntities: resetEntitiesForNewTurn(state.playerB.activeEntities),
      },
    };
  }

  return {
    ...state,
    phase: PHASES[currentIndex + 1],
  };
}
