// src/components/game/board/hooks/internal/player-actions/useToggleCardSelection.ts - Controla selección/deselección de carta en mano sin colisiones entre copias.
import { useCallback } from "react";
import { ICard } from "@/core/entities/ICard";
import { IUsePlayerActionsParams } from "./types";

type IToggleSelectionParams = Pick<
  IUsePlayerActionsParams,
  | "isAnimating"
  | "assertPlayerTurn"
  | "gameState"
  | "playingCard"
  | "clearSelection"
  | "setSelectedCard"
  | "setPlayingCard"
  | "setActiveAttackerId"
  | "clearError"
  | "setLastError"
>;

export function useToggleCardSelection({
  isAnimating,
  assertPlayerTurn,
  gameState,
  playingCard,
  clearSelection,
  setSelectedCard,
  setPlayingCard,
  setActiveAttackerId,
  clearError,
  setLastError,
}: IToggleSelectionParams) {
  return useCallback(
    (card: ICard, event?: React.MouseEvent) => {
      event?.stopPropagation();
      if (isAnimating || !assertPlayerTurn()) return;

      if (gameState.pendingTurnAction?.playerId === gameState.playerA.id) {
        setLastError({ code: "GAME_RULE_ERROR", message: "Debes resolver la acción obligatoria antes de jugar." });
        return;
      }

      if (playingCard?.runtimeId === card.runtimeId && playingCard.runtimeId) {
        clearSelection();
      } else if (!playingCard?.runtimeId && !card.runtimeId && playingCard?.id === card.id) {
        clearSelection();
      } else {
        setSelectedCard(card);
        setPlayingCard(card);
        setActiveAttackerId(null);
      }
      clearError();
    },
    [
      assertPlayerTurn,
      clearError,
      clearSelection,
      gameState.pendingTurnAction,
      gameState.playerA.id,
      isAnimating,
      playingCard?.id,
      playingCard?.runtimeId,
      setActiveAttackerId,
      setLastError,
      setPlayingCard,
      setSelectedCard,
    ],
  );
}
