// src/components/game/board/hooks/internal/match/useMatchUiState.ts - Expone y enriquece el estado UI del duelo para consumo del hook compositor.
import { MutableRefObject, useMemo } from "react";
import { ICard } from "@/core/entities/ICard";
import { GameState } from "@/core/use-cases/GameEngine";
import { IBoardUiError } from "../boardError";
import { buildBoardCombatFeedback } from "../board-state/boardCombatFeedback";
import { buildBoardPendingUi } from "../board-state/boardPendingUi";
import { IPendingZoneReplacement } from "../board-state/pending-replacement";
import { useBoardUiState } from "../board-state/useBoardUiState";

interface IUseMatchUiStateParams {
  gameStateRef: MutableRefObject<GameState>;
  createInitialState: () => GameState;
}

export function useMatchUiState({ gameStateRef, createInitialState }: IUseMatchUiStateParams) {
  const uiState = useBoardUiState(gameStateRef, createInitialState);
  const isPlayerTurn = uiState.gameState.activePlayerId === uiState.gameState.playerA.id;
  const isActionLocked = uiState.isAnimating || uiState.isFusionCinematicActive || uiState.isPaused;
  const combatFeedback = useMemo(() => buildBoardCombatFeedback(uiState.gameState.combatLog), [uiState.gameState.combatLog]);
  const pendingUi = useMemo(
    () => buildBoardPendingUi(uiState.gameState, uiState.pendingEntityReplacement),
    [uiState.gameState, uiState.pendingEntityReplacement],
  );

  return {
    ...uiState,
    isPlayerTurn,
    isActionLocked,
    combatFeedback,
    pendingUi,
  };
}

export interface IUseMatchUiStateResult {
  gameState: GameState;
  selectedCard: ICard | null;
  selectedBoardEntityInstanceId: string | null;
  playingCard: ICard | null;
  isHistoryOpen: boolean;
  activeAttackerId: string | null;
  revealedEntities: string[];
  lastError: IBoardUiError | null;
  pendingEntityReplacement: IPendingZoneReplacement | null;
  pendingEntityReplacementTargetId: string | null;
  pendingFusionSummon: { cardId: string; mode: "ATTACK" | "DEFENSE"; materials: string[] } | null;
  isFusionCinematicActive: boolean;
  isMuted: boolean;
  isPaused: boolean;
  isAutoPhaseEnabled: boolean;
  isTurnHelpEnabled: boolean;
  isPlayerTurn: boolean;
  isActionLocked: boolean;
  combatFeedback: ReturnType<typeof buildBoardCombatFeedback>;
  pendingUi: ReturnType<typeof buildBoardPendingUi>;
  setGameState: (value: GameState) => void;
  setSelectedCard: (value: ICard | null) => void;
  setSelectedBoardEntityInstanceId: (value: string | null) => void;
  setPlayingCard: (value: ICard | null) => void;
  setIsHistoryOpen: (value: boolean | ((previous: boolean) => boolean)) => void;
  setActiveAttackerId: (value: string | null | ((previous: string | null) => string | null)) => void;
  setIsAnimating: (value: boolean) => void;
  setRevealedEntities: (value: string[] | ((previous: string[]) => string[])) => void;
  setLastError: (value: IBoardUiError | null) => void;
  setPendingEntityReplacement: (value: IPendingZoneReplacement | null) => void;
  setPendingEntityReplacementTargetId: (value: string | null) => void;
  setPendingFusionSummon: (value: { cardId: string; mode: "ATTACK" | "DEFENSE"; materials: string[] } | null) => void;
  setIsFusionCinematicActive: (value: boolean) => void;
  setIsAutoPhaseEnabled: (value: boolean | ((previous: boolean) => boolean)) => void;
  setIsTurnHelpEnabled: (value: boolean | ((previous: boolean) => boolean)) => void;
  clearSelection: () => void;
  previewCard: (card: ICard) => void;
  clearError: () => void;
  toggleMute: () => void;
  togglePause: () => void;
  toggleAutoPhase: () => void;
  disableTurnHelp: () => void;
  restartMatch: () => void;
}
