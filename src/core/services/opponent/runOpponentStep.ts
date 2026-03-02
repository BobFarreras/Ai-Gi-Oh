import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { IOpponentStrategy } from "./types";

function resolveActivatedExecution(state: GameState, opponentId: string): GameState {
  const opponent = state.playerA.id === opponentId ? state.playerA : state.playerB;
  const execution = opponent.activeExecutions.find((entity) => entity.mode === "ACTIVATE");

  if (!execution) {
    return state;
  }

  return GameEngine.resolveExecution(state, opponentId, execution.instanceId);
}

export function runOpponentStep(state: GameState, opponentId: string, strategy: IOpponentStrategy): GameState {
  if (state.activePlayerId !== opponentId) {
    return state;
  }

  switch (state.phase) {
    case "MAIN_1": {
      const opponent = state.playerA.id === opponentId ? state.playerA : state.playerB;
      const hasPendingActivation = opponent.activeExecutions.some((entity) => entity.mode === "ACTIVATE");

      if (hasPendingActivation) {
        return resolveActivatedExecution(state, opponentId);
      }

      const playDecision = strategy.choosePlay(state, opponentId);
      if (!playDecision) {
        return GameEngine.nextPhase(state);
      }

      const stateAfterPlay = GameEngine.playCard(state, opponentId, playDecision.cardId, playDecision.mode);
      if (playDecision.mode === "ACTIVATE") {
        return stateAfterPlay;
      }

      const hasAnotherPlay = strategy.choosePlay(stateAfterPlay, opponentId) !== null;
      return hasAnotherPlay ? stateAfterPlay : GameEngine.nextPhase(stateAfterPlay);
    }
    case "BATTLE": {
      const attackDecision = strategy.chooseAttack(state, opponentId);
      if (!attackDecision) {
        return GameEngine.nextPhase(state);
      }

      return GameEngine.executeAttack(
        state,
        opponentId,
        attackDecision.attackerInstanceId,
        attackDecision.defenderInstanceId,
      );
    }
    default:
      return state;
  }
}
