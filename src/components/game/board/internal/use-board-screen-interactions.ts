// src/components/game/board/internal/use-board-screen-interactions.ts - Agrupa handlers interactivos y selección de cementerio para la pantalla del tablero.
import { MouseEvent, useCallback, useMemo } from "react";
import { ICard } from "@/core/entities/ICard";
import { useBoard } from "@/components/game/board/hooks/useBoard";
import { endInteraction, startInteraction } from "@/services/performance/dev-performance-telemetry";

interface IUseBoardScreenInteractionsInput {
  board: ReturnType<typeof useBoard>;
  playerId: string;
  playerGraveyard: ICard[];
  opponentGraveyard: ICard[];
  setGraveyardView: (value: "player" | "opponent" | null) => void;
  setAutoModeBannerSignal: (value: { id: string; left: string; right: string } | null) => void;
}

export function useBoardScreenInteractions({
  board,
  playerId,
  playerGraveyard,
  opponentGraveyard,
  setGraveyardView,
  setAutoModeBannerSignal,
}: IUseBoardScreenInteractionsInput) {
  const pendingGraveyardSelectionRefs = useMemo(() => {
    const pending = board.gameState.pendingTurnAction;
    if (!pending || pending.playerId !== playerId) return [];
    if (pending.type === "SELECT_GRAVEYARD_CARD") {
      return playerGraveyard.filter((card) => !pending.cardType || card.type === pending.cardType).map((card) => card.runtimeId ?? card.id);
    }
    if (pending.type === "SELECT_OPPONENT_GRAVEYARD_CARD") {
      return opponentGraveyard.filter((card) => !pending.cardType || card.type === pending.cardType).map((card) => card.runtimeId ?? card.id);
    }
    return [];
  }, [board.gameState.pendingTurnAction, opponentGraveyard, playerGraveyard, playerId]);

  const onOverlayCardSelect = useCallback(
    (card: ICard) => {
      const pending = board.gameState.pendingTurnAction;
      if (pending?.type === "SELECT_GRAVEYARD_CARD" && pending.playerId === playerId) {
        board.resolvePendingTurnAction(card.runtimeId ?? card.id);
        setGraveyardView(null);
        return;
      }
      if (pending?.type === "SELECT_OPPONENT_GRAVEYARD_CARD" && pending.playerId === playerId) {
        const cardRef = card.runtimeId ?? card.id;
        const existsInOpponentGraveyard = opponentGraveyard.some((graveCard) => (graveCard.runtimeId ?? graveCard.id) === cardRef);
        if (existsInOpponentGraveyard) {
          board.resolvePendingTurnAction(cardRef);
          setGraveyardView(null);
          return;
        }
      }
      board.previewCard(card);
    },
    [board, opponentGraveyard, playerId, setGraveyardView],
  );

  const handleActivateSelectedExecution = useCallback(() => {
    void (async () => {
      const token = startInteraction("board.activateSelectedExecution");
      try {
        board.playButtonClick();
        const result = await board.activateSelectedExecution();
        if (result === "MISSING_MATERIALS") {
          setAutoModeBannerSignal({ id: `fusion-missing-materials-${Date.now()}`, left: "Fusion", right: "Faltan materiales" });
          board.playBanner();
        }
        endInteraction(token, "ok");
      } catch {
        endInteraction(token, "error");
      }
    })();
  }, [board, setAutoModeBannerSignal]);

  const handlePlayAction = useCallback(
    async (mode: "ATTACK" | "DEFENSE" | "SET" | "ACTIVATE", event: MouseEvent) => {
      const token = startInteraction("board.playAction");
      try {
        await board.executePlayAction(mode, event);
        endInteraction(token, "ok");
      } catch (error) {
        endInteraction(token, "error");
        throw error;
      }
    },
    [board],
  );

  return { pendingGraveyardSelectionRefs, onOverlayCardSelect, handleActivateSelectedExecution, handlePlayAction };
}
