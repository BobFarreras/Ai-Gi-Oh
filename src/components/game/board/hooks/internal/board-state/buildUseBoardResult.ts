// src/components/game/board/hooks/internal/board-state/buildUseBoardResult.ts - Construye el contrato final expuesto por el hook useBoard.
import { ICard } from "@/core/entities/ICard";
import { BattleMode, IBoardEntity } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { IBoardUiError } from "../boardError";
import { IBoardCombatFeedback } from "./boardCombatFeedback";
import { IBoardPendingUi } from "./boardPendingUi";
import type { IAppliedCardExperienceResult } from "@/core/use-cases/progression/ApplyBattleCardExperienceUseCase";

interface IBuildUseBoardResultParams {
  gameState: GameState;
  selectedCard: ICard | null;
  playingCard: ICard | null;
  isHistoryOpen: boolean;
  activeAttackerId: string | null;
  revealedEntities: string[];
  lastError: IBoardUiError | null;
  pendingEntityReplacement: { cardId: string; mode: BattleMode } | null;
  pendingEntityReplacementTargetId: string | null;
  opponentDifficulty: string;
  isPlayerTurn: boolean;
  isMuted: boolean;
  isPaused: boolean;
  isFusionCinematicActive: boolean;
  setIsFusionCinematicActive: (value: boolean) => void;
  winnerPlayerId: string | "DRAW" | null;
  restartMatch: () => void;
  toggleMute: () => void;
  togglePause: () => void;
  setIsHistoryOpen: (value: boolean | ((previous: boolean) => boolean)) => void;
  toggleCardSelection: (card: ICard, event?: React.MouseEvent) => void;
  previewCard: (card: ICard) => void;
  clearSelection: () => void;
  clearError: () => void;
  executePlayAction: (mode: "ATTACK" | "DEFENSE" | "SET" | "ACTIVATE", event: React.MouseEvent) => Promise<void>;
  handleEntityClick: (entity: IBoardEntity | null, isOpponent: boolean, event: React.MouseEvent) => Promise<void>;
  advancePhase: () => void;
  handleTimerExpired: () => void;
  confirmEntityReplacement: () => void;
  cancelEntityReplacement: () => void;
  resolvePendingTurnAction: (selectedId: string) => void;
  resolvePendingHandDiscard: (cardId: string) => void;
  setSelectedEntityToAttack: () => void;
  canSetSelectedEntityToAttack: boolean;
  pendingUi: IBoardPendingUi;
  combatFeedback: IBoardCombatFeedback;
  battleExperienceSummary: IAppliedCardExperienceResult[];
  battleExperienceCardLookup: Record<string, ICard>;
  isBattleExperiencePending: boolean;
}

export function buildUseBoardResult(params: IBuildUseBoardResultParams) {
  return {
    gameState: params.gameState,
    selectedCard: params.selectedCard,
    playingCard: params.playingCard,
    isHistoryOpen: params.isHistoryOpen,
    activeAttackerId: params.activeAttackerId,
    revealedEntities: params.revealedEntities,
    lastError: params.lastError,
    pendingEntityReplacement: params.pendingEntityReplacement,
    pendingEntityReplacementTargetId: params.pendingEntityReplacementTargetId,
    opponentDifficulty: params.opponentDifficulty,
    isPlayerTurn: params.isPlayerTurn,
    isMuted: params.isMuted,
    isPaused: params.isPaused,
    isFusionCinematicActive: params.isFusionCinematicActive,
    setIsFusionCinematicActive: params.setIsFusionCinematicActive,
    winnerPlayerId: params.winnerPlayerId,
    restartMatch: params.restartMatch,
    toggleMute: params.toggleMute,
    togglePause: params.togglePause,
    setIsHistoryOpen: params.setIsHistoryOpen,
    toggleCardSelection: params.toggleCardSelection,
    previewCard: params.previewCard,
    clearSelection: params.clearSelection,
    clearError: params.clearError,
    executePlayAction: params.executePlayAction,
    handleEntityClick: params.handleEntityClick,
    advancePhase: params.advancePhase,
    handleTimerExpired: params.handleTimerExpired,
    confirmEntityReplacement: params.confirmEntityReplacement,
    cancelEntityReplacement: params.cancelEntityReplacement,
    resolvePendingTurnAction: params.resolvePendingTurnAction,
    resolvePendingHandDiscard: params.resolvePendingHandDiscard,
    setSelectedEntityToAttack: params.setSelectedEntityToAttack,
    canSetSelectedEntityToAttack: params.canSetSelectedEntityToAttack,
    battleExperienceSummary: params.battleExperienceSummary,
    battleExperienceCardLookup: params.battleExperienceCardLookup,
    isBattleExperiencePending: params.isBattleExperiencePending,
    ...params.pendingUi,
    ...params.combatFeedback,
  };
}
