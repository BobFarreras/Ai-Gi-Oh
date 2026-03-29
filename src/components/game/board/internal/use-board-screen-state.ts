// src/components/game/board/internal/use-board-screen-state.ts - Encapsula estado derivado, efectos y handlers de pantalla del tablero.
import { useEffect, useMemo, useRef, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { IMatchMode } from "@/core/entities/match";
import { IDuelResultRewardSummary } from "@/components/game/board/ui/internal/duel-result/duel-result-reward-summary";
import { IMatchNarrationPack } from "@/components/game/board/narration/types";
import { useMatchNarration } from "@/components/game/board/hooks/internal/match/useMatchNarration";
import { useBoard } from "@/components/game/board/hooks/useBoard";
import { useBoardScreenInteractions } from "./use-board-screen-interactions";

interface IUseBoardScreenStateInput {
  board: ReturnType<typeof useBoard>;
  mode: IMatchMode;
  playerId: string;
  playerName: string;
  opponentId: string;
  opponentName: string;
  playerGraveyard: ICard[];
  opponentGraveyard: ICard[];
  playerFusionDeck: ICard[];
  opponentFusionDeck: ICard[];
  playerDestroyed: ICard[];
  opponentDestroyed: ICard[];
  playerActiveEntities: ReturnType<typeof useBoard>["gameState"]["playerA"]["activeEntities"];
  playerActiveExecutions: ReturnType<typeof useBoard>["gameState"]["playerA"]["activeExecutions"];
  duelResultRewardSummary?: IDuelResultRewardSummary | null;
  narrationPack?: IMatchNarrationPack | null;
  isNarrationLocked?: boolean;
  onMatchResolved?: (result: { winnerPlayerId: string | "DRAW"; playerId: string; mode: IMatchMode; matchSeed: string }) => void;
}

export function useBoardScreenState(input: IUseBoardScreenStateInput) {
  const board = input.board;
  const playerId = input.playerId;
  const mode = input.mode;
  const onMatchResolved = input.onMatchResolved;
  const [autoModeBannerSignal, setAutoModeBannerSignal] = useState<{ id: string; left: string; right: string } | null>(null);
  const [graveyardView, setGraveyardView] = useState<"player" | "opponent" | null>(null);
  const [fusionDeckView, setFusionDeckView] = useState<"player" | "opponent" | null>(null);
  const [destroyedView, setDestroyedView] = useState<"player" | "opponent" | null>(null);
  const resolvedWinnerRef = useRef<string | "DRAW" | null>(null);
  const effectiveGraveyardView =
    board.gameState.pendingTurnAction?.type === "SELECT_GRAVEYARD_CARD" &&
    board.gameState.pendingTurnAction.playerId === playerId
      ? "player"
      : board.gameState.pendingTurnAction?.type === "SELECT_OPPONENT_GRAVEYARD_CARD" &&
          board.gameState.pendingTurnAction.playerId === playerId
        ? "opponent"
      : graveyardView;
  const visibleGraveyardCards = useMemo(
    () => (effectiveGraveyardView === "player" ? input.playerGraveyard : effectiveGraveyardView === "opponent" ? input.opponentGraveyard : []),
    [effectiveGraveyardView, input.opponentGraveyard, input.playerGraveyard],
  );
  const visibleDestroyedCards = useMemo(
    () => (destroyedView === "player" ? input.playerDestroyed : destroyedView === "opponent" ? input.opponentDestroyed : []),
    [destroyedView, input.opponentDestroyed, input.playerDestroyed],
  );
  const visibleFusionDeckCards = useMemo(
    () => (fusionDeckView === "player" ? input.playerFusionDeck : fusionDeckView === "opponent" ? input.opponentFusionDeck : []),
    [fusionDeckView, input.opponentFusionDeck, input.playerFusionDeck],
  );
  const pendingReplacementTargetCard = useMemo(() => {
    if (!board.pendingEntityReplacementTargetId || !board.pendingEntityReplacement) return null;
    const candidates = board.pendingEntityReplacement.zone === "ENTITIES" ? input.playerActiveEntities : input.playerActiveExecutions;
    return candidates.find((entity) => entity.instanceId === board.pendingEntityReplacementTargetId)?.card ?? null;
  }, [board.pendingEntityReplacement, board.pendingEntityReplacementTargetId, input.playerActiveEntities, input.playerActiveExecutions]);
  const { pendingGraveyardSelectionRefs, onOverlayCardSelect, handleActivateSelectedExecution, handlePlayAction } =
    useBoardScreenInteractions({
      board,
      playerId,
      playerGraveyard: input.playerGraveyard,
      opponentGraveyard: input.opponentGraveyard,
      setGraveyardView,
      setAutoModeBannerSignal,
    });
  useEffect(() => {
    if (!board.winnerPlayerId) {
      resolvedWinnerRef.current = null;
      return;
    }
    if (!onMatchResolved) return;
    if (resolvedWinnerRef.current === board.winnerPlayerId) return;
    onMatchResolved({ winnerPlayerId: board.winnerPlayerId, playerId, mode, matchSeed: board.matchSeed });
    resolvedWinnerRef.current = board.winnerPlayerId;
  }, [board.matchSeed, board.winnerPlayerId, mode, onMatchResolved, playerId]);
  useEffect(() => {
    if (!board.winnerPlayerId) return;
    board.setIsHistoryOpen(false);
  }, [board]);
  const narration = useMatchNarration({
    combatLog: board.gameState.combatLog,
    winnerPlayerId: board.winnerPlayerId,
    playerId,
    opponentId: input.opponentId,
    isMuted: board.isMuted,
    narrationPack: input.narrationPack,
    isLocked: input.isNarrationLocked ?? false,
  });
  return {
    narration,
    autoModeBannerSignal,
    graveyardView,
    fusionDeckView,
    destroyedView,
    effectiveGraveyardView,
    visibleGraveyardCards,
    visibleDestroyedCards,
    visibleFusionDeckCards,
    pendingReplacementTargetCard,
    pendingGraveyardSelectionRefs,
    onOverlayCardSelect,
    handleActivateSelectedExecution,
    handlePlayAction,
    setAutoModeBannerSignal,
    setGraveyardView,
    setFusionDeckView,
    setDestroyedView,
    visibleGraveyardOwner: effectiveGraveyardView === "player" ? input.playerName : input.opponentName,
    visibleFusionDeckOwner: fusionDeckView === "player" ? input.playerName : input.opponentName,
    visibleDestroyedOwner: destroyedView === "player" ? input.playerName : input.opponentName,
    isResultVisible: Boolean(board.winnerPlayerId),
    duelResultRewardSummary: input.duelResultRewardSummary ?? null,
  };
}

export type IBoardScreenState = ReturnType<typeof useBoardScreenState>;

