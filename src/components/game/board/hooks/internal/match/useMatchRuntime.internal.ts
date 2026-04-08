// src/components/game/board/hooks/internal/match/useMatchRuntime.internal.ts - Agrupa composición de parámetros y resolución de trampas para mantener useMatchRuntime compacto.
import { MutableRefObject, useCallback, useEffect, useRef } from "react";
import { ICard } from "@/core/entities/ICard";
import { GameState } from "@/core/use-cases/GameEngine";
import { toBoardUiError } from "../boardError";
import { IUseMatchUiStateResult } from "./useMatchUiState";

interface IMatchRuntimeBasics {
  uiState: IUseMatchUiStateResult;
  gameStateRef: MutableRefObject<GameState>;
  winnerPlayerId: string | "DRAW" | null;
}

interface IUseTrapDecisionManagerInput {
  uiState: IUseMatchUiStateResult;
}

export function useAutoSyncGameStateRef(gameStateRef: MutableRefObject<GameState>, gameState: GameState): void {
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameStateRef, gameState]);
}

export function useAutoClearBoardError(uiState: IUseMatchUiStateResult): void {
  useEffect(() => {
    if (!uiState.lastError) return;
    const timeoutId = setTimeout(() => uiState.setLastError(null), 3600);
    return () => clearTimeout(timeoutId);
  }, [uiState]);
}

export function useApplyTransition({ gameStateRef, uiState }: Pick<IMatchRuntimeBasics, "gameStateRef" | "uiState">) {
  return useCallback(
    (transition: (state: GameState) => GameState): GameState | null => {
      try {
        const nextState = transition(gameStateRef.current);
        gameStateRef.current = nextState;
        uiState.setGameState(nextState);
        return nextState;
      } catch (error: unknown) {
        uiState.setLastError(toBoardUiError(error));
        return null;
      }
    },
    [gameStateRef, uiState],
  );
}

export function useAssertPlayerTurn({ gameStateRef, uiState, winnerPlayerId }: IMatchRuntimeBasics) {
  return useCallback((): boolean => {
    if (winnerPlayerId) {
      uiState.setLastError({ code: "GAME_RULE_ERROR", message: "La partida ya terminó." });
      return false;
    }
    if (gameStateRef.current.activePlayerId === gameStateRef.current.playerA.id) return true;
    uiState.setLastError({ code: "GAME_RULE_ERROR", message: "No es tu turno. Espera a que el rival termine su fase." });
    return false;
  }, [gameStateRef, uiState, winnerPlayerId]);
}

export function useTrapDecisionManager({ uiState }: IUseTrapDecisionManagerInput) {
  const trapDecisionResolverRef = useRef<((activate: boolean) => void) | null>(null);

  const requestTrapActivationDecision = useCallback(
    (trapCard: ICard, trigger: "ON_OPPONENT_ATTACK_DECLARED" | "ON_OPPONENT_EXECUTION_ACTIVATED" | "ON_OPPONENT_TRAP_ACTIVATED"): Promise<boolean> =>
      new Promise<boolean>((resolve) => {
        trapDecisionResolverRef.current = resolve;
        uiState.setSelectedCard(trapCard);
        uiState.setPendingTrapActivationPrompt({ trapCard, trigger });
      }),
    [uiState],
  );

  const resolveTrapActivationDecision = useCallback(
    (activate: boolean) => {
      uiState.setPendingTrapActivationPrompt(null);
      uiState.clearSelection();
      const resolver = trapDecisionResolverRef.current;
      trapDecisionResolverRef.current = null;
      resolver?.(activate);
    },
    [uiState],
  );

  useEffect(() => {
    const prompt = uiState.pendingTrapActivationPrompt;
    if (!prompt) return;
    if (uiState.selectedCard?.id === prompt.trapCard.id) return;
    resolveTrapActivationDecision(false);
  }, [resolveTrapActivationDecision, uiState.pendingTrapActivationPrompt, uiState.selectedCard]);

  return { requestTrapActivationDecision, resolveTrapActivationDecision };
}
