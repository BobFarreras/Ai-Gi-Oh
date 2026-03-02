import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { IOpponentStrategy } from "./types";

export function runOpponentStep(state: GameState, opponentId: string, strategy: IOpponentStrategy): GameState {
  if (state.activePlayerId !== opponentId) {
    return state;
  }

  switch (state.phase) {
    case "DRAW":
      return GameEngine.nextPhase(state);
    case "MAIN_1": {
      const playDecision = strategy.choosePlay(state, opponentId);
      const stateAfterPlay = playDecision
        ? GameEngine.playCard(state, opponentId, playDecision.cardId, playDecision.mode)
        : state;
      return GameEngine.nextPhase(stateAfterPlay);
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
    case "MAIN_2":
      return GameEngine.nextPhase(state);
    case "END":
      return GameEngine.nextPhase(state);
    default:
      return state;
  }
}
