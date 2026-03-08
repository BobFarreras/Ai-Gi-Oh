// src/components/game/board/hooks/internal/board-state/useAutoAdvanceBattle.ts - Ejecuta auto-pase en BATTLE cuando no quedan acciones del jugador.
import { MutableRefObject, useEffect } from "react";
import { GameState } from "@/core/use-cases/GameEngine";
import { canAutoAdvanceBattle } from "@/core/services/turn/turn-decision";
import { resolveAdvanceWarning } from "./turn-guard";

interface IUseAutoAdvanceBattleParams {
  gameState: GameState;
  gameStateRef: MutableRefObject<GameState>;
  winnerPlayerId: string | "DRAW" | null;
  isAnimating: boolean;
  isPlayerTurn: boolean;
  isAutoPhaseEnabled: boolean;
  advancePhase: () => void;
  onAutoAdvanced: () => void;
}

function resolveWinner(state: GameState): string | "DRAW" | null {
  if (state.playerA.healthPoints <= 0 && state.playerB.healthPoints <= 0) return "DRAW";
  if (state.playerA.healthPoints <= 0) return state.playerB.id;
  if (state.playerB.healthPoints <= 0) return state.playerA.id;
  return null;
}

export function useAutoAdvanceBattle({ gameState, gameStateRef, winnerPlayerId, isAnimating, isPlayerTurn, isAutoPhaseEnabled, advancePhase, onAutoAdvanced }: IUseAutoAdvanceBattleParams) {
  useEffect(() => {
    if (!isAutoPhaseEnabled) return;
    if (resolveAdvanceWarning(gameState) === "BATTLE_SKIP_ATTACKS") return;
    if (
      !canAutoAdvanceBattle({
        phase: gameState.phase,
        winnerPlayerId,
        isAnimating,
        isPlayerTurn,
        pendingTurnActionPlayerId: gameState.pendingTurnAction?.playerId ?? null,
        playerId: gameState.playerA.id,
        activeEntities: gameState.playerA.activeEntities,
      })
    ) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      const latestState = gameStateRef.current;
      const latestWinner = resolveWinner(latestState);
      const latestIsPlayerTurn = latestState.activePlayerId === latestState.playerA.id;
      if (resolveAdvanceWarning(latestState) === "BATTLE_SKIP_ATTACKS") return;
      const canAdvanceNow = canAutoAdvanceBattle({
        phase: latestState.phase,
        winnerPlayerId: latestWinner,
        isAnimating: false,
        isPlayerTurn: latestIsPlayerTurn,
        pendingTurnActionPlayerId: latestState.pendingTurnAction?.playerId ?? null,
        playerId: latestState.playerA.id,
        activeEntities: latestState.playerA.activeEntities,
      });
      if (!canAdvanceNow) return;
      onAutoAdvanced();
      advancePhase();
    }, 260);
    return () => window.clearTimeout(timeoutId);
  }, [
    advancePhase,
    gameState,
    gameStateRef,
    gameState.pendingTurnAction,
    gameState.phase,
    gameState.playerA.activeEntities,
    gameState.playerA.id,
    isAnimating,
    isPlayerTurn,
    isAutoPhaseEnabled,
    onAutoAdvanced,
    winnerPlayerId,
  ]);
}
