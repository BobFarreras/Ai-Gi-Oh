import { useEffect } from "react";
import { GameState } from "@/core/use-cases/GameEngine";
import { IOpponentStrategy } from "@/core/services/opponent/types";
import { runOpponentStep } from "@/core/services/opponent/runOpponentStep";

interface IUseOpponentTurnParams {
  gameState: GameState;
  isAnimating: boolean;
  strategy: IOpponentStrategy;
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null;
  clearSelection: () => void;
  clearError: () => void;
}

export function useOpponentTurn({ gameState, isAnimating, strategy, applyTransition, clearSelection, clearError }: IUseOpponentTurnParams): void {
  useEffect(() => {
    if (isAnimating || gameState.activePlayerId !== gameState.playerB.id) {
      return;
    }

    const timeoutId = setTimeout(() => {
      const nextState = applyTransition((state) => runOpponentStep(state, state.playerB.id, strategy));
      if (nextState && nextState.activePlayerId === nextState.playerA.id) {
        clearSelection();
        clearError();
      }
    }, 700);

    return () => clearTimeout(timeoutId);
  }, [applyTransition, clearError, clearSelection, gameState, isAnimating, strategy]);
}
