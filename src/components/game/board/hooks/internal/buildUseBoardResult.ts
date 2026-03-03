import { ICard } from "@/core/entities/ICard";
import { BattleMode, IBoardEntity } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { IBoardUiError } from "./boardError";
import { IBoardCombatFeedback } from "./boardCombatFeedback";
import { IBoardPendingUi } from "./boardPendingUi";

interface IBuildUseBoardResultParams {
  gameState: GameState;
  selectedCard: ICard | null;
  playingCard: ICard | null;
  isHistoryOpen: boolean;
  activeAttackerId: string | null;
  revealedEntities: string[];
  lastError: IBoardUiError | null;
  pendingEntityReplacement: { cardId: string; mode: BattleMode } | null;
  opponentDifficulty: string;
  isPlayerTurn: boolean;
  isMuted: boolean;
  winnerPlayerId: string | "DRAW" | null;
  restartMatch: () => void;
  toggleMute: () => void;
  setIsHistoryOpen: (value: boolean | ((previous: boolean) => boolean)) => void;
  toggleCardSelection: (card: ICard, event?: React.MouseEvent) => void;
  previewCard: (card: ICard) => void;
  clearSelection: () => void;
  clearError: () => void;
  executePlayAction: (mode: "ATTACK" | "DEFENSE" | "SET" | "ACTIVATE", event: React.MouseEvent) => Promise<void>;
  handleEntityClick: (entity: IBoardEntity | null, isOpponent: boolean, event: React.MouseEvent) => Promise<void>;
  advancePhase: () => void;
  handleTimerExpired: () => void;
  resolvePendingTurnAction: (selectedId: string) => void;
  resolvePendingHandDiscard: (cardId: string) => void;
  pendingUi: IBoardPendingUi;
  combatFeedback: IBoardCombatFeedback;
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
    opponentDifficulty: params.opponentDifficulty,
    isPlayerTurn: params.isPlayerTurn,
    isMuted: params.isMuted,
    winnerPlayerId: params.winnerPlayerId,
    restartMatch: params.restartMatch,
    toggleMute: params.toggleMute,
    setIsHistoryOpen: params.setIsHistoryOpen,
    toggleCardSelection: params.toggleCardSelection,
    previewCard: params.previewCard,
    clearSelection: params.clearSelection,
    clearError: params.clearError,
    executePlayAction: params.executePlayAction,
    handleEntityClick: params.handleEntityClick,
    advancePhase: params.advancePhase,
    handleTimerExpired: params.handleTimerExpired,
    resolvePendingTurnAction: params.resolvePendingTurnAction,
    resolvePendingHandDiscard: params.resolvePendingHandDiscard,
    ...params.pendingUi,
    ...params.combatFeedback,
  };
}
