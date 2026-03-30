// src/components/game/board/hooks/internal/useOpponentTurn.ts - Descripción breve del módulo.
import { useEffect } from "react";
import { GameState } from "@/core/use-cases/GameEngine";
import { IOpponentStrategy } from "@/core/services/opponent/types";
import { opponentAutoPick } from "./opponent-turn/autoPick";
import { runBattlePhaseStep } from "./opponent-turn/runBattlePhaseStep";
import { runMainPhaseStep } from "./opponent-turn/runMainPhaseStep";
import { IOpponentStepTimings, IOpponentTurnContext } from "./opponent-turn/types";

interface IUseOpponentTurnParams extends IOpponentTurnContext {
  isAnimating: boolean;
  duelWinnerId: string | null;
  isMatchStartLocked?: boolean;
  disableAutomation?: boolean;
  strategy: IOpponentStrategy;
  gameState: GameState;
}

const OPPONENT_STEP_TIMINGS: IOpponentStepTimings = {
  stepDelayMs: 1150,
  attackWindupMs: 1100,
  postResolutionMs: 900,
  trapPreviewMs: 1200,
};

export function useOpponentTurn({
  gameState,
  isAnimating,
  strategy,
  duelWinnerId,
  isMatchStartLocked = false,
  disableAutomation = false,
  applyTransition,
  clearSelection,
  clearError,
  setIsAnimating,
  setActiveAttackerId,
  setRevealedEntities,
  setSelectedCard,
  requestTrapActivationDecision,
}: IUseOpponentTurnParams): void {
  useEffect(() => {
    if (disableAutomation || isMatchStartLocked || duelWinnerId || isAnimating || gameState.activePlayerId !== gameState.playerB.id) return;

    const context: IOpponentTurnContext = {
      gameState,
      strategy,
      applyTransition,
      clearSelection,
      clearError,
      setIsAnimating,
      setActiveAttackerId,
      setRevealedEntities,
      setSelectedCard,
      requestTrapActivationDecision,
    };

    const timeoutId = setTimeout(async () => {
      if (gameState.phase === "MAIN_1") {
        await runMainPhaseStep(context, OPPONENT_STEP_TIMINGS, opponentAutoPick);
        return;
      }
      if (gameState.phase === "BATTLE") {
        await runBattlePhaseStep(context, OPPONENT_STEP_TIMINGS);
      }
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [
    applyTransition,
    clearError,
    clearSelection,
    disableAutomation,
    duelWinnerId,
    isMatchStartLocked,
    gameState,
    isAnimating,
    setActiveAttackerId,
    setIsAnimating,
    setRevealedEntities,
    setSelectedCard,
    requestTrapActivationDecision,
    strategy,
  ]);
}

