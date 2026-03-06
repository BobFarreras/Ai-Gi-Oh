// src/core/services/opponent/runOpponentStep.ts - Ejecuta decisiones automáticas del rival por fase, incluyendo resolución de acciones pendientes.
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { IOpponentStrategy } from "./types";
import { ICard } from "@/core/entities/ICard";

function resolveActivatedExecution(state: GameState, opponentId: string): GameState {
  const opponent = state.playerA.id === opponentId ? state.playerA : state.playerB;
  const execution = opponent.activeExecutions.find((entity) => entity.mode === "ACTIVATE");

  if (!execution) {
    return state;
  }

  return GameEngine.resolveExecution(state, opponentId, execution.instanceId);
}

function scoreCardForDiscard(card: ICard): number {
  if (card.type === "ENTITY") {
    return (card.attack ?? 0) + (card.defense ?? 0) - card.cost * 180;
  }

  const effectValue = card.effect && "value" in card.effect ? card.effect.value : 0;
  return effectValue - card.cost * 140;
}

function chooseCardToDiscard(hand: ICard[]): ICard | null {
  if (hand.length === 0) {
    return null;
  }

  return hand.reduce((worst, current) => (scoreCardForDiscard(current) < scoreCardForDiscard(worst) ? current : worst));
}

export function runOpponentStep(state: GameState, opponentId: string, strategy: IOpponentStrategy): GameState {
  if (state.activePlayerId !== opponentId) {
    return state;
  }

  const opponent = state.playerA.id === opponentId ? state.playerA : state.playerB;

  if (state.pendingTurnAction?.playerId === opponentId) {
    const targetCard = chooseCardToDiscard(opponent.hand);
    if (!targetCard) {
      return state;
    }

    return GameEngine.resolvePendingTurnAction(state, opponentId, targetCard.id);
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

      if (playDecision.fusionMaterialInstanceIds) {
        const fusionMode = playDecision.mode === "DEFENSE" ? "DEFENSE" : "ATTACK";
        const stateAfterFusion = GameEngine.fuseCards(
          state,
          opponentId,
          playDecision.cardId,
          playDecision.fusionMaterialInstanceIds,
          fusionMode,
        );
        const hasAnotherPlayAfterFusion = strategy.choosePlay(stateAfterFusion, opponentId) !== null;
        return hasAnotherPlayAfterFusion ? stateAfterFusion : GameEngine.nextPhase(stateAfterFusion);
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
