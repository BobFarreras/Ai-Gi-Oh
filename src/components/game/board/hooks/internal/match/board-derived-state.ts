// src/components/game/board/hooks/internal/match/board-derived-state.ts - Funciones puras para derivar ganador y estado de ejecución pendiente en el board.
import { GameState } from "@/core/use-cases/GameEngine";

export function resolveWinnerPlayerId(gameState: GameState): string | "DRAW" | null {
  if (gameState.playerA.healthPoints <= 0 && gameState.playerB.healthPoints <= 0) return "DRAW";
  if (gameState.playerA.healthPoints <= 0) return gameState.playerB.id;
  if (gameState.playerB.healthPoints <= 0) return gameState.playerA.id;
  return null;
}

export function isExecutionWaitingForFusionMaterials(state: GameState, executionInstanceId: string): boolean {
  const waitingExecution = state.playerA.activeExecutions.find((entity) => entity.instanceId === executionInstanceId);
  if (!waitingExecution) return false;
  return (
    waitingExecution.mode === "SET" &&
    waitingExecution.card.type === "EXECUTION" &&
    waitingExecution.card.effect?.action === "FUSION_SUMMON" &&
    state.pendingTurnAction === null
  );
}
