// src/components/game/board/hooks/internal/match/useMatchRuntime.builders.ts - Construye parámetros y resultado final de runtime para reducir ruido en el hook principal.
import { ICard } from "@/core/entities/ICard";
import { BattleMode, IBoardEntity } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { IOpponentStrategy } from "@/core/services/opponent/types";
import type { MouseEvent } from "react";
import type { useBoardTurnControls } from "../board-state/useBoardTurnControls";
import { IUsePlayerActionsParams } from "../player-actions/types";
import { IUseMatchUiStateResult } from "./useMatchUiState";

interface IBuildOpponentTurnParamsInput {
  uiState: IUseMatchUiStateResult;
  isMatchStartLocked: boolean;
  disableOpponentAutomation: boolean;
  opponentStrategy: IOpponentStrategy;
  winnerPlayerId: string | "DRAW" | null;
  requestTrapActivationDecision: (trapCard: ICard, trigger: "ON_OPPONENT_ATTACK_DECLARED" | "ON_OPPONENT_EXECUTION_ACTIVATED" | "ON_OPPONENT_TRAP_ACTIVATED") => Promise<boolean>;
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null;
}

interface IBuildMatchRuntimeResultInput {
  opponentDifficulty: string;
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null;
  toggleCardSelection: (card: ICard, event?: MouseEvent) => void;
  executePlayAction: (mode: BattleMode, event: MouseEvent) => Promise<void>;
  handleEntityClick: (entity: IBoardEntity | null, isOpponent: boolean, event: MouseEvent) => Promise<void>;
  turnControls: ReturnType<typeof useBoardTurnControls>;
  confirmEntityReplacement: () => void;
  cancelEntityReplacement: () => void;
  pendingTrapActivationPrompt: IUseMatchUiStateResult["pendingTrapActivationPrompt"];
  resolveTrapActivationDecision: (activate: boolean) => void;
}

export function buildOpponentTurnParams(input: IBuildOpponentTurnParamsInput) {
  return {
    gameState: input.uiState.gameState,
    isAnimating: input.uiState.isActionLocked,
    isMatchStartLocked: input.isMatchStartLocked,
    strategy: input.opponentStrategy,
    duelWinnerId: input.winnerPlayerId,
    applyTransition: input.applyTransition,
    disableAutomation: input.disableOpponentAutomation,
    clearSelection: input.uiState.clearSelection,
    clearError: input.uiState.clearError,
    setIsAnimating: input.uiState.setIsAnimating,
    setActiveAttackerId: input.uiState.setActiveAttackerId,
    setRevealedEntities: input.uiState.setRevealedEntities,
    setSelectedCard: input.uiState.setSelectedCard,
    requestTrapActivationDecision: input.requestTrapActivationDecision,
  };
}

export function buildPlayerActionsParams(
  uiState: IUseMatchUiStateResult,
  assertPlayerTurn: () => boolean,
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null,
  resolvePendingTurnAction: (selectedId: string) => void,
): IUsePlayerActionsParams {
  return {
    gameState: uiState.gameState,
    isAnimating: uiState.isActionLocked,
    playingCard: uiState.playingCard,
    activeAttackerId: uiState.activeAttackerId,
    pendingEntityReplacement: uiState.pendingEntityReplacement,
    pendingEntityReplacementTargetId: uiState.pendingEntityReplacementTargetId,
    pendingFusionSummon: uiState.pendingFusionSummon,
    assertPlayerTurn,
    applyTransition,
    clearSelection: uiState.clearSelection,
    clearError: uiState.clearError,
    resolvePendingTurnAction,
    setSelectedCard: uiState.setSelectedCard,
    setSelectedBoardEntityInstanceId: uiState.setSelectedBoardEntityInstanceId,
    setPlayingCard: uiState.setPlayingCard,
    setActiveAttackerId: uiState.setActiveAttackerId,
    setIsAnimating: uiState.setIsAnimating,
    setRevealedEntities: uiState.setRevealedEntities,
    setPendingEntityReplacement: uiState.setPendingEntityReplacement,
    setPendingEntityReplacementTargetId: uiState.setPendingEntityReplacementTargetId,
    setPendingFusionSummon: uiState.setPendingFusionSummon,
    setLastError: uiState.setLastError,
  };
}

export function buildMatchRuntimeResult(input: IBuildMatchRuntimeResultInput) {
  return {
    opponentDifficulty: input.opponentDifficulty,
    applyTransition: input.applyTransition,
    toggleCardSelection: input.toggleCardSelection,
    executePlayAction: input.executePlayAction,
    handleEntityClick: input.handleEntityClick,
    advancePhase: input.turnControls.advancePhase,
    confirmAdvancePhase: input.turnControls.confirmAdvancePhase,
    cancelAdvancePhase: input.turnControls.cancelAdvancePhase,
    pendingAdvanceWarning: input.turnControls.pendingAdvanceWarning,
    handleTimerExpired: input.turnControls.handleTimerExpired,
    resolvePendingTurnAction: input.turnControls.resolvePendingTurnAction,
    resolvePendingHandDiscard: input.turnControls.resolvePendingHandDiscard,
    setSelectedEntityToAttack: input.turnControls.setSelectedEntityToAttack,
    setSelectedEntityToDefense: input.turnControls.setSelectedEntityToDefense,
    canSetSelectedEntityToAttack: input.turnControls.canSetSelectedEntityToAttack,
    canSetSelectedEntityToDefense: input.turnControls.canSetSelectedEntityToDefense,
    confirmEntityReplacement: input.confirmEntityReplacement,
    cancelEntityReplacement: input.cancelEntityReplacement,
    pendingTrapActivationPrompt: input.pendingTrapActivationPrompt,
    activatePendingTrap: () => input.resolveTrapActivationDecision(true),
    skipPendingTrap: () => input.resolveTrapActivationDecision(false),
  };
}
