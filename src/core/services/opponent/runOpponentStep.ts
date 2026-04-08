// src/core/services/opponent/runOpponentStep.ts - Ejecuta decisiones automáticas del rival por fase, incluyendo resolución de acciones pendientes.
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { IOpponentStrategy } from "./types";
import { findActivatableSetExecutionInstanceId, pickPendingSelectionId } from "@/core/services/opponent/run-opponent-step-helpers";

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

  if (state.pendingTurnAction?.playerId === opponentId) {
    const selectionId = pickPendingSelectionId(state, opponentId);
    if (!selectionId) {
      return state;
    }

    return GameEngine.resolvePendingTurnAction(state, opponentId, selectionId);
  }

  switch (state.phase) {
    case "MAIN_1": {
      const opponent = state.playerA.id === opponentId ? state.playerA : state.playerB;
      const hasPendingActivation = opponent.activeExecutions.some((entity) => entity.mode === "ACTIVATE");

      if (hasPendingActivation) {
        return resolveActivatedExecution(state, opponentId);
      }
      const activatableSetExecutionId = findActivatableSetExecutionInstanceId(state, opponentId);
      if (activatableSetExecutionId) {
        return GameEngine.changeEntityMode(state, opponentId, activatableSetExecutionId, "ACTIVATE");
      }

      const playDecision = strategy.choosePlay(state, opponentId);
      if (!playDecision) {
        return GameEngine.nextPhase(state);
      }

      if (playDecision.fusionMaterialInstanceIds) {
        const fusionMode = playDecision.mode === "DEFENSE" ? "DEFENSE" : "ATTACK";
        const stateAfterFusion = GameEngine.fuseCards(
          state,
          opponentId,
          playDecision.cardId,
          playDecision.fusionMaterialInstanceIds,
          fusionMode,
        );
        const hasAnotherPlayAfterFusion =
          strategy.choosePlay(stateAfterFusion, opponentId) !== null ||
          findActivatableSetExecutionInstanceId(stateAfterFusion, opponentId) !== null;
        return hasAnotherPlayAfterFusion ? stateAfterFusion : GameEngine.nextPhase(stateAfterFusion);
      }

      const stateAfterPlay = GameEngine.playCard(state, opponentId, playDecision.cardId, playDecision.mode);

      if (playDecision.mode === "ACTIVATE") {
        return stateAfterPlay;
      }

      const hasAnotherPlay =
        strategy.choosePlay(stateAfterPlay, opponentId) !== null ||
        findActivatableSetExecutionInstanceId(stateAfterPlay, opponentId) !== null;
      return hasAnotherPlay ? stateAfterPlay : GameEngine.nextPhase(stateAfterPlay);
    }
    case "BATTLE": {
      const attackDecision = strategy.chooseAttack(state, opponentId);
      if (!attackDecision && strategy.chooseModeChange) {
        const modeChange = strategy.chooseModeChange(state, opponentId);
        if (modeChange) {
          return GameEngine.changeEntityMode(state, opponentId, modeChange.instanceId, modeChange.newMode);
        }
      }
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
