// src/components/game/board/hooks/internal/board-state/turn-guard.ts - Evalúa acciones pendientes para decidir avisos de salto de fase en la UI del tablero.
import { ICard } from "@/core/entities/ICard";
import { GameState } from "@/core/use-cases/GameEngine";
import { hasAvailableBattleActions, shouldShowAdvanceWarning } from "@/core/services/turn/turn-decision";

function canPlayCardInMain(card: ICard, gameState: GameState): boolean {
  const player = gameState.playerA;
  if (card.cost > player.currentEnergy) return false;
  if (card.type === "ENTITY") return true;
  if (card.type === "EXECUTION") return true;
  return false;
}

export function resolveAdvanceWarning(gameState: GameState): "MAIN_SKIP_ACTIONS" | "BATTLE_SKIP_ATTACKS" | null {
  const hasPlayableMainActions =
    gameState.phase === "MAIN_1" &&
    gameState.pendingTurnAction?.playerId !== gameState.playerA.id &&
    gameState.playerA.hand.some((card) => canPlayCardInMain(card, gameState));
  const hasBattleActions = gameState.phase === "BATTLE" && hasAvailableBattleActions(gameState.playerA.activeEntities);
  return shouldShowAdvanceWarning({
    phase: gameState.phase,
    hasPlayableMainActions,
    hasAvailableBattleActions: hasBattleActions,
  });
}
