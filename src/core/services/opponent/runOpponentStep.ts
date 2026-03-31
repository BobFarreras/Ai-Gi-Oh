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

  const effectValue = card.effect && "value" in card.effect && typeof card.effect.value === "number" ? card.effect.value : 0;
  return effectValue - card.cost * 140;
}

function chooseCardToDiscard(hand: ICard[]): ICard | null {
  if (hand.length === 0) {
    return null;
  }

  return hand.reduce((worst, current) => (scoreCardForDiscard(current) < scoreCardForDiscard(worst) ? current : worst));
}

function pickPendingSelectionId(state: GameState, opponentId: string): string | null {
  if (!state.pendingTurnAction || state.pendingTurnAction.playerId !== opponentId) return null;
  if (state.pendingTurnAction.type === "DISCARD_FOR_HAND_LIMIT") return chooseCardToDiscard(state.playerB.hand)?.id ?? null;
  if (state.pendingTurnAction.type === "SELECT_FUSION_MATERIALS") {
    const pending = state.pendingTurnAction;
    return state.playerB.activeEntities.find((entity) => !pending.selectedMaterialInstanceIds.includes(entity.instanceId))?.instanceId ?? null;
  }
  if (state.pendingTurnAction.type === "SELECT_GRAVEYARD_CARD") {
    const cardType = state.pendingTurnAction.cardType;
    const selected = [...state.playerB.graveyard].reverse().find((card) => !cardType || card.type === cardType);
    return selected ? selected.runtimeId ?? selected.id : null;
  }
  if (state.pendingTurnAction.type === "SELECT_OPPONENT_GRAVEYARD_CARD") {
    const cardType = state.pendingTurnAction.cardType;
    const selected = [...state.playerA.graveyard].reverse().find((card) => !cardType || card.type === cardType);
    return selected ? selected.runtimeId ?? selected.id : null;
  }
  if (state.pendingTurnAction.type === "SELECT_OPPONENT_SET_CARD") {
    const zone = state.pendingTurnAction.zone;
    const setEntities = zone !== "EXECUTIONS" ? state.playerA.activeEntities.filter((entity) => entity.mode === "SET") : [];
    const setExecutions = zone !== "ENTITIES" ? state.playerA.activeExecutions.filter((entity) => entity.mode === "SET") : [];
    const candidates = [...setEntities, ...setExecutions];
    if (candidates.length === 0) return null;
    const best = candidates.reduce((selected, current) => {
      const selectedScore = (selected.card.attack ?? 0) + (selected.card.defense ?? 0) + selected.card.cost * 80;
      const currentScore = (current.card.attack ?? 0) + (current.card.defense ?? 0) + current.card.cost * 80;
      return currentScore > selectedScore ? current : selected;
    });
    return best.instanceId;
  }
  return null;
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
